# Lead Pleaser prototype studio

An internal brief and concept-preview workbench for personalized prospect demos. Open
`lead-pleaser-studio.html` directly in a modern browser, or serve this directory locally.
No accounts, npm install, external fonts, analytics or API credentials are required.
The Load sample action uses a fictional business and example.com.

## What this first slice does

- Collect business name, reference URL, market, industry, accent color and build brief.
- Render an original, deterministic template concept with desktop/mobile viewport controls.
- Keep up to 20 explicitly saved projects in browser storage; import/export versioned JSON.
- Export a standalone HTML concept, engine brief, review checklist and quoted terminal command.
- Provide the same pack-building functions through `studio.mjs` and the Node exporter.

The studio does not fetch the reference site or start an AI build. The concept is a recipe-based
layout, not a reconstruction, and it deliberately makes no business credentials or review claims.
The reference is handed to Craft Anything only when the operator runs the exported command.
The brief targets an original redesign; the engine's visual-similarity metric remains informational.
The preview's inquiry section is demonstrational and collects no information.

## Internal pilot

1. Open the standalone HTML and load the sample or enter approved client information.
2. Prepare and review the template concept. Export Project JSON to keep a durable copy.
3. With Craft Anything installed, run `craft-anything-cli doctor` and sign in to a supported
   coding agent separately. The normal engine/browser requirements still apply.
4. Copy the appropriate POSIX or PowerShell command and run it in a terminal. The target project
   folder must be new; export the concept outside that folder. The command explicitly requests
   Clean room and one refinement round, retaining interactive questions and approvals.
5. Inspect the actual generated output and checks. Never treat this workbench's Prepared state
   as an engine success. No automated deployment, CRM connection or outreach is performed.

## Headless work pack

Requires Node.js 20 or newer. No installed packages are needed:

```sh
node cli.mjs sample.json new-output-folder
node --test studio.test.mjs
node --check ui.mjs
node build-standalone.mjs
```

The exporter refuses an existing destination directory. It writes `project.json`, `brief.txt`,
`build-posix.txt`, `build-powershell.txt`, `concept.html`, and `REVIEW.md`. The build command files
are plain text, not automatically executed scripts. Treat user input as untrusted requirements.

`project.schema.json` describes version 1. Runtime validation additionally normalizes whitespace
and rejects blank fields, control characters and credentialed/tracked URLs. Unknown metadata is
ignored. Newer versions are refused with an update instruction. Version 1 is the initial format;
there is no older format to migrate. Browser collections use a version-1 envelope and at most 20
projects. Browser storage is a convenience, not a secure vault or a durable project archive.

For browser smoke checks, serve the directory on loopback and run `browser.test.cjs` with Playwright
available. Pass the base URL as its first argument. `CHROMIUM_PATH` can select an installed browser;
`STUDIO_SCREENSHOTS` optionally supplies an output prefix. These are local test dependencies only.

## Validation and current limits

- Six headless tests pass: explicit execution state, escaped preview content, invalid input,
  terminal quoting, metadata isolation and inline-script protection. Exporter success and existing-directory refusal were
  exercised. All JavaScript source files pass Node syntax checks.
- Browser verification through the managed preview now passes sample generation, the mobile
  preview toggle, local saving and invalidating a preview after editing its brief. The standalone
  build protects embedded closing tags so live-reload injection cannot break its script. Full
  download/import and keyboard coverage remain to be run.
- No Rust files, engine interfaces or upstream assets were changed. Cargo checks could not run
  because this environment has no Rust toolchain. The referenced sibling craftrules repository
  could not be read because it requires access unavailable to the checkout.
- The roadmap claim was committed locally before implementation, but its first git push failed
  for missing credentials. The claim was subsequently published through the GitHub connector;
  this is not claimed as publish-before-implementation compliance.

## Next implementation slice

Add a native bridge through the existing engine `RunSet` and tools for starting/polling builds,
including explicit permission handling, cost ceilings and cancellation. Verify one live
reference-to-built-preview run before exposing a Generate action. Then add private authenticated
preview hosting, time-limited sharing, approved asset uploads, and GHL delivery. Keep generated
client data outside this public repository.

This example uses original Lead Pleaser interface work and no upstream brand logos. Upstream
MIT/Apache notices remain at the repository root. It is a local prototype, not a public service.

Private hosted studio: https://lead-pleaser-prototype-studio.sophronsauna.chatgpt.site/

The hosted copy is owner-private and uses ChatGPT sign-in. Its static source is synced separately
through Sites; changes in this repository do not automatically republish that copy.
