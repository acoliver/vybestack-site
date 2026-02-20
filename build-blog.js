const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it');

const postsDir = path.join(__dirname, 'blog', 'posts');
const outputDir = path.join(__dirname, 'blog', 'rendered');
const indexFile = path.join(__dirname, 'blog', 'index.html');
const cssPath = '../vybestack.css';
const cssPathBlog = '../../vybestack.css';

const md = new markdownIt();

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Shared navigation template
const navTemplate = `
  <nav class="nav">
    <div class="nav-container">
      <div class="nav-left">
        <a href="/" class="logo">
          <img src="/assets/vybestack_logo.png" alt="Vybestack" />
        </a>
        <span class="tagline">Beyond Vibe Coding</span>
      </div>
      <div class="nav-right">
        <a href="/llxprt-code.html">LLxprt Code</a>
        <a href="/jefe.html">LLxprt Jefe</a>
        <a href="/llxprt-code/docs/">Docs</a>
        <a href="/blog/">Blog</a>
        <a href="/#podcast">Podcast</a>
        <a href="https://discord.gg/Wc6dZqWWYv" target="_blank">Discord</a>
      </div>
    </div>
  </nav>
`;

// Shared footer template
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
        <ul class="footer-icons">
          <li><a href="https://github.com/vybestack/llxprt-code" title="GitHub"><img src="/assets/icons/github.svg" alt="GitHub" /></a></li>
          <li><a href="https://discord.gg/Wc6dZqWWYv" title="Discord"><img src="/assets/icons/discord.svg" alt="Discord" /></a></li>
          <li><a href="https://www.linkedin.com/company/vybestack/" title="LinkedIn"><img src="/assets/icons/linkedin.svg" alt="LinkedIn" /></a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Vybestack. Apache 2.0 License. Built for the terminal.</p>
    </div>
  </footer>
`;

const posts = [];
const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));

files.forEach(file => {
  const filePath = path.join(postsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  if (!lines[0].startsWith('#') || !lines[1].startsWith('*')) return;

  const title = lines[0].replace(/^# /, '').trim();
  const date = lines[1].replace(/\*/g, '').trim();
  const body = lines.slice(2).join('\n');

  // Extract first image from rendered content
  const renderedHtml = md.render(body);
  const imgMatch = renderedHtml.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
  const firstImage = imgMatch ? imgMatch[1] : null;

  // Convert relative path to absolute path for index/homepage use
  const firstImageAbsolute = firstImage && firstImage.startsWith('../images/')
    ? `/blog${firstImage.substring(2)}` // ../images/xxx.png -> /blog/images/xxx.png
    : null;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | Vybestack Blog</title>
  <link rel="stylesheet" href="${cssPathBlog}" />
</head>
<body>
${navTemplate}

  <section class="section blog-post-section">
    <div class="container-narrow">
      <div class="blog-post-header">
        <span class="blog-date">${date}</span>
        <h1>${title}</h1>
      </div>
      <div class="blog-post-content">
        ${renderedHtml}
      </div>
      <div class="blog-post-nav">
        <a href="/blog/" class="btn-secondary">&lt;- Back to Blog</a>
      </div>
    </div>
  </section>

${footerTemplate}
</body>
</html>`;

  fs.writeFileSync(path.join(outputDir, file.replace(/\.md$/, '.html')), htmlContent);

  posts.push({ title, date, file: file.replace(/\.md$/, '.html'), image: firstImage, imageAbsolute: firstImageAbsolute });
});

// sort posts by date descending
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// generate index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blog | Vybestack</title>
  <link rel="stylesheet" href="${cssPath}" />
</head>
<body>
${navTemplate}

  <section class="section blog">
    <div class="container-wide">
      <div class="section-header">
        <h2>Blog</h2>
      </div>
      <p class="blog-intro">Thoughts on building developer-first AI tools, one file at a time.</p>
      <div class="blog-grid">
        ${posts.map(p => {
          const imagePath = p.imageAbsolute || p.image;
          return `
        <a href="rendered/${p.file}" class="blog-card">
          ${imagePath ? `<div class="blog-thumbnail"><img src="${imagePath}" alt="${p.title}" /></div>` : '<div class="blog-thumbnail placeholder"></div>'}
          <div class="blog-meta">
            <span class="blog-date">${p.date}</span>
          </div>
          <h3>${p.title}</h3>
          <span class="blog-link">Read more -&gt;</span>
        </a>`;
        }).join('')}
      </div>
    </div>
  </section>

${footerTemplate}
</body>
</html>`;

fs.writeFileSync(indexFile, indexHtml);

// remove orphaned .html files
const existing = fs.readdirSync(outputDir);
const expected = posts.map(p => p.file);
existing.forEach(f => {
  if (!expected.includes(f)) {
    fs.unlinkSync(path.join(outputDir, f));
  }
});

// Update homepage with last 3 blog posts
const homepagePath = path.join(__dirname, 'index.html');
let homepage = fs.readFileSync(homepagePath, 'utf-8');

const recentPosts = posts.slice(0, 3);
const blogPostsHtml = recentPosts.map(p => {
  const imagePath = p.imageAbsolute || p.image;
  return `
        <a href="/blog/rendered/${p.file}" class="blog-card">
          ${imagePath ? `<div class="blog-thumbnail"><img src="${imagePath}" alt="${p.title}" /></div>` : '<div class="blog-thumbnail placeholder"></div>'}
          <div class="blog-meta">
            <span class="blog-date">${p.date}</span>
          </div>
          <h3>${p.title}</h3>
          <span class="blog-link">Read more -&gt;</span>
        </a>`;
}).join('');

homepage = homepage.replace(/<!-- BLOG_POSTS -->[\s\S]*?<!-- END_BLOG_POSTS -->/,
  `<!-- BLOG_POSTS -->${blogPostsHtml}
        <!-- END_BLOG_POSTS -->`);
fs.writeFileSync(homepagePath, homepage);

console.log(`Generated ${posts.length} blog posts`);
console.log(`Updated homepage with ${recentPosts.length} recent posts`);
