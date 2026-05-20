# Production Deployment Guide

## Architecture

- **Backend**: FastAPI on AWS EC2 t3.small (Singapore region), Docker container
- **Frontend**: Next.js 14 on Vercel
- **Database**: PostgreSQL 16 (managed or self-hosted)
- **Cache**: Redis 7
- **Storage**: Cloudflare R2 (product images)
- **SMS**: Aliyun SMS (phone login)
- **Payments**: Hupijiao

---

## Step 1: Provision EC2 (AWS Singapore)

Launch an EC2 `t3.small` in `ap-southeast-1` (Singapore). Install Docker:

```bash
sudo apt update && sudo apt install -y docker.io
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
```

---

## Step 2: Deploy the Backend

```bash
# Clone the repository
git clone <your-repo-url> && cd project/backend

# Configure environment variables
cp .env.example .env
vim .env  # Fill in all production values (see .env.example for required keys)

# Build the Docker image
docker build -t ai-image-backend .

# Run the container
docker run -d \
  --env-file .env \
  -p 8000:8000 \
  --name backend \
  --restart unless-stopped \
  ai-image-backend
```

---

## Step 3: Configure Nginx + HTTPS (Let's Encrypt)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# /etc/nginx/sites-available/api.yourdomain.com
server {
    server_name api.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.yourdomain.com
sudo systemctl reload nginx
```

---

## Step 4: Run Database Migrations

```bash
# On the EC2 server (inside the project/backend directory)
poetry run alembic upgrade head
poetry run python scripts/seed_templates.py
```

Or run inside the container:

```bash
docker exec -it backend poetry run alembic upgrade head
docker exec -it backend poetry run python scripts/seed_templates.py
```

---

## Step 5: Deploy Frontend to Vercel

```bash
cd frontend
npm install -g vercel
vercel login
```

In the **Vercel Dashboard**, add the following environment variable for the Production environment:

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

Then deploy:

```bash
vercel --prod
```

Alternatively, connect your GitHub repo to Vercel for automatic deployments on push to `main`.

---

## Step 6: Set Up Cron Job (EC2 crontab)

Daily cleanup of expired data at 3 AM server time:

```bash
crontab -e
```

Add:

```
# Daily cleanup at 3am
0 3 * * * cd /path/to/project/backend && poetry run python scripts/cleanup_expired.py >> /var/log/cleanup.log 2>&1
```

---

## Step 7: Pre-Launch Checklist

- [ ] All 5 legal pages are accessible (Terms, Privacy, Refund, etc.)
- [ ] Phone login working with real SMS (Aliyun)
- [ ] All 3 generation modes work: template / keyword / custom
- [ ] Credit deduction is correct; credits refunded on generation failure
- [ ] Hupijiao payment callback works with real HTTPS URL
- [ ] Daily free generation limit enforced for free users
- [ ] Cloudflare R2 images are publicly accessible
- [ ] CORS configured to allow only your production domain
- [ ] OpenAI API billing alert set (prevent unexpected overspend)
- [ ] PostgreSQL backups configured
- [ ] EC2 monitoring / CloudWatch alerts configured

---

## Environment Variables Reference

See `backend/.env.example` for all required backend environment variables.

Key variables to set in production:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Random 64-char secret for JWT signing |
| `JWT_EXPIRE_HOURS` | Token expiry in hours (default: 168 = 7 days) |
| `OPENAI_API_KEY` | OpenAI API key for image generation |
| `R2_ACCESS_KEY` / `R2_SECRET_KEY` | Cloudflare R2 credentials |
| `R2_BUCKET` | R2 bucket name |
| `R2_ENDPOINT` | R2 endpoint URL |
| `R2_PUBLIC_URL` | Public base URL for serving images |
| `ALIYUN_SMS_KEY` / `ALIYUN_SMS_SECRET` | Aliyun SMS credentials |
| `ALIYUN_SMS_SIGN` | SMS signature (must match Aliyun approval) |
| `ALIYUN_SMS_TEMPLATE` | SMS template code |
| `HUPIJIAO_KEY` / `HUPIJIAO_SECRET` | Hupijiao payment credentials |
| `MAX_DAILY_FREE_GENERATIONS` | Daily limit for free users (default: 1) |

Frontend (set in Vercel Dashboard):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (must be HTTPS) |
