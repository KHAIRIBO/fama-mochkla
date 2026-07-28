"use client";

import dynamic from "next/dynamic";
import type { ReportCategory } from "@/types/report";

const MapView = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  ),
});

interface MiniMapProps {
  lat: number;
  lng: number;
  category: ReportCategory;
}

export default function MiniMap({ lat, lng, category }: MiniMapProps) {
  const fakeReport = {
    id: "mini",
    title: "Location",
    description: null,
    category,
    status: "pending" as const,
    latitude: lat,
    longitude: lng,
    address: null,
    photo_url: null,
    reporter_name: null,
    created_at: new Date().toISOString(),
  };

  return (
    <MapView
      reports={[fakeReport]}
      center={[lat, lng]}
      zoom={14}
      readOnly
      showPopups={false}
    />
  );
}
