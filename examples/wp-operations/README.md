# WP Operations

Prepare a WordPress page in a local browser. Review desktop and mobile layouts, export
editable Gutenberg blocks, and hand off the exact approved draft to a staging website.

## Open the studio

Open [wp-operations.html](wp-operations.html) in a modern desktop browser. The standalone
file works offline. Click **Load sample** to try the complete review and export flow,
or fill in your own brief. Export the project JSON to keep it and use **Import project**
to resume work. The browser preview uses the studio's own styles. Verify your WordPress
theme's final rendering in the WordPress editor.

To paste blocks into WordPress yourself, use the Block Editor's **Code editor** mode,
paste the contents of `wordpress-blocks.html`, then return to **Visual editor** and
save the page as a draft. Set the page title separately.

## Stage an approved draft

Use Node.js 20 or newer. Set `WP_STAGING_URL` to the canonical HTTPS address of a
WordPress staging installation that serves `/wp-json/`. Under a WordPress account with
permission to edit pages on that site, create an Application Password for WP Operations.
Load the username and password into `WP_STAGING_USER` and `WP_STAGING_APP_PASSWORD` using
your local terminal or secret manager. The browser and project exports do not use them.

Run these commands in the WP Operations directory with the downloaded project JSON available:

```sh
node stage.mjs review wp-operations-project.json
node stage.mjs stage wp-operations-project.json --approve APPROVAL_FROM_REVIEW
```

Review prints the destination, page title, block content, excerpt, status and approval.
Stage looks for the draft's generated slug before creating a page. It returns the editor URL
and the page ID. Review again if you edit the project or change staging sites. If WordPress
times out after submission, check the staging editor before attempting delivery again.
Run approvals for the same site from one workstation. The local lock prevents parallel
submissions on that workstation. If a crashed process leaves a lock, inspect WordPress and
remove the stale approval lock in the system temporary directory before retrying.

The search description is sent as the WordPress excerpt. Configure your site's SEO plugin
separately if you want to publish the same value as a search meta description. Existing
pages are left intact. Production publishing, plugin management, theme edits and remote
management are outside this release.

## Use Craft Anything to revise the copy

Install Craft Anything from the official [upstream releases](https://github.com/storytold/craft-anything/releases)
and run `craft-anything-cli doctor`. Configure a supported coding agent and verify its sign-in.
Download **AI brief** from a reviewed draft. On a POSIX shell, run:

```sh
craft-anything-cli rebuild - "$(cat craft-brief.txt)" --clean-room --rounds 0 --project-folder ./new-copy-project
```

The brief asks the coding agent for a versioned `wp-operations-project.json` file.
Import that file and review its content before staging. The CLI starts a new project
from the supplied brief, so it does not need a third-party website as input.

## Develop

```sh
node --test core.test.mjs
node build.mjs
```

The shipped HTML embeds the browser modules and CSS. Review and approval logic is shared
between the command-line staging tool and the tests. Chromium passed the standalone sample,
mobile layout at 360 px, review invalidation, export and import. WordPress delivery tests substitute a mock
REST server response. A real staging installation and a successful model run are pending.
