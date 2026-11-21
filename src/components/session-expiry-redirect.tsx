"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function SessionExpiryRedirect() {
  const router = useRouter();
  useEffect(() => {
    const redirect = () => router.replace("/login");
    window.addEventListener("plataforma:session-expired", redirect);
    return () => window.removeEventListener("plataforma:session-expired", redirect);
  }, [router]);
  return null;
}
