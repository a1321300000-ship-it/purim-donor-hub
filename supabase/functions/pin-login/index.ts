import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const KIOSK_EMAIL = "kiosk@purim-donor-hub.local";

function randomPassword(len = 48): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, len);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { pin } = await req.json().catch(() => ({ pin: "" }));
    if (typeof pin !== "string" || pin.length === 0 || pin.length > 32) {
      return new Response(JSON.stringify({ error: "invalid_pin" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // 1) Read configured PIN
    const { data: pinRow } = await admin.from("settings").select("value").eq("key", "access_pin").maybeSingle();
    let storedPin = "9999";
    const v = pinRow?.value as any;
    if (typeof v === "string") storedPin = v;
    else if (v && typeof v === "object" && typeof v.pin === "string") storedPin = v.pin;

    if (!safeEqual(pin, storedPin)) {
      // small delay to slow brute force
      await new Promise((r) => setTimeout(r, 400));
      return new Response(JSON.stringify({ error: "wrong_pin" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Ensure kiosk user exists; fetch or create credentials
    let { data: creds } = await admin.from("auth_kiosk").select("*").eq("id", 1).maybeSingle();

    if (!creds) {
      const password = randomPassword(48);
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: KIOSK_EMAIL,
        password,
        email_confirm: true,
      });
      if (createErr) {
        // Maybe user already exists from a prior run — try to find then update password
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users?.find((u: any) => u.email === KIOSK_EMAIL);
        if (!existing) {
          return new Response(JSON.stringify({ error: "kiosk_user_create_failed", detail: createErr.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await admin.auth.admin.updateUserById(existing.id, { password });
        await admin.from("auth_kiosk").insert({ id: 1, email: KIOSK_EMAIL, password, user_id: existing.id });
      } else {
        await admin.from("auth_kiosk").insert({ id: 1, email: KIOSK_EMAIL, password, user_id: created.user?.id });
      }
      creds = { id: 1, email: KIOSK_EMAIL, password, user_id: created?.user?.id } as any;
    }

    // 3) Sign in to obtain tokens
    const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    let { data: session, error: signErr } = await authClient.auth.signInWithPassword({
      email: creds!.email,
      password: creds!.password,
    });

    // If signIn fails (password drift), reset password and retry once
    if (signErr || !session?.session) {
      const newPass = randomPassword(48);
      if (creds!.user_id) {
        await admin.auth.admin.updateUserById(creds!.user_id, { password: newPass });
      }
      await admin.from("auth_kiosk").update({ password: newPass, updated_at: new Date().toISOString() }).eq("id", 1);
      const retry = await authClient.auth.signInWithPassword({ email: creds!.email, password: newPass });
      if (retry.error || !retry.data?.session) {
        return new Response(JSON.stringify({ error: "signin_failed", detail: retry.error?.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      session = retry.data;
    }

    return new Response(
      JSON.stringify({
        access_token: session!.session!.access_token,
        refresh_token: session!.session!.refresh_token,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "server_error", detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
