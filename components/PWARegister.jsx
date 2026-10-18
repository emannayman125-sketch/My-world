"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Chrome fires "beforeinstallprompt" once, early. Keep it on window so
    // the "Install the app" button can use it whenever it shows up (e.g.
    // inside the phone's ⋯ menu, which only mounts when opened).
    const onPrompt = (e) => {
      e.preventDefault();
      window.__installPrompt = e;
      window.dispatchEvent(new Event("install-prompt-ready"));
    };
    const onInstalled = () => {
      window.__installPrompt = null;
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
