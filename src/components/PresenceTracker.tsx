"use client";

import { useEffect } from "react";
import { initPresence } from "@/lib/presence";

/** Renders nothing — just marks this browser tab as "online" for the admin dashboard's live counter. */
export default function PresenceTracker() {
  useEffect(() => {
    initPresence();
  }, []);

  return null;
}
