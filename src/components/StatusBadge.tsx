"use client";

export type MemberStatus = "member" | "visitor" | "members_class" | "inactive";

interface StatusBadgeProps {
  status: MemberStatus;
}

const statusConfig: Record<MemberStatus, { label: string; className: string }> = {
  member: { label: "Miembro", className: "bg-green-100 text-green-800" },
  visitor: { label: "Visitante", className: "bg-blue-100 text-blue-800" },
  members_class: { label: "Clase", className: "bg-yellow-100 text-yellow-800" },
  inactive: { label: "Inactivo", className: "bg-gray-100 text-gray-500" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.member;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
