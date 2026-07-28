"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AlertTriangle, Camera, CheckCircle2, ImagePlus, Loader2, MapPin, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { insertReport, uploadPhoto } from "@/lib/supabase";
import { CATEGORY_CONFIG, type ReportCategory } from "@/types/report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MapView = dynamic(() => import("./MapComponent"), { ssr: false });

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Pre-filled coordinates from map click or GPS */
  initialLat?: number | null;
  initialLng?: number | null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function ReportModal({
  isOpen,
  onClose,
  onSuccess,
  initialLat = null,
  initialLng = null,
}: ReportModalProps) {
  const { t } = useLanguage();
  const [lat, setLat] = useState<number | null>(initialLat);
  const [lng, setLng] = useState<number | null>(initialLng);
  const [address, setAddress] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReportCategory>("hofra");
  const [otherCategoryText, setOtherCategoryText] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoWarning, setPhotoWarning] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "locating" | "denied" | "unavailable">("idle");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const setLocation = useCallback(async (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setGeocoding(true);
    const addr = await reverseGeocode(newLat, newLng);
    setAddress(addr);
    setGeocoding(false);
  }, []);

  useEffect(() => {
    if (isOpen && initialLat != null && initialLng != null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync location from props when modal opens
      setLocation(initialLat, initialLng);
    }
  }, [isOpen, initialLat, initialLng, setLocation]);

  // Auto-detect the user's current location the moment the modal opens,
  // unless a location was already pre-filled (e.g. from a map click).
  useEffect(() => {
    if (!isOpen || initialLat != null || initialLng != null || lat != null) return;
    if (!navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- report GPS unavailability when modal opens
      setGpsStatus("unavailable");
      return;
    }
    setGpsStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus("idle");
        setLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => setGpsStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isOpen, initialLat, initialLng, lat, setLocation]);

  const handleMapClick = useCallback(
    (clickLat: number, clickLng: number) => setLocation(clickLat, clickLng),
    [setLocation]
  );

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async () => {
    if (!lat || !lng || !title.trim()) return;
    if (category === "other" && !otherCategoryText.trim() && !description.trim()) {
      setError(t("modal.specifyOrDescribe"));
      return;
    }

    setSubmitting(true);
    setError(null);
    setPhotoWarning(null);

    // Photo upload failures (e.g. the storage bucket isn't set up yet) shouldn't
    // block the report itself from being saved — fall back to no photo instead.
    let photo_url: string | null = null;
    if (photoFile) {
      try {
        photo_url = await uploadPhoto(photoFile);
      } catch (err) {
        setPhotoWarning(
          err instanceof Error ? err.message : t("modal.photoUploadFailed")
        );
      }
    }

    try {
      const finalDescription =
        category === "other" && otherCategoryText.trim()
          ? `[${otherCategoryText.trim()}] ${description}`.trim()
          : description || null;

      await insertReport({
        title: title.trim(),
        description: finalDescription,
        category,
        latitude: lat,
        longitude: lng,
        address: address || null,
        photo_url,
        reporter_name: reporterName.trim() || null,
      });

      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("modal.submissionFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setLat(null);
    setLng(null);
    setAddress("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setTitle("");
    setDescription("");
    setCategory("hofra");
    setOtherCategoryText("");
    setReporterName("");
    setError(null);
    setPhotoWarning(null);
    setSuccess(false);
    setGpsStatus("idle");
    onClose();
  };

  const handleChangeLocation = () => {
    setLat(null);
    setLng(null);
    setAddress("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto glass rounded-2xl shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 bg-white/95 backdrop-blur-xl rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-poppins font-bold text-gray-900 text-lg leading-tight">
                      {t("modal.title")}
                    </h2>
                    <p className="text-xs text-gray-500">{t("modal.subtitle")}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {success ? (
                <div className="flex flex-col items-center text-center py-12 px-6 gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-300 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-600" strokeWidth={1.75} />
                  </motion.div>
                  <h3 className="font-poppins font-black text-2xl text-gray-900">
                    {t("modal.submitted")}
                  </h3>
                  <p className="text-gray-500 text-sm max-w-xs">
                    {t("modal.submittedDesc")}
                  </p>
                  {photoWarning && (
                    <div className="w-full max-w-xs px-4 py-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-left flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-amber-800 leading-snug">
                        {t("modal.photoWarning", { error: photoWarning })}
                      </p>
                    </div>
                  )}
                  <Button onClick={handleClose} className="mt-2">
                    {t("modal.done")}
                  </Button>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-5">
                  {/* Location */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">
                      {t("modal.location")}
                    </label>
                    {!lat ? (
                      <>
                        <div
                          className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-100"
                          style={{ height: 200 }}
                        >
                          <MapView
                            reports={[]}
                            onMapClick={handleMapClick}
                            zoom={7}
                          />
                          {gpsStatus === "locating" && (
                            <div className="absolute inset-0 z-[500] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 pointer-events-none">
                              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                              <p className="text-xs text-white/90 font-medium">{t("modal.detectingLocation")}</p>
                            </div>
                          )}
                        </div>
                        {(gpsStatus === "denied" || gpsStatus === "unavailable") && (
                          <p className="text-[11px] text-gray-400 mt-2">
                            {t("modal.locationUnavailable")}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-gray-700 flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-semibold text-blue-600">{t("modal.pinned")} </span>
                          {geocoding ? t("modal.lookingUpAddress") : address || `${lat.toFixed(5)}, ${lng?.toFixed(5)}`}
                        </div>
                        <button
                          type="button"
                          onClick={handleChangeLocation}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
                        >
                          {t("modal.change")}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">
                      {t("modal.category")}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(Object.entries(CATEGORY_CONFIG) as [ReportCategory, typeof CATEGORY_CONFIG[ReportCategory]][]).map(
                        ([key, cfg]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setCategory(key)}
                            className={`py-2.5 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                              category === key
                                ? "border-blue-400 bg-blue-50 text-blue-700"
                                : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-800"
                            }`}
                          >
                            <span className="text-lg">{cfg.emoji}</span>
                            <span className="leading-tight text-center">{cfg.label}</span>
                          </button>
                        )
                      )}
                    </div>
                    {category === "other" && (
                      <Input
                        className="mt-2"
                        placeholder={t("modal.specifyProblemType")}
                        value={otherCategoryText}
                        onChange={(e) => setOtherCategoryText(e.target.value)}
                      />
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">
                      {t("modal.title_")}
                    </label>
                    <Input
                      placeholder={t("modal.titlePlaceholder")}
                      value={title}
                      maxLength={100}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Photo */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">
                      {t("modal.photo")}
                    </label>

                    {photoPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                        <div className="relative w-full h-40">
                          <Image src={photoPreview} alt="Preview" fill className="object-cover" sizes="400px" />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          aria-label="Remove photo"
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex-1 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-semibold flex items-center justify-center gap-1.5 backdrop-blur-sm transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5" /> {t("modal.retake")}
                          </button>
                          <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="flex-1 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-semibold flex items-center justify-center gap-1.5 backdrop-blur-sm transition-colors"
                          >
                            <ImagePlus className="w-3.5 h-3.5" /> {t("modal.change")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(false);
                          const file = e.dataTransfer.files[0];
                          if (file) handleFileSelect(file);
                        }}
                        className={`rounded-2xl border-2 border-dashed p-4 flex flex-col items-center justify-center gap-3 min-h-[140px] transition-all ${
                          dragOver
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <ImagePlus className="w-7 h-7 text-gray-300" strokeWidth={1.5} />
                        <p className="text-xs text-gray-400">{t("modal.photoFormats")}</p>
                        <div className="flex gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-xs font-semibold transition-all"
                          >
                            <Camera className="w-4 h-4" /> {t("modal.takePhoto")}
                          </button>
                          <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-xs font-semibold transition-all"
                          >
                            <ImagePlus className="w-4 h-4" /> {t("modal.uploadPhoto")}
                          </button>
                        </div>
                      </div>
                    )}

                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelect(f);
                        e.target.value = "";
                      }}
                    />
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelect(f);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  {/* Description — RTL-friendly */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">
                      {t("modal.description")}
                    </label>
                    <Textarea
                      rows={3}
                      placeholder={t("modal.descriptionPlaceholder")}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      dir="auto"
                    />
                  </div>

                  {/* Reporter name */}
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">
                      {t("modal.yourName")}
                    </label>
                    <Input
                      placeholder={t("modal.anonymous")}
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={submitting}>
                      {t("modal.cancel")}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleSubmit}
                      disabled={!lat || !title.trim() || submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("modal.submitting")}
                        </>
                      ) : (
                        t("modal.submitReport")
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
