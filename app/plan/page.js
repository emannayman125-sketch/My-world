import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import PlanImport from "@/components/PlanImport";

// A dedicated, standalone page for "give Hamzawi your plan" rather than
// burying it inside an existing hub -- it touches several different hubs
// at once (tasks/habits/goals), so it doesn't obviously belong to just one
// of them. Reachable at /plan.
const STRINGS = {
  hint: "اكتب خطتك أو روتينك زي ما هو في بالك، أو ابعت صورة منه (مكتوب بخط إيدك أو مطبوع) — حمزاوي هيقراه ويضيف منه مهام وعادات وأهداف حقيقية في حسابك.",
  typeIt: "أكتبها",
  uploadIt: "أرفع ملف",
  textPlaceholder: "مثال:\nكل يوم: صلاة الفجر في وقتها، ربع ساعة قرآن، مذاكرة MBA ساعة بعد الشغل.\nالأسبوع ده: أخلص تسليم مادة التمويل، أتصل بـ3 موردين جداد.\nالشهر ده: أوصل لـ10 كتب اتقريت من على الرف.",
  dropHint: "دوسي هنا وارفعي صورة",
  officeHint: "لو الخطة في ملف Word أو Excel: افتحيه وانسخي النص منه والصقيه في وضع \"أكتبها\" أعلى — رفع ملف Office مباشرة لسه مش مدعوم.",
  submit: "ضيفها لحمزاوي",
  sending: "حمزاوي بيقرا...",
  addedCount: "اتضاف {n} حاجة جديدة في حسابك.",
  imageTooBig: "الصورة كبيرة أوي، جربي صورة أصغر (أقل من 8 ميجا).",
  readError: "حصلت مشكلة في قراءة الملف، جربي تاني.",
  genericError: "حصلت مشكلة، جرّب تاني.",
};

export default async function PlanPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-6 pb-16 space-y-6">
        <div className="rounded-card bg-sage/[0.06] dark:bg-sage/[0.1] border border-sage/20 p-6 space-y-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/15 text-sage dark:text-sage-soft">
            <Sparkles size={18} strokeWidth={2} />
          </span>
          <h1 className="font-display text-3xl">هات خطتك لحمزاوي</h1>
          <p className="text-ink-muted dark:text-moon-muted">اكتبها أو ابعت صورة منها، وسيبي الباقي عليه.</p>
        </div>

        <div className="card p-6">
          <PlanImport strings={STRINGS} />
        </div>
      </main>
    </div>
  );
}
