"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronDown, Inbox } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingEmojiBackground from "@/components/FloatingEmojiBackground";
import BrowserFrame from "@/components/BrowserFrame";
import MapPreview from "@/components/MapPreview";
import ReportCard from "@/components/ReportCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cleanupResolvedReports, fetchReports, supabase } from "@/lib/supabase";
import type { Report } from "@/types/report";

export default function HomePage() {
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      const data = await fetchReports();
      setReports(data);
    } catch (e) {
      console.error("Failed to load reports:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial data load
    loadReports();
    cleanupResolvedReports();

    const channel = supabase
      .channel("reports-home")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReports((prev) => [payload.new as Report, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Report;
            setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setReports((prev) => prev.filter((r) => r.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const steps = [
    { step: "01", emoji: "📍", title: t("home.step1Title"), desc: t("home.step1Desc") },
    { step: "02", emoji: "📸", title: t("home.step2Title"), desc: t("home.step2Desc") },
    { step: "03", emoji: "🚀", title: t("home.step3Title"), desc: t("home.step3Desc") },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <Navbar showReport={false} />

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden bg-grain">
        <div className="mesh-glow" />
        <FloatingEmojiBackground />

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide"
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          {t("home.badge")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center font-poppins font-black max-w-4xl leading-[1.05]"
          style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
        >
          <span className="text-gray-900">{t("home.heroTitlePrefix")}</span>
          <span className="text-gradient-brand">{t("home.heroTitleSuffix")}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-4 text-center font-poppins font-bold text-gray-700 text-xl md:text-2xl max-w-2xl"
        >
          {t("home.heroSubtitle")}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-center text-gray-500 text-base md:text-lg max-w-xl leading-relaxed"
        >
          {t("home.heroParagraph")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/map">
            <Button size="lg">
              {t("home.getStarted")}
            </Button>
          </Link>
        </motion.div>

        {/* Live map preview in browser frame */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="mt-20 w-full max-w-5xl"
        >
          <Link href="/map" className="block group">
            <BrowserFrame className="transition-transform duration-300 group-hover:scale-[1.01]">
              <MapPreview />
            </BrowserFrame>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 text-xs"
        >
          <span>{t("home.scrollToSee")}</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-poppins font-black text-4xl md:text-5xl text-gray-900 mb-4">
              {t("home.howItWorksTitle")}
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              {t("home.howItWorksSubtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-6 rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-blue-300 transition-all card-hover"
                style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.05)" }}
              >
                <span className="absolute top-4 right-5 font-poppins font-black text-5xl text-gray-50">
                  {item.step}
                </span>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-3xl mb-4">
                  {item.emoji}
                </div>
                <h3 className="font-poppins font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reports feed — light background */}
      <section id="reports" className="py-24 px-6 bg-[#f8f9fa]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12 flex-wrap gap-4"
          >
            <div>
              <h2 className="font-poppins font-black text-4xl md:text-5xl text-gray-900 mb-2">
                {t("home.latestReports")}
              </h2>
              <p className="text-gray-500 text-base">
                {t("home.liveFeed")}
              </p>
            </div>
            <Link href="/map">
              <Button variant="outline" size="sm">
                {t("home.viewAllOnMap")}
              </Button>
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                  <div className="skeleton h-48 w-full bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-4 w-3/4 bg-gray-100" />
                    <div className="skeleton h-3 w-1/2 bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-lg font-semibold text-gray-500">{t("home.noReportsYet")}</p>
              <p className="text-sm text-gray-400 mt-1">{t("home.beFirst")}</p>
              <Link href="/map">
                <Button className="mt-6">
                  {t("home.goToMap")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.slice(0, 9).map((report, i) => (
                <ReportCard key={report.id} report={report} index={i} />
              ))}
            </div>
          )}

          {reports.length > 9 && (
            <div className="text-center mt-10">
              <Link href="/map">
                <Button variant="outline">
                  {t("home.seeAllReports", { count: reports.length })}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div
            className="relative p-12 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden"
            style={{ boxShadow: "0 20px 60px rgba(59,130,246,0.08)" }}
          >
            <h2 className="font-poppins font-black text-4xl md:text-5xl text-gray-900 mb-4">
              {t("home.ctaTitle")}
              <br />
              <span className="text-blue-600">{t("home.ctaTitleAccent")}</span>
            </h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              {t("home.ctaParagraph")}
            </p>
            <Link href="/map">
              <Button size="lg">
                {t("home.getStarted")}
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
