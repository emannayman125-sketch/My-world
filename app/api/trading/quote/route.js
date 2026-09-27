import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

// Server-only route. The Finnhub key never reaches the browser — this
// route is the only thing that talks to Finnhub, and only after
// confirming there's a logged-in user.
export async function GET(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.trim().toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: "missing symbol" }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "no_api_key" }, { status: 501 });
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
      { next: { revalidate: 30 } } // cache 30s so we don't hammer the free tier's rate limit
    );

    if (!res.ok) {
      return NextResponse.json({ error: "upstream_error" }, { status: 502 });
    }

    const data = await res.json();

    // Finnhub returns all zeros for an unknown/invalid symbol rather than an error.
    if (data.c === 0 && data.h === 0 && data.l === 0) {
      return NextResponse.json({ error: "unknown_symbol" }, { status: 404 });
    }

    return NextResponse.json({
      symbol,
      price: data.c,
      change: data.d,
      percentChange: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      asOf: Date.now(),
    });
  } catch (err) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}
