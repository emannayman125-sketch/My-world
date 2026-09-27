"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import { Plus, Trash2, RefreshCw } from "lucide-react";

const STATUS_COLOR = {
  watching: "bg-white/5 desk-muted",
  setup: "bg-sky-500/20 text-sky-400",
  entered: "bg-emerald-500/15 text-emerald-400",
};

export default function WatchlistManager({ userId, initialItems, strings }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const tr = strings.trading;

  const [items, setItems] = useState(initialItems || []);
  const [prices, setPrices] = useState({}); // symbol -> {price, change, percentChange} | 'error' | 'loading'
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ symbol: "", status: "watching", thesis: "" });
  const [saving, setSaving] = useState(false);

  const fetchPrice = useCallback(async (symbol) => {
    setPrices((p) => ({ ...p, [symbol]: "loading" }));
    try {
      const res = await fetch(`/api/trading/quote?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      setPrices((p) => ({ ...p, [symbol]: data }));
    } catch {
      setPrices((p) => ({ ...p, [symbol]: "error" }));
    }
  }, []);

  useEffect(() => {
    items.forEach((item) => fetchPrice(item.symbol));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addSymbol(e) {
    e.preventDefault();
    if (!form.symbol.trim()) return;
    setSaving(true);

    const symbol = form.symbol.trim().toUpperCase();
    const { data, error } = await supabase
      .from("trading_watchlist")
      .insert({
        user_id: userId,
        symbol,
        status: form.status,
        thesis: form.thesis.trim() || null,
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setItems((list) => [data, ...list]);
      setForm({ symbol: "", status: "watching", thesis: "" });
      setOpen(false);
      fetchPrice(symbol);
    }
  }

  async function removeSymbol(id) {
    if (!(await confirm(tr.confirmDeleteSymbol))) return;
    await supabase.from("trading_watchlist").delete().eq("id", id);
    setItems((list) => list.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-4">
      <p className="text-xs desk-muted">{tr.disclaimer}</p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full card card-hover p-4 flex items-center justify-center gap-2 text-sm
                     desk-muted hover:text-sky-400 transition"
        >
          <Plus size={15} strokeWidth={2} />
          {tr.addSymbol}
        </button>
      ) : (
        <form onSubmit={addSymbol} className="desk-card p-4 space-y-2">
          <div className="flex gap-2 flex-wrap">
            <input
              autoFocus
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              placeholder={tr.symbol}
              className="flex-1 min-w-[120px] rounded-soft border border-white/10 bg-transparent
                         px-3 py-2 text-sm outline-none focus:border-sky-500 uppercase"
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="rounded-soft border border-white/10 bg-transparent
                         px-3 py-2 text-sm outline-none focus:border-sky-500"
            >
              {Object.entries(tr.status).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>
          <textarea
            value={form.thesis}
            onChange={(e) => setForm({ ...form, thesis: e.target.value })}
            placeholder={tr.thesis}
            rows={2}
            className="w-full rounded-soft border border-white/10 bg-transparent
                       px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving || !form.symbol.trim()}
              className="rounded-soft bg-sky-600 text-white text-sm font-medium px-4 py-2
                         hover:brightness-110 transition disabled:opacity-50"
            >
              {saving ? tr.saving : tr.save}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm desk-muted hover:text-white"
            >
              {strings.quote.cancel}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 && !open && (
        <p className="text-sm desk-muted text-center py-6">{tr.noWatchlist}</p>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const p = prices[item.symbol];
          const isUp = p && typeof p === "object" && p.change >= 0;
          return (
            <div key={item.id} className="desk-card p-4">
              <div className="flex items-center gap-3">
                <span className={`shrink-0 text-xs rounded-full px-2.5 py-1 font-medium ${STATUS_COLOR[item.status] || STATUS_COLOR.watching}`}>
                  {tr.status[item.status] || tr.status.watching}
                </span>
                <p className="font-mono font-semibold">{item.symbol}</p>

                <div className="flex-1 min-w-0" />

                {p === "loading" && (
                  <span className="text-xs desk-muted">{tr.loadingPrice}</span>
                )}
                {p === "error" && (
                  <span className="text-xs desk-muted">{tr.priceUnavailable}</span>
                )}
                {p && typeof p === "object" && (
                  <div className="text-end">
                    <p className="desk-mono text-lg font-semibold">${p.price?.toFixed(2)}</p>
                    <p className={`desk-mono text-xs ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                      {isUp ? "+" : ""}{p.percentChange?.toFixed(2)}%
                    </p>
                  </div>
                )}

                <button
                  onClick={() => fetchPrice(item.symbol)}
                  aria-label={tr.refresh}
                  className="text-white/30 hover:text-sky-400 transition shrink-0"
                >
                  <RefreshCw size={14} strokeWidth={2} />
                </button>
                <button
                  onClick={() => removeSymbol(item.id)}
                  aria-label={tr.delete}
                  className="text-white/30 hover:text-red-500 transition shrink-0"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
              {item.thesis && (
                <p className="text-sm mt-2 desk-muted leading-6">{item.thesis}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
