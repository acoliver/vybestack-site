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

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="${cssPathBlog}" />
</head>
<body>
  <div class="container blog-post">
    <h1>${title}</h1>
    <p class="cta-lead">${date}</p>
    ${md.render(body)}
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(outputDir, file.replace(/\.md$/, '.html')), htmlContent);

  posts.push({ title, date, file: file.replace(/\.md$/, '.html') });
});

// sort posts by date descending
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// generate index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vybestack Blog</title>
  <link rel="stylesheet" href="${cssPath}" />
</head>
<body>
  <div class="container blog-post">
    <h1>Vybestack Blog</h1>
    <p class="cta-lead">Thoughts on building developer-first AI tools, one file at a time.</p>
    <ul>
      ${posts.map(p => `<li><a href="rendered/${p.file}" style="color:#6a9955">${p.title} (${p.date})</a></li>`).join('\n      ')}
    </ul>
  </div>
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


