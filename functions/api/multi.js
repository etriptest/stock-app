// Cloudflare Pages Function
// 路徑: functions/api/multi.js
// 一次查詢多支股票，用於首頁熱門個股列表

export async function onRequest(context) {
  const url     = new URL(context.request.url);
  const stocks  = url.searchParams.get('stocks') || '';
  const list    = stocks.split(',').map(s => s.trim()).filter(Boolean);

  if (!list.length) {
    return Response.json({ ok: false, error: '請提供股票代號' }, { status: 400 });
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'https://mis.twse.com.tw/',
  };

  // 同時查 tse 和 otc
  const tsePart = list.map(s => `tse_${s}.tw`).join('|');
  const otcPart = list.map(s => `otc_${s}.tw`).join('|');
  const combined = `${tsePart}|${otcPart}`;

  try {
    const apiUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${combined}&json=1&delay=0`;
    const res    = await fetch(apiUrl, { headers });
    const data   = await res.json();
    const arr    = data?.msgArray || [];

    const seen    = new Set();
    const results = [];

    for (const q of arr) {
      const code = q.c || '';
      if (!code || seen.has(code) || !q.n) continue;
      seen.add(code);

      const price = parseFloat(q.z) || parseFloat(q.y) || 0;
      const prev  = parseFloat(q.y) || price;
      const chg   = Math.round((price - prev) * 100) / 100;
      const pct   = prev ? Math.round((chg / prev) * 10000) / 100 : 0;

      results.push({ code, name: q.n, price, change: chg, changePct: pct });
    }

    return Response.json(
      { ok: true, data: results },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (e) {
    return Response.json(
      { ok: false, error: e.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
