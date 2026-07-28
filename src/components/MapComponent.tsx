"use client";

/**
 * MapView — Leaflet map with category-colored pins.
 * - Click empty map → onMapClick (opens report form)
 * - Click existing pin → read-only popup
 */

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  CATEGORY_CONFIG,
  normalizeCategory,
  type Report,
} from "@/types/report";
import StatusBadge from "./StatusBadge";
import VoteButtons from "./VoteButtons";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TUNISIA_CENTER: [number, number] = [33.8869, 9.5375];
const TUNISIA_BOUNDS: [[number, number], [number, number]] = [
  [30.24, 7.52],
  [37.54, 11.59],
];

function buildPinIcon(color: string, emoji: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:36px; height:36px;
        background:${color};
        border-radius:50% 50% 50% 0;
        border:2.5px solid rgba(255,255,255,0.35);
        box-shadow:0 4px 16px rgba(0,0,0,0.55);
        display:flex; align-items:center; justify-content:center;
        cursor:pointer;
        animation:pinDrop 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
        transition:box-shadow 0.2s;
      ">
        <span style="transform:rotate(45deg);font-size:15px;line-height:1;display:block">${emoji}</span>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}

function NewPinMarker({ lat, lng }: { lat: number; lng: number }) {
  const icon = L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;
      background:#3b82f6;
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 0 0 6px rgba(59,130,246,0.25),0 4px 16px rgba(0,0,0,0.5);
      animation:popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both, pulse 2s 0.35s infinite;
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
  return <Marker position={[lat, lng]} icon={icon} />;
}

function UserLocationMarker({ lat, lng }: { lat: number; lng: number }) {
  const { t } = useLanguage();
  const icon = L.divIcon({
    className: "",
    html: `<div style="
      width:18px;height:18px;
      background:#3b82f6;
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 0 0 6px rgba(59,130,246,0.2),0 2px 10px rgba(0,0,0,0.5);
      animation:popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
  return (
    <Marker position={[lat, lng]} icon={icon} zIndexOffset={-100}>
      <Tooltip direction="top" offset={[0, -10]} permanent opacity={0.9}>
        {t("map.youAreHere")}
      </Tooltip>
    </Marker>
  );
}

function ClickHandler({
  onMapClick,
  enabled,
}: {
  onMapClick?: (lat: number, lng: number) => void;
  enabled?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (enabled) onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapCenterController({
  center,
  zoom,
}: {
  center?: [number, number];
  zoom?: number;
}) {
  const map = useMap();
  const prev = useRef<string>("");

  useEffect(() => {
    if (!center) return;
    const key = `${center[0]},${center[1]},${zoom ?? map.getZoom()}`;
    if (prev.current === key) return;
    prev.current = key;
    map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.8 });
  }, [center, zoom, map]);

  return null;
}

function ReportPopupContent({ report }: { report: Report }) {
  const { t } = useLanguage();
  const category = normalizeCategory(report.category);
  const catCfg = CATEGORY_CONFIG[category];
  const timeAgo = formatDistanceToNow(new Date(report.created_at), {
    addSuffix: true,
  });

  return (
    <div className="w-64 p-0 text-gray-900">
      {report.photo_url && (
        <div
          className="h-32 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${report.photo_url})` }}
        />
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catCfg.color}`}
          >
            {catCfg.emoji} {catCfg.label}
          </span>
          <StatusBadge status={report.status} size="sm" />
        </div>
        <h3 className="font-poppins font-bold text-sm leading-snug">
          {report.title}
        </h3>
        {report.description && (
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3" dir="auto">
            {report.description}
          </p>
        )}
        {report.address && (
          <p className="text-[11px] text-gray-500 line-clamp-1 flex items-center gap-1" dir="auto">
            <span className="shrink-0">📍</span>
            <span className="truncate">{report.address}</span>
          </p>
        )}
        <p className="text-[10px] text-gray-400">{timeAgo}</p>

        <div className="pt-2 border-t border-gray-100">
          {report.status === "resolved" ? (
            <p className="text-[11px] font-medium text-green-600 flex items-center gap-1">
              {t("popup.markedFixed")}
            </p>
          ) : (
            <VoteButtons report={report} compact />
          )}
        </div>

        <Link
          href={`/report/${report.id}`}
          className="block w-full text-center py-2 mt-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors"
        >
          {t("popup.viewDetails")}
        </Link>
      </div>
    </div>
  );
}

export interface MapViewProps {
  reports: Report[];
  onMapClick?: (lat: number, lng: number) => void;
  newPinLat?: number | null;
  newPinLng?: number | null;
  /** The visitor's own GPS position, shown as a distinct "You are here" marker */
  userLat?: number | null;
  userLng?: number | null;
  center?: [number, number];
  zoom?: number;
  /** When true, pins are shown but map clicks are disabled (mini-map mode) */
  readOnly?: boolean;
  /** Show popups on pin click (default true unless readOnly mini-map) */
  showPopups?: boolean;
  /** Fly to center when it changes */
  flyToCenter?: boolean;
}

export default function MapView({
  reports,
  onMapClick,
  newPinLat,
  newPinLng,
  userLat,
  userLng,
  center = TUNISIA_CENTER,
  zoom = 7,
  readOnly = false,
  showPopups = true,
  flyToCenter = false,
}: MapViewProps) {
  const clickEnabled = !readOnly && !!onMapClick;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={6}
      maxBounds={TUNISIA_BOUNDS}
      maxBoundsViscosity={1.0}
      className="w-full h-full"
      style={{ background: "#f1f2f4" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {flyToCenter && <MapCenterController center={center} zoom={zoom} />}
      <ClickHandler onMapClick={onMapClick} enabled={clickEnabled} />

      {newPinLat != null && newPinLng != null && (
        <NewPinMarker lat={newPinLat} lng={newPinLng} />
      )}

      {userLat != null && userLng != null && (
        <UserLocationMarker lat={userLat} lng={userLng} />
      )}

      {reports.map((report) => {
        const category = normalizeCategory(report.category);
        const catCfg = CATEGORY_CONFIG[category];
        const icon = buildPinIcon(catCfg.pinColor, catCfg.emoji);

        return (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={icon}
            eventHandlers={{
              mouseover: (e) => {
                (e.target as L.Marker)
                  .getElement()
                  ?.querySelector("div")
                  ?.style.setProperty("box-shadow", "0 8px 28px rgba(0,0,0,0.8)");
              },
              mouseout: (e) => {
                (e.target as L.Marker)
                  .getElement()
                  ?.querySelector("div")
                  ?.style.setProperty("box-shadow", "0 4px 16px rgba(0,0,0,0.55)");
              },
            }}
          >
            {showPopups && !readOnly && (
              <Popup closeButton maxWidth={280} minWidth={240}>
                <ReportPopupContent report={{ ...report, category }} />
              </Popup>
            )}
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export { TUNISIA_CENTER, TUNISIA_BOUNDS };
