/**
 * Admin Create User API
 * POST /api/admin/create-user
 * Creates a staff account via Supabase Auth Admin API (service role).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ROLES = [
  'SuperAdmin',
  'Admin',
  'Receptionist',
  'RestaurantLead',
] as const;

type StaffRole = (typeof ALLOWED_ROLES)[number];

const getAdminClient = () => {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://xgcsmkapakcyqxzxpuqk.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local (from Supabase → Project Settings → API → service_role).'
    );
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const getCallerClient = (authHeader: string) => {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://xgcsmkapakcyqxzxpuqk.supabase.co';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY3Nta2FwYWtjeXF4enhwdXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTQ3NTEsImV4cCI6MjA2NzkzMDc1MX0.N2ZaSfNJ-xOVQbevNIG7GejZPGmpImGRGIXP4uvumew';

  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const callerClient = getCallerClient(authHeader);
    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = getAdminClient();

    const { data: callerProfile, error: profileError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profileError || !callerProfile) {
      return NextResponse.json(
        { error: 'Unable to verify caller permissions' },
        { status: 403 }
      );
    }

    if (!['Admin', 'SuperAdmin'].includes(callerProfile.role)) {
      return NextResponse.json(
        { error: 'Only administrators can create staff accounts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const role = body.role as StaffRole;
    const phone =
      typeof body.phone === 'string' && body.phone.trim()
        ? body.phone.trim()
        : null;

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid staff role' }, { status: 400 });
    }

    if (
      (role === 'Admin' || role === 'SuperAdmin') &&
      callerProfile.role !== 'SuperAdmin'
    ) {
      return NextResponse.json(
        {
          error:
            'Only Super Administrators can create Admin or SuperAdmin users',
        },
        { status: 403 }
      );
    }

    const { data: created, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role,
          phone,
        },
      });

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    if (!created.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 500 }
      );
    }

    const { error: upsertError } = await adminClient.from('users').upsert(
      {
        id: created.user.id,
        email,
        name,
        role,
        phone,
      },
      { onConflict: 'id' }
    );

    if (upsertError) {
      return NextResponse.json(
        {
          error: `Auth user created but profile save failed: ${upsertError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: created.user.id,
        email,
        name,
        role,
        phone,
      },
    });
  } catch (error) {
    console.error('Error in /api/admin/create-user:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
