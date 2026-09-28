import Link from "next/link";
import NavMenu from "./NavMenu";
import Sidebar from "./Sidebar";
import CommandPalette from "./CommandPalette";
import ThemeToggle from "./ThemeToggle";
import SignOutButton from "./SignOutButton";
import HeaderMore from "./HeaderMore";
import BottomNav from "./BottomNav";
import LanguageToggle from "./LanguageToggle";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default function AppHeader() {
  const locale = getLocale();
  const strings = t(locale);

  return (
    <>
      <Sidebar locale={locale} strings={strings} />

      {/* Mobile / tablet top bar — the Sidebar takes over on lg+ */}
      <header className="lg:hidden flex items-center justify-between px-5 py-3.5 gap-3
                          border-b border-black/[0.06] dark:border-white/[0.06]
                          bg-paper/80 dark:bg-night/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <NavMenu strings={strings} />
          <Link href="/dashboard" className="font-display text-lg whitespace-nowrap truncate">
            {strings.brand} 🌍
          </Link>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CommandPalette strings={strings} />
          <HeaderMore>
            <div className="flex items-center justify-between gap-3 px-2 py-1">
              <LanguageToggle locale={locale} ariaLabel={strings.switchLanguageAria} variant="compact" />
              <ThemeToggle />
            </div>
            <div className="border-t border-black/[0.06] dark:border-white/[0.08] mt-1 pt-1 px-2 py-1.5">
              <SignOutButton label={strings.signOut} />
            </div>
          </HeaderMore>
        </div>
      </header>

      <BottomNav strings={strings} />
    </>
  );
}
