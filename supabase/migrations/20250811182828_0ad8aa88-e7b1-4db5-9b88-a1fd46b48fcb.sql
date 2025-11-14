-- Lock down auth_rate_limit table access by removing overly permissive policy
ALTER TABLE public.auth_rate_limit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can manage rate limit records" ON public.auth_rate_limit;

-- No replacement policies are added so that only SECURITY DEFINER functions (owned by table owner) can operate on it.
