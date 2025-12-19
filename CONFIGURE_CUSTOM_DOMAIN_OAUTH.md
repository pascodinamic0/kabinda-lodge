# Configure Custom Domain for Google OAuth Consent Screen

This guide will help you configure the Google OAuth consent screen to show **"kabinda-lodge.com"** instead of the Supabase project ID (`xgcsmkapakcyqxzxpuqk.supabase.co`).

## Overview

When users sign in with Google, they see a consent screen that says "Sign in to continue to [domain]". By default, this shows your Supabase project ID. To show your custom domain (`kabinda-lodge.com`), you need to configure:

1. **Site URL** in Supabase Dashboard
2. **Redirect URLs** in Supabase Dashboard  
3. **Authorized redirect URIs** in Google Cloud Console

## Step 1: Configure Supabase Dashboard

### 1.1 Update Site URL

1. Go to your [Supabase Dashboard](https://app.supabase.com/project/xgcsmkapakcyqxzxpuqk)
2. Navigate to **Settings** > **General**
3. Scroll down to **Site URL**
4. Change it from:
   ```
   https://xgcsmkapakcyqxzxpuqk.supabase.co
   ```
   To:
   ```
   https://kabinda-lodge.com
   ```
5. Click **Save**

### 1.2 Update Redirect URLs

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   https://kabinda-lodge.com/**
   ```
3. Also keep your local development URLs:
   ```
   http://localhost:3000/**
   http://localhost:5173/**
   ```
4. Click **Save**

### 1.3 Verify Google Provider Settings

1. Go to **Authentication** > **Providers** > **Google**
2. Ensure the **Redirect URL** shows:
   ```
   https://xgcsmkapakcyqxzxpuqk.supabase.co/auth/v1/callback
   ```
   (This should remain as the Supabase callback URL - don't change this)

## Step 2: Configure Google Cloud Console

### 2.1 Update Authorized JavaScript Origins

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID (the one used for Kabinda Lodge)
4. Click to edit it
5. Under **Authorized JavaScript origins**, add:
   ```
   https://kabinda-lodge.com
   ```
6. Keep your existing origins:
   ```
   http://localhost:3000
   http://localhost:5173
   ```
7. Click **Save**

### 2.2 Update OAuth Consent Screen (Optional but Recommended)

1. In Google Cloud Console, go to **APIs & Services** > **OAuth consent screen**
2. Under **App domain**, add:
   - **Application home page**: `https://kabinda-lodge.com`
   - **Application privacy policy link**: `https://kabinda-lodge.com/privacy`
   - **Application terms of service link**: `https://kabinda-lodge.com/terms`
3. Under **Authorized domains**, add:
   ```
   kabinda-lodge.com
   ```
4. Click **Save**

### 2.3 Verify Scopes

Ensure these scopes are configured:
- `openid`
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`

## Step 3: Update Code (Already Done ✅)

The code has already been updated to use the root domain:
- `src/contexts/AuthContext.tsx` - redirects to `${window.location.origin}`
- `src/page-components/ClientAuth.tsx` - redirects to `${window.location.origin}`

## Step 4: Test the Configuration

1. Deploy your changes to production (push to your repository)
2. Visit `https://kabinda-lodge.com/client-auth`
3. Click **"Continue with Google"**
4. You should now see:
   ```
   Sign in
   to continue to kabinda-lodge.com
   ```
   Instead of:
   ```
   Sign in
   to continue to xgcsmkapakcyqxzxpuqk.supabase.co
   ```

## Important Notes

⚠️ **The Supabase callback URL remains unchanged**: The redirect URI in Google Console (`https://xgcsmkapakcyqxzxpuqk.supabase.co/auth/v1/callback`) should NOT be changed. This is Supabase's internal callback endpoint.

✅ **What changes**: The Site URL in Supabase and the redirect URLs that Supabase sends users back to after authentication.

## Troubleshooting

### Still seeing Supabase project ID?

1. **Clear browser cache** - OAuth consent screens are cached
2. **Wait a few minutes** - Changes can take 5-10 minutes to propagate
3. **Check Site URL** - Verify it's set to `https://kabinda-lodge.com` in Supabase Dashboard
4. **Verify redirect URLs** - Ensure `https://kabinda-lodge.com/**` is in the allowed redirect URLs list

### Getting redirect errors?

- Make sure `https://kabinda-lodge.com/**` is added to Supabase redirect URLs
- Verify your production domain is correctly configured in your hosting platform
- Check that SSL/HTTPS is properly configured for `kabinda-lodge.com`

## Summary

After completing these steps:
- ✅ Users will see "kabinda-lodge.com" in the Google OAuth consent screen
- ✅ Authentication will redirect back to `https://kabinda-lodge.com` after sign-in
- ✅ Your brand identity is maintained throughout the authentication flow

---

**Last Updated**: January 2025
**Status**: Configuration Guide
**Next Action**: Update Supabase Dashboard settings

