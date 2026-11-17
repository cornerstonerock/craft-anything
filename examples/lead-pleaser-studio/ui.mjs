import {createPack, validate, slug} from './studio.mjs';
const $ = id => document.getElementById(id), form = $('brief-form');
let pack = null;
const message = text => {$('status').textContent = text;};
const sample = {version:1,company:'Example Home Services',url:'https://example.com',market:'Southeast Wisconsin',recipe:'roofing',color:'#2463eb',brief:'Create a premium, approachable homepage with a clear consultation request. Prioritize mobile navigation and a simple explanation of the project process. Use original typography and a restrained navy and blue palette.'};
function read() {return {version:1,...Object.fromEntries(new FormData(form))};}
function fill(p) {for(const [key,value] of Object.entries(validate(p))) {if(form.elements.namedItem(key)) form.elements.namedItem(key).value = value;} $('color-value').textContent=p.color;}
function updateCommand() {if(pack) $('command').value=pack[$('shell').value];}
function prepare() {
  try {pack=createPack(read()); $('preview').srcdoc=pack.preview; $('preview').hidden=false; $('empty').hidden=true; $('preview-name').textContent=pack.project.company; $('handoff').hidden=false; $('save').disabled=false; updateCommand(); message('Concept prepared · Engine build has not run');}
  catch(error) {message(error.message);}
}
form.addEventListener('submit', e=>{e.preventDefault();prepare();});
$('example').onclick=()=>{fill(sample);prepare();};
form.addEventListener('input',()=>{ $('color-value').textContent=form.elements.color.value; if(pack){pack=null;$('save').disabled=true;$('handoff').hidden=true;$('preview').hidden=true;$('preview').removeAttribute('srcdoc');$('empty').hidden=false;$('preview-name').textContent='Your next great pitch';message('Brief changed · Prepare a new concept');}});
$('shell').onchange=updateCommand;
for(const b of document.querySelectorAll('[data-width]')) b.onclick=()=>{for(const other of document.querySelectorAll('[data-width]')){other.classList.toggle('selected',other===b);other.setAttribute('aria-pressed',String(other===b));} $('preview').style.width=b.dataset.width;};
function projects(){try{const raw=localStorage.getItem('lead-pleaser-studio-v1');if(!raw)return [];if(raw.length>200000)throw Error('Saved data is too large');const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.projects)||data.projects.length>20)throw Error('Unsupported saved data');return data.projects.map(validate);}catch{message('Saved projects could not be read. Export current work to keep a copy.');return [];}}
function refreshSaved(){const select=$('saved');select.replaceChildren(new Option('Saved projects',''));for(const [i,p] of projects().entries()) select.add(new Option(p.company,String(i)));}
$('save').onclick=()=>{if(!pack)return;try{const list=projects().filter(p=>p.company!==pack.project.company);list.unshift(pack.project);localStorage.setItem('lead-pleaser-studio-v1',JSON.stringify({version:1,projects:list.slice(0,20)}));refreshSaved();message('Saved in this browser · Export JSON for a durable copy');}catch{message('Browser storage is unavailable. Export the project JSON instead.');}};
$('saved').onchange=()=>{const index=$('saved').value;if(index==='')return;const p=projects()[Number(index)];if(p){fill(p);prepare();}};
$('import').onclick=()=>$('file').click();
$('file').onchange=async()=>{try{const file=$('file').files[0];if(!file)return;if(file.size>16384)throw Error('Choose a project JSON smaller than 16 KiB.');fill(JSON.parse(await file.text()));prepare();}catch(error){message(error.message);}finally{$('file').value='';}};
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
for(const b of document.querySelectorAll('[data-export]'))b.onclick=()=>{if(!pack)return;const key=b.dataset.export;const extensions={project:'json',preview:'html',brief:'txt',review:'md'};download(slug(pack.project.company)+'-'+key+'.'+extensions[key],key==='project'?JSON.stringify(pack.project,null,2):pack[key],key==='preview'?'text/html':'text/plain');};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('command').value);message('Build command copied · Run it locally after doctor succeeds');}catch{$('command').focus();$('command').select();message('Select and copy the highlighted command');}};
refreshSaved();
