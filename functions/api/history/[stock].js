// Cloudflare Pages Function
// 路徑: functions/api/history/[stock].js
// 抓最近 3 個月的歷史 K 線資料，用來計算技術指標

export async function onRequest(context) {
  const stockNo = context.params.stock?.trim();
  if (!stockNo) {
    return Response.json({ ok: false, error: '請提供股票代號' }, { status: 400 });
  }

  const headers = { 'User-Agent': 'Mozilla/5.0' };
  const results = [];

  const now = new Date();
  // 抓最近 3 個月
  for (let delta = 2; delta >= 0; delta--) {
    const d = new Date(now.getFullYear(), now.getMonth() - delta, 1);
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}01`;

    try {
      const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${ym}&stockNo=${stockNo}`;
      const res  = await fetch(url, { headers });
      const data = await res.json();

      if (data.stat === 'OK' && data.data) {
        for (const row of data.data) {
          try {
            results.push({
              date:   row[0],
              open:   parseFloat(row[3].replace(/,/g, '')),
              high:   parseFloat(row[4].replace(/,/g, '')),
              low:    parseFloat(row[5].replace(/,/g, '')),
              close:  parseFloat(row[6].replace(/,/g, '')),
              volume: parseInt(row[1].replace(/,/g, '')),
            });
          } catch (_) { continue; }
        }
      }
    } catch (_) { continue; }
  }

  return Response.json(
    { ok: true, data: results },
    { headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
