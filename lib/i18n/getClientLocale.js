"use client";

// Client-only helper for small leaf components (toggles, indicators) that
// don't receive `strings` as a prop. Reads the same cookie the server
// already used to render the page, so it stays consistent.
export function getClientLocale() {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|; )locale=(ar|en)/);
  return match ? match[1] : "en";
}
