import {readFile, writeFile} from 'node:fs/promises';

const read = filename => readFile(new URL(filename, import.meta.url), 'utf8');
const [html, css, core, ui] = await Promise.all(['index.html', 'style.css', 'core.mjs', 'ui.mjs'].map(read));
const script = (core.replace(/^export /gm, '') + '\n' + ui.replace(/^import .*\n/m, ''))
  .replace(/<\/(script|body|head|html)/gi, '<\\/$1');
const output = html.replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${css}</style>`)
  .replace('<script type="module" src="ui.mjs"></script>', () => `<script type="module">\n${script}</script>`);
await writeFile(new URL('wp-operations.html', import.meta.url), output);
