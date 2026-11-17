import {createHash} from 'node:crypto';
import {open, readFile, unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {blocks, normalize} from './core.mjs';

export function prepare(project, configuredSite) {
  let site;
  try {
    site = new URL(configuredSite);
  } catch {
    throw new Error('Set WP_STAGING_URL to your WordPress staging site.');
  }
  if (site.protocol !== 'https:' || site.username || site.password || site.search || site.hash) {
    throw new Error('Set WP_STAGING_URL to a credential-free HTTPS site URL without a query or fragment.');
  }
  site.pathname = site.pathname.replace(/\/+$/, '') + '/';
  const page = normalize(project);
  const payload = {title: page.title, content: blocks(page), excerpt: page.description, status: 'draft'};
  const approval = createHash('sha256').update(JSON.stringify([site.href, payload])).digest('hex');
  return {site, approval, payload: {...payload, slug: `wpops-${approval.slice(0, 32)}`}};
}

export async function sendDraft(reviewed, approval, credentials, request = fetch) {
  if (approval !== reviewed.approval) throw new Error('Approval did not match the draft and staging site. Run review again.');
  const user = credentials.WP_STAGING_USER;
  const password = credentials.WP_STAGING_APP_PASSWORD;
  if (!user || user.includes(':') || !password) throw new Error('Set the WordPress staging username and application password.');
  const route = new URL('wp-json/wp/v2/pages', reviewed.site);
  const headers = {Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`};
  async function call(url, options) {
    const response = await request(url, {
      ...options,
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
      headers: {...headers, ...options.headers},
    });
    if (!response.ok) throw new Error(`WordPress returned HTTP ${response.status}. Check the staging site and integration permissions.`);
    return response.json();
  }

  const lookup = new URL(route);
  lookup.search = new URLSearchParams({slug: reviewed.payload.slug, status: 'any', context: 'edit', _fields: 'id,status,slug'});
  const existing = await call(lookup, {method: 'GET'});
  if (!Array.isArray(existing)) throw new Error('WordPress returned an unexpected draft lookup response.');
  if (existing.length) {
    if (existing.length !== 1 || existing[0].slug !== reviewed.payload.slug || existing[0].status !== 'draft') {
      throw new Error('The draft identifier is already in use. Inspect the WordPress page before continuing.');
    }
    return result(existing[0], reviewed.site, true);
  }

  const created = await call(route, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(reviewed.payload),
  });
  if (created?.status !== 'draft' || created.slug !== reviewed.payload.slug) {
    throw new Error('WordPress did not confirm the expected draft. Inspect WordPress before retrying.');
  }
  return result(created, reviewed.site, false);
}

function result(page, site, reused) {
  if (!Number.isSafeInteger(page.id) || page.id < 1) throw new Error('WordPress did not return a valid page ID.');
  const editor = new URL('wp-admin/post.php', site);
  editor.search = new URLSearchParams({post: String(page.id), action: 'edit'});
  return {id: page.id, status: 'draft', reused, editor: editor.href};
}

async function main([command, filename, flag, approval, ...extra]) {
  if (!filename || extra.length || (command === 'review' ? flag : command !== 'stage' || flag !== '--approve' || !approval)) {
    throw new Error('Use review PROJECT.json or stage PROJECT.json --approve APPROVAL.');
  }
  const file = await open(filename, 'r');
  let input;
  try {
    if ((await file.stat()).size > 24000) throw new Error('Project files must be smaller than 24 KB.');
    input = JSON.parse(await readFile(file, 'utf8'));
  } finally {
    await file.close();
  }
  const reviewed = prepare(input, process.env.WP_STAGING_URL);
  if (command === 'review') return {stagingSite: reviewed.site.href, ...reviewed.payload, approval: reviewed.approval};
  const lockPath = join(tmpdir(), `wp-operations-${reviewed.approval}.lock`);
  const lock = await open(lockPath, 'wx', 0o600).catch(error => {
    if (error.code === 'EEXIST') throw new Error('Another staging attempt holds this approval lock.');
    throw error;
  });
  try {
    return await sendDraft(reviewed, approval, process.env);
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await main(process.argv.slice(2)), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
