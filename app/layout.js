import { Amiri, IBM_Plex_Sans_Arabic, Fraunces } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import FontSizeProvider from "@/components/FontSizeProvider";
import ToastProvider from "@/components/ToastProvider";
import ConfirmProvider from "@/components/ConfirmProvider";
import OfflineIndicator from "@/components/OfflineIndicator";
import PWARegister from "@/components/PWARegister";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

// خط العرض الدافئ للعناوين والرسائل الشخصية
const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-display",
  display: "swap",
});

// خط واضح ومريء لباقي الواجهة
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

// A warm English serif, reserved for the one-time welcome letter —
// distinct from the app's everyday display face.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-letter",
  display: "swap",
});

export const metadata = {
  title: "عالمك الخاص",
  description: "مساحة شخصية صُنعت لك بحب.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#B46F4D",
};

export default function RootLayout({ children }) {
  const locale = getLocale();
  const { dir } = t(locale);

  return (
    <html lang={locale} dir={dir} className={`${amiri.variable} ${plexArabic.variable} ${fraunces.variable}`}>
      <body className="font-body min-h-screen">
        <ThemeProvider>
          <FontSizeProvider>
            <ToastProvider>
              <OfflineIndicator />
              <ConfirmProvider>{children}</ConfirmProvider>
            </ToastProvider>
          </FontSizeProvider>
        </ThemeProvider>
        <PWARegister />
      </body>
    </html>
  );
}
