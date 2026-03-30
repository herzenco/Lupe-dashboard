"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: string;
  color: string;
}

type ViewMode = "week" | "day" | "month";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am - 8pm

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function formatDateRange(date: Date, view: ViewMode): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  if (view === "day") {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      ...opts,
    });
  }
  if (view === "week") {
    const weekStart = startOfWeek(date);
    const weekEnd = addDays(weekStart, 6);
    const s = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const e = weekEnd.toLocaleDateString("en-US", opts);
    return `${s} – ${e}`;
  }
  // month
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function eventColor(type: string): {
  bg: string;
  border: string;
  text: string;
} {
  switch (type) {
    case "clickup":
      return {
        bg: "bg-green-500/20",
        border: "border-green-500/50",
        text: "text-green-300",
      };
    case "cron":
      return {
        bg: "bg-gray-500/20",
        border: "border-gray-500/50",
        text: "text-gray-300",
      };
    default:
      return {
        bg: "bg-blue-500/20",
        border: "border-blue-500/50",
        text: "text-blue-300",
      };
  }
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [popover, setPopover] = useState<{
    event: CalendarEvent;
    x: number;
    y: number;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fetch events
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/calendar");
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setPopover(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Navigation
  const navigate = useCallback(
    (dir: -1 | 1) => {
      setCurrentDate((prev) => {
        if (viewMode === "day") return addDays(prev, dir);
        if (viewMode === "week") return addDays(prev, dir * 7);
        const d = new Date(prev);
        d.setMonth(d.getMonth() + dir);
        return d;
      });
    },
    [viewMode]
  );

  const goToday = () => setCurrentDate(new Date());

  // Event click handler
  function handleEventClick(
    e: React.MouseEvent,
    event: CalendarEvent
  ) {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopover({ event, x: rect.left, y: rect.bottom + 4 });
  }

  // ─── Week View ──────────────────────────────────────────────────────────

  function renderWeekView() {
    const weekStart = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const now = new Date();
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
      <div className="overflow-auto">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-800">
          <div /> {/* spacer for time gutter */}
          {days.map((day, i) => {
            const isToday = isSameDay(day, now);
            return (
              <div
                key={i}
                className="border-l border-gray-800 px-2 py-3 text-center"
              >
                <div className="text-xs text-gray-500">{dayNames[i]}</div>
                <div
                  className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    isToday
                      ? "bg-blue-600 text-white"
                      : "text-gray-300"
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="relative grid grid-cols-[60px_repeat(7,1fr)]">
          {/* Hour rows */}
          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className="relative h-16 border-b border-gray-800/50 pr-2 text-right">
                <span className="relative -top-2 text-[10px] text-gray-600">
                  {formatHour(hour)}
                </span>
              </div>
              {days.map((_, di) => (
                <div
                  key={di}
                  className="h-16 border-b border-l border-gray-800/50"
                />
              ))}
            </div>
          ))}

          {/* Events overlay — one column per day, absolutely positioned over the grid */}
          {days.map((day, di) => {
            const dayEvents = events.filter((ev) =>
              isSameDay(new Date(ev.start), day)
            );
            return dayEvents.map((ev) => {
              const start = new Date(ev.start);
              const end = new Date(ev.end);
              const startHour = start.getHours() + start.getMinutes() / 60;
              const endHour = end.getHours() + end.getMinutes() / 60;
              const top = (startHour - 8) * 64; // 64px per hour (h-16 = 4rem = 64px)
              const height = Math.max((endHour - startHour) * 64, 20);
              const colors = eventColor(ev.type);

              if (startHour < 8 || startHour > 20) return null;

              // Each column is 1/8 of the grid (60px gutter + 7 equal cols)
              // Column di starts at gridColumn di+2 in the 8-col layout
              // Use calc: left = 60px + di * (100% - 60px) / 7
              const colWidthCalc = "(100% - 60px) / 7";
              const leftCalc = `calc(60px + ${di} * ${colWidthCalc} + 2px)`;
              const widthCalc = `calc(${colWidthCalc} - 4px)`;

              return (
                <div
                  key={ev.id}
                  className={`absolute cursor-pointer rounded border px-1.5 py-0.5 text-[11px] leading-tight ${colors.bg} ${colors.border} ${colors.text} hover:brightness-125`}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: leftCalc,
                    width: widthCalc,
                  }}
                  onClick={(e) => handleEventClick(e, ev)}
                >
                  <div className="truncate font-medium">{ev.title}</div>
                </div>
              );
            });
          })}

          {/* Current time indicator */}
          {days.some((d) => isSameDay(d, now)) && (() => {
            const nowHour = now.getHours() + now.getMinutes() / 60;
            if (nowHour < 8 || nowHour > 20) return null;
            const top = (nowHour - 8) * 64;
            const dayIndex = days.findIndex((d) => isSameDay(d, now));
            const colWidthCalc = "(100% - 60px) / 7";
            return (
              <div
                className="pointer-events-none absolute h-0.5 bg-red-500"
                style={{
                  top: `${top}px`,
                  left: `calc(60px + ${dayIndex} * ${colWidthCalc})`,
                  width: `calc(${colWidthCalc})`,
                }}
              >
                <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500" />
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ─── Day View ───────────────────────────────────────────────────────────

  function renderDayView() {
    const now = new Date();
    const isToday = isSameDay(currentDate, now);
    const dayEvents = events.filter((ev) =>
      isSameDay(new Date(ev.start), currentDate)
    );

    return (
      <div className="overflow-auto">
        <div className="relative grid grid-cols-[60px_1fr]">
          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className="relative h-16 border-b border-gray-800/50 pr-2 text-right">
                <span className="relative -top-2 text-[10px] text-gray-600">
                  {formatHour(hour)}
                </span>
              </div>
              <div className="h-16 border-b border-l border-gray-800/50" />
            </div>
          ))}

          {/* Events */}
          {dayEvents.map((ev) => {
            const start = new Date(ev.start);
            const end = new Date(ev.end);
            const startHour = start.getHours() + start.getMinutes() / 60;
            const endHour = end.getHours() + end.getMinutes() / 60;
            const top = (startHour - 8) * 64;
            const height = Math.max((endHour - startHour) * 64, 20);
            const colors = eventColor(ev.type);

            if (startHour < 8 || startHour > 20) return null;

            return (
              <div
                key={ev.id}
                className={`absolute cursor-pointer rounded border px-2 py-1 text-xs ${colors.bg} ${colors.border} ${colors.text} hover:brightness-125`}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left: "64px",
                  right: "8px",
                }}
                onClick={(e) => handleEventClick(e, ev)}
              >
                <div className="truncate font-medium">{ev.title}</div>
              </div>
            );
          })}

          {/* Current time line */}
          {isToday && (() => {
            const nowHour = now.getHours() + now.getMinutes() / 60;
            if (nowHour < 8 || nowHour > 20) return null;
            const top = (nowHour - 8) * 64;
            return (
              <div
                className="pointer-events-none absolute h-0.5 bg-red-500"
                style={{
                  top: `${top}px`,
                  left: "60px",
                  right: "0",
                }}
              >
                <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500" />
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ─── Month View ─────────────────────────────────────────────────────────

  function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    // Shift so Monday = 0
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const now = new Date();
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div>
        {/* Header row */}
        <div className="grid grid-cols-7 border-b border-gray-800">
          {dayNames.map((name) => (
            <div
              key={name}
              className="px-2 py-2 text-center text-xs font-medium text-gray-500"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${i}`}
                  className="h-24 border-b border-r border-gray-800/50"
                />
              );
            }

            const cellDate = new Date(year, month, day);
            const isToday = isSameDay(cellDate, now);
            const dayEvents = events.filter((ev) =>
              isSameDay(new Date(ev.start), cellDate)
            );

            return (
              <div
                key={day}
                className="h-24 cursor-pointer border-b border-r border-gray-800/50 p-1.5 hover:bg-gray-800/30"
                onClick={() => {
                  setCurrentDate(cellDate);
                  setViewMode("day");
                }}
              >
                <div
                  className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-blue-600 font-bold text-white"
                      : "text-gray-400"
                  }`}
                >
                  {day}
                </div>
                {/* Event dots */}
                <div className="flex flex-wrap gap-0.5">
                  {dayEvents.slice(0, 3).map((ev) => {
                    const colors = eventColor(ev.type);
                    return (
                      <div
                        key={ev.id}
                        className={`h-1.5 w-1.5 rounded-full ${colors.bg.replace("/20", "/80")}`}
                        title={ev.title}
                      />
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-gray-500">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            {formatDateRange(currentDate, viewMode)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-700 bg-gray-900">
            {(["week", "day", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition ${
                  viewMode === mode
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              &larr;
            </button>
            <button
              onClick={goToday}
              className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              Today
            </button>
            <button
              onClick={() => navigate(1)}
              className="rounded-lg border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500/60" />
          Calendar
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500/60" />
          ClickUp Tasks
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-500/60" />
          Cron Jobs
        </span>
      </div>

      {/* Calendar body */}
      <div className="rounded-xl border border-gray-800 bg-gray-900">
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {viewMode === "week" && renderWeekView()}
            {viewMode === "day" && renderDayView()}
            {viewMode === "month" && renderMonthView()}
          </>
        )}
      </div>

      {/* Event Popover */}
      {popover && (
        <div
          ref={popoverRef}
          className="fixed z-50 w-72 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-xl"
          style={{ left: popover.x, top: popover.y }}
        >
          <div className="mb-2 flex items-start justify-between">
            <h4 className="font-semibold text-white">{popover.event.title}</h4>
            <button
              onClick={() => setPopover(null)}
              className="ml-2 text-gray-500 hover:text-gray-300"
            >
              &times;
            </button>
          </div>
          <div className="space-y-1 text-xs text-gray-400">
            <p>
              <span className="text-gray-500">Type:</span>{" "}
              <span className="capitalize">{popover.event.type}</span>
            </p>
            <p>
              <span className="text-gray-500">Start:</span>{" "}
              {new Date(popover.event.start).toLocaleString()}
            </p>
            <p>
              <span className="text-gray-500">End:</span>{" "}
              {new Date(popover.event.end).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
