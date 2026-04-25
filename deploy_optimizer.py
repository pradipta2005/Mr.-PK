import re
import os

html_path = r'c:\Users\ADMIN\OneDrive\Documents\Desktop\gemini_portfolio\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. SEO Payload
if '<meta name="description"' not in content:
    seo_meta = """    <meta name="description" content="Pradipta Khan - Data Scientist and Web Architect specializing in AI solutions, machine learning, and interactive web experiences.">
    <meta name="keywords" content="Data Scientist, AI, Web Architect, Portfolio, Pradipta Khan, Machine Learning, UI/UX">
    <meta name="author" content="Pradipta Khan">
    <meta property="og:title" content="Pradipta Khan | Data Scientist & Developer">
    <meta property="og:description" content="Explore my portfolio covering AI models, data engineering, and high-end interactive UI development.">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
    <meta name="theme-color" content="#F5F3EC">
"""
    content = content.replace('    <title>', seo_meta + '    <title>')

# 2. Add loading='lazy', decoding='async' and onerror to all img tags
def repl_img(match):
    tag = match.group(0)
    if 'loading=' not in tag:
        # Fallback SVG logic for broken images ensuring fast recovery
        fallback = r"""onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%25\' height=\'100%25\'%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'%23111\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' alignment-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23555\' font-family=\'sans-serif\'%3EImage Unavailable%3C/text%3E%3C/svg%3E';" """
        tag = tag.replace('<img ', f'<img loading="lazy" decoding="async" {fallback} ')
    return tag

content = re.sub(r'<img\s+[^>]*>', repl_img, content)

# 3. Add rel to target=_blank a tags
def repl_a(match):
    tag = match.group(0)
    if 'rel=' not in tag:
        tag = tag.replace('target="_blank"', 'target="_blank" rel="noopener noreferrer"')
    return tag

content = re.sub(r'<a\s+[^>]*target="_blank"[^>]*>', repl_a, content)

# 4. Inject noscript globally
if '<noscript>' not in content:
    noscript = '\n    <noscript>\n        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#07090F;color:white;display:flex;align-items:center;justify-content:center;z-index:99999;font-family:sans-serif;font-weight:bold;">\n            Javascript is strictly required to view this immersive WebGL portfolio. Please enable it in your browser settings.\n        </div>\n    </noscript>\n'
    content = content.replace('<body>', '<body>' + noscript)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
