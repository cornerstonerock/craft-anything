export const fields = {
  title: ['Page title', 70],
  audience: ['Audience', 160],
  headline: ['Headline', 100],
  summary: ['Intro', 280],
  section: ['Section heading', 90],
  body: ['Section copy', 1600],
  action: ['Button label', 45],
  destination: ['Button HTTPS URL', 500],
  description: ['Search description', 160],
};

export const sample = {
  version: 1,
  title: 'Spring garden consultations',
  audience: 'Homeowners planning a garden refresh this spring',
  headline: 'Make room for a garden you love',
  summary: 'Start with a one-on-one garden consultation and leave with a clear plan for the season ahead.',
  section: 'What we cover together',
  body: 'We walk through your space, talk about sunlight and soil, and prioritize the changes that will make a difference this season.',
  action: 'Request a consultation',
  destination: 'https://example.com/consultations',
  description: 'Plan a spring garden refresh with a one-on-one consultation covering plant selection, layout and seasonal priorities.',
};

export function normalize(input) {
  if (input?.version !== 1) throw new Error('Use a version 1 WP Operations project.');
  const project = {version: 1};
  for (const [key, [label, limit]] of Object.entries(fields)) {
    const value = typeof input[key] === 'string' ? input[key].trim().replace(/\s+/gu, ' ') : '';
    if (!value || value.length > limit || /[\x00-\x08\x0e-\x1f\x7f]/u.test(value)) {
      throw new Error(`${label} needs 1–${limit} characters.`);
    }
    project[key] = value;
  }
  let destination;
  try {
    destination = new URL(project.destination);
  } catch {
    throw new Error('Enter a valid HTTPS button URL.');
  }
  if (destination.protocol !== 'https:' || destination.username || destination.password) {
    throw new Error('Enter an HTTPS button URL without credentials.');
  }
  project.destination = destination.href;
  if (project.destination.length > fields.destination[1]) throw new Error('The button URL is too long.');
  return project;
}

export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, value => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[value]);
}

export function blocks(input) {
  const p = normalize(input);
  const e = escapeHtml;
  return [
    '<!-- wp:heading -->',
    `<h2 class="wp-block-heading">${e(p.headline)}</h2>`,
    '<!-- /wp:heading -->',
    '<!-- wp:paragraph -->',
    `<p>${e(p.summary)}</p>`,
    '<!-- /wp:paragraph -->',
    '<!-- wp:heading {"level":3} -->',
    `<h3 class="wp-block-heading">${e(p.section)}</h3>`,
    '<!-- /wp:heading -->',
    '<!-- wp:paragraph -->',
    `<p>${e(p.body)}</p>`,
    '<!-- /wp:paragraph -->',
    '<!-- wp:buttons -->',
    '<div class="wp-block-buttons"><!-- wp:button -->',
    `<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${e(p.destination)}">${e(p.action)}</a></div>`,
    '<!-- /wp:button --></div>',
    '<!-- /wp:buttons -->',
  ].join('\n');
}

export function craftBrief(input) {
  const p = normalize(input);
  const format = Object.entries(fields).map(([key, [label, cap]]) => `- ${key}: ${label}, up to ${cap} characters`).join('\n');
  return `Create one original WordPress campaign page draft. Save it as wp-operations-project.json.\n`
    + `Use a JSON object with version: 1 and these plain-text fields.\n${format}\n`
    + 'Keep the HTTPS destination exact, avoid inventing proof or claims, and use the supplied copy as source material.\n'
    + `Draft data follows.\n${JSON.stringify(p, null, 2)}\n`;
}
