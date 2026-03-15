# Netlify Deployment Guide

## 🔧 Required Environment Variables

**IMPORTANT:** Ye environment variables Netlify dashboard mein set karein:

### 1. NextAuth Configuration (Required)
```
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://coffee-shop-dashboard222.netlify.app
```

**Secret key generate karne ke liye:**
- Online: https://generate-secret.vercel.app/32
- Terminal: `openssl rand -base64 32`

### 2. Supabase Configuration (Required)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 📝 Netlify mein Environment Variables Set Karne Ka Tarika

1. Netlify Dashboard mein jao: https://app.netlify.com
2. Apne site ko select karo
3. **Site settings** → **Environment variables** par click karo
4. Har variable ko add karo:
   - **Key**: Variable name (e.g., `NEXTAUTH_SECRET`)
   - **Value**: Variable value
   - **Scopes**: Production, Preview, Deploy previews (sab check karo)

## ⚠️ Common Issues

### Error: "error=Configuration"
**Problem:** `NEXTAUTH_SECRET` ya `NEXTAUTH_URL` missing hai

**Solution:**
1. Netlify dashboard mein environment variables check karo
2. `NEXTAUTH_SECRET` set karo (32+ characters ka strong secret)
3. `NEXTAUTH_URL` ko apne Netlify domain ke saath match karo:
   ```
   NEXTAUTH_URL=https://coffee-shop-dashboard222.netlify.app
   ```
4. Site ko redeploy karo

### Login Page Par Redirect Ho Raha Hai
**Problem:** Session properly establish nahi ho rahi

**Solution:**
- Environment variables properly set hone chahiye
- Site ko redeploy karo after setting variables
- Browser cache clear karo

## 🚀 Deployment Steps

1. **GitHub par code push karo:**
   ```bash
   git add .
   git commit -m "Fix authentication configuration"
   git push origin main
   ```

2. **Netlify Environment Variables set karo:**
   - `NEXTAUTH_SECRET` (required)
   - `NEXTAUTH_URL` (required)
   - Supabase variables (required)

3. **Netlify automatic deploy karega** (agar GitHub connected hai)

4. **Manual redeploy agar zarurat ho:**
   - Netlify Dashboard → Deploys → Trigger deploy

## ✅ Verification

Deployment ke baad check karo:
- ✅ Login page load ho raha hai
- ✅ Credentials se login ho raha hai
- ✅ Dashboard properly load ho raha hai
- ✅ No "error=Configuration" in URL

## 📞 Support

Agar issue rahe to check karo:
1. Netlify build logs
2. Browser console errors
3. Environment variables properly set hain ya nahi
