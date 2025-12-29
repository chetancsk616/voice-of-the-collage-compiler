# Deployment Guide - AI Web Compiler

Complete guide for deploying the AI Web Compiler to production.

## 📋 Prerequisites

- Node.js 18+ installed on server
- Firebase project configured
- Groq API key
- Domain names (optional):
  - `admin.yourcompiler.com`
  - `app.yourcompiler.com`

## 🚀 Deployment Options

### Option 1: Traditional VPS (DigitalOcean, AWS EC2, etc.)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

#### 2. Clone and Setup Project

```bash
# Clone repository
git clone <your-repo-url>
cd ai-web-compiler

# Install dependencies
npm run install:all

# Configure environment
cp admin/.env.example admin/.env
cp student/.env.example student/.env

# Edit .env files with production values
nano admin/.env
nano student/.env

# Build projects
npm run build
```

#### 3. Configure PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'admin-server',
      cwd: './admin/server',
      script: 'index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4001
      }
    },
    {
      name: 'student-server',
      cwd: './student/server',
      script: 'index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      }
    }
  ]
};
```

Start servers:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. Configure Nginx

```nginx
# /etc/nginx/sites-available/admin
server {
    listen 80;
    server_name admin.yourcompiler.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# /etc/nginx/sites-available/student
server {
    listen 80;
    server_name app.yourcompiler.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable sites:

```bash
sudo ln -s /etc/nginx/sites-available/admin /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/student /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d admin.yourcompiler.com -d app.yourcompiler.com
```

### Option 2: Render.com

#### 1. Create render.yaml

```yaml
services:
  - type: web
    name: admin-server
    env: node
    region: oregon
    buildCommand: cd admin/server && npm install
    startCommand: cd admin/server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 4001
      - key: GROQ_API_KEY
        sync: false
      - key: FIREBASE_SERVICE_ACCOUNT_BASE64
        sync: false

  - type: web
    name: student-server
    env: node
    region: oregon
    buildCommand: cd student/server && npm install
    startCommand: cd student/server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5001
      - key: GROQ_API_KEY
        sync: false
      - key: FIREBASE_SERVICE_ACCOUNT_BASE64
        sync: false

  - type: web
    name: admin-client
    env: static
    buildCommand: cd admin/client && npm install && npm run build
    staticPublishPath: admin/client/dist

  - type: web
    name: student-client
    env: static
    buildCommand: cd student/client && npm install && npm run build
    staticPublishPath: student/client/dist
```

#### 2. Deploy

1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard
4. Deploy

### Option 3: Vercel + Railway

#### Admin & Student Clients → Vercel

```bash
# Deploy admin client
cd admin/client
vercel --prod

# Deploy student client
cd ../../student/client
vercel --prod
```

#### Servers → Railway

1. Create new project on Railway
2. Deploy from GitHub
3. Configure environment variables
4. Set start commands:
   - Admin: `cd admin/server && npm start`
   - Student: `cd student/server && npm start`

## 🔐 Production Environment Variables

### Admin (.env)

```env
NODE_ENV=production
PORT=4001
API_PREFIX=/api

GROQ_API_KEY=<your-production-key>
FIREBASE_SERVICE_ACCOUNT_BASE64=<your-base64-credentials>

# Optional: Custom domain
ADMIN_CLIENT_URL=https://admin.yourcompiler.com

# Security
JWT_SECRET=<generate-strong-secret>
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Student (.env)

```env
NODE_ENV=production
PORT=5001
API_PREFIX=/api

GROQ_API_KEY=<your-production-key>
FIREBASE_SERVICE_ACCOUNT_BASE64=<your-base64-credentials>
PISTON_API_URL=https://emkc.org/api/v2/piston

# Optional: Custom domain
STUDENT_CLIENT_URL=https://app.yourcompiler.com

# Security
JWT_SECRET=<generate-strong-secret>
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔒 Security Checklist

- [ ] All environment variables set securely
- [ ] Firebase rules configured properly
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting enabled
- [ ] Admin access restricted to specific emails
- [ ] CORS configured correctly
- [ ] Firewall rules set up
- [ ] PM2 monitoring enabled
- [ ] Automated backups configured
- [ ] Error logging set up (e.g., Sentry)

## 📊 Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs

# Monitor processes
pm2 monit

# Check status
pm2 status

# Restart services
pm2 restart all
```

### Log Management

```bash
# Install PM2 log rotate
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 🔄 Updates & Maintenance

### Deploy Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm run install:all

# Rebuild
npm run build

# Restart services
pm2 restart all
```

### Database Backups (Firebase)

1. Go to Firebase Console
2. Navigate to Firestore/Realtime Database
3. Export data regularly
4. Store backups securely

## ⚡ Performance Optimization

### Client Optimization

- Enable compression in Nginx
- Configure caching headers
- Use CDN for static assets
- Minimize bundle sizes

### Server Optimization

```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🆘 Troubleshooting

### Server Not Starting

```bash
# Check logs
pm2 logs admin-server --lines 100
pm2 logs student-server --lines 100

# Check environment variables
pm2 env admin-server

# Restart
pm2 restart all --update-env
```

### High Memory Usage

```bash
# Monitor
pm2 monit

# Adjust PM2 max memory
pm2 start ecosystem.config.js --max-memory-restart 500M
```

### Database Connection Issues

- Verify Firebase credentials
- Check network connectivity
- Review Firebase quotas
- Check security rules

## 📞 Support

For deployment issues:
1. Check logs first: `pm2 logs`
2. Review environment variables
3. Test locally with production env
4. Contact system administrator

---

**Last Updated**: December 29, 2025
