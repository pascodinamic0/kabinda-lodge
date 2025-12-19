# Google OAuth Setup Guide for Kabinda Lodge

This guide will help you configure Google OAuth authentication for your Kabinda Lodge application.

## Prerequisites

- A Google Cloud Platform account
- Access to your Supabase project dashboard
- The application running locally or deployed

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**

### 1.2 Configure OAuth Consent Screen

1. Click on **OAuth consent screen** in the left sidebar
2. Select **External** user type (or **Internal** if you're using Google Workspace)
3. Click **Create**
4. Fill in the required information:
   - **App name**: Kabinda Lodge
   - **User support email**: Your support email
   - **Developer contact information**: Your email
5. Click **Save and Continue**
6. On the **Scopes** page, click **Add or Remove Scopes**
7. Add the following scopes:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
8. Click **Save and Continue**
9. Add test users if needed (for development)
10. Click **Save and Continue** and then **Back to Dashboard**

### 1.3 Create OAuth Client ID

1. Click on **Credentials** in the left sidebar
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Configure the following:
   - **Name**: Kabinda Lodge Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (for local development)
     - `http://192.168.43.68:5173` (for network access)
     - `https://your-production-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `https://xgcsmkapakcyqxzxpuqk.supabase.co/auth/v1/callback`
     - `http://localhost:54321/auth/v1/callback` (for local Supabase)
5. Click **Create**
6. **Important**: Copy the **Client ID** and **Client Secret** - you'll need these!

## Step 2: Configure Supabase

### 2.1 Add Google Provider in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: `xgcsmkapakcyqxzxpuqk`
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and click to expand
5. Enable the Google provider
6. Enter your credentials:
   - **Client ID**: Paste the Client ID from Google Cloud Console
   - **Client Secret**: Paste the Client Secret from Google Cloud Console
7. Configure the redirect URL (should be pre-filled):
   - `https://xgcsmkapakcyqxzxpuqk.supabase.co/auth/v1/callback`
8. Click **Save**

### 2.2 Configure Local Environment (Optional)

If you're running Supabase locally, create or update your `.env.local` file:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Supabase Configuration (already set)
NEXT_PUBLIC_SUPABASE_URL=https://xgcsmkapakcyqxzxpuqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 3: Update Redirect URLs

### 3.1 In Supabase Dashboard

1. Go to **Authentication** > **URL Configuration**
2. Add the following to **Redirect URLs**:
   - `http://localhost:5173/kabinda-lodge`
   - `http://192.168.43.68:5173/kabinda-lodge`
   - `https://your-production-domain.com/kabinda-lodge`
3. Click **Save**

### 3.2 Verify Config File

The `supabase/config.toml` file has been updated with the necessary configuration:

```toml
[auth]
enabled = true
additional_redirect_urls = [
  "https://localhost:3000/**",
  "http://localhost:5173/**",
  "http://192.168.43.68:5173/**"
]

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
redirect_uri = "http://localhost:54321/auth/v1/callback"
```

## Step 4: Database Setup

### 4.1 Ensure Profiles Table Exists

The auth webhook will automatically create user profiles for Google sign-ins. Verify your `profiles` table has the following structure:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'Guest',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 4.2 Verify Auth Webhook

The auth webhook has been updated to handle OAuth signups. It will:
- Detect when a user signs up via Google
- Automatically create a profile with the 'Guest' role
- Extract name from Google user metadata
- Skip email confirmation for OAuth users

## Step 5: Testing

### 5.1 Local Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the client authentication page:
   ```
   http://localhost:5173/kabinda-lodge/client-auth
   ```

3. Click the **"Continue with Google"** button

4. You should be redirected to Google's OAuth consent screen

5. After authorizing, you'll be redirected back to `/kabinda-lodge`

### 5.2 Verify User Creation

1. Go to Supabase Dashboard > **Authentication** > **Users**
2. You should see your Google account listed
3. Go to **Table Editor** > **profiles**
4. Verify a profile was created with:
   - Your email
   - Name from Google
   - Role set to 'Guest'

## Step 6: Production Deployment

### 6.1 Update Google Cloud Console

1. Add your production domain to **Authorized JavaScript origins**
2. Add your production callback URL to **Authorized redirect URIs**:
   - `https://your-domain.com/kabinda-lodge`

### 6.2 Update Supabase

1. Add production URLs to **Redirect URLs** in Supabase Dashboard
2. Ensure Google provider is enabled in production

### 6.3 Environment Variables

Make sure your production environment has:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- All Supabase credentials

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches:
```
https://xgcsmkapakcyqxzxpuqk.supabase.co/auth/v1/callback
```

### Error: "Access blocked: This app's request is invalid"

**Solution**: 
1. Verify OAuth consent screen is properly configured
2. Add your email as a test user if the app is not published
3. Check that all required scopes are added

### User signs in but profile not created

**Solution**:
1. Check Supabase logs for webhook errors
2. Verify the auth webhook is deployed and running
3. Check that the `profiles` table exists and has proper permissions

### Error: "Invalid redirect URL"

**Solution**:
1. Verify the URL is added in Supabase Dashboard > Authentication > URL Configuration
2. Check that the URL in `AuthContext.tsx` matches: `/kabinda-lodge`

## Security Best Practices

1. **Never commit credentials**: Keep `.env` files in `.gitignore`
2. **Use environment variables**: Store secrets in environment variables
3. **Restrict domains**: Only add necessary domains to authorized origins
4. **Enable RLS**: Ensure Row Level Security is enabled on all tables
5. **Verify emails**: Consider requiring email verification even for OAuth users
6. **Rate limiting**: The app already has rate limiting for password logins
7. **Monitor usage**: Regularly check Google Cloud Console for unusual activity

## Additional Features

### Add More OAuth Providers

You can add more providers (GitHub, Facebook, etc.) by:
1. Following similar steps in their respective developer consoles
2. Enabling the provider in Supabase Dashboard
3. The existing code already supports multiple OAuth providers

### Customize User Experience

The `ClientAuth.tsx` component can be customized to:
- Add more user fields during signup
- Customize the redirect behavior
- Add custom error handling
- Implement additional validation

## Support

If you encounter issues:
1. Check Supabase logs in the Dashboard
2. Check browser console for client-side errors
3. Review Google Cloud Console logs
4. Verify all URLs and credentials are correct

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Auth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)

