"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface MemberHistoryResponse {
  member: {
    id: number;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
  };
  records: {
    date: string;
    present: boolean;
  }[];
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function MemberHistoryPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<MemberHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/members/${id}/history`);
        if (!response.ok) {
          throw new Error("No se pudo cargar el historial");
        }

        const payload: MemberHistoryResponse = await response.json();
        if (!cancelled) {
          setData(payload);
        }
      } catch {
        if (!cancelled) {
          setError("No se pudo cargar el historial");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadHistory();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const stats = useMemo(() => {
    const records = data?.records ?? [];
    const attendedCount = records.filter((record) => record.present).length;
    const attendanceRate = records.length > 0 ? Math.round((attendedCount / records.length) * 100) : 0;

    let currentStreak = 0;
    for (const record of records) {
      if (!record.present) {
        break;
      }
      currentStreak += 1;
    }

    return {
      attendedCount,
      attendanceRate,
      currentStreak,
      totalRecords: records.length,
    };
  }, [data]);

  const memberName = data ? `${data.member.firstName} ${data.member.lastName}` : "";

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: "var(--theme-page-bg)", color: "var(--theme-text)" }}>
      <div
        className="sticky top-0 z-10 border-b px-4 py-3 shadow-sm"
        style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "rgba(0, 0, 0, 0.08)" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--theme-text-muted)" }}>
              Historial de asistencia
            </p>
            <h1 className="text-lg font-bold">Miembro</h1>
          </div>
          <Link
            href="/members"
            className="rounded-full px-3 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--theme-page-bg)", color: "var(--theme-text)" }}
          >
            ← Miembros
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2" style={{ borderColor: "var(--theme-primary)" }} />
          </div>
        ) : error || !data ? (
          <div
            className="rounded-2xl border px-4 py-10 text-center"
            style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "rgba(0, 0, 0, 0.08)" }}
          >
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>{error || "Historial no disponible"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="rounded-3xl border p-5 shadow-sm"
              style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "rgba(0, 0, 0, 0.08)" }}
            >
              <div className="flex items-center gap-4">
                {data.member.photoUrl ? (
                  <img
                    src={data.member.photoUrl}
                    alt={memberName}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold"
                    style={{ backgroundColor: "var(--theme-primary)", color: "white" }}
                  >
                    {getInitials(data.member.firstName, data.member.lastName)}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">{memberName}</h2>
                  <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                    {stats.totalRecords} registros de asistencia
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "Asistencias", value: stats.attendedCount.toString() },
                  { label: "Porcentaje", value: `${stats.attendanceRate}%` },
                  { label: "Racha actual", value: `${stats.currentStreak}` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl px-3 py-4 text-center"
                    style={{ backgroundColor: "var(--theme-page-bg)" }}
                  >
                    <p className="text-2xl font-bold" style={{ color: "var(--theme-primary)" }}>{item.value}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--theme-text-muted)" }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-3xl border p-4 shadow-sm"
              style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "rgba(0, 0, 0, 0.08)" }}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold">Fechas registradas</h3>
                <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
                  Desliza para ver más
                </span>
              </div>

              <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                {data.records.length === 0 ? (
                  <div className="rounded-2xl px-4 py-8 text-center" style={{ backgroundColor: "var(--theme-page-bg)" }}>
                    <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                      Todavía no hay asistencias registradas.
                    </p>
                  </div>
                ) : (
                  data.records.map((record) => (
                    <div
                      key={record.date}
                      className="flex items-center justify-between rounded-2xl px-4 py-3"
                      style={{ backgroundColor: "var(--theme-page-bg)" }}
                    >
                      <p className="text-sm font-medium capitalize">{dateFormatter.format(new Date(record.date))}</p>
                      <span
                        className="rounded-full px-3 py-1 text-sm font-semibold"
                        style={{
                          backgroundColor: record.present ? "#dcfce7" : "#fee2e2",
                          color: record.present ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {record.present ? "✓ Asistió" : "✗ Ausente"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link
              href="/members"
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "var(--theme-card-bg)", color: "var(--theme-text)" }}
            >
              ← Volver a miembros
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
