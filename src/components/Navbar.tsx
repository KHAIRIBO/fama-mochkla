"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Menu, X, Plus } from "lucide-react";

interface NavbarProps {
  onReportClick?: () => void;
  /** Set to false to hide the "Report a Problem" action entirely (e.g. on the index page). */
  showReport?: boolean;
}

export default function Navbar({ onReportClick, showReport = true }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300 ${
        scrolled ? "glass shadow-lg shadow-gray-900/5" : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 group"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
          <MapPin className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-poppins font-black text-lg tracking-tight text-gray-900">
          fama-<span className="text-blue-500">mochkla</span>
        </span>
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-2">
        <Link
          href="/map"
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-all"
        >
          Live Map
        </Link>
        <Link
          href="/#reports"
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-all"
        >
          Reports Feed
        </Link>
        {showReport && (
          onReportClick ? (
            <button
              onClick={onReportClick}
              className="ml-2 inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Report a Problem
            </button>
          ) : (
            <Link
              href="/map"
              className="ml-2 inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Report a Problem
            </Link>
          )
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden w-10 h-10 rounded-xl glass flex items-center justify-center text-gray-900"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={menuOpen ? "close" : "open"}
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.15 }}
            className="flex"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.span>
        </AnimatePresence>
      </button>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="absolute top-16 left-4 right-4 glass rounded-2xl p-4 flex flex-col gap-2 md:hidden"
          >
            <Link href="/map" className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-all" onClick={() => setMenuOpen(false)}>
              Live Map
            </Link>
            <Link href="/#reports" className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-all" onClick={() => setMenuOpen(false)}>
              Reports Feed
            </Link>
            {showReport && (
              onReportClick ? (
                <button
                  onClick={() => { setMenuOpen(false); onReportClick(); }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl text-center"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  Report a Problem
                </button>
              ) : (
                <Link
                  href="/map"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  Report a Problem
                </Link>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
