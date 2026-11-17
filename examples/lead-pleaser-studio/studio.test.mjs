import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPack, validate, shellQuote, renderPreview} from './studio.mjs';
const sample=JSON.parse(await readFile(new URL('./sample.json',import.meta.url),'utf8'));
test('pack explicitly separates concept preparation from execution',()=>{
 const p=createPack(sample);assert.match(p.review,/engine build not run/);assert.match(p.preview,/Reference website has not been inspected/);assert.match(p.posix,/--clean-room rebuild/);assert.match(p.posix,/--rounds 1$/);assert.doesNotMatch(p.posix,/--unattended|--deep/);
});
test('HTML treats business details as text and restricts forms and scripts',()=>{
 const html=renderPreview({...sample,company:'<script>alert(1)</script>',market:'" onload="bad()'});
 assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);assert.match(html,/form-action 'none'/);assert.doesNotMatch(html,/<form|<input|https:\/\/example/);
});
test('reject invalid inputs before producing HTML or commands',()=>{
 for(const patch of [{version:2},{recipe:'constructor'},{color:'#fff;bad'},{company:' '},{brief:'x'.repeat(3001)},{url:'javascript:alert(1)'},{url:'https://user:pass@example.com'},{url:'https://example.com?token=private'},{url:'https://127.0.0.1'},{market:'bad\u001btext'}]) assert.throws(()=>validate({...sample,...patch}));
});
test('terminal quoting contains substitutions and apostrophes as literals',()=>{
 assert.equal(shellQuote("a'b"),`'a'"'"'b'`);assert.equal(shellQuote("a'b",'powershell'),"'a''b'");
 const p=createPack({...sample,brief:"Use $(touch /tmp/should-not-exist) and `whoami` and a client's brief"});
 assert.match(p.posix,/\$\(touch/);assert.match(p.powershell,/client''s/);assert.throws(()=>shellQuote('a','cmd'));
});
test('unknown metadata cannot mark a project as built or change the command',()=>{
 const p=createPack({...sample,status:'ready',command:'run arbitrary code'});assert.equal(p.project.status,undefined);assert.equal(p.project.command,undefined);assert.match(p.review,/prepared/);
});
