const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

const ALL_SLUGS = [
  'facebook','instagram','youtube','tiktok','linkedin','x',
  'pinterest','snapchat','threads','reddit','twitch','discord',
  'whatsapp','telegram','vimeo','bluesky','mastodon','medium',
  'tumblr','behance','spotify','wechat',
];

test('build runs without error', () => {
  execSync('node build.js', { cwd: ROOT, stdio: 'pipe' });
});

test('facebook page exists', () => {
  const file = path.join(PUBLIC, 'facebook', 'index.html');
  assert.ok(fs.existsSync(file), 'public/facebook/index.html missing');
});

test('facebook page has required SEO elements', () => {
  const html = fs.readFileSync(path.join(PUBLIC, 'facebook', 'index.html'), 'utf8');
  assert.ok(html.includes('<title>'), 'missing <title>');
  assert.ok(html.includes('Facebook Specs'), 'title missing platform name');
  assert.ok(html.includes('<h1'), 'missing <h1>');
  assert.ok(html.includes('<link rel="canonical"'), 'missing canonical');
  assert.ok(html.includes('allplatforms.io/facebook'), 'canonical wrong URL');
  assert.ok(html.includes('application/ld+json'), 'missing JSON-LD');
});

test('facebook page has spec sections in priority order', () => {
  const html = fs.readFileSync(path.join(PUBLIC, 'facebook', 'index.html'), 'utf8');
  const imagePos = html.indexOf('id="images"');
  const videoPos = html.indexOf('id="video"');
  const textPos  = html.indexOf('id="text"');
  assert.ok(imagePos > -1, 'missing images section');
  assert.ok(videoPos > -1, 'missing video section');
  assert.ok(textPos  > -1, 'missing text section');
  assert.ok(imagePos < videoPos, 'images must come before video');
  assert.ok(videoPos < textPos,  'video must come before text');
});

test('homepage exists', () => {
  const file = path.join(PUBLIC, 'index.html');
  assert.ok(fs.existsSync(file), 'public/index.html missing');
});

test('homepage lists all platforms', () => {
  const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
  for (const slug of ALL_SLUGS) {
    assert.ok(html.includes(`href="/${slug}"`), `homepage missing link to ${slug}`);
  }
});

test('sitemap.xml contains all platform URLs', () => {
  const sitemap = fs.readFileSync(path.join(PUBLIC, 'sitemap.xml'), 'utf8');
  for (const slug of ALL_SLUGS) {
    assert.ok(sitemap.includes(`allplatforms.io/${slug}`), `sitemap missing ${slug}`);
  }
});

test('robots.txt exists and references sitemap', () => {
  const robots = fs.readFileSync(path.join(PUBLIC, 'robots.txt'), 'utf8');
  assert.ok(robots.includes('Sitemap:'), 'robots.txt missing Sitemap directive');
  assert.ok(robots.includes('allplatforms.io/sitemap.xml'), 'robots.txt wrong sitemap URL');
});

for (const slug of ['pinterest','snapchat','threads','reddit','twitch','discord','whatsapp','telegram','vimeo','bluesky','mastodon','medium','tumblr','behance','spotify','wechat']) {
  test(`${slug} page exists`, () => {
    assert.ok(fs.existsSync(path.join(PUBLIC, slug, 'index.html')), `public/${slug}/index.html missing`);
  });

  test(`${slug} page has required SEO elements`, () => {
    const html = fs.readFileSync(path.join(PUBLIC, slug, 'index.html'), 'utf8');
    assert.ok(html.includes('<title>'), `${slug}: missing <title>`);
    assert.ok(html.includes('<link rel="canonical"'), `${slug}: missing canonical`);
    assert.ok(html.includes('application/ld+json'), `${slug}: missing JSON-LD`);
  });
}
