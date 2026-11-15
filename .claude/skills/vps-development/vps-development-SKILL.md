---
name: vps-development
description: "Design, audit, and prepare applications for deployment to the owner's shared Hostinger Ubuntu VPS with Apache, while protecting existing sites. Use when planning architecture, adding deployment configuration, or preparing releases."
---

# Shared VPS: application development and deployment

## Mission
Design apps that can be safely deployed to the owner's existing multi-app VPS. Treat this document as context, **not** as proof of the current live server state. Inspect the repository and request read-only server evidence before proposing impactful changes. Never assume authorization to deploy.

## Known environment and conventions

| Detail | Status | Notes |
|---|---|---|
| Provider | Confirmed historically | Hostinger KVM 2 VPS |
| OS | Confirmed historically | Ubuntu; version not established |
| Web server | Confirmed | Apache 2 with virtual hosts |
| SSH account | Confirmed historically | `david` on host `srv1414441` |
| Application parent | Observed | `/var/www/apps/` |
| Apache configuration | Observed | `/etc/apache2/sites-available/` and `/etc/apache2/sites-enabled/` |
| Domain convention | Observed | `*.djm-apps.com`; individual domains must be confirmed |
| TLS | Observed | Let's Encrypt / Certbot-style `*-le-ssl.conf` vhosts |
| Reverse proxy | Observed historically | Apache `proxy`, `proxy_http`, `headers`, `ssl` modules enabled; actual site routing varies |
| DNS provider | Reported in earlier guidance, **verify** | Cloudflare; do not assume DNS or proxy settings |
| Docker / process manager | Not verified globally | Some apps may use containers or Node services; inspect before choosing |
| VPS CPU, RAM, disk | Not currently verified | Do not depend on previously mentioned plan specifications |
| System Node version | Observed at one point | Node v18.19.1 during FactoryFlow build; current version may differ |

Known Apache site names previously observed: `birdbrain`, `davey-maps`, `djm-apps`, `factoryflow`, `plane`, `pokevote`, `sentinel`, `http_github_server`, and `githublookup.djm-apps.com`. This list is **historical, not an inventory**. Never modify unrelated vhosts.

## Architectural rules

1. **Determine the runtime first.** A static Vite/Astro export can usually be served directly by Apache from a build directory. Do not invent a dedicated port, PM2 service, or Docker container for a purely static app.
2. **Dynamic applications:** for Node, Python, or other backends, establish the actual startup command, production runtime, internal bind address and port, persistence requirements, and process supervisor. Prefer binding application ports to `127.0.0.1` behind Apache unless a documented requirement says otherwise. Check port conflicts first.
3. **Preserve existing sites.** Do not overwrite shared Apache configuration, enable/disable unrelated modules or sites, change system-wide Node versions, or open firewall ports without explicit approval and a rollback plan.
4. **Runtime isolation:** prefer a project-scoped Node version manager/build environment or container where appropriate. An upgrade of system Node can break other applications.
5. **Use correct paths.** Verify the repo root using `pwd`, `git rev-parse --show-toplevel`, and `ls package.json` (when relevant). One past deployment had a nested repo at `/var/www/apps/factoryflow/FactoryFlow`, not `/var/www/apps/factoryflow`.
6. **Separate build and serve.** Prefer building in CI or a release directory and serving immutable artifacts; never assume `npm run dev` is a production service.
7. **Secrets:** use environment variables or protected secret files outside Git; never paste credentials, private keys, or full secret-bearing configs into chat or logs.
8. **Data and state:** explicitly plan database migrations, backups, file uploads, durable storage, and rollback for stateful services. Never assume a Git checkout or Docker volume is a backup.
9. **Resource discipline:** consider memory, disk, CPU, logs, dependency size, and backup retention on a shared VPS.
10. **TLS and DNS:** distinguish Apache origin HTTPS from DNS/CDN configuration. Confirm actual domain, DNS record, and certificate status before enabling public traffic.

## Pre-development questions

Before implementation or deployment design, determine:
- Static SPA, SSR app, API, worker, or hybrid? Which language/framework and required runtime version?
- Expected public hostname and whether a domain already points to this VPS?
- Does it need a database, persistent files, background jobs, scheduled tasks, websockets, or outbound services?
- What configuration is required at **build time** versus **runtime**? Does any value risk being bundled into browser JavaScript?
- Does the app need a separate localhost port? If so, which ports are actually free?
- What is the intended deployment mechanism: Git pull, CI artifact, Docker, or versioned releases?
- What is the recovery plan if the new version fails?

If facts are unknown, label them as **Needs verification** rather than filling in guesses.

## Read-only server reconnaissance

When shell access is available and the owner approves inspection, start with:

