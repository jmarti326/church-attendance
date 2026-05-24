"use client";

import { useEffect, useState } from "react";

interface VisitorItem {
  id: number;
  name: string;
  firstVisit: string;
  visitCount: number;
}

interface VisitorResponse {
  recentFirstTimeVisitors: VisitorItem[];
  returningVisitors: VisitorItem[];
  lostVisitors: VisitorItem[];
}

const emptyData: VisitorResponse = {
  recentFirstTimeVisitors: [],
  returningVisitors: [],
  lostVisitors: [],
};

function formatVisitDate(date: string) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function VisitorList({ title, visitors, emptyMessage }: { title: string; visitors: VisitorItem[]; emptyMessage: string }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
          {title}
        </h3>
        <span
          className="inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: "color-mix(in srgb, var(--theme-primary) 14%, white)", color: "var(--theme-primary)" }}
        >
          {visitors.length}
        </span>
      </div>

      {visitors.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-2">
          {visitors.map((visitor) => (
            <div
              key={visitor.id}
              className="rounded-xl border px-3 py-3 shadow-sm"
              style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "color-mix(in srgb, var(--theme-primary) 12%, #d1d5db)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
                    {visitor.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--theme-text-muted)" }}>
                    Primera visita: {formatVisitDate(visitor.firstVisit)}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ backgroundColor: "color-mix(in srgb, var(--theme-primary) 12%, white)", color: "var(--theme-primary)" }}
                >
                  {visitor.visitCount} visita{visitor.visitCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function VisitorFollowUp() {
  const [data, setData] = useState<VisitorResponse>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadVisitors = async () => {
      try {
        const response = await fetch("/api/dashboard/visitors", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload: VisitorResponse = await response.json();
        if (active) {
          setData(payload);
        }
      } catch {
        // offline
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadVisitors();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="px-4 pb-4">
      <div
        className="rounded-2xl border p-4 shadow-sm"
        style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "color-mix(in srgb, var(--theme-primary) 16%, #e5e7eb)" }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--theme-text)" }}>
              Visitantes
            </h2>
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
              Seguimiento de primeras visitas y regresos.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-6 text-sm" style={{ color: "var(--theme-text-muted)" }}>
            Cargando visitantes...
          </div>
        ) : (
          <div className="space-y-5">
            <VisitorList
              title="Nuevos (últimos 30 días)"
              visitors={data.recentFirstTimeVisitors}
              emptyMessage="No hay visitantes nuevos en los últimos 30 días."
            />
            <VisitorList
              title="Regresaron ✓"
              visitors={data.returningVisitors}
              emptyMessage="Todavía no hay visitantes que hayan regresado."
            />
            <VisitorList
              title="No han regresado ⚠️"
              visitors={data.lostVisitors}
              emptyMessage="No hay visitantes pendientes de seguimiento."
            />
          </div>
        )}
      </div>
    </div>
  );
}
