import {fields, sample, normalize, escapeHtml, blocks, craftBrief} from './core.mjs';

const byId = id => document.getElementById(id);
const form = byId('brief');
const page = byId('page');
const details = byId('details');
const status = byId('status');
const exportIds = ['project', 'blocks', 'craft'];
let reviewed;

for (const [key, [label, limit]] of Object.entries(fields)) {
  const wrapper = document.createElement('label');
  const control = document.createElement(['summary', 'body', 'description'].includes(key) ? 'textarea' : 'input');
  control.name = key;
  control.maxLength = limit;
  control.required = true;
  if (key === 'destination') control.type = 'url';
  wrapper.append(label, control);
  byId('fields').append(wrapper);
}

function setExports(enabled) {
  for (const id of exportIds) byId(id).disabled = !enabled;
}

function review(input) {
  reviewed = normalize(input);
  page.innerHTML = `<header><p class="page-title">${escapeHtml(reviewed.title)}</p></header>`
    + `<div class="page-body">${blocks(reviewed)}</div>`;
  page.querySelector('a').addEventListener('click', event => {
    event.preventDefault();
    status.textContent = `Button destination: ${reviewed.destination}`;
  });
  details.textContent = `Audience: ${reviewed.audience} · Search description: ${reviewed.description.length}/160 characters`;
  setExports(true);
  status.textContent = 'Draft ready for export.';
}

function load(input) {
  const project = normalize(input);
  for (const key of Object.keys(fields)) form.elements.namedItem(key).value = project[key];
  review(project);
}

function download(name, value, type) {
  const url = URL.createObjectURL(new Blob([value], {type}));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    review({version: 1, ...Object.fromEntries(new FormData(form))});
  } catch (error) {
    status.textContent = error.message;
  }
});
form.addEventListener('input', () => {
  reviewed = undefined;
  setExports(false);
  details.textContent = 'Review your changes before exporting.';
  page.innerHTML = '<p class="empty">Review your changes to refresh the preview.</p>';
  status.textContent = '';
});

byId('sample').addEventListener('click', () => load(sample));
for (const mode of ['desktop', 'mobile']) {
  byId(mode).addEventListener('click', () => {
    page.classList.toggle('mobile', mode === 'mobile');
    for (const option of ['desktop', 'mobile']) byId(option).setAttribute('aria-pressed', String(option === mode));
  });
}

byId('project').addEventListener('click', () => download('wp-operations-project.json', JSON.stringify(reviewed, null, 2), 'application/json'));
byId('blocks').addEventListener('click', () => download('wordpress-blocks.html', blocks(reviewed), 'text/plain'));
byId('craft').addEventListener('click', () => download('craft-brief.txt', craftBrief(reviewed), 'text/plain'));
byId('import').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 24000) throw new Error('Project files must be smaller than 24 KB.');
    load(JSON.parse(await file.text()));
  } catch (error) {
    status.textContent = `Import failed. ${error.message}`;
  } finally {
    event.target.value = '';
  }
});
