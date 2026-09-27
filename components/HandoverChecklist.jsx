"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useConfirm } from "./ConfirmProvider";

const ITEMS = [
  { key: "account", label: "حساب أحمد اتعمل (سجّل هو بنفسه أو جهّزتيه له)" },
  { key: "data", label: "البيانات اتراجعت — كل حاجة موجودة وصح" },
  { key: "backup", label: "نسخة احتياطية (Export) اتعملت قبل التسليم" },
  { key: "public", label: "الصفحة العامة اتفحصت — بس اللي عام فعلاً ظاهر" },
  { key: "private", label: "البيانات الخاصة محمية (راجعتي SECURITY_CHECKLIST.md)" },
  { key: "builder", label: "جاهزة تشيلي صلاحياتك من GitHub/Vercel/Supabase" },
  { key: "instructions", label: "خطوات ما بعد التسليم جاهزة (HANDOVER.md)" },
];

export default function HandoverChecklist() {
  const { confirm } = useConfirm();
  const [checked, setChecked] = useState({});
  const [transferred, setTransferred] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("pw-handover-checklist");
    if (saved) setChecked(JSON.parse(saved));
    if (window.localStorage.getItem("pw-handover-done") === "true") setTransferred(true);
  }, []);

  function toggle(key) {
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);
    window.localStorage.setItem("pw-handover-checklist", JSON.stringify(next));
  }

  const allChecked = ITEMS.every((item) => checked[item.key]);

  async function finalTransfer() {
    const ok = await confirm(
      "بعد الخطوة دي، مش هيكون عندك وصول لعالم أحمد الخاص تاني. متأكدة إنك خلّصتي كل حاجة برّه الموقع (نقل GitHub/Vercel/Supabase)؟"
    );
    if (!ok) return;
    setTransferred(true);
    window.localStorage.setItem("pw-handover-done", "true");
  }

  if (transferred) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-8 text-center space-y-3"
      >
        <p className="text-5xl">🎁</p>
        <h2 className="font-display text-2xl">تم التسليم</h2>
        <p className="text-ink-muted dark:text-moon-muted">
          عالم أحمد بقى ملكه بالكامل. أتمنى الهدية دي تفرحه زي ما فرحتك وانتي بتبنيها. ❤️
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h2 className="font-display text-xl mb-4">قبل التسليم، اتأكدي من:</h2>
        <div className="space-y-2">
          {ITEMS.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 rounded-soft px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={!!checked[item.key]}
                onChange={() => toggle(item.key)}
                className="w-4 h-4"
              />
              <span className={checked[item.key] ? "text-ink-muted dark:text-moon-muted line-through" : ""}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="card p-6 border-red-500/30 space-y-3">
        <h2 className="font-display text-xl text-red-500">🔴 التسليم النهائي</h2>
        <p className="text-sm text-ink-muted dark:text-moon-muted">
          بعد الخطوة دي، مش هيفضل عندك وصول لعالم أحمد الخاص. اعملي التحويل الفعلي (GitHub/Vercel/Supabase) الأول من HANDOVER.md، وبعدين اضغطي هنا.
        </p>
        <button
          onClick={finalTransfer}
          disabled={!allChecked}
          className="rounded-soft bg-red-500/90 text-white px-6 py-3 font-medium hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          تأكيد التسليم النهائي
        </button>
        {!allChecked && (
          <p className="text-xs text-ink-muted dark:text-moon-muted">لازم تخلّصي كل البنود فوق الأول.</p>
        )}
      </div>
    </div>
  );
}
