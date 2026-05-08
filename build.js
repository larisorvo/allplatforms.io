// build.js
'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR     = path.join(__dirname, 'data');
const SRC_DIR      = path.join(__dirname, 'src');
const ARTICLES_DIR = path.join(SRC_DIR, 'articles');
const PUBLIC_DIR   = path.join(__dirname, 'public');
const LOGOS_DIR    = path.join(PUBLIC_DIR, 'logos');
const BASE_URL     = 'https://allplatforms.io';

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

// Popularity rank, marketer rank, launch year, and platform type for every slug.
// Popularity ≈ global MAU; marketingRank ≈ paid/organic marketer usage.
const PLATFORM_META = {
  facebook:  { popularity: 1,  marketingRank: 1,  launchYear: 2004, type: 'Social' },
  youtube:   { popularity: 2,  marketingRank: 3,  launchYear: 2005, type: 'Video' },
  whatsapp:  { popularity: 3,  marketingRank: 11, launchYear: 2009, type: 'Messaging' },
  instagram: { popularity: 4,  marketingRank: 2,  launchYear: 2010, type: 'Social' },
  tiktok:    { popularity: 5,  marketingRank: 4,  launchYear: 2018, type: 'Short-form Video' },
  wechat:    { popularity: 6,  marketingRank: 20, launchYear: 2011, type: 'Messaging' },
  messenger: { popularity: 7,  marketingRank: 12, launchYear: 2011, type: 'Messaging' },
  telegram:  { popularity: 8,  marketingRank: 13, launchYear: 2013, type: 'Messaging' },
  snapchat:  { popularity: 9,  marketingRank: 8,  launchYear: 2011, type: 'Short-form Video' },
  x:         { popularity: 10, marketingRank: 6,  launchYear: 2006, type: 'Social' },
  pinterest: { popularity: 11, marketingRank: 7,  launchYear: 2010, type: 'Image' },
  linkedin:  { popularity: 12, marketingRank: 5,  launchYear: 2003, type: 'Professional' },
  reddit:    { popularity: 13, marketingRank: 10, launchYear: 2005, type: 'Forums' },
  spotify:   { popularity: 14, marketingRank: 31, launchYear: 2008, type: 'Audio' },
  discord:   { popularity: 15, marketingRank: 14, launchYear: 2015, type: 'Social' },
  line:      { popularity: 16, marketingRank: 29, launchYear: 2011, type: 'Messaging' },
  twitch:    { popularity: 17, marketingRank: 15, launchYear: 2011, type: 'Streaming' },
  threads:   { popularity: 18, marketingRank: 9,  launchYear: 2023, type: 'Social' },
  tumblr:    { popularity: 19, marketingRank: 25, launchYear: 2007, type: 'Social' },
  medium:    { popularity: 20, marketingRank: 22, launchYear: 2012, type: 'Publishing' },
  mastodon:  { popularity: 21, marketingRank: 18, launchYear: 2016, type: 'Social' },
  behance:   { popularity: 22, marketingRank: 24, launchYear: 2006, type: 'Professional' },
  signal:    { popularity: 23, marketingRank: 30, launchYear: 2014, type: 'Messaging' },
  rumble:    { popularity: 24, marketingRank: 28, launchYear: 2013, type: 'Video' },
  bereal:    { popularity: 25, marketingRank: 17, launchYear: 2020, type: 'Social' },
  bluesky:   { popularity: 26, marketingRank: 19, launchYear: 2023, type: 'Social' },
  kick:      { popularity: 27, marketingRank: 27, launchYear: 2022, type: 'Streaming' },
  lemon8:    { popularity: 28, marketingRank: 16, launchYear: 2020, type: 'Image' },
  substack:  { popularity: 29, marketingRank: 23, launchYear: 2017, type: 'Publishing' },
  patreon:   { popularity: 30, marketingRank: 21, launchYear: 2013, type: 'Creator' },
  vimeo:     { popularity: 31, marketingRank: 26, launchYear: 2004, type: 'Video' },
  clubhouse:   { popularity: 32, marketingRank: 32, launchYear: 2020, type: 'Audio' },
  dribbble:    { popularity: 33, marketingRank: 33, launchYear: 2009, type: 'Professional' },
  soundcloud:  { popularity: 34, marketingRank: 34, launchYear: 2007, type: 'Audio' },
  quora:       { popularity: 35, marketingRank: 35, launchYear: 2009, type: 'Forums' },
  viber:       { popularity: 36, marketingRank: 36, launchYear: 2010, type: 'Messaging' },
  dailymotion: { popularity: 37, marketingRank: 37, launchYear: 2005, type: 'Video' },
  flickr:      { popularity: 38, marketingRank: 38, launchYear: 2004, type: 'Image' },
  '500px':     { popularity: 39, marketingRank: 39, launchYear: 2009, type: 'Image' },
  bandcamp:    { popularity: 40, marketingRank: 40, launchYear: 2008, type: 'Audio' },
  kakaotalk:   { popularity: 41, marketingRank: 41, launchYear: 2010, type: 'Messaging' },
  nextdoor:    { popularity: 42, marketingRank: 42, launchYear: 2011, type: 'Social' },
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Load all logo SVGs from public/logos/ into a map keyed by slug.
// Returns the inner SVG content (strips outer <svg> tag so we can re-wrap at inject time).
function loadLogos(allPlatforms) {
  const logos = {};
  for (const platform of allPlatforms) {
    const logoPath = path.join(LOGOS_DIR, `${platform.slug}.svg`);
    if (fs.existsSync(logoPath)) {
      logos[platform.slug] = fs.readFileSync(logoPath, 'utf8').trim();
    } else {
      console.warn(`  ⚠ No logo found for ${platform.slug} (${logoPath})`);
      logos[platform.slug] = '';
    }
  }
  return logos;
}

// Re-wrap a stored SVG string with specific dimensions.
function injectLogo(svgString, width, height) {
  if (!svgString) return '';
  // Extract inner content and viewBox from stored SVG
  const viewBoxMatch = svgString.match(/viewBox="([^"]*)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
  const inner = svgString
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '')
    .trim();
  return `<svg width="${width}" height="${height}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

// Build the colored badge wrapper + logo SVG at a given size.
// Adds a subtle inner ring so near-black badges remain visible against dark page surfaces.
function buildLogoBadge(platform, logos, size, iconSize, radius) {
  const logo = injectLogo(logos[platform.slug] || '', iconSize, iconSize);
  return `<div style="width:${size}px;height:${size}px;border-radius:${radius}px;background:${platform.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.15);">${logo}</div>`;
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
        ? 'px-3 py-1.5 rounded text-sm bg-indigo-100 dark:bg-indigo-600 text-indigo-700 dark:text-white'
        : 'px-3 py-1.5 rounded text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors';
      return `<a href="/${p.slug}" class="${cls}">${escapeHtml(p.name)}</a>`;
    })
    .join('');
}

function buildOtherPlatforms(allPlatforms, currentSlug, logos) {
  return allPlatforms
    .filter(p => p.slug !== currentSlug)
    .map(p => {
      const badge = buildLogoBadge(p, logos, 16, 9, 4);
      return `<a href="/${p.slug}" class="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-700 dark:hover:text-gray-100 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors">${badge}${escapeHtml(p.name)}</a>`;
    })
    .join('');
}

function buildSources(sources) {
  return sources
    .map(s => {
      const safeUrl = /^https?:\/\//.test(s.url) ? s.url : '#';
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline">${escapeHtml(s.label)} ↗</a>`;
    })
    .join('');
}

