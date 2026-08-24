/**
 * IndexNow：把 sitemap 里的 URL 主动推送给 Bing（ChatGPT 联网搜索的索引来源之一）。
 * 用法：npm run geo:ping
 * 部署后跑一次即可；新页面上线时再跑。
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const HOST = 'www.shanhai.app';
const KEY = '6d39f6711e904896a550665bab1dc452';

function readSitemapUrls() {
  const xml = fs.readFileSync(path.join(__dirname, '..', 'public', 'sitemap.xml'), 'utf8');
  const urls = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) urls.push(m[1].trim());
  return urls;
}

function post(urls) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls,
    });
    const req = https.request(
      'https://api.indexnow.org/indexnow',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) },
        timeout: 15000,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      },
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.write(body);
    req.end();
  });
}

(async () => {
  const urls = readSitemapUrls();
  if (!urls.length) throw new Error('sitemap.xml 里没有 URL');
  const { status, data } = await post(urls);
  console.log(`IndexNow 提交 ${urls.length} 个 URL，HTTP ${status}${data ? ` ${data}` : ''}`);
  if (status >= 400) process.exit(1);
})().catch((err) => {
  console.error(`IndexNow 提交失败: ${err.message}`);
  process.exit(1);
});
