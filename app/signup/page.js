import SignupForm from "@/components/SignupForm";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default function SignupPage() {
  const locale = getLocale();
  const strings = t(locale);
  return <SignupForm strings={strings} locale={locale} />;
}