function buildPlatformPage(platform, template, allPlatforms, logos) {
  const sorted = [...platform.specs].sort((a, b) => a.priority - b.priority);
  const specSections = sorted
    .map((section, i) => renderSection(section, platform.color, i === 0))
    .join('\n');

  const metaTitle = `${platform.name} Specifications & Size Guide | AllPlatforms.io`;
  const metaDesc  = `Complete ${platform.name} technical specifications: image sizes, video requirements, character limits, and ad specs. Last verified ${platform.lastUpdated}.`;
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
  const otherPlatforms  = buildOtherPlatforms(allPlatforms, platform.slug, logos);
  const sources         = buildSources(platform.sources);
  const platformLogo    = buildLogoBadge(platform, logos, 48, 26, 12);

  return template
    .replace(/\{\{META_TITLE\}\}/g,          () => metaTitle)
    .replace(/\{\{META_DESCRIPTION\}\}/g,    () => metaDesc)
    .replace(/\{\{CANONICAL_URL\}\}/g,       () => canonical)
    .replace(/\{\{JSON_LD\}\}/g,             () => jsonLd)
    .replace(/\{\{PLATFORM_NAME\}\}/g,       () => escapeHtml(platform.name))
    .replace(/\{\{PLATFORM_COLOR\}\}/g,      () => platform.color)
    .replace(/\{\{PLATFORM_LOGO\}\}/g,       () => platformLogo)
    .replace(/\{\{PLATFORM_DESCRIPTION\}\}/g, () => escapeHtml(platform.description))
    .replace(/\{\{QUICK_STATS\}\}/g,         () => quickStats)
    .replace(/\{\{NAV_LINKS\}\}/g,           () => navLinks)
    .replace(/\{\{SPEC_SECTIONS\}\}/g,       () => specSections)
    .replace(/\{\{OTHER_PLATFORMS\}\}/g,     () => otherPlatforms)
    .replace(/\{\{SOURCES\}\}/g,             () => sources)
    .replace(/\{\{LAST_UPDATED\}\}/g,        () => platform.lastUpdated);
}

