import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "https://nikolairuchko-ops.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Authentication required" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const secretMap = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || secretMap.default;
    if (!url || !anonKey || !serviceKey) throw new Error("Supabase server credentials are not configured.");

    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: authData, error: authError } = await caller.auth.getUser(token);
    if (authError || !authData.user || authData.user.is_anonymous) {
      return json({ error: "Valid authenticated session required" }, 401);
    }

    const { data: callerProfile, error: roleError } = await caller
      .from("profiles").select("role").eq("id", authData.user.id).single();
    if (roleError || callerProfile.role !== "admin") return json({ error: "Admin access required" }, 403);

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const body = await req.json();

    if (body.action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (error) return json({ error: error.message }, 400);
      const { data: profiles, error: profilesError } = await admin
        .from("profiles").select("id,display_name,role");
      if (profilesError) return json({ error: profilesError.message }, 500);
      const map = new Map((profiles || []).map((p) => [p.id, p]));
      const users = (data.users || []).map((u) => {
        const p = map.get(u.id);
        return {
          id: u.id,
          email: u.email || "",
          phone: u.phone || "",
          display_name: p?.display_name || String(u.user_metadata?.display_name || ""),
          role: p?.role || "unassigned",
          email_confirmed: Boolean(u.email_confirmed_at),
          phone_confirmed: Boolean(u.phone_confirmed_at),
        };
      });
      return json({ users });
    }

    if (body.action !== "create") return json({ error: "Unknown action" }, 400);
    const displayName = String(body.display_name || "").trim();
    const role = String(body.role || "");
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const validPhone = /^\+[1-9]\d{7,14}$/.test(phone);
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!displayName || displayName.length < 2 || displayName.length > 100 ||
        !["coach", "athlete"].includes(role) ||
        !(validPhone || (validEmail && password.length >= 8)) ||
        (phone && !validPhone)) {
      return json({
        error: "Укажи имя, корректный телефон в формате +380XXXXXXXXX или email с паролем от 8 символов и роль тренера/спортсмена."
      }, 400);
    }

    const attributes = validPhone
      ? { phone, user_metadata: { display_name: displayName } }
      : { email, password, email_confirm: true, user_metadata: { display_name: displayName } };

    const { data: created, error: createError } = await admin.auth.admin.createUser(attributes);
    if (createError || !created.user) return json({ error: createError?.message || "Не удалось создать аккаунт." }, 400);

    const { error: updateError } = await admin.from("profiles")
      .update({ display_name: displayName, role }).eq("id", created.user.id);
    if (updateError) {
      return json({ error: "Аккаунт создан, но профиль не обновлён: " + updateError.message, user_id: created.user.id }, 500);
    }

    return json({
      ok: true,
      user: {
        id: created.user.id,
        email: created.user.email || "",
        phone: created.user.phone || "",
        display_name: displayName,
        role,
      }
    }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Server error" }, 500);
  }
});