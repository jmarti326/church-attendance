"use client";

import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";

interface BirthdayMember {
  id: number;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  daysUntil: number;
  nextBirthday: string;
}

export function UpcomingBirthdays() {
  const [members, setMembers] = useState<BirthdayMember[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/birthdays")
      .then((r) => r.json())
      .then(setMembers)
      .catch(() => {});
  }, []);

  if (members.length === 0) return null;

  return (
    <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: "var(--theme-card-bg)" }}>
      <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--theme-text)" }}>
        🎂 Cumpleaños Próximos
      </h3>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: "var(--theme-page-bg)" }}>
            <Avatar firstName={m.firstName} lastName={m.lastName} photoUrl={m.photoUrl} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--theme-text)" }}>
                {m.firstName} {m.lastName}
              </p>
              <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
                {m.nextBirthday}
              </p>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full" style={{
              backgroundColor: m.daysUntil === 0 ? "var(--theme-present-bg)" : "var(--theme-primary-light)",
              color: m.daysUntil === 0 ? "var(--theme-check)" : "var(--theme-primary)",
            }}>
              {m.daysUntil === 0 ? "¡Hoy!" : m.daysUntil === 1 ? "Mañana" : `${m.daysUntil} días`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
