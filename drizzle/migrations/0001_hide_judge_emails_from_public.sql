REVOKE SELECT ON public.scores, public.judge_assignments, public.judges FROM anon, authenticated;
GRANT SELECT (id, judge_name, team_number, round, category_scores, total_score, created_at) ON public.scores TO anon, authenticated;
GRANT SELECT (id, judge_name, team_number, round, created_at) ON public.judge_assignments TO anon, authenticated;
GRANT SELECT (id, name, created_at) ON public.judges TO anon, authenticated;