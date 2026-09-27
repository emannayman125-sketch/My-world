import LoginForm from "@/components/LoginForm";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default function LoginPage() {
  const locale = getLocale();
  const strings = t(locale);
  return <LoginForm strings={strings} locale={locale} />;
}
