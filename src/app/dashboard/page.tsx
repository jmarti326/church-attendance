"use client";

import VisitorFollowUp from "@/components/VisitorFollowUp";
import { UpcomingBirthdays } from "@/components/UpcomingBirthdays";
import { shareReportPdf } from "@/lib/report-pdf";
import { useState, useEffect, useCallback, useRef } from "react";

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
  attendanceMatrix: AttendanceMatrixData;
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
  annualAttendance: AttendanceRow[];
  attendanceMonths: (AttendanceMatrixData & {
    month: string;
    label: string;
  })[];
}

interface AttendanceRow {
  id: number;
  name: string;
  presentDates: string[];
  attendedCount: number;
  rate: number;
}

interface AttendanceMatrixData {
  sundays: string[];
  attendees: AttendanceRow[];
}

type DashboardData = SundayData | MonthData | YearData;

export default function DashboardPage() {
  const [view, setView] = useState<View>("sunday");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

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

  const reportPeriod =
    view === "month"
      ? new Date(`${date.substring(0, 7)}-01T12:00:00`).toLocaleDateString("es", {
          month: "long",
          year: "numeric",
        })
      : date.substring(0, 4);

  const handleSharePdf = async () => {
    if (!reportRef.current || (view !== "month" && view !== "year")) return;

    setExportingPdf(true);
    setPdfMessage("");

    try {
      const monthly = view === "month";
      const reportDate = new Date(`${date.substring(0, 7)}-01T12:00:00`);
      const monthName = reportDate
        .toLocaleDateString("es", { month: "long" })
        .toLocaleLowerCase("es");
      const filename = monthly
        ? `reporte-mensual-${monthName}-${date.substring(0, 4)}.pdf`
        : `reporte-anual-${date.substring(0, 4)}.pdf`;
      const title = monthly
        ? `Reporte mensual - ${reportPeriod}`
        : `Reporte anual - ${reportPeriod}`;
      const result = await shareReportPdf({
        element: reportRef.current,
        filename,
        title,
        shareText: `Reporte de asistencia de ${reportPeriod}`,
      });

      if (result === "downloaded") {
        setPdfMessage("PDF descargado y listo para compartir.");
      } else if (result === "shared") {
        setPdfMessage("PDF compartido.");
      }
    } catch (error) {
      console.error("PDF report generation failed", error);
      setPdfMessage("No se pudo generar el PDF. Inténtalo nuevamente.");
    } finally {
      setExportingPdf(false);
    }
  };

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
        {(view === "month" || view === "year") && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => void handleSharePdf()}
              disabled={loading || exportingPdf}
              className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportingPdf ? "Generando PDF..." : "Compartir PDF"}
            </button>
            {pdfMessage && (
              <p className="mt-1 text-center text-xs text-gray-500" role="status">
                {pdfMessage}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <>
          <div
            ref={data?.view === "month" || data?.view === "year" ? reportRef : undefined}
            className="bg-gray-50"
          >
            {data?.view === "sunday" ? (
              <SundayView data={data} />
            ) : data?.view === "month" || data?.view === "year" ? (
              <>
              <div data-pdf-section className="bg-white px-4 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Project Shepherd
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {data.view === "month" ? "Reporte mensual" : "Reporte anual"}
                </h2>
                <p className="mt-1 capitalize text-sm text-gray-500">{reportPeriod}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Generado el {new Date().toLocaleDateString("es")}
                </p>
              </div>
              {data.view === "month" ? (
                <MonthView data={data} />
              ) : (
                <YearView data={data} />
              )}
              </>
            ) : null}
            <VisitorFollowUp />
            <div className="px-4 pb-4">
              <UpcomingBirthdays />
            </div>
          </div>
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

function formatSunday(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
  });
}

