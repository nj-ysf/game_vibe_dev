// Fallback for Windows environments that cannot spawn esbuild through Node pipes.
// The JavaScript bundle is created by scripts/build-local.ps1 first.
import fs from 'node:fs/promises';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';

const css = await fs.readFile('src/styles.css', 'utf8');
const output = await postcss([tailwindcss({ optimize: true })]).process(css, { from: 'src/styles.css', to: 'dist/assets/game.css' });
await fs.writeFile('dist/assets/game.css', output.css);
await fs.copyFile('public/logo.png', 'dist/logo.png');
const html = (await fs.readFile('index.html', 'utf8')).replace('<script type="module" src="/src/main.jsx"></script>', '<link rel="stylesheet" href="/assets/game.css"/><script type="module" src="/assets/game.js"></script>');
await fs.writeFile('dist/index.html', html);
console.log('Local production build written to frontend/dist.');
