"use client";

import { useEffect, useState } from "react";
import type { SiteContent } from "@/lib/site/schema";

// Badge "Aperto ora / Chiuso" calcolato nel browser con l'ora italiana
// (la pagina è in cache, quindi non può farlo il server).

function romeNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(wd);
  return { day, minutes: (Number(h) % 24) * 60 + Number(m) };
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export function isOpenAt(hours: SiteContent["hours"], day: number, minutes: number): boolean {
  const today = hours[day];
  if (today && !today.closed) {
    for (const s of today.slots) {
      const from = toMin(s.from);
      const to = toMin(s.to);
      if (to > from ? minutes >= from && minutes < to : minutes >= from) return true; // to <= from: oltre mezzanotte
    }
  }
  const prev = hours[(day + 6) % 7];
  if (prev && !prev.closed) {
    for (const s of prev.slots) if (toMin(s.to) <= toMin(s.from) && minutes < toMin(s.to)) return true;
  }
  return false;
}

export function OpenNow({ hours, className = "" }: { hours: SiteContent["hours"]; className?: string }) {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const tick = () => {
      const { day, minutes } = romeNow();
      setOpen(isOpenAt(hours, day, minutes));
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours]);
  if (open === null || !hours.some((d) => d.slots.length)) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${open ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-700"} ${className}`}>
      <span className={`h-2 w-2 rounded-full ${open ? "bg-emerald-500" : "bg-neutral-400"}`} />
      {open ? "Aperto ora" : "Ora chiuso"}
    </span>
  );
}
