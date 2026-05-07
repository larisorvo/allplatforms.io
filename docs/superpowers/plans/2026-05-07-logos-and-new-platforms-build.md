# Logos + 6 New Platforms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 new platforms (Pinterest, Snapchat, Threads, Reddit, Twitch, Discord) with full spec data, plus SVG logos for all 12 platforms in both homepage cards and platform page heroes.

**Architecture:** SVG logo files live in `public/logos/<slug>.svg`. `build.js` reads them at startup into a `logos` map, then inlines them into generated HTML. Cards get a branded header banner; platform page heroes get a logo badge beside the H1. The existing JSON schema gains a `category` field (shown in card subtitles).

**Tech Stack:** Node.js 18+, plain HTML, Tailwind CSS via CDN

---

## Task 1: Update tests for all 12 platforms

**Files:**
- Modify: `tests/build.test.js`

- [ ] **Step 1: Update tests/build.test.js**

Replace the slug arrays and add per-platform existence checks:

```javascript
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
];

test('build runs without error', () => {
  execSync('node build.js', { cwd: ROOT, stdio: 'pipe' });
});

test('facebook page exists', () => {
  assert.ok(fs.existsSync(path.join(PUBLIC, 'facebook', 'index.html')));
});

test('facebook page has required SEO elements', () => {
  const html = fs.readFileSync(path.join(PUBLIC, 'facebook', 'index.html'), 'utf8');
  assert.ok(html.includes('<title>'), 'missing <title>');
  assert.ok(html.includes('Facebook Specs'), 'title missing platform name');
  assert.ok(html.includes('<h1>'), 'missing <h1>');
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
  assert.ok(fs.existsSync(path.join(PUBLIC, 'index.html')));
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

for (const slug of ['pinterest','snapchat','threads','reddit','twitch','discord']) {
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
```

- [ ] **Step 2: Run tests — confirm failures for new platforms**

```powershell
node --test tests/build.test.js
```

Expected: existing 8 tests pass, new 12 tests (6 exists + 6 SEO) fail with "missing" errors. This is correct.

- [ ] **Step 3: Commit**

```powershell
git add tests/build.test.js
git commit -m "test: extend test suite for 12 platforms"
```

---

## Task 2: Create SVG logo files

**Files:**
- Create: `public/logos/facebook.svg`
- Create: `public/logos/instagram.svg`
- Create: `public/logos/youtube.svg`
- Create: `public/logos/tiktok.svg`
- Create: `public/logos/linkedin.svg`
- Create: `public/logos/x.svg`
- Create: `public/logos/pinterest.svg`
- Create: `public/logos/snapchat.svg`
- Create: `public/logos/threads.svg`
- Create: `public/logos/reddit.svg`
- Create: `public/logos/twitch.svg`
- Create: `public/logos/discord.svg`

- [ ] **Step 1: Create public/logos/ directory and all SVG files**

`public/logos/facebook.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
```

`public/logos/instagram.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
```

`public/logos/youtube.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#FF0000"/></svg>
```

`public/logos/tiktok.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.53V6.77a4.85 4.85 0 0 1-1.02-.08z"/></svg>
```

`public/logos/linkedin.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
```

`public/logos/x.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
```

`public/logos/pinterest.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
```

