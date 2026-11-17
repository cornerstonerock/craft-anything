# WP Operations MCP service

Node 22+. Run npm ci, npm test and npm start from this directory. The process
exposes a stateless Streamable HTTP MCP server on /mcp. Terminate HTTPS at the
reverse proxy. It binds to loopback by default; WPO_BIND and PORT override it.

Configure these settings in the deployment's secret manager:

- WPO_RESOURCE_URL is the public HTTPS /mcp URL and expected token audience.
- WPO_ISSUER is the exact issuer of user access tokens. Configure an OAuth provider
  with authorization code plus PKCE, ChatGPT client registration, resource audience,
  and the wordpress:operate scope. WPO_JWKS_URL is its HTTPS public key set.
- WPO_SITES_JSON is an array of records with id, url, subject, user and password.
  Each subject is the customer identity issued by that provider. The password is
  a revocable WordPress application password for that customer's site. This pilot
  uses operator provisioning. Customer self-service pairing remains open.

With the plugin active, connect ChatGPT to the HTTPS MCP resource using OAuth.
Ask it to list sites, find and read a page, review a proposed replacement, then
create a separate draft. The original page remains available. The returned edit
link opens in wp-admin for a WordPress user who can edit the draft.

Run one process per pilot deployment. Concurrent identical draft calls are
coalesced within that process. A production multi-instance deployment needs a
shared idempotency store. Account provisioning, external OAuth and a real
ChatGPT conversation require separate integration verification.
