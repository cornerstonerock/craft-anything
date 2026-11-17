# WP Operations for ChatGPT

The customer installs WP Operations on each WordPress site. ChatGPT is the operating interface.
The site plugin is the execution boundary. Craft Anything is a development tool.

## First site-side capability

Upload the WP Operations ZIP in Plugins → Add New → Upload Plugin and activate it. WordPress
exposes the authenticated wp-operations/v1/site REST route. The route checks edit_pages and
returns the canonical site and native REST endpoints for the authenticated user. An existing
WordPress application password can authenticate over HTTPS. WordPress core can revoke it.
This release includes only the site-side capability. Installing it alone does not connect ChatGPT.

## Customer journey to implement

1. Connect ChatGPT to the hosted WP Operations MCP app. Authenticate the customer's WP Operations account through OAuth.
2. Ask ChatGPT to connect a site. The service issues a short-lived, account-bound pairing link.
   A WordPress administrator authorizes access in wp-admin. Credentials stay outside the conversation.
3. The service verifies the plugin and authenticated site identity, stores the site credential
   encrypted, and lists only sites belonging to the current account.
4. For a request such as “Draft a services page on my staging site,” ChatGPT selects the site,
   reads relevant content, calls a narrowly scoped MCP tool and receives a WordPress draft
   identifier and a preview link. The plugin enforces WordPress capabilities for every operation.
5. Require a separate confirmation for consequential changes, record the operation, and verify
   the resulting WordPress state. Disconnecting revokes future access.

## Product scope

Start with site discovery, page reads, draft creation and preview in a real ChatGPT conversation.
Expand into media, editable fields, supported builders, theme previews, WooCommerce and multi-site
maintenance. Agency access requires per-client permissions and auditable changes. The page studio
in PR 3 is an optional development fixture. A browser export or CLI call does not satisfy the
ChatGPT acceptance test.

## References

- [WPVibe getting started](https://wpvibe.ai/docs/getting-started/)
- [WPVibe documentation and capability guides](https://wpvibe.ai/docs/)
- [OpenAI authentication for ChatGPT plugins](https://developers.openai.com/plugins/build/auth)
- [WordPress REST endpoint permissions](https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-custom-endpoints/)
