import { cookies } from "next/headers";
import { locales, defaultLocale, localeCookieName } from "./config";

// Server-only helper. Reads the visitor's saved language preference so
// server components can render the right strings and set dir/lang.
export function getLocale() {
  const value = cookies().get(localeCookieName)?.value;
  return locales.includes(value) ? value : defaultLocale;
}
