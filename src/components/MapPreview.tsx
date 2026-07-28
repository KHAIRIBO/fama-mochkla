"use client";

import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import { CATEGORY_CONFIG, STATUS_CONFIG } from "@/types/report";

const MapView = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  ),
});

const MOCK_REPORTS = [
  { id: "m1", category: "hofra" as const, title: "7ofra kbira fi Avenue Habib Bourguiba", status: "pending" as const, lat: 36.81, lng: 10.17 },
  { id: "m2", category: "dhaw" as const, title: "Dhaw mkasser 9rib Bab Souika", status: "in_progress" as const, lat: 36.80, lng: 10.16 },
  { id: "m3", category: "zbila" as const, title: "Zbila f Marché Central", status: "resolved" as const, lat: 36.82, lng: 10.18 },
  { id: "m4", category: "ma_famech_ma" as const, title: "Ma famech ma fi Rue de Rome", status: "pending" as const, lat: 36.79, lng: 10.15 },
  { id: "m5", category: "accident" as const, title: "Accident 9rib Palais de Justice", status: "in_progress" as const, lat: 36.83, lng: 10.19 },
];

/** Live map preview inside the browser frame on the landing page */
export default function MapPreview() {
  const fakeReports = MOCK_REPORTS.map((r) => ({
    id: r.id,
    title: r.title,
    description: null,
    category: r.category,
    status: r.status,
    latitude: r.lat,
    longitude: r.lng,
    address: null,
    photo_url: null,
    reporter_name: null,
    created_at: new Date().toISOString(),
    fixed_votes: 0,
    not_fixed_votes: 0,
    resolved_at: null,
  }));

  return (
    <div className="w-full flex" style={{ height: 480 }}>
      <div className="relative flex-1 overflow-hidden border-r border-gray-200">
        <MapView reports={fakeReports} readOnly showPopups zoom={7} />
        <div className="absolute top-4 left-4 glass rounded-xl px-3 py-2 flex items-center gap-2 text-[10px] text-gray-600 pointer-events-none">
          <Search className="w-3 h-3" /> Search &amp; Filter
        </div>
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-[10px] text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live · Tunisia
        </div>
      </div>

      <div className="w-72 flex-col bg-white overflow-hidden hidden md:flex">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-800">Recent Reports</span>
          <span className="text-[10px] text-blue-600 font-semibold">{MOCK_REPORTS.length} live</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {MOCK_REPORTS.map((r) => {
            const cat = CATEGORY_CONFIG[r.category];
            const st = STATUS_CONFIG[r.status];
            return (
              <div key={r.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                    style={{ background: `${cat.pinColor}1a`, border: `1px solid ${cat.pinColor}44` }}
                  >
                    {cat.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 mb-1">
                      {r.title}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${st.color}`}>
                      <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="w-full py-2 bg-blue-50 border border-blue-200 rounded-xl text-center text-[11px] font-bold text-blue-700">
            Open Live Map →
          </div>
        </div>
      </div>
    </div>
  );
}
