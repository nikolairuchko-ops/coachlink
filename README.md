# COACH LINK 4.0 — Equilibrium Training

Mobile-first cloud platform for coaches and athletes. Built as a static HTML application with Supabase Auth, Postgres Row Level Security and Realtime.

## Included
- Separate coach and athlete login flows.
- Signup always creates an athlete profile. Coach privileges must be granted by an administrator.
- Coach workspace: roster, invite code, training assignments, athlete reports, skill records and team news.
- Athlete workspace: join a coach by invite code, view assignments, track sets/time, send progress reports and view skill records/news.
- Manual athlete-name entry in the coach task builder; the entered name must match a connected team member.
- Live synchronization for tasks, team links, requests, skill records and coach news.
- Mobile navigation and responsive dark/cyber visual design.

## Supabase project
- URL: https://gozakkwuwkylvcugtmps.supabase.co
- Browser uses only the public publishable key. Never put a Supabase secret or service_role key in this repository.
- Existing schema includes profiles, coach_athletes, training_tasks, coach_news, news_subscriptions, skill_records, coach_athlete_requests, coach_public_profiles and QR login request infrastructure.
- Applied migrations:
  - `20261121210000_harden_profile_roles_and_enable_team_realtime`
  - `20261121214846_move_invite_lookup_to_private_schema`
  - `20261121214930_add_query_indexes_and_consolidate_rls_policies`

## Deploy
1. Serve `index.html` over HTTPS (GitHub Pages or another static host).
2. In Supabase Authentication, enable Email provider.
3. Add the final site URL to Authentication → URL Configuration → Redirect URLs.
4. Register an athlete account and verify email if confirmation is enabled.
5. Promote a trusted account to `coach` using the Supabase admin workflow, then assign a unique invite_code.
6. The coach shares the code; the athlete signs in and enters it in the Team tab.

## Security notes
- Choosing the coach button at signup does not grant coach privileges.
- Browser users can update only `profiles.display_name`; role and invite_code are not client-editable.
- QR login request records are not directly exposed to anon/authenticated browser roles.
- Invite-code joining uses the authenticated `join_coach_by_code` RPC. Its public wrapper runs as invoker; privileged lookup is isolated in the non-exposed `private` schema and checks caller identity and athlete role.
- RLS is the source of truth for row-level access. UI visibility is not an authorization boundary.

## Verification status
The three database migrations have been applied and verified. Profile update privileges were checked at column level. The privileged invite lookup is no longer in the exposed public schema. Realtime publication includes coach_athletes, coach_athlete_requests, skill_records, training_tasks and coach_news. End-to-end testing with two separate real accounts and final hosting/redirect configuration remains before production launch.
