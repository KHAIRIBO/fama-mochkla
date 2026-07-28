"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { ChevronDown, FileText, Inbox, MousePointerClick, Navigation, Plus, SlidersHorizontal, TrendingUp, X } from "lucide-react";
import AnimatedNumber from "@/components/AnimatedNumber";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import FilterCard from "@/components/FilterCard";
import ReportCard from "@/components/ReportCard";
import ReportModal from "@/components/ReportModal";
import { Button } from "@/components/ui/button";
import { cleanupResolvedReports, fetchReports, supabase } from "@/lib/supabase";
import { CATEGORY_CONFIG, STATUS_CONFIG, type Report, type ReportCategory } from "@/types/report";

const MapView = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading map…</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  );
}

function MapPageContent() {
  const searchParams = useSearchParams();
  const targetLat = parseFloat(searchParams.get("lat") ?? "");
  const targetLng = parseFloat(searchParams.get("lng") ?? "");
  const hasTarget = !Number.isNaN(targetLat) && !Number.isNaN(targetLng);

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [newPinLat, setNewPinLat] = useState<number | null>(null);
  const [newPinLng, setNewPinLng] = useState<number | null>(null);
  const [modalLat, setModalLat] = useState<number | null>(null);
  const [modalLng, setModalLng] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(
    hasTarget ? [targetLat, targetLng] : undefined
  );
  const [mapZoom, setMapZoom] = useState(hasTarget ? 16 : 7);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showClickHint, setShowClickHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowClickHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const loadReports = useCallback(async () => {
    try {
      const data = await fetchReports({ category, status });
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [category, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial data load on filter change
    loadReports();
  }, [loadReports]);

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return reports;
    }
    const q = search.toLowerCase();
    return reports.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.address?.toLowerCase().includes(q) ?? false) ||
        (r.description?.toLowerCase().includes(q) ?? false)
    );
  }, [reports, search]);

  const stats = useMemo(() => {
    const byStatus = { pending: 0, in_progress: 0, resolved: 0 };
    const byCategory = new Map<ReportCategory, number>(
      (Object.keys(CATEGORY_CONFIG) as ReportCategory[]).map((c) => [c, 0])
    );

    for (const r of reports) {
      byStatus[r.status] += 1;
      byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + 1);
    }

    const categoryBreakdown = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
    const maxCategoryCount = Math.max(1, ...categoryBreakdown.map(([, n]) => n));
    const resolutionRate = reports.length > 0 ? Math.round((byStatus.resolved / reports.length) * 100) : 0;

    return { byStatus, categoryBreakdown, maxCategoryCount, resolutionRate };
  }, [reports]);

  const recent = reports.slice(0, 6);

  useEffect(() => {
    // Lazy cleanup — no cron job exists, so this is what actually deletes reports
    // that were voted "fixed" 24h+ ago. Runs whenever anyone loads the map.
    cleanupResolvedReports();

    const channel = supabase
      .channel("reports-map")
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

  // Auto-detect the visitor's location on load so the map can show a
  // "You are here" marker and start centered nearby — unless we were sent
  // here to focus a specific report (?lat=&lng=), which takes priority.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude);
        setUserLng(longitude);
        if (!hasTarget) {
          setMapCenter([latitude, longitude]);
          setMapZoom(13);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hasTarget derives from URL params present at mount, deliberately not re-run on change
  }, []);

  const openReportAt = useCallback((lat: number, lng: number) => {
    setNewPinLat(lat);
    setNewPinLng(lng);
    setModalLat(lat);
    setModalLng(lng);
    setModalOpen(true);
    setShowClickHint(false);
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => openReportAt(lat, lng),
    [openReportAt]
  );

  const handleModalClose = () => {
    setModalOpen(false);
    setNewPinLat(null);
    setNewPinLng(null);
    setModalLat(null);
    setModalLng(null);
  };

  const handleOpenReportButton = () => {
    setModalLat(null);
    setModalLng(null);
    setNewPinLat(null);
    setNewPinLng(null);
    setModalOpen(true);
  };

  const handleGps = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude);
        setUserLng(longitude);
        setMapCenter([latitude, longitude]);
        setMapZoom(15);
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true }
    );
  };

  const handleCardClick = (report: Report) => {
    setMapCenter([report.latitude, report.longitude]);
    setMapZoom(15);
  };

  return (
    <div className="bg-white text-gray-900">
      <Navbar showReport={false} />

      {/* Big live map */}
      <section className="relative w-full h-screen overflow-hidden">
        <div className="absolute inset-0">
          {!loading && (
            <MapView
              reports={filtered}
              onMapClick={handleMapClick}
              newPinLat={newPinLat}
              newPinLng={newPinLng}
              userLat={userLat}
              userLng={userLng}
              center={mapCenter}
              flyToCenter={!!mapCenter}
              zoom={mapZoom}
            />
          )}
          {loading && (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Loading reports…</p>
              </div>
            </div>
          )}
        </div>

        {/* Click-to-report hint — sits in the empty middle of the map, out of the way of the corner UI */}
        <AnimatePresence>
          {!loading && showClickHint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] pointer-events-none px-4"
            >
              <div className="glass rounded-2xl px-5 py-3 flex items-center gap-2.5 shadow-xl">
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  className="shrink-0"
                >
                  <MousePointerClick className="w-4 h-4 text-blue-600" />
                </motion.span>
                <span className="text-sm font-medium text-gray-700 text-center">
                  Tap anywhere on the map to report a problem
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter card — always visible on desktop */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden md:block absolute top-20 left-4 z-[500] max-w-[calc(100vw-2rem)]"
        >
          <FilterCard
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            status={status}
            onStatusChange={setStatus}
          />
        </motion.div>

        {/* Filter toggle + panel — mobile only, avoids overlapping the Report button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => setMobileFilterOpen((v) => !v)}
          className="md:hidden absolute top-20 left-4 z-[500] w-11 h-11 rounded-full glass shadow-lg flex items-center justify-center text-gray-700"
          aria-label="Toggle filters"
        >
          {mobileFilterOpen ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
          {!mobileFilterOpen && (category !== "all" || status !== "all" || !!search) && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" />
          )}
        </motion.button>
        <AnimatePresence>
          {mobileFilterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="md:hidden absolute top-36 left-4 z-[500] max-w-[calc(100vw-2rem)]"
            >
              <FilterCard
                search={search}
                onSearchChange={setSearch}
                category={category}
                onCategoryChange={setCategory}
                status={status}
                onStatusChange={setStatus}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report CTA — top-right */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute top-20 right-4 z-[500]"
        >
          <Button onClick={handleOpenReportButton} size="default">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">Report a Problem</span>
            <span className="sm:hidden">Report</span>
          </Button>
        </motion.div>

        {/* GPS shortcut — bottom-right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-20 right-4 z-[500]"
        >
          <Button
            variant="secondary"
            onClick={handleGps}
            disabled={gpsLoading}
            className="glass shadow-xl"
            aria-label="Use my location"
          >
            <Navigation className={`w-4 h-4 ${gpsLoading ? "animate-pulse" : ""}`} />
            <span className="hidden sm:inline">{gpsLoading ? "Locating…" : "Use My Location"}</span>
          </Button>
        </motion.div>

        {/* Live count badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="absolute bottom-6 left-4 z-[500] glass rounded-2xl px-4 py-2.5 flex items-center gap-3 text-xs"
        >
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900">
            <AnimatedNumber value={filtered.length} duration={0.5} />
          </span>
          <span className="text-gray-500">report{filtered.length !== 1 ? "s" : ""}</span>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[500] flex flex-col items-center gap-1 text-gray-600 text-[11px] pointer-events-none glass px-3 py-1.5 rounded-full"
        >
          <span>Scroll for stats</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats & recent activity */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-gray-200 bg-white">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-lg font-semibold text-gray-600">No reports yet.</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to report a problem — tap the map above.</p>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
            >
              <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50">
                <div className="flex items-center gap-1.5 text-blue-600 mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest">Total reports</span>
                </div>
                <span className="font-poppins font-black text-3xl text-gray-900">
                  <AnimatedNumber value={reports.length} />
                </span>
              </div>

              {(["pending", "in_progress", "resolved"] as const).map((s) => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <div key={s} className="p-5 rounded-2xl border border-gray-200 bg-white">
                    <div className="flex items-center gap-1.5 text-gray-500 mb-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      <span className="text-[11px] font-semibold uppercase tracking-widest">{cfg.label}</span>
                    </div>
                    <span className="font-poppins font-black text-3xl text-gray-900">
                      <AnimatedNumber value={stats.byStatus[s]} />
                    </span>
                  </div>
                );
              })}
            </motion.div>

            {/* Resolution rate meter */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-5 rounded-2xl border border-gray-200 bg-white mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">Resolution rate</span>
                </div>
                <span className="font-poppins font-bold text-sm text-gray-900">
                  <AnimatedNumber value={stats.resolutionRate} suffix="%" />
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-blue-50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${stats.resolutionRate}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-blue-500"
                />
              </div>
            </motion.div>

            {/* Category breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-5 rounded-2xl border border-gray-200 bg-white mb-10"
            >
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                Reports by category
              </h2>
              <div className="space-y-3">
                {stats.categoryBreakdown.map(([cat, count]) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  const pct = (count / stats.maxCategoryCount) * 100;
                  return (
                    <div key={cat} className="flex items-center gap-3 group">
                      <div className="w-32 sm:w-40 shrink-0 flex items-center gap-1.5 text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                        <span>{cfg.emoji}</span>
                        <span className="truncate">{cfg.label}</span>
                      </div>
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500/80 group-hover:bg-blue-500 transition-all"
                          style={{ width: count > 0 ? `${Math.max(pct, 3)}%` : "0%" }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right text-xs font-semibold text-gray-500 tabular-nums">
                        <AnimatedNumber value={count} duration={0.6} />
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Recent activity */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-poppins font-bold text-xl text-gray-900 mb-4">Recent Activity</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recent.map((report, i) => (
                  <div key={report.id} onClick={() => handleCardClick(report)}>
                    <ReportCard report={report} index={i} />
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </main>

      <Footer />

      <ReportModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSuccess={loadReports}
        initialLat={modalLat}
        initialLng={modalLng}
      />
    </div>
  );
}
