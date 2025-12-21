# Quick Start: Enable Google Authentication

## ⚡ Fast Setup (5 minutes)

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing)
3. Click **Create Credentials** > **OAuth client ID**
4. If prompted, configure the OAuth consent screen first:
   - App name: **Kabinda Lodge**
   - User support email: your email
   - Add scopes: `userinfo.email`, `userinfo.profile`, `openid`
5. Create OAuth client ID:
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     https://xgcsmkapakcyqxzxpuqk.supabase.co/auth/v1/callback
     ```
6. Copy the **Client ID** and **Client Secret**

### Step 2: Configure Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/project/xgcsmkapakcyqxzxpuqk)
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and enable it
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

### Step 3: Add Redirect URLs

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Add these redirect URLs:
   ```
   http://localhost:5173/kabinda-lodge
   http://192.168.43.68:5173/kabinda-lodge
   ```
3. Click **Save**

### Step 4: Test It!

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:5173/kabinda-lodge/client-auth`

3. Click **"Continue with Google"**

4. Sign in with your Google account

5. You should be redirected back to the home page, logged in! ✅

## 🎉 That's It!

Your Google authentication is now working. The system will:
- ✅ Automatically create a user profile
- ✅ Set the user role to "Guest"
- ✅ Extract name from Google account
- ✅ No email verification needed for OAuth users

## 🔧 Troubleshooting

### "redirect_uri_mismatch" error?
Make sure the redirect URI in Google Console is exactly:
```
https://xgcsmkapakcyqxzxpuqk.supabase.co/auth/v1/callback
```

### "Access blocked" error?
Add your email as a test user in Google Cloud Console > OAuth consent screen

### Not redirecting back?
Check that redirect URLs are added in Supabase Dashboard > Authentication > URL Configuration

## 📚 Need More Details?

See the full guide: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

## 🚀 Production Deployment

When deploying to production:

1. Add production domain to Google Console authorized origins
2. Add production callback URL: `https://your-domain.com/kabinda-lodge`
3. Update Supabase redirect URLs with production domain
4. Set environment variables in your hosting platform

## ✨ What's Already Implemented

The code is ready to go! Here's what's already set up:

- ✅ Google sign-in button in `ClientAuth.tsx`
- ✅ OAuth handler in `AuthContext.tsx`
- ✅ Automatic profile creation via auth webhook
- ✅ Proper redirect handling
- ✅ Error handling and user feedback
- ✅ Support for both sign-in and sign-up flows

You just need to configure the OAuth credentials! 🎊





