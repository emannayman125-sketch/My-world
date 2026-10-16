"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

// Desktop-only floating Hamzawi button: one click from any page. On
// phones the raised middle button of the bottom bar does this job.
export default function HamzawiFab({ label }) {
  const pathname = usePathname() || "";
  if (pathname === "/ai" || pathname.startsWith("/ai/")) return null;
  return (
    <Link
      href="/ai"
      aria-label={label}
      title={label}
      className="hidden lg:flex fixed bottom-6 end-6 z-30 items-center gap-2 rounded-full
                 bg-gilded text-night font-medium pl-4 pr-5 py-3 shadow-glow
                 hover:brightness-105 hover:-translate-y-0.5 transition"
    >
      <Sparkles size={18} strokeWidth={2} />
      <span className="text-sm">{label}</span>
    </Link>
  );
}
