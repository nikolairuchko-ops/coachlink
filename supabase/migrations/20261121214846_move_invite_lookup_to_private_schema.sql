-- Move privileged invite-code lookup out of the exposed public schema.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.join_coach_by_code(code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_user uuid := auth.uid(); v_coach uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Требуется авторизация'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=v_user AND p.role='athlete') THEN
    RAISE EXCEPTION 'Только спортсмен может подключиться к тренеру';
  END IF;
  SELECT p.id INTO v_coach FROM public.profiles p
   WHERE p.role='coach' AND p.invite_code=upper(trim(code)) LIMIT 1;
  IF v_coach IS NULL THEN RAISE EXCEPTION 'Неверный код приглашения'; END IF;
  INSERT INTO public.coach_athletes(coach_id,athlete_id) VALUES(v_coach,v_user) ON CONFLICT DO NOTHING;
  INSERT INTO public.news_subscriptions(coach_id,athlete_id) VALUES(v_coach,v_user) ON CONFLICT DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION private.join_coach_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.join_coach_by_code(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_coach_by_code(code text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$ BEGIN PERFORM private.join_coach_by_code(code); END; $$;
REVOKE ALL ON FUNCTION public.join_coach_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_coach_by_code(text) TO authenticated;