function AttendanceMatrix({
  title,
  sundays,
  attendees,
}: {
  title: string;
  sundays: string[];
  attendees: AttendanceRow[];
}) {
  if (sundays.length === 0 || attendees.length === 0) return null;

  return (
    <section
      data-pdf-table-section
      data-pdf-title={title}
      className="overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm"
    >
      <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-800">{title}</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Asistentes en filas · domingos en columnas
            </p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700">
            {attendees.length} asistentes
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table
          data-pdf-table
          className="w-full border-collapse text-xs"
          style={{ minWidth: `${Math.max(720, 330 + sundays.length * 78)}px` }}
        >
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="sticky left-0 z-[1] min-w-56 border-b border-r border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold">
                Asistente
              </th>
              {sundays.map((sunday) => (
                <th
                  key={sunday}
                  className="min-w-16 border-b border-r border-gray-200 px-2 py-2 text-center font-semibold"
                >
                  {formatSunday(sunday)}
                </th>
              ))}
              <th className="min-w-16 border-b border-r border-gray-200 px-2 py-2 text-center font-semibold">
                Total
              </th>
              <th className="min-w-16 border-b border-gray-200 px-2 py-2 text-center font-semibold">
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {attendees.map((attendee, rowIndex) => {
              const rowBackground = rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50";
              return (
                <tr key={attendee.id} className={rowBackground}>
                  <th
                    className={`sticky left-0 z-[1] border-b border-r border-gray-100 px-3 py-2 text-left font-medium text-gray-800 ${rowBackground}`}
                  >
                    {attendee.name}
                  </th>
                  {sundays.map((sunday) => {
                    const present = attendee.presentDates.includes(sunday);
                    return (
                      <td
                        key={sunday}
                        className="border-b border-r border-gray-100 px-2 py-1.5 text-center"
                        aria-label={present ? "Presente" : "Ausente"}
                      >
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-bold ${
                            present
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {present ? "Sí" : "—"}
                        </span>
                      </td>
                    );
                  })}
                  <td className="border-b border-r border-gray-100 px-2 py-2 text-center font-semibold text-gray-700">
                    {attendee.attendedCount}/{sundays.length}
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2 text-center">
                    <span
                      className={`rounded-full px-2 py-1 font-semibold ${
                        attendee.rate >= 80
                          ? "bg-emerald-100 text-emerald-700"
                          : attendee.rate >= 50
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {attendee.rate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AnnualAttendanceSummary({
  attendees,
  totalSundays,
}: {
  attendees: AttendanceRow[];
  totalSundays: number;
}) {
  if (attendees.length === 0) return null;

  return (
    <section
      data-pdf-table-section
      data-pdf-title="Resumen anual por asistente"
      className="overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm"
    >
      <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-3">
        <h3 className="text-sm font-bold text-gray-800">Resumen anual por asistente</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Total de domingos asistidos durante el año
        </p>
      </div>
      <table data-pdf-table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-50 text-gray-600">
            <th className="border-b border-r border-gray-200 px-3 py-2 text-left font-semibold">
              Asistente
            </th>
            <th className="w-28 border-b border-r border-gray-200 px-3 py-2 text-center font-semibold">
              Domingos
            </th>
            <th className="w-24 border-b border-gray-200 px-3 py-2 text-center font-semibold">
              Asistencia
            </th>
          </tr>
        </thead>
        <tbody>
          {attendees.map((attendee, rowIndex) => (
            <tr
              key={attendee.id}
              className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}
            >
              <td className="border-b border-r border-gray-100 px-3 py-2 font-medium text-gray-800">
                {attendee.name}
              </td>
              <td className="border-b border-r border-gray-100 px-3 py-2 text-center font-semibold text-gray-700">
                {attendee.attendedCount}/{totalSundays}
              </td>
              <td className="border-b border-gray-100 px-3 py-2 text-center">
                {attendee.rate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
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
      <div data-pdf-section className="grid grid-cols-2 gap-3">
        <KpiCard label="Promedio Semanal" value={data.average} trend={data.change} sub={`vs ${data.prevMonthAverage} mes anterior`} />
        <KpiCard label="Tasa Promedio" value={`${data.averageRate}%`} sub={`de ${data.activeMembers} activos`} />
        <KpiCard label="Asistentes Únicos" value={data.uniqueAttendees} sub={`en ${data.totalSundays} domingos`} />
        <KpiCard label="Nuevos Miembros" value={data.newMembers} />
      </div>

      {/* Bar chart */}
      {data.sundays.length > 0 && (
        <div data-pdf-section className="bg-white rounded-xl border p-4">
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

      <AttendanceMatrix
        title={`Detalle de asistencia · ${new Date(`${data.month}-01T12:00:00`).toLocaleDateString("es", {
          month: "long",
          year: "numeric",
        })}`}
        sundays={data.attendanceMatrix.sundays}
        attendees={data.attendanceMatrix.attendees}
      />
    </div>
  );
}

// ─── Year View ────────────────────────────────────────────────────
function YearView({ data }: { data: YearData }) {
  const maxAvg = Math.max(...data.monthlyData.map((m) => m.average), 1);

  return (
    <div className="p-4 space-y-4">
      {/* KPIs */}
      <div data-pdf-section className="grid grid-cols-2 gap-3">
        <KpiCard label="Promedio Anual" value={data.yearAverage} trend={data.change} sub={`vs ${data.prevYearAverage} año anterior`} />
        <KpiCard label="Asistentes Únicos" value={data.uniqueAttendees} sub={`de ${data.activeMembers} activos`} />
        <KpiCard label="Domingos Registrados" value={data.totalSundays} />
        <KpiCard label="Nuevos Miembros" value={data.newMembers} />
      </div>

      {/* Monthly trend chart */}
      <div data-pdf-section className="bg-white rounded-xl border p-4">
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
        <div data-pdf-section className="bg-white rounded-xl border p-4">
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
        <div data-pdf-section className="bg-white rounded-xl border p-4">
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

      <AnnualAttendanceSummary
        attendees={data.annualAttendance}
        totalSundays={data.totalSundays}
      />

      {data.attendanceMonths.map((month) => (
        <AttendanceMatrix
          key={month.month}
          title={`Asistencia · ${month.label}`}
          sundays={month.sundays}
          attendees={month.attendees}
        />
      ))}
    </div>
  );
}
