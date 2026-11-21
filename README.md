# COACH LINK 4.0 — Equilibrium Training

Mobile-first cloud platform for coaches and athletes. Built as a static HTML application with Supabase Auth, Postgres Row Level Security and Realtime.

## Included
- Separate coach and athlete login flows.
- Signup always creates an athlete profile. Coach privileges must be granted by an administrator.
- Coach workspace: roster, invite code, training assignment, athlete reports, skill records and team news.
- Athlete workspace: join a coach by invite code, view assignments, track sets/time, send progress reports and view skill records/news.
- Manual athlete-name entry in the coach task builder; name must match a connected team member.
- Live synchronization for tasks, team links, requests, skill records and coach news.
- Mobile navigation and responsive dark/cyber visual design.

## Supabase project
- URL: https://gozakkwuwkylvcugtmps.supabase.co
- Browser uses only the public publishable key. Never put a Supabase secret or service_role key in this repository.
- Existing project schema includes profiles, coach_athletes, training_tasks, coach_news, news_subscriptions, skill_records, coach_athlete_requests, coach_public_profiles and QR login request infrastructure.
- Migration `supabase/migrations/20261121210000_harden_profiles_and_realtime.sql` has been applied to the connected project.

## Deploy
1. Serve `index.html` over HTTPS (GitHub Pages or another static host).
2. In Supabase Authentication, enable Email provider.
3. Add the final site URL to Authentication → URL Configuration → Redirect URLs.
4. Register an athlete account and verify email if confirmation is enabled.
5. Promote a trusted account to `coach` using the Supabase admin workflow, then assign a unique invite_code.
6. The coach shares the code; the athlete signs in and enters it in the Team tab.

## Important security notes
- Choosing the coach button at signup does not grant coach privileges.
- The browser can update only `profiles.display_name`; role and invite_code are not client-editable.
- QR login request records are not directly exposed to anon/authenticated browser roles.
- Invite-code joining is performed by the authenticated `join_coach_by_code` RPC. Its public wrapper runs as invoker; the privileged lookup is isolated in the non-exposed `private` schema and checks caller identity and athlete role.
- RLS remains the source of truth for row-level access. UI visibility is not an authorization boundary.

## Verification status
The hardening migration was applied and verified against the connected Supabase project. Realtime publication includes coach_athletes, coach_athlete_requests, skill_records, training_tasks and coach_news. The web app was committed to the release branch. End-to-end testing with two real user accounts and final hosting/redirect configuration is still required before production launch.
