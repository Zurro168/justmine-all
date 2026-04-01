#!/usr/bin/env node
/**
 * sync-obsidian.js
 * Reads markdown files from the Obsidian vault and generates
 * src/data/kb-articles.json for the KnowledgeBase page to consume.
 *
 * Usage:
 *   node scripts/sync-obsidian.js
 *   npm run sync-kb
 */

const fs = require('fs');
const path = require('path');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const VAULT_PATH = 'F:\\Documents\\Obsidian Vault\\正矿网站知识库';
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'kb-articles.json');

// Map vault subfolder names → category IDs used in the website
const FOLDER_TO_CATEGORY = {
  '贸易实务': 'trade',
  '矿产专题': 'mineral',
  '供应链金融': 'finance',
};

// Default values when frontmatter is missing
const DEFAULTS = {
  readTime: '8 min',
  hasDownload: false,
  isNew: false,
  tag: '知识库',
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse YAML frontmatter from a markdown string.
 * Returns { frontmatter: Object, body: string }
 */
function parseFrontmatter(content) {
  const fm = {};
  let body = content;

  if (content.startsWith('---')) {
    const end = content.indexOf('\n---', 3);
    if (end !== -1) {
      const yamlBlock = content.slice(3, end).trim();
      body = content.slice(end + 4).trim();

      for (const line of yamlBlock.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const key = line.slice(0, colonIdx).trim();
        let val = line.slice(colonIdx + 1).trim();

        // Coerce types
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (!isNaN(val) && val !== '') val = Number(val);
        else val = val.replace(/^["']|["']$/g, ''); // strip quotes

        fm[key] = val;
      }
    }
  }

  return { frontmatter: fm, body };
}

/**
 * Extract a short excerpt from the markdown body (first paragraph, 120 chars).
 */
function extractExcerpt(body) {
  // Strip markdown headings, code blocks, HTML comment lines
  const cleaned = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\|.*\|$/gm, '')   // table rows
    .replace(/!\[.*?\]\(.*?\)/g, '')  // images
    .replace(/\[.*?\]\(.*?\)/g, '$1') // links → text
    .replace(/[*_`>]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  return cleaned.length > 160 ? cleaned.slice(0, 157) + '…' : cleaned;
}

/**
 * Recursively find all markdown files in a directory.
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.md')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function syncVault() {
  if (!fs.existsSync(VAULT_PATH)) {
    console.error(`❌ Vault not found: ${VAULT_PATH}`);
    process.exit(1);
  }

  const articles = [];
  let id = 1;

  console.log('--- 🚀 Starting Obsidian Sync ---');

  for (const [folderName, category] of Object.entries(FOLDER_TO_CATEGORY)) {
    const folderPath = path.join(VAULT_PATH, folderName);
    if (!fs.existsSync(folderPath)) {
      console.warn(`⚠️  Category folder missing, skipping: ${folderName}`);
      continue;
    }

    const files = getAllFiles(folderPath);
    console.log(`📂 [${folderName}] → Found ${files.length} documents`);

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { frontmatter: fm, body } = parseFrontmatter(content);

      // Skip files explicitly marked as draft
      if (fm.draft === true) {
        console.log(`   ⏭️  Skipping draft: ${path.basename(filePath)}`);
        continue;
      }

      const article = {
        id: id++,
        category,
        title:       fm.title       || path.basename(filePath, '.md'),
        tag:         fm.tag         || DEFAULTS.tag,
        excerpt:     fm.excerpt     || extractExcerpt(body),
        readTime:    fm.readTime    || DEFAULTS.readTime,
        hasDownload: fm.hasDownload ?? DEFAULTS.hasDownload,
        isNew:       fm.isNew       ?? DEFAULTS.isNew,
        body:        body,
        updatedAt:   fs.statSync(filePath).mtime.toISOString().slice(0, 10),
        sourceFile:  path.relative(VAULT_PATH, filePath).replace(/\\/g, '/'),
      };

      articles.push(article);
      console.log(`   ✅ Synced: ${article.title}`);
    }
  }

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(articles, null, 2), 'utf-8');

  console.log(`\n🎉 Success! Combined ${articles.length} articles into database.`);
}

syncVault();
