# AllPlatforms.io Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static social media spec reference site with a JSON-data-driven build script that generates SEO-optimized HTML pages for 6 major platforms.

**Architecture:** JSON spec files in `/data/` are processed by `build.js` using string-token replacement to inject platform data into shared HTML templates in `/src/`. Output is fully static HTML written to `/public/`, which is committed to git and served by Cloudflare Pages.

**Tech Stack:** Node.js 18+ (built-in `node:test`, `node:fs`, `node:path`, `node:crypto`), Tailwind CSS via CDN, plain HTML/JS

---

## File Map

| File | Purpose |
|---|---|
| `package.json` | Project scripts |
| `.gitignore` | Excludes hash cache and node_modules |
| `tests/build.test.js` | Integration tests for build output |
| `data/facebook.json` | Facebook spec data (reference platform) |
| `data/instagram.json` | Instagram spec data |
| `data/youtube.json` | YouTube spec data |
| `data/tiktok.json` | TikTok spec data |
| `data/linkedin.json` | LinkedIn spec data |
| `data/x.json` | X/Twitter spec data |
| `src/template-platform.html` | Shared platform page template (tokens replaced by build.js) |
| `src/template-index.html` | Homepage template |
| `build.js` | Reads data + templates, writes public/ |
| `scripts/check-sources.js` | Weekly source change-detection script |
| `public/` | Generated output — committed to git |

---

## Task 1: Initialize project

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `data/`, `src/`, `tests/`, `scripts/`, `public/` directories

- [ ] **Step 1: Create directory structure**

```powershell
cd C:\Users\laris\claude-code\allplatforms.io
New-Item -ItemType Directory -Force data, src, tests, scripts, public | Out-Null
```

Expected: directories created silently.

- [ ] **Step 2: Create package.json**

Create `package.json`:
```json
{
  "name": "allplatforms-io",
  "version": "1.0.0",
  "description": "Social media specs and size guide",
  "scripts": {
    "build": "node build.js",
    "test": "node --test tests/build.test.js",
    "check-sources": "node scripts/check-sources.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

- [ ] **Step 3: Create .gitignore**

Create `.gitignore`:
```
scripts/.source-hashes.json
node_modules/
.DS_Store
Thumbs.db
```

- [ ] **Step 4: Initialize git**

```powershell
git init
git add package.json .gitignore
git commit -m "chore: initialize allplatforms.io project"
```

---

## Task 2: Write failing integration tests

**Files:**
- Create: `tests/build.test.js`

Tests assert on the build output. They fail now (no build.js, no data, no templates). That is expected.

- [ ] **Step 1: Create tests/build.test.js**

```javascript
// tests/build.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

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
  const file = path.join(PUBLIC, 'index.html');
  assert.ok(fs.existsSync(file), 'public/index.html missing');
});

test('homepage lists all platforms', () => {
  const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
  for (const slug of ['facebook', 'instagram', 'youtube', 'tiktok', 'linkedin', 'x']) {
    assert.ok(html.includes(`href="/${slug}"`), `homepage missing link to ${slug}`);
  }
});

test('sitemap.xml contains all platform URLs', () => {
  const sitemap = fs.readFileSync(path.join(PUBLIC, 'sitemap.xml'), 'utf8');
  for (const slug of ['facebook', 'instagram', 'youtube', 'tiktok', 'linkedin', 'x']) {
    assert.ok(sitemap.includes(`allplatforms.io/${slug}`), `sitemap missing ${slug}`);
  }
});

