// functions/api/tw-fundamental/[stock].js
// 台股本益比、殖利率、股價淨值比 — 台灣證交所官方 API（免費）

export async function onRequest(context) {
  const stockNo = context.params.stock?.trim();
  if (!stockNo) {
    return Response.json({ ok: false, error: '請提供股票代號' }, { status: 400 });
  }

  const headers = { 'User-Agent': 'Mozilla/5.0' };

  try {
    // TWSE BWIBBU_d：個股本益比、殖利率、股價淨值比（當月每日資料）
    const now   = new Date();
    const ym    = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}01`;
    const url   = `https://www.twse.com.tw/exchangeReport/BWIBBU_d?response=json&date=${ym}&stockNo=${stockNo}`;
    const res   = await fetch(url, { headers });
    const data  = await res.json();

    if (data.stat !== 'OK' || !data.data?.length) {
      // 試上個月
      const prev = new Date(now.getFullYear(), now.getMonth()-1, 1);
      const ym2  = `${prev.getFullYear()}${String(prev.getMonth()+1).padStart(2,'0')}01`;
      const url2 = `https://www.twse.com.tw/exchangeReport/BWIBBU_d?response=json&date=${ym2}&stockNo=${stockNo}`;
      const res2 = await fetch(url2, { headers });
      const d2   = await res2.json();
      if (d2.stat !== 'OK' || !d2.data?.length) {
        return Response.json({ ok: false, error: '無本益比資料' }, {
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }
      data.data = d2.data;
    }

    // 取最後一筆（最新資料）
    // 欄位：[0]日期 [1]殖利率(%) [2]股利年度 [3]本益比 [4]股價淨值比 [5]財報年/季
    const rows = data.data;
    const last = rows[rows.length - 1];

    const parse = (v) => {
      if (!v || v === '--' || v === '-') return null;
      const n = parseFloat(v.replace(/,/g,''));
      return isNaN(n) ? null : n;
    };

    const dividendYield = parse(last[1]);
    const pe            = parse(last[3]);
    const pb            = parse(last[4]);

    return Response.json({
      ok: true,
      stockNo,
      date: last[0],
      pe,
      pb,
      dividendYield,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (e) {
    return Response.json(
      { ok: false, error: e.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
