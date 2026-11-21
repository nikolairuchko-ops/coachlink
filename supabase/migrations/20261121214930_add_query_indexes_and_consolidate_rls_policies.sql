-- Query-path indexes and RLS policy cleanup for COACH LINK 4.0.
CREATE INDEX IF NOT EXISTS coach_athletes_athlete_id_idx ON public.coach_athletes(athlete_id);
CREATE INDEX IF NOT EXISTS coach_news_coach_id_created_idx ON public.coach_news(coach_id, created_at DESC);
CREATE INDEX IF NOT EXISTS news_subscriptions_athlete_id_idx ON public.news_subscriptions(athlete_id);
CREATE INDEX IF NOT EXISTS qr_login_requests_approved_user_id_idx ON public.qr_login_requests(approved_user_id);
CREATE INDEX IF NOT EXISTS skill_records_athlete_id_created_idx ON public.skill_records(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS skill_records_coach_id_created_idx ON public.skill_records(coach_id, created_at DESC);
CREATE INDEX IF NOT EXISTS skill_records_coach_athlete_idx ON public.skill_records(coach_id, athlete_id);
CREATE INDEX IF NOT EXISTS training_tasks_athlete_id_created_idx ON public.training_tasks(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS training_tasks_coach_id_created_idx ON public.training_tasks(coach_id, created_at DESC);

DROP POLICY IF EXISTS coach_requests_cancel_own ON public.coach_athlete_requests;
DROP POLICY IF EXISTS coach_requests_respond_coach ON public.coach_athlete_requests;
CREATE POLICY coach_requests_update_involved ON public.coach_athlete_requests
FOR UPDATE TO authenticated
USING (
  (coach_id = (SELECT auth.uid()) AND status = 'pending')
  OR (athlete_id = (SELECT auth.uid()) AND status = 'pending')
)
WITH CHECK (
  (coach_id = (SELECT auth.uid()) AND status IN ('accepted','rejected'))
  OR (athlete_id = (SELECT auth.uid()) AND status = 'cancelled')
);

DROP POLICY IF EXISTS subscriptions_insert ON public.news_subscriptions;
CREATE POLICY subscriptions_insert ON public.news_subscriptions
FOR INSERT TO authenticated
WITH CHECK (
  athlete_id = (SELECT auth.uid())
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = news_subscriptions.coach_id AND p.role = 'coach')
  AND EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = news_subscriptions.coach_id AND ca.athlete_id = (SELECT auth.uid()))
);
