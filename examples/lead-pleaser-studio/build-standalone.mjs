import {readFile,writeFile} from 'node:fs/promises';
const read=name=>readFile(new URL(name,import.meta.url),'utf8');
const [html,css,core,ui]=await Promise.all(['index.html','style.css','studio.mjs','ui.mjs'].map(read));
const source=html.replace('<link rel="stylesheet" href="style.css">',`<style>${css}</style>`).replace('<script type="module" src="ui.mjs"></script>',()=>`<script type="module">\n${core.replace(/^export /gm,'')}\n${ui.replace(/^import .*\n/,'')}\n</script>`);
await writeFile(new URL('lead-pleaser-studio.html',import.meta.url),source);
console.log('Built standalone workbench: lead-pleaser-studio.html');