test('robots.txt exists and references sitemap', () => {
  const robots = fs.readFileSync(path.join(PUBLIC, 'robots.txt'), 'utf8');
  assert.ok(robots.includes('Sitemap:'), 'robots.txt missing Sitemap directive');
  assert.ok(robots.includes('allplatforms.io/sitemap.xml'), 'robots.txt wrong sitemap URL');
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```powershell
node --test tests/build.test.js
```

Expected: test "build runs without error" fails with `Cannot find module` or similar. All other tests fail too. This is correct.

- [ ] **Step 3: Commit test file**

```powershell
git add tests/build.test.js
git commit -m "test: add build integration tests (failing)"
```

---

## Task 3: Facebook JSON — full spec data

**Files:**
- Create: `data/facebook.json`

This is the reference platform. All other platforms follow this exact schema.

- [ ] **Step 1: Create data/facebook.json**

```json
{
  "name": "Facebook",
  "slug": "facebook",
  "color": "#1877F2",
  "description": "Specs and technical requirements for all Facebook content formats.",
  "lastUpdated": "2026-05-03",
  "sources": [
    { "label": "Facebook Image Specs", "url": "https://www.facebook.com/help/597402743415010" },
    { "label": "Facebook Video Specs", "url": "https://www.facebook.com/help/1141422115955462" },
    { "label": "Facebook Ad Specs", "url": "https://www.facebook.com/business/ads-guide" }
  ],
  "specs": [
    {
      "category": "images",
      "label": "Image Specs",
      "priority": 1,
      "items": [
        {
          "name": "Feed Photo (Link Preview)",
          "dimensions": "1200 × 628 px",
          "aspectRatio": "1.91:1",
          "maxFileSize": "30 MB",
          "formats": ["JPG", "PNG"],
          "notes": "Recommended for link previews and shared articles"
        },
        {
          "name": "Feed Photo (Square)",
          "dimensions": "1080 × 1080 px",
          "aspectRatio": "1:1",
          "maxFileSize": "30 MB",
          "formats": ["JPG", "PNG"]
        },
        {
          "name": "Feed Photo (Portrait)",
          "dimensions": "1080 × 1350 px",
          "aspectRatio": "4:5",
          "maxFileSize": "30 MB",
          "formats": ["JPG", "PNG"]
        },
        {
          "name": "Story / Reel Image",
          "dimensions": "1080 × 1920 px",
          "aspectRatio": "9:16",
          "maxFileSize": "30 MB",
          "formats": ["JPG", "PNG"]
        }
      ]
    },
    {
      "category": "video",
      "label": "Video Specs",
      "priority": 2,
      "items": [
        {
          "name": "Feed Video",
          "resolution": "1280 × 720 px (minimum)",
          "aspectRatio": "16:9 recommended",
          "duration": "1 second – 240 minutes",
          "maxFileSize": "4 GB",
          "formats": ["MP4", "MOV"],
          "notes": "H.264 codec, AAC audio recommended"
        },
        {
          "name": "Reel",
          "resolution": "1080 × 1920 px",
          "aspectRatio": "9:16",
          "duration": "Up to 90 seconds",
          "maxFileSize": "1 GB",
          "formats": ["MP4"],
          "notes": "Vertical format only"
        },
        {
          "name": "Story Video",
          "resolution": "1080 × 1920 px",
          "aspectRatio": "9:16",
          "duration": "Up to 15 seconds",
          "formats": ["MP4", "MOV"]
        }
      ]
    },
    {
      "category": "text",
      "label": "Text & Character Limits",
      "priority": 3,
      "items": [
        {
          "name": "Status / Post",
          "limit": "63,206",
          "unit": "characters"
        },
        {
          "name": "Comment",
          "limit": "8,000",
          "unit": "characters"
        },
        {
          "name": "Page Name",
          "limit": "75",
          "unit": "characters"
        },
        {
          "name": "Page Username",
          "limit": "50",
          "unit": "characters"
        },
        {
          "name": "Page Description",
          "limit": "255",
          "unit": "characters"
        }
      ]
    },
    {
      "category": "profile",
      "label": "Profile & Cover Assets",
      "priority": 4,
      "items": [
        {
          "name": "Profile Photo",
          "dimensions": "170 × 170 px",
          "displayedAs": "128 × 128 px in feed",
          "formats": ["JPG", "PNG"],
          "notes": "Displayed as a circle"
        },
        {
          "name": "Cover Photo",
          "dimensions": "820 × 312 px",
          "displayedAs": "640 × 360 px on mobile",
          "formats": ["JPG", "PNG"],
          "notes": "Keep key content in the safe center area"
        }
      ]
    },
    {
      "category": "ads",
      "label": "Ad Specs",
      "priority": 5,
      "items": [
        {
          "name": "Single Image Ad",
          "dimensions": "1200 × 628 px",
          "formats": ["JPG", "PNG"],
          "maxFileSize": "30 MB"
        },
        {
          "name": "Carousel Ad",
          "dimensions": "1080 × 1080 px per card",
          "notes": "2–10 cards per carousel"
        },
        {
          "name": "Stories Ad",
          "dimensions": "1080 × 1920 px",
          "formats": ["JPG", "PNG", "MP4"]
        },
        {
          "name": "Ad Headline",
          "limit": "40",
          "unit": "characters"
        },
        {
          "name": "Ad Primary Text",
          "limit": "125",
          "unit": "characters",
          "notes": "Text beyond 125 characters is truncated with 'See more'"
        },
        {
          "name": "Ad Description",
          "limit": "30",
          "unit": "characters"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```powershell
git add data/facebook.json
git commit -m "data: add Facebook spec data"
```

---

## Task 4: Platform HTML template

**Files:**
- Create: `src/template-platform.html`

Tokens used: `{{META_TITLE}}`, `{{META_DESCRIPTION}}`, `{{CANONICAL_URL}}`, `{{JSON_LD}}`, `{{PLATFORM_NAME}}`, `{{PLATFORM_COLOR}}`, `{{PLATFORM_DESCRIPTION}}`, `{{QUICK_STATS}}`, `{{NAV_LINKS}}`, `{{SPEC_SECTIONS}}`, `{{OTHER_PLATFORMS}}`, `{{SOURCES}}`, `{{LAST_UPDATED}}`

- [ ] **Step 1: Create src/template-platform.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{META_TITLE}}</title>
  <meta name="description" content="{{META_DESCRIPTION}}">
  <link rel="canonical" href="{{CANONICAL_URL}}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{{META_TITLE}}">
  <meta property="og:description" content="{{META_DESCRIPTION}}">
  <meta property="og:url" content="{{CANONICAL_URL}}">
  <script type="application/ld+json">{{JSON_LD}}</script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 text-gray-900 font-sans">

  <!-- Navigation -->
  <nav class="bg-gray-900 border-b border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
      <a href="/" class="text-white font-bold text-lg tracking-tight">AllPlatforms<span class="text-blue-400">.io</span></a>
      <div class="hidden md:flex items-center gap-1 text-sm">{{NAV_LINKS}}</div>
    </div>
  </nav>

  <!-- Hero -->
  <div class="border-b border-gray-200" style="background: linear-gradient(135deg, {{PLATFORM_COLOR}}18 0%, white 60%)">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 class="text-3xl sm:text-4xl font-bold tracking-tight" style="color: {{PLATFORM_COLOR}}">{{PLATFORM_NAME}} Specs</h1>
      <p class="text-gray-600 mt-1 text-lg">{{PLATFORM_DESCRIPTION}}</p>
      <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">{{QUICK_STATS}}</div>
    </div>
  </div>

  <!-- Ad: Leaderboard -->
  <div class="bg-gray-100 border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex justify-center">
      <div class="ad-slot w-full max-w-3xl h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs" data-ad-format="leaderboard">[Ad]</div>
    </div>
  </div>

  <!-- Content -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:flex lg:gap-8">

    <!-- Main -->
    <main class="flex-1 min-w-0">
      {{SPEC_SECTIONS}}
    </main>

    <!-- Sidebar -->
    <aside class="w-72 flex-shrink-0 hidden lg:block">
      <div class="sticky top-4 space-y-4">
        <div class="ad-slot h-[600px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs" data-ad-format="sidebar-300x600">[Ad]</div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Other Platforms</h4>
          <nav class="space-y-1">{{OTHER_PLATFORMS}}</nav>
        </div>
      </div>
    </aside>

  </div>

  <!-- Sources -->
  <div class="border-t border-gray-200 bg-white mt-4">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sources</h4>
      <div class="flex flex-wrap gap-3 text-sm">{{SOURCES}}</div>
      <p class="text-xs text-gray-400 mt-3">Last verified: <time datetime="{{LAST_UPDATED}}">{{LAST_UPDATED}}</time></p>
    </div>
  </div>

  <!-- Footer -->
  <footer class="bg-gray-900 text-gray-500 text-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row justify-between gap-2">
      <p class="text-gray-300 font-medium">AllPlatforms<span class="text-blue-400">.io</span></p>
      <p>Spec data verified against official platform documentation. Always check platform help centers for the latest updates.</p>
    </div>
  </footer>

</body>
</html>
```

- [ ] **Step 2: Commit**

```powershell
git add src/template-platform.html
git commit -m "feat: add platform page HTML template"
```

---

## Task 5: Homepage HTML template

**Files:**
- Create: `src/template-index.html`

Tokens: `{{META_TITLE}}`, `{{META_DESCRIPTION}}`, `{{PLATFORM_CARDS}}`, `{{PLATFORM_COUNT}}`

- [ ] **Step 1: Create src/template-index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{META_TITLE}}</title>
  <meta name="description" content="{{META_DESCRIPTION}}">
  <link rel="canonical" href="https://allplatforms.io/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{{META_TITLE}}">
  <meta property="og:description" content="{{META_DESCRIPTION}}">
  <meta property="og:url" content="https://allplatforms.io/">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 text-gray-900 font-sans">

  <!-- Navigation -->
  <nav class="bg-gray-900 border-b border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3">
      <a href="/" class="text-white font-bold text-lg tracking-tight">AllPlatforms<span class="text-blue-400">.io</span></a>
    </div>
  </nav>

  <!-- Hero -->
  <div class="bg-gray-900 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <h1 class="text-4xl sm:text-5xl font-bold tracking-tight mb-3">Social Media Specs</h1>
      <p class="text-gray-400 text-xl max-w-2xl">Image sizes, video requirements, character limits, and ad specs for every major platform — all in one place.</p>
      <div class="mt-6">
        <input
          type="text"
          id="platform-filter"
          placeholder="Filter platforms..."
          class="w-full max-w-sm bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-400"
          oninput="filterPlatforms(this.value)"
        >
      </div>
    </div>
  </div>

  <!-- Platform grid -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <p class="text-sm text-gray-500 mb-4">{{PLATFORM_COUNT}} platforms</p>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" id="platform-grid">
      {{PLATFORM_CARDS}}
    </div>
  </div>

  <!-- Footer -->
  <footer class="bg-gray-900 text-gray-500 text-sm mt-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row justify-between gap-2">
      <p class="text-gray-300 font-medium">AllPlatforms<span class="text-blue-400">.io</span></p>
      <p>Spec data verified against official platform documentation. Updated regularly.</p>
    </div>
  </footer>

  <script>
    function filterPlatforms(query) {
      const q = query.toLowerCase();
      document.querySelectorAll('#platform-grid > a').forEach(function(card) {
        card.style.display = (card.dataset.platform || '').includes(q) || q === '' ? '' : 'none';
      });
    }
  </script>

</body>
</html>
```

- [ ] **Step 2: Commit**

```powershell
git add src/template-index.html
git commit -m "feat: add homepage HTML template"
```

---

## Task 6: Build script

**Files:**
- Create: `build.js`

Reads every JSON in `/data/`, renders platform pages and homepage, writes to `/public/`, generates `sitemap.xml` and `robots.txt`.

- [ ] **Step 1: Create build.js**

```javascript
// build.js
'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR   = path.join(__dirname, 'data');
const SRC_DIR    = path.join(__dirname, 'src');
const PUBLIC_DIR = path.join(__dirname, 'public');
const BASE_URL   = 'https://allplatforms.io';

// Fields rendered in spec item tables, in display order.
// 'unit' is consumed together with 'limit' — not rendered as its own row.
const FIELD_LABELS = {
  dimensions:  'Dimensions',
  aspectRatio: 'Aspect Ratio',
  maxFileSize:  'Max File Size',
  formats:     'File Formats',
  resolution:  'Resolution',
  duration:    'Max Duration',
  codec:       'Codec',
  limit:       'Character Limit',
  displayedAs: 'Displayed As',
  notes:       'Notes',
};

function renderSpecItem(item) {
  const rows = [];
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    if (key === 'limit') {
      if (item.limit !== undefined) {
        const val = item.unit ? `${item.limit} ${item.unit}` : item.limit;
        rows.push(row(label, val));
      }
      continue;
    }
    if (item[key] === undefined) continue;
    const val = Array.isArray(item[key]) ? item[key].join(', ') : item[key];
    rows.push(row(label, val));
  }

  return `<div class="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
  <h3 class="font-semibold text-gray-800 mb-3">${item.name}</h3>
  <table class="w-full"><tbody class="divide-y divide-gray-50">${rows.join('')}</tbody></table>
</div>`;
}

