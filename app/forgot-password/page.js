import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default function ForgotPasswordPage() {
  const locale = getLocale();
  const strings = t(locale);
  return <ForgotPasswordForm strings={strings} locale={locale} />;
}
