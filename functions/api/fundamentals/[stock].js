// functions/api/fundamentals/[stock].js
// 基本面資料 — Yahoo Finance（免費，不需要 API Key）

export async function onRequest(context) {
  const symbol = context.params.stock?.trim().toUpperCase();
  if (!symbol) {
    return Response.json({ ok: false, error: '請提供股票代號' }, { status: 400 });
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
  };

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d&modules=financialData,defaultKeyStatistics,summaryDetail,calendarEvents`;
    const res  = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    // 也抓 quoteSummary 取得更多基本面資料
    const url2 = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=financialData%2CdefaultKeyStatistics%2CsummaryDetail%2CearningsTrend%2CincomeStatementHistory`;
    const res2 = await fetch(url2, { headers });
    const raw2 = await res2.json();
    const sum  = raw2?.quoteSummary?.result?.[0] || {};

    const fd = sum.financialData       || {};
    const ks = sum.defaultKeyStatistics|| {};
    const sd = sum.summaryDetail       || {};

    // 取出關鍵指標
    const get = (obj, key) => obj?.[key]?.raw ?? obj?.[key] ?? null;
    const fmt  = (v, dec=2) => v != null ? +Number(v).toFixed(dec) : null;

    const pe         = fmt(get(sd,'trailingPE') ?? get(ks,'forwardPE'));
    const forwardPE  = fmt(get(ks,'forwardPE'));
    const pbRatio    = fmt(get(ks,'priceToBook'));
    const eps        = fmt(get(ks,'trailingEps'));
    const roe        = fmt(get(fd,'returnOnEquity') * 100);
    const grossMargin= fmt(get(fd,'grossMargins') * 100);
    const opMargin   = fmt(get(fd,'operatingMargins') * 100);
    const revenue    = get(fd,'totalRevenue');
    const debtRatio  = fmt(get(fd,'debtToEquity'));
    const currentRatio = fmt(get(fd,'currentRatio'));
    const revenueGrowth = fmt(get(fd,'revenueGrowth') * 100);
    const earningsGrowth = fmt(get(fd,'earningsGrowth') * 100);
    const week52High = fmt(get(sd,'fiftyTwoWeekHigh'));
    const week52Low  = fmt(get(sd,'fiftyTwoWeekLow'));
    const dividendYield = fmt(get(sd,'dividendYield') * 100);
    const beta       = fmt(get(sd,'beta'));
    const marketCap  = get(sd,'marketCap') ?? get(ks,'marketCap');
    const targetPrice = fmt(get(fd,'targetMeanPrice'));

    return Response.json({
      ok: true,
      symbol,
      pe, forwardPE, pbRatio, eps,
      roe, grossMargin, opMargin,
      revenue, revenueGrowth, earningsGrowth,
      debtRatio, currentRatio,
      week52High, week52Low, dividendYield,
      beta, marketCap, targetPrice,
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