function row(label, value) {
  return `<tr><th class="text-left py-1.5 pr-4 text-gray-400 font-normal whitespace-nowrap text-sm">${label}</th><td class="py-1.5 font-mono text-gray-800 text-sm">${value}</td></tr>`;
}

function renderSection(section, platformColor, insertAdAfter) {
  const items = section.items.map(renderSpecItem).join('\n');
  const ad = insertAdAfter
    ? `\n<div class="ad-slot my-6 h-28 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs" data-ad-format="mid-content">[Ad]</div>`
    : '';

  return `<section id="${section.category}" class="mb-10">
  <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
    <span class="w-1 h-6 rounded flex-shrink-0" style="background-color: ${platformColor}"></span>
    <span style="color: ${platformColor}">${section.label}</span>
  </h2>
  <div class="grid gap-4 sm:grid-cols-2">${items}</div>
</section>${ad}`;
}

function buildQuickStats(specs) {
  return [...specs]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map(section => {
      const item = section.items[0];
      if (item.dimensions) return `<span><strong>${item.name}:</strong> ${item.dimensions}</span>`;
      if (item.limit)      return `<span><strong>${item.name}:</strong> ${item.limit}${item.unit ? ' ' + item.unit : ''}</span>`;
      if (item.duration)   return `<span><strong>${item.name}:</strong> ${item.duration}</span>`;
      return `<span>${item.name}</span>`;
    })
    .join('<span class="text-gray-300 mx-1">·</span>');
}

function buildNavLinks(allPlatforms, currentSlug) {
  return allPlatforms
    .map(p => {
      const active = p.slug === currentSlug;
      const cls = active
        ? 'px-3 py-1.5 rounded text-sm bg-blue-600 text-white'
        : 'px-3 py-1.5 rounded text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors';
      return `<a href="/${p.slug}" class="${cls}">${p.name}</a>`;
    })
    .join('');
}

function buildOtherPlatforms(allPlatforms, currentSlug) {
  return allPlatforms
    .filter(p => p.slug !== currentSlug)
    .map(p => `<a href="/${p.slug}" class="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"><span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: ${p.color}"></span>${p.name}</a>`)
    .join('');
}

