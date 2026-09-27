import { redirect } from "next/navigation";

export default function RootPage() {
  // الـ Middleware هو اللي بيتحكم في التوجيه الحقيقي حسب حالة تسجيل الدخول
  redirect("/dashboard");
}
