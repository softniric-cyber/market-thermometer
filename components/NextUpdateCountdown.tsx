"use client";

import { useEffect, useState } from "react";

/**
 * Countdown timer to the next data update.
 * Scraper runs Mon & Thu at 08:00 Madrid time (CEST/CET).
 * We show "next update" as ~10:00 Madrid time to account for scraping + deploy.
 */

function getNextUpdateDate(): Date {
  const now = new Date();
  // Work in Madrid timezone
  const madrid = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Madrid" })
  );

  const day = madrid.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu
  const hour = madrid.getHours();

  // Schedule days: Monday (1) and Thursday (4)
  // Data available ~10:00 Madrid time
  const PUBLISH_HOUR = 10;
  const scheduleDays = [1, 4];

  let daysUntil = 0;

  // Find next schedule day
  for (let i = 0; i <= 7; i++) {
    const candidateDay = (day + i) % 7;
    if (scheduleDays.includes(candidateDay)) {
      if (i === 0 && hour >= PUBLISH_HOUR) continue; // today already passed
      daysUntil = i;
      break;
    }
  }

  const next = new Date(madrid);
  next.setDate(next.getDate() + daysUntil);
  next.setHours(PUBLISH_HOUR, 0, 0, 0);

  // Convert back: get the offset between local and Madrid
  const nowMs = now.getTime();
  const madridMs = madrid.getTime();
  const offset = nowMs - madridMs;

  return new Date(next.getTime() + offset);
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function NextUpdateCountdown({ locale }: { locale: string }) {
  const [target, setTarget] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const t = getNextUpdateDate();
    setTarget(t);
    setTimeLeft(getTimeLeft(t));

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(t));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  const label = locale === "en" ? "Next update" : "Próxima actualización";
  const dayLabel = locale === "en" ? "d" : "d";
  const hourLabel = "h";
  const minLabel = "m";
  const secLabel = "s";

  const pad = (n: number) => n.toString().padStart(2, "0");

  // If less than 1 minute, show "updating..."
  if (
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0
  ) {
    const updatingText =
      locale === "en" ? "Updating now..." : "Actualizando...";
    return (
      <span className="text-cyan-400 text-xs font-medium animate-pulse">
        🔄 {updatingText}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <span>⏱</span>
      <span>{label}:</span>
      <span className="font-mono text-slate-400">
        {timeLeft.days > 0 && (
          <>
            <span className="text-slate-300">{timeLeft.days}</span>
            {dayLabel}{" "}
          </>
        )}
        <span className="text-slate-300">{pad(timeLeft.hours)}</span>
        {hourLabel}{" "}
        <span className="text-slate-300">{pad(timeLeft.minutes)}</span>
        {minLabel}{" "}
        <span className="text-slate-300">{pad(timeLeft.seconds)}</span>
        {secLabel}
      </span>
    </span>
  );
}
