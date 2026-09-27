import ResetPasswordForm from "@/components/ResetPasswordForm";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default function ResetPasswordPage() {
  const locale = getLocale();
  const strings = t(locale);
  return <ResetPasswordForm strings={strings} locale={locale} />;
}
