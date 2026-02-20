const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it');

const sourceDir = path.join(__dirname, 'tmp', 'llxprt-code', 'docs');
const outputDir = path.join(__dirname, 'llxprt-code', 'docs');
const assetsSource = path.join(sourceDir, 'assets');
const assetsOutput = path.join(outputDir, 'assets');
const cssPath = '../../vybestack.css';

const md = new markdownIt({ html: true, linkify: true });

// Shared navigation template
const navTemplate = `
  <nav>
    <div class="nav-container">
      <div class="nav-left">
        <a href="/" class="logo">
          <img src="/assets/vybestack_logo.png" alt="Vybestack" />
        </a>
        <span class="tagline">Beyond Vibe Coding</span>
      </div>
      <div class="nav-right">
        <div class="nav-dropdown">
          <a href="/llxprt-code.html">LLxprt Code</a>
          <div class="nav-dropdown-menu">
            <a href="/llxprt-code.html">Overview</a>
            <a href="/llxprt-code/docs/">Documentation</a>
          </div>
        </div>
        <a href="/jefe.html">LLxprt Jefe</a>
        <a href="/blog/">Blog</a>
        <a href="/#podcast">Podcast</a>
        <a href="https://discord.gg/Wc6dZqWWYv" target="_blank">Discord</a>
      </div>
    </div>
  </nav>
`;

const footerTemplate = `
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-section">
        <h4>Vybestack</h4>
        <p>Beyond vibe coding. Autonomous development for ascending engineers.</p>
      </div>
      <div class="footer-section">
        <h4>Products</h4>
        <ul>
          <li><a href="/llxprt-code.html">LLxprt Code</a></li>
          <li><a href="/jefe.html">LLxprt Jefe</a></li>
        </ul>
      </div>
      <div class="footer-section">
        <h4>Content</h4>
        <ul>
          <li><a href="/blog/">Blog</a></li>
          <li><a href="/#podcast">Podcast</a></li>
          <li><a href="/llxprt-code/docs/">Documentation</a></li>
        </ul>
      </div>
      <div class="footer-section">
        <h4>Connect</h4>
        <ul class="social-links">
          <li><a href="https://github.com/vybestack/llxprt-code"><img src="/assets/github-mark-white.svg" alt="GitHub" /> </a></li>
          <li><a href="https://discord.gg/Wc6dZqWWYv"><img src="/assets/discord-mark-white.svg" alt="Discord" /></a></li>
          <li><a href="https://www.linkedin.com/company/vybestack/"><img src="/assets/linkedin-white.svg" alt="LinkedIn" /></a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Vybestack. Apache 2.0 License. Built for the terminal.</p>
    </div>
  </footer>
`;

if (!fs.existsSync(sourceDir)) {
  console.error('Source docs not found at', sourceDir);
  console.error('Run: git clone --depth 1 https://github.com/vybestack/llxprt-code.git ./tmp/llxprt-code');
  process.exit(1);
}

// Clean output directory (except assets)
if (fs.existsSync(outputDir)) {
  fs.readdirSync(outputDir).forEach(f => {
    const p = path.join(outputDir, f);
    if (fs.statSync(p).isDirectory()) {
      fs.rmSync(p, { recursive: true });
    } else {
      fs.unlinkSync(p);
    }
  });
}
fs.mkdirSync(outputDir, { recursive: true });

// Copy assets
if (fs.existsSync(assetsSource)) {
  fs.mkdirSync(assetsOutput, { recursive: true });
  fs.readdirSync(assetsSource).forEach(f => {
    fs.copyFileSync(path.join(assetsSource, f), path.join(assetsOutput, f));
  });
}

// Convert .md links to .html links in rendered HTML
function rewriteLinks(html) {
  return html.replace(/href="([^"]*?)\.md(#[^"]*)?"/g, (match, base, hash) => {
    hash = hash || '';
    // Don't rewrite external links
    if (base.startsWith('http://') || base.startsWith('https://')) return match;
    return `href="${base}.html${hash}"`;
  });
}

// Build sidebar from index.md
function buildSidebar(indexContent) {
  const lines = indexContent.split('\n');
  const links = [];
  for (const line of lines) {
    const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      let href = linkMatch[2];
      if (href.endsWith('.md')) href = href.replace(/\.md$/, '.html');
      if (href.startsWith('./')) href = href.substring(2);
      links.push({ title: linkMatch[1], href });
    }
  }
  return links;
}

const sidebarLinks = buildSidebar(fs.readFileSync(path.join(sourceDir, 'index.md'), 'utf-8'));

const sidebarHtml = `
      <nav class="docs-sidebar">
        <h3><a href="/llxprt-code/docs/">Documentation</a></h3>
        <ul>
          ${sidebarLinks.map(l => `<li><a href="/llxprt-code/docs/${l.href}">${l.title}</a></li>`).join('\n          ')}
        </ul>
      </nav>`;

// Recursively find all markdown files
function findMarkdownFiles(dir, base) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(base, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'assets') continue;
      results = results.concat(findMarkdownFiles(fullPath, relPath));
    } else if (entry.name.endsWith('.md')) {
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

const mdFiles = findMarkdownFiles(sourceDir, '');
let count = 0;

for (const { fullPath, relPath } of mdFiles) {
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  // Extract title from first heading
  const titleLine = lines.find(l => l.startsWith('# '));
  const title = titleLine ? titleLine.replace(/^# /, '').trim() : path.basename(relPath, '.md');

  const renderedHtml = rewriteLinks(md.render(content));

  // Calculate relative CSS path based on depth
  const depth = relPath.split(path.sep).length - 1;
  const cssRelPath = '../'.repeat(depth) + cssPath;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | LLxprt Code Docs</title>
  <link rel="stylesheet" href="${cssRelPath}" />
</head>
<body>
${navTemplate}

  <section class="section docs-section">
    <div class="container-wide">
      <div class="docs-layout">
${sidebarHtml}
        <div class="docs-content">
          <div class="blog-post-content">
            ${renderedHtml}
          </div>
        </div>
      </div>
    </div>
  </section>

${footerTemplate}
</body>
</html>`;

  const outPath = path.join(outputDir, relPath.replace(/\.md$/, '.html'));
  const outDir = path.dirname(outPath);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, htmlContent);
  count++;
}

// Create index.html as a redirect/alias for index.md -> index.html
console.log(`Generated ${count} documentation pages`);
