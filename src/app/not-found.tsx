"use client";

import Link from "next/link";
import { MapPinOff } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-24 pb-20">
        <div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mb-6">
          <MapPinOff className="w-9 h-9 text-blue-500" strokeWidth={1.75} />
        </div>
        <h1 className="font-poppins font-black text-4xl text-gray-900 mb-2">
          {t("notFound.title")}
        </h1>
        <p className="text-gray-500 text-base max-w-sm mb-8">
          {t("notFound.description")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <Button size="lg">{t("notFound.goHome")}</Button>
          </Link>
          <Link href="/map">
            <Button size="lg" variant="secondary">{t("notFound.openLiveMap")}</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
