"use client";

export function AppVersion() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE || "";

  return (
    <div className="flex flex-col items-center gap-0.5 select-none">
      <span
        className="px-3 py-1 rounded-full text-xs font-medium tracking-wide"
        style={{
          backgroundColor: "var(--theme-primary-light, #eef2ff)",
          color: "var(--theme-primary, #4f46e5)",
        }}
      >
        v{version}
      </span>
      {buildDate && (
        <span className="text-[10px] text-gray-400">{buildDate}</span>
      )}
    </div>
  );
}
