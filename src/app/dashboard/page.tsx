"use client";

import VisitorFollowUp from "@/components/VisitorFollowUp";
import { UpcomingBirthdays } from "@/components/UpcomingBirthdays";
import { useState, useEffect, useCallback } from "react";

type View = "sunday" | "month" | "year";

interface SundayData {
  view: "sunday";
  date: string;
  presentCount: number;
  activeMembers: number;
  attendanceRate: number;
  prevSundayCount: number;
  change: number;
  newVisitors: number;
  families: { name: string; present: number; total: number }[];
  presentMembers: { id: number; name: string; status: string; family?: string }[];
}

interface MonthData {
  view: "month";
  month: string;
  sundays: { date: string; count: number; rate: number }[];
  average: number;
  highest: number;
  lowest: number;
  activeMembers: number;
  averageRate: number;
  prevMonthAverage: number;
  change: number;
  newMembers: number;
  uniqueAttendees: number;
  totalSundays: number;
}

interface YearData {
  view: "year";
  year: number;
  monthlyData: { month: string; average: number; count: number; sundays: number }[];
  yearAverage: number;
  activeMembers: number;
  uniqueAttendees: number;
  totalSundays: number;
  consistent: { id: number; name: string; rate: number }[];
  atRisk: { id: number; name: string; rate: number }[];
  newMembers: number;
  prevYearAverage: number;
  change: number;
}

type DashboardData = SundayData | MonthData | YearData;

