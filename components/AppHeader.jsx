import Link from "next/link";
import NavMenu from "./NavMenu";
import Sidebar from "./Sidebar";
import CommandPalette from "./CommandPalette";
import ThemeToggle from "./ThemeToggle";
import SignOutButton from "./SignOutButton";
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
        <div className="flex items-center gap-3">
          <NavMenu strings={strings} />
          <Link href="/dashboard" className="font-display text-lg">
            {strings.brand} 🌍
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <CommandPalette strings={strings} />
          <LanguageToggle
            locale={locale}
            ariaLabel={strings.switchLanguageAria}
            variant="compact"
          />
          <ThemeToggle />
          <SignOutButton label={strings.signOut} />
        </div>
      </header>
    </>
  );
}
