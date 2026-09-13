# TECTO MARK — Digital Media & Growth Agency

High-performance digital presence, creative content, and marketing infrastructure for ambitious brands.

---

## 🚀 Live Deployment on Render (Free & 1-Click)

This project is pre-configured with a `render.yaml` blueprint for zero-friction deployment on [Render](https://render.com).

### Step 1: Create a GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Name your repository: `tectomark` (choose Public or Private).
3. Click **Create repository**.
4. Push your local code:
   ```bash
   git remote add origin https://github.com/anoopshukla01/tectomark.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com) (sign in with GitHub).
2. Click **New +** → **Web Service**.
3. Connect your **tectomark** GitHub repository.
4. Render will auto-detect the configuration:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. (Optional) In **Environment Variables**, you can add:
   - `ADMIN_EMAIL`: `tectomarksupport@gmail.com`
   - `SMTP_USER`: `tectomarksupport@gmail.com`
   - `SMTP_PASS`: Your 16-character Google App Password (if using native Gmail SMTP)
6. Click **Deploy Web Service**.
7. Render will provide a free live URL (e.g. `https://tectomark.onrender.com`).

---

## 🌐 Custom Domain Setup (e.g. `tectomark.com`)

Once deployed on Render:
1. In the Render Dashboard, go to your Web Service → **Settings** → **Custom Domains**.
2. Click **Add Custom Domain** and enter your domain (e.g., `tectomark.com` or `www.tectomark.com`).
3. Add the DNS records (CNAME or A record) provided by Render into your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.).
4. Render automatically provisions a free Let's Encrypt SSL certificate within a few minutes.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start local server
npm start
# Server will run at http://localhost:3000
```