```bash
pwd
ls -lah /var/www/apps
sudo apache2ctl -S
ls -lah /etc/apache2/sites-enabled
sudo ss -ltnp
node --version 2>/dev/null || true
npm --version 2>/dev/null || true
systemctl --type=service --state=running --no-pager
sudo ufw status 2>/dev/null || true
df -h
free -h
```

Use focused inspection of the **specific** site's Apache configuration, service unit, and logs. Avoid printing secret environment files or exposing sensitive data. Check `which node`, any version manager, and the actual process runtime before recommending Node changes. Do not treat these commands as a license to modify anything.

## Project readiness checks

- Verify repository root, package manager, lockfile, required runtime version, and installation instructions.
- Run project-specific tests, type checks, linting, and production build; report exact commands and results.
- Verify build artifacts exist and all required assets/data are included. Beware symlinks: ensure static JSON and other public assets survive packaging/deployment.
- Check public asset base paths, client-side routing fallback needs, absolute URLs, CORS, CSP, and browser console/network errors.
- Ensure health checks (for servers), graceful shutdown, startup/restart behavior, and log rotation where relevant.
- Confirm secrets are excluded from Git and client bundles.
- Document migrations, backups, expected storage use, and rollback for stateful changes.

## Apache deployment patterns

### Static build (preferred when applicable)

Use a site-specific `DocumentRoot` pointing to the **verified** built artifact directory, e.g. `/var/www/apps/<app>/<actual-repo-root>/dist`. Add an appropriate `<Directory>` stanza with `Require all granted`, `AllowOverride None`, and `Options -Indexes +FollowSymLinks` when symlinks are genuinely needed. Only add `FallbackResource /index.html` if SPA routing requires it; make sure missing static assets aren't silently rewritten to HTML.

No application-specific listening port is needed: Apache already handles public HTTP/HTTPS on 80/443, subject to verification.

### Server application

Select an unused localhost port after inspecting listeners; bind the app to loopback, configure a supervised process or container with restart policy, and create a site-specific Apache reverse-proxy vhost. Account for websocket upgrades, request body sizes, timeouts, and forwarded headers only when relevant. Do not blindly copy another application's proxy rules.

### Changes and validation

Prefer a dedicated vhost under `/etc/apache2/sites-available/<hostname-or-app>.conf`; avoid editing shared/default vhosts unless necessary. Check current SSL vhosts to avoid duplicate/conflicting `ServerName` entries. After proposed changes, use `sudo apache2ctl configtest` **before** `sudo systemctl reload apache2`. Certbot/ACME configuration should be proposed only after DNS and HTTP reachability are confirmed. Request approval before applying changes.

## Safe release workflow

1. **Inventory** current app configuration and running state; save a backup of the affected vhost and document current release identifier.
2. **Build and test** without altering the live serving directory where possible.
3. **Stage** a new release and verify artifacts and permissions; use versioned releases plus a `current` symlink if compatible with the app.
4. **Prepare** domain, vhost, localhost service, and TLS changes (only as required).
5. **Ask for explicit approval** before any production writes, service reloads, DNS changes, firewall changes, or certificate requests.
6. **Deploy** with minimal downtime; check `apache2ctl configtest`, HTTP response, application health, assets, logs, and browser behavior.
7. **Rollback** by restoring the prior release and any backed-up site config; database rollback requires its own explicit plan.

For routine static asset updates, Apache generally does not need reloading unless its configuration changed.

## Lessons from FactoryFlow

FactoryFlow is a Vite + TypeScript + Three.js **static** app. Its README specifies Node.js **22+**, `npm run build` (TypeScript then Vite), `npm test`, `npm run validate:data`, and a `dist/` production build. Its generated simulation data must be available under the published `data/` path. An attempted build on Node v18.19.1 failed because a dependency imported `node:util.styleText`. The repository was cloned into a nested `FactoryFlow/` directory, causing an Apache `DocumentRoot` warning until the path was corrected. These are examples of why to validate runtime versions and real filesystem paths; they are **not** universal requirements for other apps.

## Expected assistant output

For any new project, provide:
1. **Deployment profile:** app type, runtime, build output, process model, required ports, persistence, secrets, and hostname.
2. **Compatibility findings:** confirmed facts, blockers, and items needing server verification.
3. **Minimal proposed changes:** exact app-specific files and Apache/service configuration, clearly marked as proposed.
4. **Ordered commands:** safe read-only checks first, then changes that require approval.
5. **Verification and rollback:** concrete tests, expected results, and how to restore service.

Never claim deployment success based solely on a successful build, `Syntax OK`, or an Apache reload. Verify actual HTTP behavior and app functionality.