export default function DashboardPage() {
  const [view, setView] = useState<View>("sunday");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard?view=${view}&date=${date}`);
      if (res.ok) setData(await res.json());
    } catch {
      // offline
    }
    setLoading(false);
  }, [view, date]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  return (
    <div className="pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 border-b px-4 py-3 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900 mb-2">Dashboard</h1>

        {/* View tabs */}
        <div className="flex gap-1 mb-2">
          {([
            { value: "sunday", label: "Domingo" },
            { value: "month", label: "Mes" },
            { value: "year", label: "Año" },
          ] as const).map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setLoading(true);
                setView(t.value);
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                view === t.value
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Date picker */}
        {view === "sunday" && (
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setLoading(true);
              setDate(e.target.value);
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        )}
        {view === "month" && (
          <input
            type="month"
            value={date.substring(0, 7)}
            onChange={(e) => {
              setLoading(true);
              setDate(e.target.value + "-01");
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        )}
        {view === "year" && (
          <select
            value={date.substring(0, 4)}
            onChange={(e) => {
              setLoading(true);
              setDate(e.target.value + "-01-01");
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <>
          {data?.view === "sunday" ? (
            <SundayView data={data} />
          ) : data?.view === "month" ? (
            <MonthView data={data} />
          ) : data?.view === "year" ? (
            <YearView data={data} />
          ) : null}
          <VisitorFollowUp />
          <UpcomingBirthdays />
          <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: "var(--theme-card-bg)" }}>
            <h3 className="font-semibold mb-3" style={{ color: "var(--theme-text)" }}>📥 Exportar Datos</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.location.assign("/api/members/export")}
                className="flex-1 text-center text-sm py-2 rounded-lg font-medium"
                style={{ backgroundColor: "var(--theme-primary-light)", color: "var(--theme-primary)" }}
              >
                Miembros CSV
              </button>
              <button
                type="button"
                onClick={() => window.location.assign("/api/attendance/export")}
                className="flex-1 text-center text-sm py-2 rounded-lg font-medium"
                style={{ backgroundColor: "var(--theme-primary-light)", color: "var(--theme-primary)" }}
              >
                Asistencia CSV
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend }: { label: string; value: string | number; sub?: string; trend?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <div className="flex items-end gap-1.5 mt-1">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend !== undefined && trend !== 0 && (
          <span className={`text-xs font-semibold ${trend > 0 ? "text-green-600" : "text-red-500"}`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Sunday View ──────────────────────────────────────────────────
function SundayView({ data }: { data: SundayData }) {
  return (
    <div className="p-4 space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Presentes" value={data.presentCount} trend={data.change} sub={`vs ${data.prevSundayCount} semana anterior`} />
        <KpiCard label="Tasa Asistencia" value={`${data.attendanceRate}%`} sub={`de ${data.activeMembers} activos`} />
        <KpiCard label="Visitantes Nuevos" value={data.newVisitors} />
        <KpiCard label="Familias" value={data.families.length} />
      </div>

      {/* Family breakdown */}
      {data.families.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Asistencia por Familia</h3>
          <div className="space-y-2">
            {data.families.sort((a, b) => b.present - a.present).slice(0, 10).map((f) => (
              <div key={f.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{f.name}</span>
                <span className="text-xs font-medium text-gray-500">
                  {f.present}{f.total > 0 ? `/${f.total}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Present list */}
      {data.presentMembers.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Presentes ({data.presentMembers.length})
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {data.presentMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-1 text-sm">
                <span className="text-gray-700">{m.name}</span>
                <span className="text-xs text-gray-400">{m.family}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────
function MonthView({ data }: { data: MonthData }) {
  const maxCount = Math.max(...data.sundays.map((s) => s.count), 1);

  return (
    <div className="p-4 space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Promedio Semanal" value={data.average} trend={data.change} sub={`vs ${data.prevMonthAverage} mes anterior`} />
        <KpiCard label="Tasa Promedio" value={`${data.averageRate}%`} sub={`de ${data.activeMembers} activos`} />
        <KpiCard label="Asistentes Únicos" value={data.uniqueAttendees} sub={`en ${data.totalSundays} domingos`} />
        <KpiCard label="Nuevos Miembros" value={data.newMembers} />
      </div>

      {/* Bar chart */}
      {data.sundays.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Asistencia por Domingo</h3>
          <div className="space-y-2">
            {data.sundays.map((s) => (
              <div key={s.date} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-12 shrink-0">
                  {new Date(s.date + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "short" })}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${(s.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-8 text-right">{s.count}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs text-gray-400">
            <span>Más alto: {data.highest}</span>
            <span>Más bajo: {data.lowest}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Year View ────────────────────────────────────────────────────
function YearView({ data }: { data: YearData }) {
  const maxAvg = Math.max(...data.monthlyData.map((m) => m.average), 1);

  return (
    <div className="p-4 space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Promedio Anual" value={data.yearAverage} trend={data.change} sub={`vs ${data.prevYearAverage} año anterior`} />
        <KpiCard label="Asistentes Únicos" value={data.uniqueAttendees} sub={`de ${data.activeMembers} activos`} />
        <KpiCard label="Domingos Registrados" value={data.totalSundays} />
        <KpiCard label="Nuevos Miembros" value={data.newMembers} />
      </div>

      {/* Monthly trend chart */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tendencia Mensual</h3>
        <div className="flex items-end gap-1 h-32">
          {data.monthlyData.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-gray-600">
                {m.average > 0 ? m.average : ""}
              </span>
              <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                <div
                  className="w-full max-w-[20px] bg-indigo-400 rounded-t transition-all"
                  style={{
                    height: m.average > 0 ? `${(m.average / maxAvg) * 100}%` : "2px",
                    backgroundColor: m.average > 0 ? undefined : "#e5e7eb",
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-400">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Most consistent */}
      {data.consistent.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">⭐ Más Consistentes</h3>
          <div className="space-y-1.5">
            {data.consistent.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{m.name}</span>
                <span className="text-xs font-medium text-green-600">{m.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* At risk */}
      {data.atRisk.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">⚠️ Necesitan Seguimiento</h3>
          <p className="text-xs text-gray-400 mb-2">Asistencia menor al 30%</p>
          <div className="space-y-1.5">
            {data.atRisk.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{m.name}</span>
                <span className="text-xs font-medium text-red-500">{m.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
