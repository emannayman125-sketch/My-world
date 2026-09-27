"use client";

import { useEffect, useRef } from "react";
import { useToast } from "./ToastProvider";
import { getClientLocale } from "@/lib/i18n/getClientLocale";

const MSG = {
  ar: { offline: "📡 مفيش إنترنت دلوقتي — التغييرات هتتحفظ لما ترجع.", online: "✅ رجع الإنترنت." },
  en: { offline: "📡 No internet right now — changes will save once you're back.", online: "✅ Back online." },
};

export default function OfflineIndicator() {
  const { showToast } = useToast();
  const hasMounted = useRef(false);

  useEffect(() => {
    const locale = getClientLocale();
    const m = MSG[locale] || MSG.en;

    function handleOffline() {
      showToast(m.offline);
    }
    function handleOnline() {
      if (hasMounted.current) showToast(m.online);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    hasMounted.current = true;

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [showToast]);

  return null;
}
