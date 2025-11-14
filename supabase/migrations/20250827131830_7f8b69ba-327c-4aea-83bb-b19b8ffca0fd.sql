-- Enable leaked password protection for better security
-- This addresses the security linter warning about password protection

-- Enable password strength and leaked password protection
UPDATE auth.config 
SET 
  password_min_length = 8,
  password_require_upper = true,
  password_require_lower = true,
  password_require_numbers = true,
  password_require_symbols = false,
  hibp_enabled = true
WHERE TRUE;