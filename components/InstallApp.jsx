"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

// "Install as an app": on Chrome / Edge / Android it uses the browser's own
// install prompt (PWARegister keeps the event on window.__installPrompt).
// The app then opens in its own window and can sit on the taskbar / desktop
// / phone home screen. On iPhone Safari there is no prompt, so it shows the
// two-tap way instead. Hidden once installed.
//   variant "sidebar" = for the dark desktop sidebar
//   variant "menu"    = for the light/dark phone menu
export default function InstallApp({ locale = "ar", className = "", variant = "sidebar" }) {
  const [evt, setEvt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone;
    if (standalone) return setInstalled(true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    if (window.__installPrompt) setEvt(window.__installPrompt);
    const onReady = () => setEvt(window.__installPrompt || null);
    const onInstalled = () => setInstalled(true);
    window.addEventListener("install-prompt-ready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("install-prompt-ready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!evt && !ios)) return null;
  const ar = locale === "ar";
  const menu = variant === "menu";

  async function install() {
    if (evt) {
      evt.prompt();
      await evt.userChoice.catch(() => {});
      window.__installPrompt = null;
      setEvt(null);
    } else {
      setHint((h) => !h);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={install}
        className={`w-full inline-flex items-center gap-2 rounded-soft border px-3 py-2 text-sm transition ${
          menu
            ? "border-lantern/40 bg-lantern/10 text-ink dark:text-moon hover:bg-lantern/20"
            : "border-lantern/30 bg-lantern/10 text-lantern-soft hover:bg-lantern/20"
        }`}
      >
        <Download size={15} />
        {ar ? "ثبّتي التطبيق على جهازك" : "Install the app"}
      </button>
      {hint && (
        <p className={`mt-2 text-xs leading-relaxed ${menu ? "text-ink-muted dark:text-moon-muted" : "text-moon-muted"}`}>
          {ar
            ? "من Safari: اضغطي زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»."
            : "In Safari: tap Share, then “Add to Home Screen”."}
        </p>
      )}
    </div>
  );
}
