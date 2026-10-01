"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

// Off by default. Ahmed chooses, per his one accepted partner:
// view-only, or view + log trades together. Nothing is visible to
// anyone until he turns this on himself.
export default function TradingShareSettings({ userId, partnerName, initialShared, initialCanLog, strings: tr }) {
  const supabase = createClient();
  const [shared, setShared] = useState(!!initialShared);
  const [canLog, setCanLog] = useState(!!initialCanLog);
  const [saving, setSaving] = useState(false);

  async function update(next) {
    setSaving(true);
    await supabase.from("profiles").update(next).eq("id", userId);
    setSaving(false);
  }

  function onSharedChange(value) {
    setShared(value);
    if (!value) setCanLog(false);
    update(value ? { trading_shared: true } : { trading_shared: false, trading_partner_can_log: false });
  }

  function onCanLogChange(value) {
    setCanLog(value);
    update({ trading_partner_can_log: value });
  }

  if (!partnerName) {
    return <p className="text-xs desk-muted">{tr.noPartnerYet}</p>;
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>{tr.shareWith.replace("{name}", partnerName)}</span>
        <input
          type="checkbox"
          checked={shared}
          disabled={saving}
          onChange={(e) => onSharedChange(e.target.checked)}
          className="accent-dusk w-4 h-4"
        />
      </label>

      {shared && (
        <label className="flex items-center justify-between gap-3 text-sm ps-4 border-s-2 border-dusk/20">
          <span>{tr.allowLogging}</span>
          <input
            type="checkbox"
            checked={canLog}
            disabled={saving}
            onChange={(e) => onCanLogChange(e.target.checked)}
            className="accent-dusk w-4 h-4"
          />
        </label>
      )}

      <p className="text-xs desk-muted">
        {shared ? (canLog ? tr.statusEdit : tr.statusView) : tr.statusOff}
      </p>
    </div>
  );
}
