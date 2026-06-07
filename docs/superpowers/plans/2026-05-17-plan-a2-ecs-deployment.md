# Plan A2: ECS Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy `apps/main` to Alibaba Cloud ECS Hong Kong with Nginx reverse proxy, PM2 process management, and Let's Encrypt SSL.

**Architecture:** The monorepo lives at `/var/www/yoursite` on the ECS server. PM2 starts Next.js via `pnpm turbo build --filter=@repo/main...` then `pm2 start ecosystem.config.cjs` (port 3000). Nginx reverse-proxies ports 80/443 → 3000 and handles SSL termination via Certbot. Tasks 1–4 create config files committed to the repo; Tasks 5–7 are server-side steps performed by a human with SSH access to the ECS instance.

**Tech Stack:** Ubuntu 22.04 LTS, Node.js 20 (nvm), pnpm 9+, PM2 5, Nginx, Certbot (Let's Encrypt)

**⚠️ Before starting Tasks 5–7:** Replace every occurrence of `YOUR_DOMAIN` with your actual domain (e.g. `yoursite.com`). The domain is not yet decided — see `docs/superpowers/specs/2026-05-17-service-website-design.md` §12.

---

## File Map

```
deploy/
├── ecosystem.config.cjs          PM2 process definition (apps/main on port 3000)
├── nginx/
│   └── yoursite.com.conf         Nginx vhost (HTTP proxy; Certbot adds HTTPS block)
└── scripts/
    ├── setup-server.sh           One-time server setup (Node, pnpm, PM2, Nginx, Certbot)
    └── deploy.sh                 Deploy/update: git pull → build → pm2 reload
```

`apps/main/package.json` already has `"start": "next start"` — no changes needed there.

---

## Task 1: PM2 Ecosystem Config

**Files:**
- Create: `deploy/ecosystem.config.cjs`

- [ ] **Step 1: Create `deploy/ecosystem.config.cjs`**

```js
module.exports = {
  apps: [
    {
      name: 'main',
      cwd: '/var/www/yoursite',
      script: 'pnpm',
      args: '--filter @repo/main start',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      error_file: '/var/log/pm2/main-error.log',
      out_file: '/var/log/pm2/main-out.log',
      time: true,
    },
  ],
};
```

- [ ] **Step 2: Commit**

```bash
git add deploy/ecosystem.config.cjs
git commit -m "chore(deploy): add PM2 ecosystem config for main app"
```

---

## Task 2: Nginx Virtual Host Config

**Files:**
- Create: `deploy/nginx/yoursite.com.conf`

This is the **HTTP-only** config that you copy to the server. After running `certbot --nginx`, Certbot automatically adds the HTTPS server block and HTTP→HTTPS redirect.

- [ ] **Step 1: Create `deploy/nginx/yoursite.com.conf`**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1024;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Next.js static assets — long-lived cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add deploy/nginx/yoursite.com.conf
git commit -m "chore(deploy): add Nginx vhost config for main site"
```

---

## Task 3: Server Setup Script

**Files:**
- Create: `deploy/scripts/setup-server.sh`

Run this once on a fresh Ubuntu 22.04 ECS instance. It installs Node 20, pnpm, PM2, Nginx, and Certbot.

- [ ] **Step 1: Create `deploy/scripts/setup-server.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== 1/6: Update system packages ==="
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl git build-essential

echo "=== 2/6: Install Node.js 20 via nvm ==="
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20
echo "Node version: $(node -v)"

echo "=== 3/6: Install pnpm and PM2 ==="
npm install -g pnpm@latest
npm install -g pm2@latest
echo "pnpm version: $(pnpm -v)"
echo "PM2 version: $(pm2 -v)"

echo "=== 4/6: Install Nginx ==="
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

echo "=== 5/6: Install Certbot ==="
sudo apt-get install -y certbot python3-certbot-nginx

echo "=== 6/6: Create app directory and configure PM2 startup ==="
sudo mkdir -p /var/www/yoursite
sudo chown -R "$USER:$USER" /var/www/yoursite
sudo mkdir -p /var/log/pm2
sudo chown -R "$USER:$USER" /var/log/pm2
pm2 startup

echo ""
echo "=== Server setup complete! ==="
echo "IMPORTANT: Copy and run the 'sudo env PATH=...' command printed by 'pm2 startup' above."
echo ""
echo "Next steps:"
echo "  1. Clone repo:  git clone <repo-url> /var/www/yoursite"
echo "  2. Set env:     cp /var/www/yoursite/apps/main/.env.example /var/www/yoursite/apps/main/.env.local"
echo "  3. Edit env:    nano /var/www/yoursite/apps/main/.env.local"
echo "  4. Deploy:      bash /var/www/yoursite/deploy/scripts/deploy.sh"
echo "  5. Nginx:       see Task 6 in the deployment plan"
echo "  6. SSL:         sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN"
```

- [ ] **Step 2: Make executable and commit**

```bash
chmod +x deploy/scripts/setup-server.sh
git add deploy/scripts/setup-server.sh
git commit -m "chore(deploy): add server setup script (Ubuntu 22.04)"
```

---

## Task 4: Deploy Script

**Files:**
- Create: `deploy/scripts/deploy.sh`

Run on the server for the first deploy and every subsequent update. Uses Turborepo filter to build only `apps/main` and its dependencies (`packages/ui`, `packages/config`), skipping any future demo apps.

- [ ] **Step 1: Create `deploy/scripts/deploy.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/var/www/yoursite"

echo "=== Deploy: yoursite main app ==="

echo "[1/4] Pull latest code..."
cd "$REPO_DIR"
git pull

echo "[2/4] Install dependencies..."
pnpm install --frozen-lockfile

echo "[3/4] Build main app and its dependencies..."
pnpm turbo build --filter=@repo/main...

echo "[4/4] Start or reload PM2 process..."
if pm2 list | grep -q "main"; then
  pm2 reload main --update-env
else
  pm2 start "$REPO_DIR/deploy/ecosystem.config.cjs"
fi

pm2 save
echo "=== Deploy complete! ==="
```

- [ ] **Step 2: Make executable and commit**

```bash
chmod +x deploy/scripts/deploy.sh
git add deploy/scripts/deploy.sh
git commit -m "chore(deploy): add deploy script (git pull → build → pm2 reload)"
```

---

## Task 5: ECS Server Provisioning (Human Step)

**⚠️ This task requires manual steps in Alibaba Cloud Console and a terminal with SSH.**

No code changes — this is infrastructure provisioning.

- [ ] **Step 1: Purchase ECS instance**

In [Alibaba Cloud Console](https://ecs.console.aliyun.com):
- Region: **Hong Kong (ap-southeast-1)**
- Instance type: **ecs.c6.large** (2 vCPU, 4 GB RAM) or better
- OS image: **Ubuntu 22.04 LTS 64-bit**
- System disk: **40 GB ESSD**
- Network: **Assign Elastic Public IP**
- Security group inbound rules:
  | Protocol | Port | Source   |
  |----------|------|----------|
  | TCP      | 22   | 0.0.0.0/0 |
  | TCP      | 80   | 0.0.0.0/0 |
  | TCP      | 443  | 0.0.0.0/0 |

- [ ] **Step 2: Note server IP and test SSH**

```bash
SERVER_IP=<the ECS public IP>
ssh root@$SERVER_IP "echo SSH OK"
```

Expected: `SSH OK`

- [ ] **Step 3: Point domain DNS to server**

In your domain registrar DNS settings:
```
Type: A    Name: @      Value: <SERVER_IP>   TTL: 300
Type: A    Name: www    Value: <SERVER_IP>   TTL: 300
```

Wait 5–30 minutes for propagation. Verify:
```bash
nslookup YOUR_DOMAIN
```
Expected: resolves to `<SERVER_IP>`

- [ ] **Step 4: Push local commits to remote (if not already)**

```bash
# From your local machine in service-website/
git remote add origin <your-repo-url>
git push -u origin master
```

- [ ] **Step 5: Run setup script on server**

```bash
# SSH into server
ssh root@$SERVER_IP

# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/<your-repo>/main/deploy/scripts/setup-server.sh | bash
```

Or clone first if repo is private:
```bash
ssh root@$SERVER_IP
git clone <your-repo-url> /tmp/setup-repo
bash /tmp/setup-repo/deploy/scripts/setup-server.sh
```

Expected: Script prints "Server setup complete!" at the end.

- [ ] **Step 6: Run the PM2 startup command**

After the script runs, PM2 prints something like:
```
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/root/.nvm/versions/node/v20.x.x/bin pm2 startup systemd -u root --hp /root
```

Copy and run that exact command on the server.

---

## Task 6: First Deployment and SSL (Human Step)

**⚠️ Requires SSH access to the ECS server. DNS must resolve correctly (Task 5 Step 3).**

- [ ] **Step 1: Clone repo on server**

```bash
ssh root@$SERVER_IP
git clone <your-repo-url> /var/www/yoursite
cd /var/www/yoursite
```

- [ ] **Step 2: Configure production environment**

```bash
cp apps/main/.env.example apps/main/.env.local
nano apps/main/.env.local
```

Fill in these values (get from Supabase project dashboard):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
RESEND_API_KEY=re_your_key
RESEND_FROM=YourSite <noreply@YOUR_DOMAIN>
NEXT_PUBLIC_WHATSAPP_PHONE=
```

- [ ] **Step 3: Run first deploy**

```bash
bash /var/www/yoursite/deploy/scripts/deploy.sh
```

Expected last lines:
```
[4/4] Start or reload PM2 process...
[PM2] Starting /var/www/yoursite/deploy/ecosystem.config.cjs in fork_mode (1 instance)
=== Deploy complete! ===
```

Verify:
```bash
pm2 status
```
Expected: row for `main` shows status `online`.

If status is `errored`, check logs:
```bash
pm2 logs main --lines 50
```

- [ ] **Step 4: Confirm app responds on port 3000**

```bash
curl -s http://127.0.0.1:3000 | grep -o '帮外贸工厂' | head -1
```
Expected: `帮外贸工厂`

- [ ] **Step 5: Install and enable Nginx config**

```bash
# Copy config from repo
sudo cp /var/www/yoursite/deploy/nginx/yoursite.com.conf /etc/nginx/sites-available/YOUR_DOMAIN

# Replace placeholder domain (repeat for actual domain)
sudo sed -i 's/YOUR_DOMAIN/actualyoursite.com/g' /etc/nginx/sites-available/YOUR_DOMAIN

# Enable the site
sudo ln -sf /etc/nginx/sites-available/YOUR_DOMAIN /etc/nginx/sites-enabled/YOUR_DOMAIN

# Disable the default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

Expected: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

- [ ] **Step 6: Verify HTTP works before SSL**

```bash
curl -I http://YOUR_DOMAIN
```
Expected: `HTTP/1.1 200 OK` (proxied from port 3000)

- [ ] **Step 7: Obtain SSL certificate**

```bash
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```

When prompted:
1. Enter an email address for renewal notices
2. Type `A` to agree to terms
3. Choose whether to share email with EFF (optional)
4. Select `2` for "Redirect — Make all requests redirect to HTTPS"

Expected: `Congratulations! Your certificate and chain have been saved at /etc/letsencrypt/live/YOUR_DOMAIN/`

Certbot automatically updates the Nginx config and reloads it.

---

## Task 7: Verify Production (Human Step)

**⚠️ Requires SSH access and a browser.**

- [ ] **Step 1: Verify HTTPS response**

```bash
curl -I https://YOUR_DOMAIN
```
Expected:
```
HTTP/2 200
server: nginx
```

- [ ] **Step 2: Verify Chinese homepage content**

```bash
curl -s https://YOUR_DOMAIN | grep -o '帮外贸工厂和贸易公司做英文产品网站'
```
Expected: `帮外贸工厂和贸易公司做英文产品网站`

- [ ] **Step 3: Verify English route**

```bash
curl -sI https://YOUR_DOMAIN/en
```
Expected: `HTTP/2 200`

- [ ] **Step 4: Test SSL auto-renewal**

```bash
sudo certbot renew --dry-run
```
Expected: `Congratulations, all simulated renewals succeeded`

- [ ] **Step 5: Verify PM2 survives reboot**

```bash
sudo reboot
```

Wait ~30 seconds, then:
```bash
ssh root@$SERVER_IP
pm2 status
```
Expected: `main` shows `online`.

- [ ] **Step 6: Browser smoke test**

Open `https://YOUR_DOMAIN`:
- ✅ HTTPS padlock visible
- ✅ Chinese hero: "帮外贸工厂和贸易公司做英文产品网站"
- ✅ "EN" button in top right
- ✅ Click EN → URL becomes `https://YOUR_DOMAIN/en`, English text loads

---

## Self-Review

**Spec coverage:**
- ✓ Alibaba Cloud ECS Hong Kong
- ✓ Nginx reverse proxy (port 80/443 → 3000)
- ✓ PM2 process management with auto-restart
- ✓ Let's Encrypt SSL via Certbot
- ✓ Main app (`yoursite.com`) on port 3000
- ✓ PM2 startup on server reboot
- ✓ Domain DNS A record setup

**Not in this plan (by design):**
- Demo app deployments — each future plan (C1, D1, E1) adds its own PM2 entry + Nginx `server_name` block on a new port
- CI/CD pipeline — future plan
- Alibaba Cloud OSS for assets — future plan when media uploads are needed
- Supabase setup — managed service, no server-side config needed
- Database migrations — none yet; added when contact form goes live (Plan B1)

**Placeholder scan:**
- `YOUR_DOMAIN` used throughout Tasks 2, 5, 6, 7 — explicitly flagged in the plan header and in each task where it appears. No TBD or TODO in code blocks.
- `/var/www/yoursite` is the hardcoded server path — used consistently across all four config files.
- `<your-repo-url>` in Tasks 5–6 requires the user's actual git remote URL.

**Consistency:**
- Port `3000` is declared in `ecosystem.config.cjs` (`PORT: '3000'`) and `proxy_pass http://127.0.0.1:3000` in Nginx config — consistent.
- `pnpm --filter @repo/main start` in `ecosystem.config.cjs` matches the `"start": "next start"` script in `apps/main/package.json` — consistent.
- `pnpm turbo build --filter=@repo/main...` in `deploy.sh` uses the `^build` dependency chain from `turbo.json` — consistent.
