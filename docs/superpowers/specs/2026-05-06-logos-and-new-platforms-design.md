# AllPlatforms.io — Logos + 6 New Platforms Design Spec
**Date:** 2026-05-06
**Status:** Approved

---

## Overview

Extend allplatforms.io with 6 new popular social media platforms (Pinterest, Snapchat, Threads, Reddit, Twitch, Discord) and add platform logos to every card on the homepage and every platform spec page. The existing 6 platforms (Facebook, Instagram, YouTube, TikTok, LinkedIn, X) also get logos added.

**Result:** 12 total platforms, all with brand logos, richer cards, and a more visual hero area.

---

## New Platforms

| Slug | Name | Brand Color |
|---|---|---|
| `pinterest` | Pinterest | `#E60023` |
| `snapchat` | Snapchat | `#FFFC00` |
| `threads` | Threads | `#101010` |
| `reddit` | Reddit | `#FF4500` |
| `twitch` | Twitch | `#9146FF` |
| `discord` | Discord | `#5865F2` |

Each new platform follows the existing JSON schema exactly — 5 spec categories (images, video, text, profile, ads) at the same depth as the existing platforms.

---

## Logo Design

### Storage
- One SVG file per platform at `public/logos/<slug>.svg`
- All 12 platforms (6 existing + 6 new)
- Each file contains only the inner icon path(s), white fill, on a transparent background — no background square, no color fill at the file level
- The brand-colored rounded square wrapper is applied by `build.js` at inject time, so the same logo file works at any size

### Icons
| Platform | Icon description |
|---|---|
| Facebook | "f" lettermark |
| Instagram | Camera outline with lens circle and dot |
| YouTube | Play triangle inside rounded rectangle |
| TikTok | Musical note silhouette |
| LinkedIn | "in" lettermark |
| X (Twitter) | X shape (two diagonal strokes) |
| Pinterest | "P" pin shape |
| Snapchat | Ghost outline |
| Threads | Swirl/thread mark |
| Reddit | Alien head with ears |
| Twitch | Speech bubble / controller shape |
| Discord | Gamepad/headset silhouette |

### Logo loading in build.js
At build startup, `build.js` reads each `public/logos/<slug>.svg` and stores the SVG string in a `logos` map keyed by slug. If a logo file is missing for a platform, the build logs a warning and continues — the colored square renders without an inner icon rather than crashing.

---

## Visual Changes

### Homepage cards — branded header banner

**Before:** Thin vertical color bar + platform name, description, teaser specs.

**After:**
```
┌─────────────────────────────────────┐
│ [gradient tinted header]            │
│  [icon badge]  Platform Name        │
│               Platform Type         │
├─────────────────────────────────────┤
│ Description text                    │
│ → Image Specs: 1000 × 1500 px       │
│ → Video Specs: up to 10 min         │
│ → Text: 500 characters              │
└─────────────────────────────────────┘
```

The header strip has a subtle `linear-gradient(135deg, <color>15, white)` tint. The icon badge is a 36×36px rounded square (border-radius 8px) filled with the platform brand color, containing the white SVG icon at 20×20px.

### Platform page hero — logo beside H1

**Before:**
```
[Platform Name] Specs   ← in brand color
[Description]
[Quick stats]
```

**After:**
```
[icon badge 48px]  [Platform Name] Specs   ← inline, vertically centered
[Description]
[Quick stats]
```

The icon badge is 48×48px with border-radius 12px. The SVG icon inside is 26×26px.

### Sidebar "Other Platforms" — logo dots

**Before:** Small 8×8px colored circle dot + platform name.

**After:** Small 16×16px rounded icon badge (border-radius 4px) with 9×9px SVG icon + platform name.

---

## Build Script Changes

### New token: `{{PLATFORM_LOGO}}`

Added to `src/template-platform.html` in the hero section. `build.js` replaces it with:

```html
<div style="width:48px;height:48px;border-radius:12px;background:<color>;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
  <svg width="26" height="26" viewBox="..."><!-- icon paths --></svg>
</div>
```

### Updated functions

- `buildHomePage()` — new card HTML structure with branded header banner
- `buildOtherPlatforms()` — small logo badges replacing colored dots
- `buildPlatformPage()` — adds `{{PLATFORM_LOGO}}` replacement
- `main()` — reads all logo SVGs from `public/logos/` at startup into a `logos` map

### No new tokens on index template

The homepage card HTML is fully generated inside `buildHomePage()` in `build.js`, not via template tokens, so `src/template-index.html` requires no changes.

---

## Template Changes

### `src/template-platform.html`

Hero section updated to:
```html
<div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
  <div class="flex items-center gap-4 mb-2">
    {{PLATFORM_LOGO}}
    <h1 class="text-3xl sm:text-4xl font-bold tracking-tight" style="color: {{PLATFORM_COLOR}}">{{PLATFORM_NAME}} Specs</h1>
  </div>
  <p class="text-gray-600 dark:text-gray-300 mt-1 text-lg">{{PLATFORM_DESCRIPTION}}</p>
  <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">{{QUICK_STATS}}</div>
</div>
```

### `src/template-index.html`

No changes required.

---

## Test Updates

`tests/build.test.js` slug arrays extended from 6 to 12 platforms:

```javascript
const ALL_SLUGS = ['facebook','instagram','youtube','tiktok','linkedin','x',
                   'pinterest','snapchat','threads','reddit','twitch','discord'];
```

The tests `homepage lists all platforms` and `sitemap.xml contains all platform URLs` both iterate `ALL_SLUGS`. New tests added:
- Each new platform page exists (`public/<slug>/index.html`)
- Each new platform page has required SEO elements

---

## File Map

| File | Action |
|---|---|
| `data/pinterest.json` | Create |
| `data/snapchat.json` | Create |
| `data/threads.json` | Create |
| `data/reddit.json` | Create |
| `data/twitch.json` | Create |
| `data/discord.json` | Create |
| `public/logos/facebook.svg` | Create |
| `public/logos/instagram.svg` | Create |
| `public/logos/youtube.svg` | Create |
| `public/logos/tiktok.svg` | Create |
| `public/logos/linkedin.svg` | Create |
| `public/logos/x.svg` | Create |
| `public/logos/pinterest.svg` | Create |
| `public/logos/snapchat.svg` | Create |
| `public/logos/threads.svg` | Create |
| `public/logos/reddit.svg` | Create |
| `public/logos/twitch.svg` | Create |
| `public/logos/discord.svg` | Create |
| `build.js` | Modify (logo loading, card rendering, hero rendering, sidebar) |
| `src/template-platform.html` | Modify (add `{{PLATFORM_LOGO}}` to hero) |
| `tests/build.test.js` | Modify (extend slug arrays to 12 platforms) |
| `public/` | Regenerate (all platform pages + homepage) |

---

## Out of Scope

- Dark mode logo variants (white icons on colored badges work in both modes)
- Animated or hover logo effects
- Logo for the nav bar platform links (text-only links unchanged)
- Any additional platforms beyond the 12 listed