function buildSources(sources) {
  return sources
    .map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${s.label} ↗</a>`)
    .join('');
}

function buildPlatformPage(platform, template, allPlatforms) {
  const sorted = [...platform.specs].sort((a, b) => a.priority - b.priority);
  const specSections = sorted
    .map((section, i) => renderSection(section, platform.color, i === 0))
    .join('\n');

  const metaTitle = `${platform.name} Specs & Size Guide 2026 | AllPlatforms.io`;
  const metaDesc  = `Complete ${platform.name} specs: image sizes, video requirements, character limits, and ad specs. Last verified ${platform.lastUpdated}.`;
  const canonical = `${BASE_URL}/${platform.slug}`;

  const jsonLd = JSON.stringify({
    '@context':    'https://schema.org',
    '@type':       'WebPage',
    'name':        metaTitle,
    'description': metaDesc,
    'url':         canonical,
    'dateModified': platform.lastUpdated,
  });

  return template
    .replace(/\{\{META_TITLE\}\}/g,          metaTitle)
    .replace(/\{\{META_DESCRIPTION\}\}/g,    metaDesc)
    .replace(/\{\{CANONICAL_URL\}\}/g,       canonical)
    .replace(/\{\{JSON_LD\}\}/g,             jsonLd)
    .replace(/\{\{PLATFORM_NAME\}\}/g,       platform.name)
    .replace(/\{\{PLATFORM_COLOR\}\}/g,      platform.color)
    .replace(/\{\{PLATFORM_DESCRIPTION\}\}/g, platform.description)
    .replace(/\{\{QUICK_STATS\}\}/g,         buildQuickStats(platform.specs))
    .replace(/\{\{NAV_LINKS\}\}/g,           buildNavLinks(allPlatforms, platform.slug))
    .replace(/\{\{SPEC_SECTIONS\}\}/g,       specSections)
    .replace(/\{\{OTHER_PLATFORMS\}\}/g,     buildOtherPlatforms(allPlatforms, platform.slug))
    .replace(/\{\{SOURCES\}\}/g,             buildSources(platform.sources))
    .replace(/\{\{LAST_UPDATED\}\}/g,        platform.lastUpdated);
}

function buildHomePage(allPlatforms, template) {
  const cards = allPlatforms.map(p => {
    const sorted = [...p.specs].sort((a, b) => a.priority - b.priority);
    const teasers = sorted.slice(0, 3).map(section => {
      const item = section.items[0];
      if (item.dimensions) return `${section.label}: ${item.dimensions}`;
      if (item.limit)      return `${section.label}: ${item.limit}${item.unit ? ' ' + item.unit : ''}`;
      if (item.duration)   return `${section.label}: ${item.duration}`;
      return section.label;
    });

    return `<a href="/${p.slug}" class="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all group" data-platform="${p.slug}">
  <div class="flex items-center gap-3 mb-3">
    <div class="w-1 h-10 rounded flex-shrink-0" style="background-color: ${p.color}"></div>
    <h2 class="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">${p.name}</h2>
  </div>
  <p class="text-sm text-gray-500 mb-3">${p.description}</p>
  <ul class="text-xs text-gray-400 space-y-0.5">${teasers.map(t => `<li>→ ${t}</li>`).join('')}</ul>
</a>`;
  }).join('\n');

  return template
    .replace(/\{\{META_TITLE\}\}/g,      'Social Media Specs & Size Guide 2026 | AllPlatforms.io')
    .replace(/\{\{META_DESCRIPTION\}\}/g, 'Complete specs for Facebook, Instagram, YouTube, TikTok, LinkedIn, and X. Image sizes, video requirements, character limits, and ad specs — all in one place.')
    .replace(/\{\{PLATFORM_CARDS\}\}/g,  cards)
    .replace(/\{\{PLATFORM_COUNT\}\}/g,  String(allPlatforms.length));
}

function buildSitemap(allPlatforms) {
  const urls = [
    `  <url><loc>${BASE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    ...allPlatforms.map(p =>
      `  <url><loc>${BASE_URL}/${p.slug}</loc><lastmod>${p.lastUpdated}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`
    ),
  ].join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

function main() {
  const slugs = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.basename(f, '.json'));

  if (slugs.length === 0) {
    console.error('No JSON files found in /data. Add at least one platform file.');
    process.exit(1);
  }

  const allPlatforms = slugs.map(slug =>
    JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${slug}.json`), 'utf8'))
  );

  const platformTemplate = fs.readFileSync(path.join(SRC_DIR, 'template-platform.html'), 'utf8');
  const indexTemplate    = fs.readFileSync(path.join(SRC_DIR, 'template-index.html'),    'utf8');

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  for (const platform of allPlatforms) {
    const dir = path.join(PUBLIC_DIR, platform.slug);
    fs.mkdirSync(dir, { recursive: true });
    const html = buildPlatformPage(platform, platformTemplate, allPlatforms);
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
    console.log(`  ✓ /${platform.slug}/index.html`);
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), buildHomePage(allPlatforms, indexTemplate), 'utf8');
  console.log('  ✓ /index.html');

  const sitemap = buildSitemap(allPlatforms);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap, 'utf8');
  console.log('  ✓ /sitemap.xml');

  const robots = `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml\n`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robots, 'utf8');
  console.log('  ✓ /robots.txt');

  console.log(`\nBuild complete — ${allPlatforms.length} platform(s)`);
}

main();
```

- [ ] **Step 2: Run build**

```powershell
node build.js
```

Expected output:
```
  ✓ /facebook/index.html
  ✓ /index.html
  ✓ /sitemap.xml
  ✓ /robots.txt

Build complete — 1 platform(s)
```

- [ ] **Step 3: Run tests (partial pass expected)**

```powershell
node --test tests/build.test.js
```

Expected: tests `build runs without error`, `facebook page exists`, `facebook page has required SEO elements`, `facebook page has spec sections in priority order`, `homepage exists` — all **PASS**. Tests `homepage lists all platforms` and `sitemap.xml contains all platform URLs` fail (missing 5 platforms). That is correct.

- [ ] **Step 4: Commit**

```powershell
git add build.js public/
git commit -m "feat: add build script and initial generated output"
```

---

## Task 7: Instagram JSON

**Files:**
- Create: `data/instagram.json`

- [ ] **Step 1: Create data/instagram.json**

```json
{
  "name": "Instagram",
  "slug": "instagram",
  "color": "#E1306C",
  "description": "Specs and technical requirements for all Instagram content formats.",
  "lastUpdated": "2026-05-03",
  "sources": [
    { "label": "Instagram Help Center", "url": "https://help.instagram.com/1631821640426723" },
    { "label": "Instagram Ad Specs", "url": "https://www.facebook.com/business/ads-guide/image/instagram-feed" }
  ],
  "specs": [
    {
      "category": "images",
      "label": "Image Specs",
      "priority": 1,
      "items": [
        {
          "name": "Feed — Square",
          "dimensions": "1080 × 1080 px",
          "aspectRatio": "1:1",
          "maxFileSize": "30 MB",
          "formats": ["JPG", "PNG"]
        },
        {
          "name": "Feed — Portrait",
          "dimensions": "1080 × 1350 px",
          "aspectRatio": "4:5",
          "maxFileSize": "30 MB",
          "formats": ["JPG", "PNG"],
          "notes": "Maximum vertical crop in feed"
        },
        {
          "name": "Feed — Landscape",
          "dimensions": "1080 × 566 px",
          "aspectRatio": "1.91:1",
          "maxFileSize": "30 MB",
          "formats": ["JPG", "PNG"]
        },
        {
          "name": "Story / Reel Cover",
          "dimensions": "1080 × 1920 px",
          "aspectRatio": "9:16",
          "maxFileSize": "30 MB",
          "formats": ["JPG", "PNG"]
        }
      ]
    },
    {
      "category": "video",
      "label": "Video Specs",
      "priority": 2,
      "items": [
        {
          "name": "Feed Video",
          "resolution": "1080 × 1080 px (square) or 1080 × 1350 px",
          "duration": "3 seconds – 60 seconds",
          "maxFileSize": "650 MB",
          "formats": ["MP4", "MOV"],
          "notes": "H.264 codec, 30fps recommended"
        },
        {
          "name": "Reel",
          "resolution": "1080 × 1920 px",
          "aspectRatio": "9:16",
          "duration": "Up to 90 seconds",
          "maxFileSize": "1 GB",
          "formats": ["MP4"],
          "notes": "Vertical format only; keep key content within centre safe zone"
        },
        {
          "name": "Story Video",
          "resolution": "1080 × 1920 px",
          "aspectRatio": "9:16",
          "duration": "Up to 60 seconds",
          "formats": ["MP4", "MOV"]
        }
      ]
    },
    {
      "category": "text",
      "label": "Text & Character Limits",
      "priority": 3,
      "items": [
        {
          "name": "Caption",
          "limit": "2,200",
          "unit": "characters",
          "notes": "Only first ~125 characters visible without tapping 'more'"
        },
        {
          "name": "Bio",
          "limit": "150",
          "unit": "characters"
        },
        {
          "name": "Username",
          "limit": "30",
          "unit": "characters"
        },
        {
          "name": "Comment",
          "limit": "2,200",
          "unit": "characters"
        }
      ]
    },
    {
      "category": "profile",
      "label": "Profile & Cover Assets",
      "priority": 4,
      "items": [
        {
          "name": "Profile Photo",
          "dimensions": "320 × 320 px",
          "displayedAs": "110 × 110 px in-app",
          "formats": ["JPG", "PNG"],
          "notes": "Displayed as a circle; upload at 320×320 for best quality"
        },
        {
          "name": "Story Highlight Cover",
          "dimensions": "1080 × 1920 px",
          "aspectRatio": "9:16",
          "formats": ["JPG", "PNG"],
          "notes": "Only the centre circle is visible on the profile"
        }
      ]
    },
    {
      "category": "ads",
      "label": "Ad Specs",
      "priority": 5,
      "items": [
        {
          "name": "Feed Single Image Ad",
          "dimensions": "1080 × 1080 px (square) or 1080 × 1350 px (portrait)",
          "formats": ["JPG", "PNG"],
          "maxFileSize": "30 MB"
        },
        {
          "name": "Carousel Ad",
          "dimensions": "1080 × 1080 px per card",
          "notes": "2–10 cards per carousel"
        },
        {
          "name": "Stories Ad",
          "dimensions": "1080 × 1920 px",
          "formats": ["JPG", "PNG", "MP4"]
        },
        {
          "name": "Reels Ad",
          "dimensions": "1080 × 1920 px",
          "duration": "Up to 30 seconds",
          "formats": ["MP4"]
        },
        {
          "name": "Ad Primary Text",
          "limit": "125",
          "unit": "characters"
        },
        {
          "name": "Ad Headline",
          "limit": "40",
          "unit": "characters"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Rebuild and commit**

```powershell
node build.js
git add data/instagram.json public/instagram/
git commit -m "data: add Instagram spec data"
```

---

## Task 8: YouTube JSON

**Files:**
- Create: `data/youtube.json`

- [ ] **Step 1: Create data/youtube.json**

```json
{
  "name": "YouTube",
  "slug": "youtube",
  "color": "#FF0000",
  "description": "Specs and technical requirements for all YouTube content formats.",
  "lastUpdated": "2026-05-03",
  "sources": [
    { "label": "YouTube Creator Academy", "url": "https://support.google.com/youtube/answer/4603579" },
    { "label": "YouTube Help — Upload Videos", "url": "https://support.google.com/youtube/answer/1722171" }
  ],
  "specs": [
    {
      "category": "images",
      "label": "Image Specs",
      "priority": 1,
      "items": [
        {
          "name": "Video Thumbnail",
          "dimensions": "1280 × 720 px",
          "aspectRatio": "16:9",
          "maxFileSize": "2 MB",
          "formats": ["JPG", "PNG", "GIF", "BMP"],
          "notes": "Minimum width 640 px; 16:9 is the most common aspect ratio on YouTube"
        },
        {
          "name": "Channel Art (Banner)",
          "dimensions": "2560 × 1440 px",
          "displayedAs": "Safe area: 1546 × 423 px",
          "maxFileSize": "6 MB",
          "formats": ["JPG", "PNG", "GIF", "BMP"],
          "notes": "Design within the 1546×423 safe area — it's visible on all devices"
        }
      ]
    },
    {
      "category": "video",
      "label": "Video Specs",
      "priority": 2,
      "items": [
        {
          "name": "Standard Upload",
          "resolution": "1920 × 1080 px recommended (1080p)",
          "maxFileSize": "256 GB or 12 hours (whichever is less)",
          "formats": ["MP4", "MOV", "AVI", "WMV", "FLV", "MKV", "WEBM"],
          "notes": "H.264 + AAC audio recommended for best compatibility"
        },
        {
          "name": "YouTube Shorts",
          "resolution": "1080 × 1920 px",
          "aspectRatio": "9:16",
          "duration": "Up to 3 minutes",
          "formats": ["MP4", "MOV"],
          "notes": "Vertical format required; keep text within the safe zone to avoid UI overlap"
        }
      ]
    },
    {
      "category": "text",
      "label": "Text & Character Limits",
      "priority": 3,
      "items": [
        {
          "name": "Video Title",
          "limit": "100",
          "unit": "characters",
          "notes": "Titles are truncated in search results at around 70 characters"
        },
        {
          "name": "Video Description",
          "limit": "5,000",
          "unit": "characters",
          "notes": "Only the first 2–3 lines are shown without expanding"
        },
        {
          "name": "Tags",
          "limit": "500",
          "unit": "characters total across all tags"
        },
        {
          "name": "Channel Description",
          "limit": "1,000",
          "unit": "characters"
        },
        {
          "name": "Channel Name",
          "limit": "100",
          "unit": "characters"
        },
        {
          "name": "Comment",
          "limit": "10,000",
          "unit": "characters"
        },
        {
          "name": "Playlist Title",
          "limit": "150",
          "unit": "characters"
        }
      ]
    },
    {
      "category": "profile",
      "label": "Profile & Cover Assets",
      "priority": 4,
      "items": [
        {
          "name": "Channel Icon",
          "dimensions": "800 × 800 px",
          "displayedAs": "98 × 98 px on channel page",
          "formats": ["JPG", "PNG", "GIF", "BMP"],
          "notes": "Displayed as a circle; upload at 800×800 for best quality"
        },
        {
          "name": "Channel Art / Banner",
          "dimensions": "2560 × 1440 px",
          "displayedAs": "Safe area 1546 × 423 px",
          "maxFileSize": "6 MB",
          "formats": ["JPG", "PNG"]
        }
      ]
    },
    {
      "category": "ads",
      "label": "Ad Specs",
      "priority": 5,
      "items": [
        {
          "name": "Skippable In-Stream Ad",
          "resolution": "1920 × 1080 px recommended",
          "duration": "Minimum 12 seconds; skippable after 5 seconds",
          "formats": ["MP4", "MOV", "AVI"]
        },
        {
          "name": "Non-Skippable In-Stream Ad",
          "resolution": "1920 × 1080 px",
          "duration": "15–20 seconds",
          "formats": ["MP4", "MOV"]
        },
        {
          "name": "Bumper Ad",
          "resolution": "1920 × 1080 px",
          "duration": "Maximum 6 seconds",
          "formats": ["MP4", "MOV"],
          "notes": "Non-skippable"
        },
        {
          "name": "Display Ad",
          "dimensions": "300 × 250 px",
          "formats": ["JPG", "PNG", "GIF"]
        },
        {
          "name": "Companion Banner",
          "dimensions": "300 × 60 px",
          "formats": ["JPG", "PNG", "GIF"]
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Rebuild and commit**

```powershell
node build.js
git add data/youtube.json public/youtube/
git commit -m "data: add YouTube spec data"
```

---

## Task 9: TikTok JSON

**Files:**
- Create: `data/tiktok.json`

- [ ] **Step 1: Create data/tiktok.json**

```json
{
  "name": "TikTok",
  "slug": "tiktok",
  "color": "#010101",
  "description": "Specs and technical requirements for all TikTok content formats.",
  "lastUpdated": "2026-05-03",
  "sources": [
    { "label": "TikTok Help Center", "url": "https://support.tiktok.com/en/using-tiktok/creating-videos" },
    { "label": "TikTok Ads Specs", "url": "https://ads.tiktok.com/help/article/tiktok-ad-specs-placements" }
  ],
  "specs": [
    {
      "category": "images",
      "label": "Image Specs",
      "priority": 1,
      "items": [
        {
          "name": "Photo Post (Vertical)",
          "dimensions": "1080 × 1920 px",
          "aspectRatio": "9:16",
          "formats": ["JPG", "PNG", "WEBP"]
        },
        {
          "name": "Photo Post (Square)",
          "dimensions": "1080 × 1080 px",
          "aspectRatio": "1:1",
          "formats": ["JPG", "PNG", "WEBP"]
        }
      ]
    },
    {
      "category": "video",
      "label": "Video Specs",
      "priority": 2,
      "items": [
        {
          "name": "Feed Video",
          "resolution": "1080 × 1920 px",
          "aspectRatio": "9:16 recommended",
          "duration": "15 seconds – 10 minutes",
          "maxFileSize": "287.6 MB",
          "formats": ["MP4", "MOV", "AVI", "WEBM"],
          "notes": "H.264 or H.265 codec; vertical (9:16) performs best in the feed"
        },
        {
          "name": "Story",
          "resolution": "1080 × 1920 px",
          "aspectRatio": "9:16",
          "duration": "Up to 15 seconds",
          "formats": ["MP4", "MOV"]
        }
      ]
    },
    {
      "category": "text",
      "label": "Text & Character Limits",
      "priority": 3,
      "items": [
        {
          "name": "Video Caption",
          "limit": "2,200",
          "unit": "characters",
          "notes": "First ~300 characters visible before 'more' is shown"
        },
        {
          "name": "Bio",
          "limit": "80",
          "unit": "characters"
        },
        {
          "name": "Username",
          "limit": "24",
          "unit": "characters"
        },
        {
          "name": "Comment",
          "limit": "150",
          "unit": "characters"
        }
      ]
    },
    {
      "category": "profile",
      "label": "Profile & Cover Assets",
      "priority": 4,
      "items": [
        {
          "name": "Profile Photo",
          "dimensions": "200 × 200 px",
          "formats": ["JPG", "PNG"],
          "notes": "Displayed as a circle"
        },
        {
          "name": "Profile Video",
          "resolution": "1080 × 1920 px",
          "duration": "3–60 seconds",
          "formats": ["MP4"],
          "notes": "Looping video shown on your profile instead of a static photo"
        }
      ]
    },
    {
      "category": "ads",
      "label": "Ad Specs",
      "priority": 5,
      "items": [
        {
          "name": "In-Feed Ad",
          "resolution": "1080 × 1920 px",
          "aspectRatio": "9:16",
          "duration": "5–60 seconds",
          "formats": ["MP4", "MOV", "AVI", "WEBM"],
          "notes": "Appears in the For You feed; 9–15 seconds recommended"
        },
        {
          "name": "TopView Ad",
          "resolution": "1080 × 1920 px",
          "duration": "5–60 seconds",
          "formats": ["MP4", "MOV"],
          "notes": "First ad shown when app is opened"
        },
        {
          "name": "Brand Takeover",
          "resolution": "1080 × 1920 px",
          "duration": "3–5 seconds (video) or static image",
          "formats": ["MP4", "JPG"],
          "notes": "Full-screen; exclusive one advertiser per day per category"
        },
        {
          "name": "Ad Display Name",
          "limit": "25",
          "unit": "characters"
        },
        {
          "name": "Ad Description",
          "limit": "100",
          "unit": "characters"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Rebuild and commit**

```powershell
node build.js
git add data/tiktok.json public/tiktok/
git commit -m "data: add TikTok spec data"
```

---

## Task 10: LinkedIn JSON

**Files:**
- Create: `data/linkedin.json`

- [ ] **Step 1: Create data/linkedin.json**

```json
{
  "name": "LinkedIn",
  "slug": "linkedin",
  "color": "#0A66C2",
  "description": "Specs and technical requirements for all LinkedIn content formats.",
  "lastUpdated": "2026-05-03",
  "sources": [
    { "label": "LinkedIn Help — Image Posts", "url": "https://www.linkedin.com/help/linkedin/answer/a521928" },
    { "label": "LinkedIn Marketing Solutions", "url": "https://business.linkedin.com/marketing-solutions/ad-specs" }
  ],
  "specs": [
    {
      "category": "images",
      "label": "Image Specs",
      "priority": 1,
      "items": [
        {
          "name": "Post Image",
          "dimensions": "1200 × 627 px",
          "aspectRatio": "1.91:1",
          "maxFileSize": "5 MB",
          "formats": ["JPG", "PNG"],
          "notes": "Recommended for link shares and updates"
        },
        {
          "name": "Article Cover",
          "dimensions": "744 × 400 px",
          "maxFileSize": "5 MB",
          "formats": ["JPG", "PNG"]
        },
        {
          "name": "Company Logo",
          "dimensions": "300 × 300 px",
          "maxFileSize": "4 MB",
          "formats": ["JPG", "PNG"],
          "notes": "Square format required"
        },
        {
          "name": "Company Cover / Banner",
          "dimensions": "1128 × 191 px",
          "maxFileSize": "4 MB",
          "formats": ["JPG", "PNG"]
        }
      ]
    },
    {
      "category": "video",
      "label": "Video Specs",
      "priority": 2,
      "items": [
        {
          "name": "Post Video",
          "resolution": "1920 × 1080 px recommended",
          "duration": "3 seconds – 10 minutes",
          "maxFileSize": "5 GB",
          "formats": ["MP4"],
          "notes": "H.264, AAC audio; aspect ratios 1:2.4 to 2.4:1 supported"
        }
      ]
    },
    {
      "category": "text",
      "label": "Text & Character Limits",
      "priority": 3,
      "items": [
        {
          "name": "Post",
          "limit": "3,000",
          "unit": "characters"
        },
        {
          "name": "Article Body",
          "limit": "110,000",
          "unit": "characters"
        },
        {
          "name": "Article Title",
          "limit": "100",
          "unit": "characters"
        },
        {
          "name": "Profile Headline",
          "limit": "220",
          "unit": "characters"
        },
        {
          "name": "Profile Summary / About",
          "limit": "2,000",
          "unit": "characters"
        },
        {
          "name": "Comment",
          "limit": "1,250",
          "unit": "characters"
        },
        {
          "name": "Direct Message",
          "limit": "8,000",
          "unit": "characters"
        }
      ]
    },
    {
      "category": "profile",
      "label": "Profile & Cover Assets",
      "priority": 4,
      "items": [
        {
          "name": "Profile Photo",
          "dimensions": "400 × 400 px recommended",
          "maxFileSize": "8 MB",
          "formats": ["JPG", "PNG"],
          "notes": "Minimum 200×200 px; displayed as a circle"
        },
        {
          "name": "Background / Banner",
          "dimensions": "1584 × 396 px",
          "maxFileSize": "8 MB",
          "formats": ["JPG", "PNG"]
        },
        {
          "name": "Company Logo",
          "dimensions": "300 × 300 px",
          "maxFileSize": "4 MB",
          "formats": ["JPG", "PNG"]
        },
        {
          "name": "Company Banner",
          "dimensions": "1128 × 191 px",
          "maxFileSize": "4 MB",
          "formats": ["JPG", "PNG"]
        }
      ]
    },
    {
      "category": "ads",
      "label": "Ad Specs",
      "priority": 5,
      "items": [
        {
          "name": "Single Image Ad",
          "dimensions": "1200 × 627 px",
          "formats": ["JPG", "PNG"],
          "maxFileSize": "5 MB"
        },
        {
          "name": "Carousel Ad",
          "dimensions": "1080 × 1080 px per card",
          "notes": "2–10 cards per carousel; square format required"
        },
        {
          "name": "Video Ad",
          "resolution": "1920 × 1080 px or 1080 × 1080 px",
          "maxFileSize": "200 MB",
          "formats": ["MP4"]
        },
        {
          "name": "Ad Headline",
          "limit": "70",
          "unit": "characters"
        },
        {
          "name": "Ad Intro Text",
          "limit": "150",
          "unit": "characters"
        },
        {
          "name": "Ad Description",
          "limit": "70",
          "unit": "characters"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Rebuild and commit**

```powershell
node build.js
git add data/linkedin.json public/linkedin/
git commit -m "data: add LinkedIn spec data"
```

---

## Task 11: X (Twitter) JSON

**Files:**
- Create: `data/x.json`

- [ ] **Step 1: Create data/x.json**

```json
{
  "name": "X (Twitter)",
  "slug": "x",
  "color": "#000000",
  "description": "Specs and technical requirements for all X (formerly Twitter) content formats.",
  "lastUpdated": "2026-05-03",
  "sources": [
    { "label": "X Help Center — Media", "url": "https://help.twitter.com/en/using-x/how-to-tweet#types-of-tweets" },
    { "label": "X Ads Specifications", "url": "https://business.twitter.com/en/help/campaign-setup/advertiser-card-specifications.html" }
  ],
  "specs": [
    {
      "category": "images",
      "label": "Image Specs",
      "priority": 1,
      "items": [
        {
          "name": "Tweet Image",
          "dimensions": "1600 × 900 px recommended",
          "displayedAs": "Cropped to ~600 × 335 px in feed",
          "maxFileSize": "5 MB (JPG/PNG) or 15 MB (GIF)",
          "formats": ["JPG", "PNG", "GIF", "WEBP"],
          "notes": "Up to 4 images per tweet"
        },
        {
          "name": "Header / Banner",
          "dimensions": "1500 × 500 px",
          "maxFileSize": "5 MB",
          "formats": ["JPG", "PNG", "GIF"]
        },
        {
          "name": "Summary Card (Large Image)",
          "dimensions": "800 × 418 px minimum",
          "aspectRatio": "2:1",
          "formats": ["JPG", "PNG", "GIF", "WEBP"]
        }
      ]
    },
    {
      "category": "video",
      "label": "Video Specs",
      "priority": 2,
      "items": [
        {
          "name": "Tweet Video",
          "resolution": "1280 × 720 px maximum",
          "duration": "Up to 2 minutes 20 seconds",
          "maxFileSize": "512 MB",
          "formats": ["MP4", "MOV"],
          "notes": "H.264, AAC audio; 30fps or 60fps"
        },
        {
          "name": "GIF",
          "maxFileSize": "15 MB",
          "formats": ["GIF"],
          "notes": "Converted to MP4 for playback; looping"
        }
      ]
    },
    {
      "category": "text",
      "label": "Text & Character Limits",
      "priority": 3,
      "items": [
        {
          "name": "Tweet",
          "limit": "280",
          "unit": "characters",
          "notes": "URLs always count as 23 characters regardless of actual length"
        },
        {
          "name": "Bio",
          "limit": "160",
          "unit": "characters"
        },
        {
          "name": "Display Name",
          "limit": "50",
          "unit": "characters"
        },
        {
          "name": "Username / Handle",
          "limit": "15",
          "unit": "characters"
        },
        {
          "name": "Direct Message",
          "limit": "10,000",
          "unit": "characters"
        }
      ]
    },
    {
      "category": "profile",
      "label": "Profile & Cover Assets",
      "priority": 4,
      "items": [
        {
          "name": "Profile Photo",
          "dimensions": "400 × 400 px",
          "displayedAs": "200 × 200 px on profile",
          "maxFileSize": "2 MB",
          "formats": ["JPG", "PNG", "GIF"],
          "notes": "Displayed as a circle"
        },
        {
          "name": "Header / Banner",
          "dimensions": "1500 × 500 px",
          "maxFileSize": "5 MB",
          "formats": ["JPG", "PNG", "GIF"]
        }
      ]
    },
    {
      "category": "ads",
      "label": "Ad Specs",
      "priority": 5,
      "items": [
        {
          "name": "Promoted Post Image",
          "dimensions": "1600 × 900 px recommended",
          "formats": ["JPG", "PNG"],
          "maxFileSize": "5 MB"
        },
        {
          "name": "Website Card Image",
          "dimensions": "800 × 418 px or 800 × 800 px",
          "formats": ["JPG", "PNG"]
        },
        {
          "name": "Video Ad",
          "resolution": "1280 × 720 px",
          "duration": "15–30 seconds recommended",
          "formats": ["MP4", "MOV"]
        },
        {
          "name": "Carousel Ad",
          "dimensions": "800 × 800 px per card",
          "notes": "2–6 cards per carousel"
        },
        {
          "name": "Ad Headline",
          "limit": "70",
          "unit": "characters"
        },
        {
          "name": "Ad Body Copy",
          "limit": "280",
          "unit": "characters"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Rebuild and commit**

```powershell
node build.js
git add data/x.json public/x/
git commit -m "data: add X (Twitter) spec data"
```

---

## Task 12: Run full test suite

All 6 platforms now have JSON files. The full test suite should pass.

- [ ] **Step 1: Run tests**

```powershell
node --test tests/build.test.js
```

Expected: all 8 tests **PASS**.

```
▶ build runs without error
  ✔ build runs without error (...)
▶ facebook page exists
  ✔ facebook page exists (...)
...
▶ sitemap.xml contains all platform URLs
  ✔ sitemap.xml contains all platform URLs (...)
ℹ tests 8
ℹ pass 8
ℹ fail 0
```

If any test fails, check:
- The JSON file for the failing platform exists in `/data/`
- `node build.js` ran without errors after adding that JSON
- The generated `public/` files exist

- [ ] **Step 2: Open a generated page in a browser to visually verify**

Open `public/facebook/index.html` in a browser (double-click or use a local server). Verify:
- Platform name appears in the hero
- At least 3 spec sections are visible
- Quick stats line appears under the description
- Sidebar shows "Other Platforms" links

- [ ] **Step 3: Commit test results**

```powershell
git add public/
git commit -m "chore: rebuild public with all 6 platforms"
```

---

## Task 13: Source change-detection script

**Files:**
- Create: `scripts/check-sources.js`

Fetches each URL in every platform's `sources` array, compares against a stored hash, and reports changes.

- [ ] **Step 1: Create scripts/check-sources.js**

```javascript
// scripts/check-sources.js
'use strict';

const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const DATA_DIR   = path.join(__dirname, '..', 'data');
const HASHES_FILE = path.join(__dirname, '.source-hashes.json');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'AllPlatforms.io/1.0 spec-checker' } }, res => {
      // Follow one redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(fetchUrl(res.headers.location));
        return;
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

async function main() {
  const stored = fs.existsSync(HASHES_FILE)
    ? JSON.parse(fs.readFileSync(HASHES_FILE, 'utf8'))
    : {};

  const updated = { ...stored };
  const results = [];

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const platform = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
    for (const source of platform.sources) {
      const key = `${platform.slug}::${source.url}`;
      process.stdout.write(`  Checking ${platform.name} — ${source.label} ... `);
      try {
        const content = await fetchUrl(source.url);
        const current = hashContent(content);
        const prev    = stored[key];
        updated[key]  = current;
        const status  = !prev ? 'NEW' : prev !== current ? 'CHANGED' : 'OK';
        results.push({ status, platform: platform.name, label: source.label, url: source.url });
        console.log(status);
      } catch (err) {
        results.push({ status: 'ERROR', platform: platform.name, label: source.label, error: err.message });
        console.log(`ERROR (${err.message})`);
      }
    }
  }

  fs.writeFileSync(HASHES_FILE, JSON.stringify(updated, null, 2));

  console.log('\n--- Source Check Report ---');
  const icons = { CHANGED: '⚠️ ', ERROR: '❌', NEW: '🆕', OK: '✅' };
  for (const r of results) {
    console.log(`${icons[r.status]} [${r.status.padEnd(7)}] ${r.platform} — ${r.label}`);
    if (r.status === 'CHANGED') console.log(`            → Review: ${r.url}`);
    if (r.status === 'ERROR')   console.log(`            → ${r.error}`);
  }

  const changed = results.filter(r => r.status === 'CHANGED');
  console.log('');
  if (changed.length > 0) {
    console.log(`⚠️  ${changed.length} source(s) changed — update the relevant JSON files and rebuild`);
    process.exit(1);
  } else {
    console.log('✅ All sources unchanged');
  }
}

main();
```

- [ ] **Step 2: Verify .gitignore excludes the hash file**

Confirm `scripts/.source-hashes.json` is in `.gitignore`. It was added in Task 1 — double-check:

```powershell
Select-String "source-hashes" .gitignore
```

Expected: one match on the `scripts/.source-hashes.json` line.

- [ ] **Step 3: Commit**

```powershell
git add scripts/check-sources.js
git commit -m "feat: add source change-detection script"
```

---

## Task 14: Final verification and commit

- [ ] **Step 1: Run the full build from scratch**

```powershell
Remove-Item -Recurse -Force public\
node build.js
```

Expected: all 7 files/directories recreated, no errors.

- [ ] **Step 2: Run the full test suite**

```powershell
node --test tests/build.test.js
```

Expected: 8/8 tests pass.

- [ ] **Step 3: Check file count**

```powershell
Get-ChildItem public\ -Recurse -File | Measure-Object | Select-Object Count
```

Expected: 10 files (6 platform `index.html`, 1 homepage `index.html`, `sitemap.xml`, `robots.txt`, no extras).

- [ ] **Step 4: Verify sitemap content**

```powershell
Get-Content public\sitemap.xml
```

Expected: contains 7 `<url>` entries (homepage + 6 platforms), each with `<loc>` pointing to `https://allplatforms.io/...`.

- [ ] **Step 5: Stage and commit generated output**

```powershell
git add public/
git commit -m "chore: final generated output for all 6 platforms"
```

- [ ] **Step 6: Confirm project structure**

```powershell
Get-ChildItem -Recurse -Depth 2 | Where-Object { -not $_.FullName.Contains('.git') } | Select-Object FullName
```

Expected structure:
```
allplatforms.io/
├── build.js
├── package.json
├── .gitignore
├── data/
│   ├── facebook.json
│   ├── instagram.json
│   ├── youtube.json
│   ├── tiktok.json
│   ├── linkedin.json
│   └── x.json
├── src/
│   ├── template-platform.html
│   └── template-index.html
├── tests/
│   └── build.test.js
├── scripts/
│   └── check-sources.js
├── docs/
│   └── superpowers/
└── public/
    ├── index.html
    ├── sitemap.xml
    ├── robots.txt
    ├── facebook/index.html
    ├── instagram/index.html
    ├── youtube/index.html
    ├── tiktok/index.html
    ├── linkedin/index.html
    └── x/index.html
```

---

## Daily update workflow (reference)

After initial build, keeping the site current takes 3 steps:

1. **Detect changes** — `npm run check-sources` (reports which official spec pages changed)
2. **Update data** — edit the relevant `data/<platform>.json` and update `lastUpdated`
3. **Rebuild** — `npm run build`, then `git add public/ data/ && git commit -m "data: update <platform> specs"`

Later, when deploying to Cloudflare Pages: push to GitHub — Cloudflare runs `node build.js` automatically on every push.
