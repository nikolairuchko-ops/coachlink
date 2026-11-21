-- COACH LINK 4.0 hardening and realtime support
-- Applied to Supabase project gozakkwuwkylvcugtmps.

REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (display_name) ON TABLE public.profiles TO authenticated;

REVOKE ALL ON TABLE public.qr_login_requests FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.join_coach_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_coach_by_code(text) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='coach_athletes') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_athletes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='coach_athlete_requests') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_athlete_requests';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='skill_records') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.skill_records';
  END IF;
END $$;
