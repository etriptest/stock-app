// functions/api/history-us/[stock].js
// 美股歷史 K 線 — 透過 Finnhub candle API

export async function onRequest(context) {
  const symbol = context.params.stock?.trim().toUpperCase();
  if (!symbol) {
    return Response.json({ ok: false, error: '請提供股票代號' }, { status: 400 });
  }

  const FINNHUB_KEY = context.env.FINNHUB_KEY;
  if (!FINNHUB_KEY) {
    return Response.json({ ok: false, error: '伺服器未設定 API Key' }, { status: 500 });
  }

  // 抓最近 90 天
  const to   = Math.floor(Date.now() / 1000);
  const from = to - 90 * 24 * 3600;

  try {
    const res  = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_KEY}`
    );
    const data = await res.json();

    if (data.s !== 'ok' || !data.c?.length) {
      return Response.json(
        { ok: false, error: `查無 ${symbol} 的歷史資料` },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const rows = data.t.map((ts, i) => ({
      date:   new Date(ts * 1000).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
      open:   data.o[i],
      high:   data.h[i],
      low:    data.l[i],
      close:  data.c[i],
      volume: data.v[i],
    }));

    return Response.json(
      { ok: true, data: rows },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (e) {
    return Response.json(
      { ok: false, error: e.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
