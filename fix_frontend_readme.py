with open('autofix-frontend/README.md', 'r', encoding='utf-8') as f:
    content = f.read()
old = 'Indican a Cloudflare Pages que todas las rutas las maneja React Router (SPA).'
new = 'Indican a Netlify que todas las rutas las maneja React Router (SPA).'
content = content.replace(old, new)
with open('autofix-frontend/README.md', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated')