// functions/api/quote-us/[stock].js
// 美股即時報價 — 透過 Finnhub API

export async function onRequest(context) {
  const symbol = context.params.stock?.trim().toUpperCase();
  if (!symbol) {
    return Response.json({ ok: false, error: '請提供股票代號' }, { status: 400 });
  }

  // API Key 從 Cloudflare 環境變數讀取（安全，不寫死在程式碼裡）
  const FINNHUB_KEY = context.env.FINNHUB_KEY;
  if (!FINNHUB_KEY) {
    return Response.json({ ok: false, error: '伺服器未設定 API Key' }, { status: 500 });
  }

  try {
    // 同時抓報價和公司名稱
    const [quoteRes, profileRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`)
    ]);

    const quote   = await quoteRes.json();
    const profile = await profileRes.json();

    // quote.c = 現價, quote.pc = 昨收, quote.h = 今高, quote.l = 今低, quote.o = 今開
    if (!quote.c || quote.c === 0) {
      return Response.json(
        { ok: false, error: `查無「${symbol}」，請確認美股代號是否正確` },
        { status: 404 }
      );
    }

    const price = quote.c;
    const prev  = quote.pc;
    const chg   = Math.round((price - prev) * 100) / 100;
    const pct   = Math.round((chg / prev) * 10000) / 100;

    return Response.json({
      ok:        true,
      code:      symbol,
      name:      profile.name || symbol,
      price,
      prev,
      change:    chg,
      changePct: pct,
      high:      quote.h || 0,
      low:       quote.l || 0,
      open:      quote.o || 0,
      volume:    quote.v || 0,
      exchange:  '美股',
      currency:  'USD',
      market:    'US',
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (e) {
    return Response.json(
      { ok: false, error: '查詢失敗，請稍後再試' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
