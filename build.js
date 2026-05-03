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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSpecItem(item) {
  const rows = [];
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    if (key === 'limit') {
      if (item.limit !== undefined) {
        const val = item.unit ? `${escapeHtml(item.limit)} ${escapeHtml(item.unit)}` : escapeHtml(item.limit);
        rows.push(row(label, val));
      }
      continue;
    }
    if (item[key] === undefined) continue;
    const val = Array.isArray(item[key]) ? item[key].map(escapeHtml).join(', ') : escapeHtml(item[key]);
    rows.push(row(label, val));
  }

  return `<div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
  <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-3">${escapeHtml(item.name)}</h3>
  <table class="w-full"><tbody class="divide-y divide-gray-100 dark:divide-gray-700">${rows.join('')}</tbody></table>
</div>`;
}

function row(label, value) {
  return `<tr><th class="text-left py-1.5 pr-4 text-gray-400 dark:text-gray-500 font-normal whitespace-nowrap text-sm">${label}</th><td class="py-1.5 font-mono text-gray-800 dark:text-gray-200 text-sm">${value}</td></tr>`;
}

function renderSection(section, platformColor, insertAdAfter) {
  const items = section.items.map(renderSpecItem).join('\n');
  const ad = insertAdAfter
    ? `\n<div class="ad-slot my-6 h-28 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs" data-ad-format="mid-content">[Ad]</div>`
    : '';

  return `<section id="${section.category}" class="mb-10">
  <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
    <span class="w-1 h-6 rounded flex-shrink-0" style="background-color: ${platformColor}"></span>
    <span style="color: ${platformColor}">${escapeHtml(section.label)}</span>
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
      if (!item) return `<span>${escapeHtml(section.label)}</span>`;
      if (item.dimensions) return `<span><strong>${escapeHtml(item.name)}:</strong> ${escapeHtml(item.dimensions)}</span>`;
      if (item.limit)      return `<span><strong>${escapeHtml(item.name)}:</strong> ${escapeHtml(item.limit)}${item.unit ? ' ' + escapeHtml(item.unit) : ''}</span>`;
      if (item.duration)   return `<span><strong>${escapeHtml(item.name)}:</strong> ${escapeHtml(item.duration)}</span>`;
      return `<span>${escapeHtml(item.name)}</span>`;
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
    .map(p => `<a href="/${p.slug}" class="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: ${p.color}"></span>${escapeHtml(p.name)}</a>`)
    .join('');
}

function buildSources(sources) {
  return sources
    .map(s => {
      const safeUrl = /^https?:\/\//.test(s.url) ? s.url : '#';
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">${escapeHtml(s.label)} ↗</a>`;
    })
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

  const quickStats      = buildQuickStats(platform.specs);
  const navLinks        = buildNavLinks(allPlatforms, platform.slug);
  const otherPlatforms  = buildOtherPlatforms(allPlatforms, platform.slug);
  const sources         = buildSources(platform.sources);

  return template
    .replace(/\{\{META_TITLE\}\}/g,          () => metaTitle)
    .replace(/\{\{META_DESCRIPTION\}\}/g,    () => metaDesc)
    .replace(/\{\{CANONICAL_URL\}\}/g,       () => canonical)
    .replace(/\{\{JSON_LD\}\}/g,             () => jsonLd)
    .replace(/\{\{PLATFORM_NAME\}\}/g,       () => platform.name)
    .replace(/\{\{PLATFORM_COLOR\}\}/g,      () => platform.color)
    .replace(/\{\{PLATFORM_DESCRIPTION\}\}/g, () => platform.description)
    .replace(/\{\{QUICK_STATS\}\}/g,         () => quickStats)
    .replace(/\{\{NAV_LINKS\}\}/g,           () => navLinks)
    .replace(/\{\{SPEC_SECTIONS\}\}/g,       () => specSections)
    .replace(/\{\{OTHER_PLATFORMS\}\}/g,     () => otherPlatforms)
    .replace(/\{\{SOURCES\}\}/g,             () => sources)
    .replace(/\{\{LAST_UPDATED\}\}/g,        () => platform.lastUpdated);
}

function buildHomePage(allPlatforms, template) {
  const cards = allPlatforms.map(p => {
    const sorted = [...p.specs].sort((a, b) => a.priority - b.priority);
    const teasers = sorted.slice(0, 3).map(section => {
      const item = section.items[0];
      if (!item) return escapeHtml(section.label);
      if (item.dimensions) return `${escapeHtml(section.label)}: ${escapeHtml(item.dimensions)}`;
      if (item.limit)      return `${escapeHtml(section.label)}: ${escapeHtml(item.limit)}${item.unit ? ' ' + escapeHtml(item.unit) : ''}`;
      if (item.duration)   return `${escapeHtml(section.label)}: ${escapeHtml(item.duration)}`;
      return escapeHtml(section.label);
    });

    return `<a href="/${p.slug}" class="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all group" data-platform="${p.slug}">
  <div class="flex items-center gap-3 mb-3">
    <div class="w-1 h-10 rounded flex-shrink-0" style="background-color: ${p.color}"></div>
    <h2 class="font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${escapeHtml(p.name)}</h2>
  </div>
  <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">${escapeHtml(p.description)}</p>
  <ul class="text-xs text-gray-400 dark:text-gray-500 space-y-0.5">${teasers.map(t => `<li>→ ${t}</li>`).join('')}</ul>
</a>`;
  }).join('\n');

  const metaTitle = 'Social Media Specs & Size Guide 2026 | AllPlatforms.io';
  const metaDesc  = 'Complete specs for Facebook, Instagram, YouTube, TikTok, LinkedIn, and X. Image sizes, video requirements, character limits, and ad specs — all in one place.';
  const platformCount = String(allPlatforms.length);

  return template
    .replace(/\{\{META_TITLE\}\}/g,       () => metaTitle)
    .replace(/\{\{META_DESCRIPTION\}\}/g, () => metaDesc)
    .replace(/\{\{PLATFORM_CARDS\}\}/g,   () => cards)
    .replace(/\{\{PLATFORM_COUNT\}\}/g,   () => platformCount);
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
    if (!/^[a-z0-9-]+$/.test(platform.slug)) {
      throw new Error(`Invalid slug in ${platform.slug}.json: slugs must match [a-z0-9-]`);
    }
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

try {
  main();
} catch (err) {
  console.error('Build failed:', err.message);
  process.exit(1);
}
