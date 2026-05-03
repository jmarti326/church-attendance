"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface User {
  userId: number;
  username: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, isAuthenticated: false });

export function useAuth() {
  return useContext(AuthContext);
}

const PUBLIC_PATHS = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
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
          return res.json();
        }
      })
      .then((data) => {
        if (data) {
          setUser(data);
          setChecked(true);
        }
      })
      .catch(() => {
        setChecked(true);
      });
  }, [pathname, router]);

  if (!checked) return null;

  return (
    <AuthContext value={{ user, isAuthenticated: !!user }}>
      {children}
    </AuthContext>
  );
}
