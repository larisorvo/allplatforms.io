// scripts/check-sources.js
'use strict';

const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const DATA_DIR   = path.join(__dirname, '..', 'data');
const HASHES_FILE = path.join(__dirname, '.source-hashes.json');

function fetchUrl(url, depth = 0) {
  return new Promise((resolve, reject) => {
    if (depth > 1) {
      reject(new Error('Too many redirects'));
      return;
    }
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'AllPlatforms.io/1.0 spec-checker' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location, depth + 1).then(resolve, reject);
        return;
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`HTTP ${res.statusCode}`));
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

  const tempFile = HASHES_FILE + '.tmp';
  fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2));
  fs.renameSync(tempFile, HASHES_FILE);

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
