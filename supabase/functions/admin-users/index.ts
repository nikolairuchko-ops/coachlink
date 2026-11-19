import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });
  try {
    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\\s+/i, "");
    if (!token) return Response.json({ error: "Authentication required" }, { status: 401, headers: cors });
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: authData, error: authError } = await caller.auth.getUser(token);
    if (authError || !authData.user) return Response.json({ error: "Invalid session" }, { status: 401, headers: cors });
    const { data: callerProfile, error: roleError } = await caller.from("profiles").select("role").eq("id", authData.user.id).single();
    if (roleError || callerProfile.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403, headers: cors });
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const body = await req.json();
    if (body.action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (error) return Response.json({ error: error.message }, { status: 400, headers: cors });
      const { data: profiles, error: profilesError } = await admin.from("profiles").select("id,display_name,role");
      if (profilesError) return Response.json({ error: profilesError.message }, { status: 500, headers: cors });
      const map = new Map((profiles || []).map((p) => [p.id, p]));
      const users = (data.users || []).map((u) => {
        const p = map.get(u.id);
        return { id: u.id, email: u.email || "", display_name: p?.display_name || String(u.user_metadata?.display_name || ""), role: p?.role || "unassigned", email_confirmed: Boolean(u.email_confirmed_at) };
      });
      return Response.json({ users }, { headers: cors });
    }
    if (body.action !== "create") return Response.json({ error: "Unknown action" }, { status: 400, headers: cors });
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const displayName = String(body.display_name || "").trim();
    const role = String(body.role || "");
    if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || password.length < 8 || !displayName || !["coach", "athlete"].includes(role)) {
      return Response.json({ error: "Укажи корректный email, имя, пароль от 8 символов и роль тренера или спортсмена." }, { status: 400, headers: cors });
    }
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: displayName } });
    if (createError || !created.user) return Response.json({ error: createError?.message || "Не удалось создать аккаунт." }, { status: 400, headers: cors });
    const { error: updateError } = await admin.from("profiles").update({ display_name: displayName, role }).eq("id", created.user.id);
    if (updateError) return Response.json({ error: "Аккаунт создан, но роль профиля не обновилась: " + updateError.message, user_id: created.user.id }, { status: 500, headers: cors });
    return Response.json({ ok: true, user: { id: created.user.id, email, display_name: displayName, role } }, { status: 201, headers: cors });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500, headers: cors });
  }
});