`public/logos/snapchat.svg` (black icon — yellow background):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000"><path d="M12.166.006C7.456-.026 3.25 2.618 1.25 6.72c-.9 1.85-1.16 3.79-1.25 5.73v.7c.04 1.14.1 2.39.56 3.46-.23.12-.46.27-.65.44-.48.41-.73.93-.65 1.45.16 1.01 1.36 1.61 2.22 1.85.13.04.27.08.42.13.44.15.91.33 1.17.71.41.59.61 1.3.93 1.94.38.74 1.01 1.15 1.79 1.15.4 0 .82-.11 1.29-.34.52-.25 1.02-.37 1.5-.37.54 0 1.01.15 1.49.47.63.42 1.17.62 1.7.62.75 0 1.38-.37 1.82-1.07.31-.49.53-1.08.84-1.58.22-.36.65-.55 1.07-.69.14-.05.28-.09.41-.13.86-.24 2.06-.84 2.22-1.85.08-.52-.17-1.04-.65-1.45-.19-.17-.42-.32-.66-.44.47-1.07.52-2.32.56-3.46v-.7c-.09-1.95-.35-3.87-1.25-5.73C21.05 2.62 16.87-.02 12.17.006h-.004z"/></svg>
```

`public/logos/threads.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" fill="white"><path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.206 17.11 97.015 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 9.986 15.908 12.787 26.396l16.137-4.304c-3.412-12.586-8.766-23.441-16.036-32.411C147.844 9.781 126.113.294 97.1.007h-.199C68.001.294 46.487 9.798 31.95 28.24 18.785 44.911 12.01 68.376 11.804 96.009l-.001.072.001.072c.205 27.633 6.98 51.098 20.145 67.769C46.487 182.202 68 191.706 96.9 191.993h.2c26.106-.264 44.428-7.047 59.522-22.139 19.715-19.702 19.117-44.39 12.636-59.548-4.462-10.403-13.033-18.811-27.72-23.318Zm-48.32 47.43c-10.438.588-21.286-4.098-21.82-14.135-.401-7.544 5.34-15.959 22.574-16.977 1.976-.114 3.918-.169 5.824-.169 6.404 0 12.4.619 17.868 1.812-2.032 25.357-14.654 28.871-24.446 29.47z"/></svg>
```

`public/logos/reddit.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
```

`public/logos/twitch.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>
```

`public/logos/discord.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/></svg>
```

- [ ] **Step 2: Commit logos**

```powershell
git add public/logos/
git commit -m "feat: add SVG logo files for all 12 platforms"
```

---

## Task 3: Add category field to existing 6 JSON files

**Files:**
- Modify: `data/facebook.json`, `data/instagram.json`, `data/youtube.json`, `data/tiktok.json`, `data/linkedin.json`, `data/x.json`

Add `"category": "..."` after the `"color"` field in each file:
- facebook.json: `"category": "Social"`
- instagram.json: `"category": "Social"`
- youtube.json: `"category": "Video"`
- tiktok.json: `"category": "Video"`
- linkedin.json: `"category": "Professional"`
- x.json: `"category": "Social"`

- [ ] **Step 1: Update each existing JSON file with category field**

- [ ] **Step 2: Commit**

```powershell
git add data/
git commit -m "data: add category field to existing platform JSON files"
```

---

## Task 4: Create 6 new platform JSON files

**Files:**
- Create: `data/pinterest.json`
- Create: `data/snapchat.json`
- Create: `data/threads.json`
- Create: `data/reddit.json`
- Create: `data/twitch.json`
- Create: `data/discord.json`

(Full JSON content in implementation — see build plan execution)

- [ ] **Step 1: Create all 6 JSON files**
- [ ] **Step 2: Commit**

```powershell
git add data/
git commit -m "data: add Pinterest, Snapchat, Threads, Reddit, Twitch, Discord spec data"
```

---

## Task 5: Modify build.js

**Files:**
- Modify: `build.js`

Changes:
1. Add `LOGOS_DIR` constant and `injectLogo()` helper
2. Add `loadLogos()` function
3. Update `buildHomePage()` for branded card header
4. Update `buildOtherPlatforms()` for logo badges
5. Update `buildPlatformPage()` to replace `{{PLATFORM_LOGO}}`
6. Update `main()` to load logos and pass them through

- [ ] **Step 1: Rewrite build.js with all logo changes**
- [ ] **Step 2: Commit**

```powershell
git add build.js
git commit -m "feat: add logo injection to build script"
```

---

## Task 6: Modify template-platform.html

**Files:**
- Modify: `src/template-platform.html`

Update hero section to include `{{PLATFORM_LOGO}}` token beside the H1.

- [ ] **Step 1: Update hero in template-platform.html**
- [ ] **Step 2: Commit**

```powershell
git add src/template-platform.html
git commit -m "feat: add PLATFORM_LOGO token to platform page hero"
```

---

## Task 7: Run build and verify all tests pass

- [ ] **Step 1: Run build**

```powershell
node build.js
```

Expected: 12 platform pages + index.html + sitemap.xml + robots.txt

- [ ] **Step 2: Run full test suite**

```powershell
node --test tests/build.test.js
```

Expected: all 20 tests pass (8 original + 12 new)

- [ ] **Step 3: Commit public/**

```powershell
git add public/
git commit -m "chore: rebuild with logos and 12 platforms"
```
