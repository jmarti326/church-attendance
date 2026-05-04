"use client";

export function AppVersion() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

  return (
    <span className="text-[10px] text-gray-400 select-none">
      v{version}
    </span>
  );
}
