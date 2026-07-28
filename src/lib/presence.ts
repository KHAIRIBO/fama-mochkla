"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export const PRESENCE_CHANNEL = "site-visitors";

let channel: RealtimeChannel | null = null;
let currentCount = 1;
const listeners = new Set<(count: number) => void>();

/**
 * One shared Realtime Presence channel per browser tab. Realtime forbids adding
 * `.on()` listeners after `.subscribe()` has been called, so every consumer must
 * go through this singleton instead of creating its own `supabase.channel(...)`
 * with the same topic — otherwise the second subscriber crashes.
 */
function getChannel(): RealtimeChannel {
  if (channel) return channel;

  channel = supabase.channel(PRESENCE_CHANNEL, {
    config: { presence: { key: crypto.randomUUID() } },
  });

  channel.on("presence", { event: "sync" }, () => {
    const state = channel!.presenceState();
    currentCount = Math.max(1, Object.keys(state).length);
    listeners.forEach((cb) => cb(currentCount));
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel!.track({ online_at: new Date().toISOString() });
    }
  });

  return channel;
}

/** Marks this tab as present. Call once (e.g. from a layout-level component). */
export function initPresence() {
  getChannel();
}

/** Subscribes to live online-count updates; returns an unsubscribe function. */
export function subscribePresenceCount(cb: (count: number) => void): () => void {
  getChannel();
  listeners.add(cb);
  cb(currentCount);
  return () => {
    listeners.delete(cb);
  };
}
