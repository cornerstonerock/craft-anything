import test from 'node:test';
import assert from 'node:assert/strict';
import {blocks, craftBrief, normalize, sample} from './core.mjs';
import {prepare, sendDraft} from './stage.mjs';

const site = 'https://stage.example.test/cms/';
const credentials = {WP_STAGING_USER: 'fixture', WP_STAGING_APP_PASSWORD: 'fixture password'};
const reviewed = prepare(sample, site);

test('builds editable blocks and escapes every plain text input', () => {
  const html = blocks({...sample, headline: '<img src=x>', destination: 'https://example.org/?one=1&two=2'});
  assert.match(html, /<!-- wp:heading -->/);
  assert.match(html, /<!-- wp:buttons -->/);
  assert.match(html, /&lt;img src=x&gt;/);
  assert.match(html, /one=1&amp;two=2/);
  assert.doesNotMatch(html, /<img/);
});

test('validates project versions and HTTPS destinations', () => {
  for (const destination of ['javascript:alert(1)', 'http://example.test/', 'https://user:pass@example.test/']) {
    assert.throws(() => normalize({...sample, destination}), /HTTPS/);
  }
  assert.throws(() => normalize({...sample, version: 2}), /version 1/);
  assert.match(craftBrief(sample), /wp-operations-project.json/);
});

test('binds approval to both the draft and destination and refuses changes before HTTP', async () => {
  const edited = prepare({...sample, headline: 'Different headline'}, site);
  const moved = prepare(sample, 'https://other.example.test/');
  assert.notEqual(edited.approval, reviewed.approval);
  assert.notEqual(moved.approval, reviewed.approval);
  await assert.rejects(sendDraft(edited, reviewed.approval, credentials, () => assert.fail('Unexpected HTTP')), /Approval did not match/);
});

test('creates a draft only, honors subdirectory installs and reuses a matching draft', async () => {
  const calls = [];
  const page = {id: 9, slug: reviewed.payload.slug, status: 'draft'};
  const request = async (url, options) => {
    assert.equal(url.origin, 'https://stage.example.test');
    assert.equal(url.pathname, '/cms/wp-json/wp/v2/pages');
    assert.equal(options.redirect, 'error');
    assert.match(options.headers.Authorization, /^Basic /);
    calls.push(options.method);
    if (options.method === 'GET') {
      assert.equal(url.searchParams.get('slug'), page.slug);
      return Response.json(calls.length === 1 ? [] : [page]);
    }
    assert.deepEqual(JSON.parse(options.body), reviewed.payload);
    assert.equal(JSON.parse(options.body).status, 'draft');
    return Response.json(page, {status: 201});
  };
  const create = await sendDraft(reviewed, reviewed.approval, credentials, request);
  const reuse = await sendDraft(reviewed, reviewed.approval, credentials, request);
  assert.deepEqual(calls, ['GET', 'POST', 'GET']);
  assert.deepEqual(create, {id: 9, status: 'draft', reused: false, editor: `${site}wp-admin/post.php?post=9&action=edit`});
  assert.equal(reuse.reused, true);
});

test('refuses a published match and reports an unexpected create response', async () => {
  const published = {id: 9, slug: reviewed.payload.slug, status: 'publish'};
  await assert.rejects(sendDraft(reviewed, reviewed.approval, credentials, async (url, options) => {
    assert.equal(options.method, 'GET');
    return Response.json([published]);
  }), /already in use/);
  await assert.rejects(sendDraft(reviewed, reviewed.approval, credentials, async (url, options) => (
    Response.json(options.method === 'GET' ? [] : published)
  )), /did not confirm/);
});
