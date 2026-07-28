"use client";

import { type ReactNode } from "react";

interface BrowserFrameProps {
  children: ReactNode;
  className?: string;
}

/**
 * A rounded browser-mockup frame that wraps any content,
 * styled to mimic the reference design's preview widget.
 */
export default function BrowserFrame({ children, className = "" }: BrowserFrameProps) {
  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-50 ${className}`}
      style={{ boxShadow: "0 30px 90px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.04)" }}
    >
      {/* Top bar — browser chrome dots */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-200">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-400" />
        <div className="ml-3 flex-1 h-5 rounded-full bg-gray-100 border border-gray-200 flex items-center px-3">
          <span className="text-[10px] text-gray-400 font-mono tracking-wide select-none">
            fama-mochkla.app/map
          </span>
        </div>
      </div>

      {/* Content slot */}
      <div className="relative">{children}</div>
    </div>
  );
}
