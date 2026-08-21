// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ROLES = [
  "SuperAdmin",
  "Admin",
  "Receptionist",
  "RestaurantLead",
] as const;

type StaffRole = (typeof ALLOWED_ROLES)[number];

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: StaffRole;
  phone?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Missing or invalid Authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      data: { user: caller },
      error: callerError,
    } = await supabase.auth.getUser();

    if (callerError || !caller) {
      throw new Error("Unauthorized");
    }

    const { data: callerProfile, error: profileError } = await adminClient
      .from("users")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (profileError || !callerProfile) {
      throw new Error("Unable to verify caller permissions");
    }

    if (!["Admin", "SuperAdmin"].includes(callerProfile.role)) {
      throw new Error("Only administrators can create staff accounts");
    }

    const body: CreateUserRequest = await req.json();
    const email = body.email?.trim();
    const password = body.password;
    const name = body.name?.trim();
    const role = body.role;
    const phone = body.phone?.trim() || null;

    if (!email || !password || !name || !role) {
      throw new Error("Name, email, password, and role are required");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    if (!ALLOWED_ROLES.includes(role)) {
      throw new Error("Invalid staff role");
    }

    if (
      (role === "Admin" || role === "SuperAdmin") &&
      callerProfile.role !== "SuperAdmin"
    ) {
      throw new Error(
        "Only Super Administrators can create Admin or SuperAdmin users"
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
      throw createError;
    }

    if (!created.user) {
      throw new Error("User creation failed");
    }

    // Ensure public.users has the intended staff role/phone even if the
    // auth trigger defaulted anything.
    const { error: upsertError } = await adminClient.from("users").upsert(
      {
        id: created.user.id,
        email,
        name,
        role,
        phone,
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      console.error("Failed to upsert public.users profile:", upsertError);
      throw new Error(
        `Auth user created but profile save failed: ${upsertError.message}`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: created.user.id,
          email,
          name,
          role,
          phone,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in admin-create-user:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
