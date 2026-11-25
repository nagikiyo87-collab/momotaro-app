/**
 * Googleマップの共有リンク（https://maps.app.goo.gl/xxxx など）から、場所の名前を調べる。
 * iPhone の Googleマップで「リンクをコピー」すると URL だけがコピーされ、店名が分からないため。
 * 短縮リンクの転送先（/maps/place/店名/... や ?q=店名,住所）から名前を取り出す。
 * ブラウザからは転送先を読めない（CORS）ので、Vercel のサーバー側で行う。
 *
 * GET /api/place-name?url=<共有リンク>  →  { name: "店名" } または { name: null }
 *
 * 安全のため、Google マップのリンク以外は扱わない（任意の URL を取りに行く踏み台にさせない）
 */
const ALLOWED_HOSTS = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'g.co',
  'maps.google.com',
  'www.google.com',
  'google.com',
  'www.google.co.jp',
  'google.co.jp',
]);

const isAllowed = (u) => {
  try {
    const url = new URL(u);
    if (url.protocol !== 'https:') return false;
    if (!ALLOWED_HOSTS.has(url.hostname)) return false;
    // google.com などは /maps の下だけ
    if (/google\./.test(url.hostname) && url.hostname !== 'maps.google.com' && !url.pathname.startsWith('/maps')) return false;
    if (url.hostname === 'goo.gl' && !url.pathname.startsWith('/maps')) return false;
    return true;
  } catch {
    return false;
  }
};

/** 転送先の URL から場所の名前を取り出す */
export const extractPlaceName = (u) => {
  try {
    const url = new URL(u);
    // 例：https://www.google.com/maps/place/スターバックス+コーヒー+調布駅前店/@35.65,139.54,17z/...
    const m = url.pathname.match(/\/maps\/place\/([^/]+)/);
    if (m) return decodeURIComponent(m[1].replace(/\+/g, ' ')).trim() || null;
    // 例：https://maps.google.com/?q=スターバックス+コーヒー+調布駅前店,+〒182-0024+東京都...&ftid=...
    const q = url.searchParams.get('q') || url.searchParams.get('query');
    if (q && !/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(q)) {
      // 住所の前（最初の「,」や「〒」まで）を名前とする
      return q.split(/,|、|〒/)[0].trim() || null;
    }
  } catch {
    // 読めない URL は名前なし
  }
  return null;
};

export default async function handler(req, res) {
  const target = typeof req.query?.url === 'string' ? req.query.url : '';
  if (!isAllowed(target)) {
    res.status(400).json({ name: null, error: 'Google マップのリンクではありません' });
    return;
  }
  let current = target;
  try {
    // 短縮リンクは何回か転送されるので、Google マップの範囲内で最大 5 回までたどる
    for (let i = 0; i < 5; i++) {
      const name = extractPlaceName(current);
      if (name) {
        res.setHeader('Cache-Control', 's-maxage=86400');
        res.status(200).json({ name });
        return;
      }
      const r = await fetch(current, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
      const next = r.headers.get('location');
      if (!next) break;
      const abs = new URL(next, current).toString();
      if (!isAllowed(abs)) break;
      current = abs;
    }
  } catch {
    // 調べられなかったときは名前なしで返す（アプリ側で手入力してもらう）
  }
  res.status(200).json({ name: extractPlaceName(current) });
}
