#!/usr/bin/env node
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {createPack} from './studio.mjs';
// No child processes, network access, engine credentials or automatic publishing.
try {
  const [file, out, ...extra] = process.argv.slice(2);
  if (!file || !out || extra.length) throw Error('Usage: node cli.mjs project.json new-output-folder');
  const source = await readFile(file, 'utf8');
  if (source.length > 16384) throw Error('Project file is too large (maximum 16 KiB).');
  const pack = createPack(JSON.parse(source));
  const folder = resolve(out); await mkdir(folder); // Refuse existing folders instead of overwriting.
  for (const [name, content] of Object.entries({'project.json':JSON.stringify(pack.project,null,2),'brief.txt':pack.brief,'build-posix.txt':pack.posix,'build-powershell.txt':pack.powershell,'concept.html':pack.preview,'REVIEW.md':pack.review})) {
    await writeFile(join(folder,name), content, {flag:'wx'});
  }
  console.log('Created concept and build handoff. Engine build has not run.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
