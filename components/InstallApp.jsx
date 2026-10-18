"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

// "Install as an app": on Chrome / Edge / Android it uses the browser's own
// install prompt (the app then opens in its own window, can be pinned to
// the taskbar / desktop / phone home screen). On iPhone Safari there is no
// prompt, so it shows the two-tap way instead. Hidden once installed.
export default function InstallApp({ locale = "ar", className = "" }) {
  const [evt, setEvt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone;
    if (standalone) return setInstalled(true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e) => {
      e.preventDefault();
      setEvt(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!evt && !ios)) return null;
  const ar = locale === "ar";

  async function install() {
    if (evt) {
      evt.prompt();
      await evt.userChoice.catch(() => {});
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
        className="w-full inline-flex items-center gap-2 rounded-soft border border-lantern/30 bg-lantern/10 px-3 py-2 text-sm text-lantern-soft hover:bg-lantern/20 transition"
      >
        <Download size={15} />
        {ar ? "ثبّتي التطبيق على جهازك" : "Install the app"}
      </button>
      {hint && (
        <p className="mt-2 text-xs leading-relaxed text-moon-muted">
          {ar
            ? "من Safari: اضغطي زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»."
            : "In Safari: tap Share, then “Add to Home Screen”."}
        </p>
      )}
    </div>
  );
}