function buildFeaturedArticles(articles) {
  if (!articles || articles.length === 0) return '';
  const featured = articles.slice(0, 3);
  const items = featured.map(a => `<a href="/blog/${a.slug}" class="blog-strip-item">
  <div class="blog-strip-item-top">
    <span class="blog-strip-cat">${escapeHtml(a.category || 'Guide')}</span>
    <span class="blog-strip-read">${escapeHtml(a.readTime || '5 min read')}</span>
  </div>
  <span class="blog-strip-title">${escapeHtml(a.title)}</span>
  <span class="blog-strip-arrow">Read →</span>
</a>`).join('\n');
  return `<div class="blog-strip">
  <div class="blog-strip-header">
    <span class="blog-strip-label">From the blog</span>
    <a href="/blog" class="blog-strip-all">View all articles →</a>
  </div>
  <div class="blog-strip-list">${items}</div>
</div>`;
}

function buildHomePage(allPlatforms, template, logos, articles) {
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

    const iconBadge = buildLogoBadge(p, logos, 36, 20, 8);
    const category  = escapeHtml(p.category || 'Social');
    const meta      = PLATFORM_META[p.slug] || { popularity: 99, marketingRank: 99, launchYear: 2000, type: p.category || 'Social' };
    const metaType  = escapeHtml(meta.type);
    const specCount = p.specs.reduce((sum, s) => sum + s.items.length, 0);

    return `<a href="/${p.slug}" class="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group" data-platform="${p.slug}" data-color="${p.color}" data-category="${category}" data-type="${metaType}" data-name="${escapeHtml(p.name)}" data-popularity="${meta.popularity}" data-marketing-rank="${meta.marketingRank}" data-launch-year="${meta.launchYear}" data-spec-count="${specCount}" data-updated="${escapeHtml(p.lastUpdated)}">
  <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700" style="background:linear-gradient(135deg,${p.color}18,transparent);">
    ${iconBadge}
    <div>
      <div class="font-bold text-sm text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">${escapeHtml(p.name)}</div>
      <div class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide" style="font-size:10px;letter-spacing:0.05em;">${metaType}</div>
    </div>
  </div>
  <div class="p-4">
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">${escapeHtml(p.description)}</p>
    <ul class="text-xs text-gray-400 dark:text-gray-500 space-y-0.5">${teasers.map(t => `<li>→ ${t}</li>`).join('')}</ul>
  </div>
</a>`;
  }).join('\n');

  const metaTitle = 'Social Media Specifications & Size Guide | AllPlatforms.io';
  const metaDesc  = 'Complete technical specifications for every major social platform — image sizes, video requirements, character limits, and ad specs, all in one place. Verified against official documentation.';
  const platformCount = String(allPlatforms.length);

  const featuredArticles = buildFeaturedArticles(articles || []);

  return template
    .replace(/\{\{META_TITLE\}\}/g,         () => metaTitle)
    .replace(/\{\{META_DESCRIPTION\}\}/g,   () => metaDesc)
    .replace(/\{\{PLATFORM_CARDS\}\}/g,     () => cards)
    .replace(/\{\{PLATFORM_COUNT\}\}/g,     () => platformCount)
    .replace(/\{\{FEATURED_ARTICLES\}\}/g,  () => featuredArticles);
}

// ── Article helpers ────────────────────────────────────────────────────────

