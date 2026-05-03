"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_PATHS = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      setChecked(true);
      return;
    }

    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.replace("/login");
        } else {
          setChecked(true);
        }
      })
      .catch(() => {
        // Offline — allow cached page to render
        setChecked(true);
      });
  }, [pathname, router]);

  if (!checked) return null;

  return <>{children}</>;
}
