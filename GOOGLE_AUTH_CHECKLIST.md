# ✅ Google Authentication Setup Checklist

Use this checklist to quickly set up Google authentication for your Kabinda Lodge application.

## 📋 Pre-Setup Checklist

- [x] Code implementation complete
- [x] Auth webhook updated
- [x] Supabase config updated
- [x] Documentation created
- [ ] Google Cloud Console account ready
- [ ] Supabase dashboard access ready

## 🎯 Setup Steps

### Part 1: Google Cloud Console (5 minutes)

- [ ] **Step 1.1**: Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] **Step 1.2**: Create new project or select existing one
- [ ] **Step 1.3**: Navigate to "APIs & Services" > "Credentials"
- [ ] **Step 1.4**: Configure OAuth consent screen:
  - [ ] Select "External" user type
  - [ ] App name: "Kabinda Lodge"
  - [ ] Add your support email
  - [ ] Add scopes: `userinfo.email`, `userinfo.profile`, `openid`
  - [ ] Add test users (your email)
  - [ ] Save and continue
- [ ] **Step 1.5**: Create OAuth client ID:
  - [ ] Click "Create Credentials" > "OAuth client ID"
  - [ ] Application type: "Web application"
  - [ ] Name: "Kabinda Lodge Web Client"
  - [ ] Add Authorized redirect URI:
    ```
    https://xgcsmkapakcyqxzxpuqk.supabase.co/auth/v1/callback
    ```
  - [ ] Click "Create"
- [ ] **Step 1.6**: Copy credentials:
  - [ ] Copy Client ID (save somewhere safe)
  - [ ] Copy Client Secret (save somewhere safe)

### Part 2: Supabase Dashboard (2 minutes)

- [ ] **Step 2.1**: Go to [Supabase Dashboard](https://app.supabase.com/project/xgcsmkapakcyqxzxpuqk)
- [ ] **Step 2.2**: Navigate to "Authentication" > "Providers"
- [ ] **Step 2.3**: Find "Google" in the list
- [ ] **Step 2.4**: Enable Google provider
- [ ] **Step 2.5**: Paste Client ID from Google Console
- [ ] **Step 2.6**: Paste Client Secret from Google Console
- [ ] **Step 2.7**: Click "Save"
- [ ] **Step 2.8**: Go to "Authentication" > "URL Configuration"
- [ ] **Step 2.9**: Add redirect URLs:
  - [ ] `http://localhost:5173/kabinda-lodge`
  - [ ] `http://192.168.43.68:5173/kabinda-lodge`
  - [ ] (Add production URL when ready)
- [ ] **Step 2.10**: Click "Save"

### Part 3: Testing (2 minutes)

- [ ] **Step 3.1**: Ensure dev server is running:
  ```bash
  npm run dev
  ```
- [ ] **Step 3.2**: Open browser to: `http://localhost:3000/kabinda-lodge/client-auth`
- [ ] **Step 3.3**: Verify "Continue with Google" button is visible
- [ ] **Step 3.4**: Click "Continue with Google"
- [ ] **Step 3.5**: Sign in with your Google account
- [ ] **Step 3.6**: Authorize the application
- [ ] **Step 3.7**: Verify you're redirected back to `/kabinda-lodge`
- [ ] **Step 3.8**: Verify you're logged in (check user menu/profile)

### Part 4: Verification (1 minute)

- [ ] **Step 4.1**: Go to Supabase Dashboard > "Authentication" > "Users"
- [ ] **Step 4.2**: Verify your Google account is listed
- [ ] **Step 4.3**: Go to "Table Editor" > "profiles"
- [ ] **Step 4.4**: Verify your profile was created:
  - [ ] Email matches Google account
  - [ ] Name extracted from Google
  - [ ] Role is set to "Guest"
- [ ] **Step 4.5**: Test sign out
- [ ] **Step 4.6**: Test sign in again with Google

## 🎉 Success Criteria

You'll know it's working when:
- ✅ Google sign-in button redirects to Google
- ✅ After authorization, you're redirected back
- ✅ You see your name/profile in the app
- ✅ Your profile appears in Supabase dashboard
- ✅ You can sign out and sign in again

## 🚨 Troubleshooting Checklist

If something doesn't work:

### Error: "redirect_uri_mismatch"
- [ ] Check redirect URI in Google Console matches exactly:
  ```
  https://xgcsmkapakcyqxzxpuqk.supabase.co/auth/v1/callback
  ```
- [ ] No trailing slashes
- [ ] HTTPS (not HTTP) for Supabase URL

### Error: "Access blocked"
- [ ] Add your email as test user in Google Console
- [ ] OAuth consent screen is properly configured
- [ ] All required scopes are added

### Not redirecting back
- [ ] Check redirect URLs in Supabase > Authentication > URL Configuration
- [ ] Verify URLs match your development environment
- [ ] Check browser console for errors

### Profile not created
- [ ] Check Supabase logs for webhook errors
- [ ] Verify auth webhook is deployed
- [ ] Check profiles table exists and has correct structure

## 📝 Configuration Values Reference

Keep these handy during setup:

| Item | Value |
|------|-------|
| Supabase Project ID | `xgcsmkapakcyqxzxpuqk` |
| Supabase URL | `https://xgcsmkapakcyqxzxpuqk.supabase.co` |
| OAuth Callback URL | `https://xgcsmkapakcyqxzxpuqk.supabase.co/auth/v1/callback` |
| Local Dev URL | `http://localhost:5173/kabinda-lodge` |
| Network URL | `http://192.168.43.68:5173/kabinda-lodge` |
| Required Scopes | `userinfo.email`, `userinfo.profile`, `openid` |

## 🚀 Production Deployment Checklist

When ready to deploy to production:

- [ ] Add production domain to Google Console authorized origins
- [ ] Add production callback URL to Google Console
- [ ] Add production redirect URL to Supabase
- [ ] Set environment variables in hosting platform:
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] All Supabase credentials
- [ ] Test OAuth flow in production
- [ ] Publish OAuth consent screen (if needed for public use)
- [ ] Monitor first few signups for issues

## 📚 Documentation Reference

- **Quick Start**: See `QUICK_START_GOOGLE_AUTH.md`
- **Detailed Guide**: See `GOOGLE_OAUTH_SETUP.md`
- **Implementation Summary**: See `GOOGLE_AUTH_IMPLEMENTATION_SUMMARY.md`

## ⏱️ Time Estimate

- Google Cloud Console setup: **5 minutes**
- Supabase configuration: **2 minutes**
- Testing: **2 minutes**
- Verification: **1 minute**
- **Total: ~10 minutes**

## 🎊 You're Done!

Once all checkboxes are marked, your Google authentication is fully functional and ready for users!

---

**Last Updated**: December 19, 2025
**Status**: Implementation Complete ✅
**Next Action**: Configure OAuth Credentials