function slugifyHeading(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function renderArticleBody(sections) {
  return sections.map(s => {
    switch (s.type) {
      case 'paragraph':
        // paragraph content is raw HTML (author-controlled) — not escaped
        return `<p class="ap">${s.content}</p>`;
      case 'h2':
        return `<h2 class="ah2" id="${slugifyHeading(s.content)}">${escapeHtml(s.content)}</h2>`;
      case 'h3':
        return `<h3 class="ah3">${escapeHtml(s.content)}</h3>`;
      case 'table': {
        const ths = s.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('');
        const trs = s.rows.map(r =>
          `<tr>${r.map(c => `<td>${escapeHtml(String(c))}</td>`).join('')}</tr>`
        ).join('');
        const cap = s.caption ? `<caption>${escapeHtml(s.caption)}</caption>` : '';
        return `<div class="atbl-wrap"><table class="atbl">${cap}<thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
      }
      case 'list': {
        const lis = s.items.map(i => `<li>${escapeHtml(i)}</li>`).join('');
        return `<ul class="alist">${lis}</ul>`;
      }
      case 'tip':
        return `<div class="atip"><strong>${escapeHtml(s.label || 'Tip')}</strong>${escapeHtml(s.content)}</div>`;
      default:
        return '';
    }
  }).join('\n');
}

function buildArticleTOC(sections) {
  const h2s = sections.filter(s => s.type === 'h2');
  if (h2s.length < 2) return '';
  const items = h2s.map(s => {
    const id = slugifyHeading(s.content);
    return `<li><a href="#${id}">${escapeHtml(s.content)}</a></li>`;
  }).join('');
  return `<div class="toc"><div class="toc-inner"><p class="toc-label">Contents</p><ol>${items}</ol></div></div>`;
}

function buildRelatedPlatformsWidget(slugs, allPlatforms, logos) {
  if (!slugs || !slugs.length) return '';
  const links = slugs
    .map(slug => allPlatforms.find(p => p.slug === slug))
    .filter(Boolean)
    .map(p => {
      const badge = buildLogoBadge(p, logos, 28, 16, 6);
      return `<a href="/${p.slug}" class="rel-platform">${badge}<span>${escapeHtml(p.name)}</span></a>`;
    })
    .join('');
  return `<div class="related-section"><p class="related-label">Platform specs</p><div class="related-platforms">${links}</div></div>`;
}

function buildArticlePage(article, template, allPlatforms, logos) {
  const canonical = `${BASE_URL}/blog/${article.slug}`;
  const metaTitle = `${article.title} | AllPlatforms.io`;
  const body      = renderArticleBody(article.sections);
  const toc       = buildArticleTOC(article.sections);
  const related   = buildRelatedPlatformsWidget(article.relatedPlatforms || [], allPlatforms, logos);
  const dateDisplay = new Date(article.publishDate + 'T00:00:00Z')
    .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

  const jsonLd = JSON.stringify({
    '@context':     'https://schema.org',
    '@type':        'Article',
    'headline':     article.title,
    'description':  article.description,
    'url':          canonical,
    'datePublished': article.publishDate,
    'dateModified':  article.lastUpdated,
    'author':     { '@type': 'Organization', 'name': 'AllPlatforms.io', 'url': BASE_URL },
    'publisher':  { '@type': 'Organization', 'name': 'AllPlatforms.io', 'url': BASE_URL },
  });

  return template
    .replace(/\{\{META_TITLE\}\}/g,              () => metaTitle)
    .replace(/\{\{META_DESCRIPTION\}\}/g,        () => article.description)
    .replace(/\{\{CANONICAL_URL\}\}/g,           () => canonical)
    .replace(/\{\{JSON_LD\}\}/g,                 () => jsonLd)
    .replace(/\{\{ARTICLE_TITLE\}\}/g,           () => escapeHtml(article.title))
    .replace(/\{\{ARTICLE_DESCRIPTION\}\}/g,     () => escapeHtml(article.description))
    .replace(/\{\{ARTICLE_DATE\}\}/g,            () => article.publishDate)
    .replace(/\{\{ARTICLE_DATE_DISPLAY\}\}/g,    () => dateDisplay)
    .replace(/\{\{ARTICLE_READ_TIME\}\}/g,       () => escapeHtml(article.readTime || '5 min read'))
    .replace(/\{\{ARTICLE_CATEGORY\}\}/g,        () => escapeHtml(article.category || 'Guide'))
    .replace(/\{\{ARTICLE_TOC\}\}/g,             () => toc)
    .replace(/\{\{ARTICLE_BODY\}\}/g,            () => body)
    .replace(/\{\{RELATED_PLATFORMS_SECTION\}\}/g, () => related);
}

function buildBlogIndexPage(articles, template) {
  const cards = articles.map(a => {
    const dateDisplay = new Date(a.publishDate + 'T00:00:00Z')
      .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    return `<a href="/blog/${a.slug}" class="blog-card">
  <div class="blog-card-top">
    <span class="blog-card-cat">${escapeHtml(a.category || 'Guide')}</span>
    <span class="blog-card-read">${escapeHtml(a.readTime || '5 min read')}</span>
  </div>
  <h2 class="blog-card-title">${escapeHtml(a.title)}</h2>
  <p class="blog-card-desc">${escapeHtml(a.description)}</p>
  <span class="blog-card-date">${dateDisplay}</span>
</a>`;
  }).join('\n');

  return template
    .replace(/\{\{META_TITLE\}\}/g,       () => 'Blog — Social Media Guides & Comparisons | AllPlatforms.io')
    .replace(/\{\{META_DESCRIPTION\}\}/g, () => 'Guides, spec comparisons, and quick references for social media image sizes, video formats, and platform specs.')
    .replace(/\{\{BLOG_CARDS\}\}/g,       () => cards)
    .replace(/\{\{ARTICLE_COUNT\}\}/g,    () => String(articles.length));
}

// ── Sitemap ─────────────────────────────────────────────────────────────────

function buildSitemap(allPlatforms, articles) {
  const urls = [
    `  <url><loc>${BASE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    `  <url><loc>${BASE_URL}/blog</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    ...allPlatforms.map(p =>
      `  <url><loc>${BASE_URL}/${p.slug}</loc><lastmod>${p.lastUpdated}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`
    ),
    ...articles.map(a =>
      `  <url><loc>${BASE_URL}/blog/${a.slug}</loc><lastmod>${a.lastUpdated}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
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

  const logos = loadLogos(allPlatforms);

  const platformTemplate = fs.readFileSync(path.join(SRC_DIR, 'template-platform.html'), 'utf8');
  const indexTemplate    = fs.readFileSync(path.join(SRC_DIR, 'template-index.html'),    'utf8');

  // Load articles (sorted newest first)
  const articles = fs.existsSync(ARTICLES_DIR)
    ? fs.readdirSync(ARTICLES_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8')))
        .sort((a, b) => b.publishDate.localeCompare(a.publishDate))
    : [];

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  for (const platform of allPlatforms) {
    if (!/^[a-z0-9-]+$/.test(platform.slug)) {
      throw new Error(`Invalid slug in ${platform.slug}.json: slugs must match [a-z0-9-]`);
    }
    const dir = path.join(PUBLIC_DIR, platform.slug);
    fs.mkdirSync(dir, { recursive: true });
    const html = buildPlatformPage(platform, platformTemplate, allPlatforms, logos);
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
    console.log(`  ✓ /${platform.slug}/index.html`);
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), buildHomePage(allPlatforms, indexTemplate, logos, articles), 'utf8');
  console.log('  ✓ /index.html');

  if (articles.length > 0) {
    const articleTemplate = fs.readFileSync(path.join(SRC_DIR, 'template-article.html'), 'utf8');
    const blogTemplate    = fs.readFileSync(path.join(SRC_DIR, 'template-blog.html'),    'utf8');

    const blogDir = path.join(PUBLIC_DIR, 'blog');
    fs.mkdirSync(blogDir, { recursive: true });

    for (const article of articles) {
      const dir = path.join(blogDir, article.slug);
      fs.mkdirSync(dir, { recursive: true });
      const html = buildArticlePage(article, articleTemplate, allPlatforms, logos);
      fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
      console.log(`  ✓ /blog/${article.slug}/index.html`);
    }

    fs.writeFileSync(path.join(blogDir, 'index.html'), buildBlogIndexPage(articles, blogTemplate), 'utf8');
    console.log('  ✓ /blog/index.html');
  }

  const sitemap = buildSitemap(allPlatforms, articles);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap, 'utf8');
  console.log('  ✓ /sitemap.xml');

  const robots = `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml\n`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robots, 'utf8');
  console.log('  ✓ /robots.txt');

  console.log(`\nBuild complete — ${allPlatforms.length} platform(s), ${articles.length} article(s)`);
}

try {
  main();
} catch (err) {
  console.error('Build failed:', err.message);
  process.exit(1);
}
