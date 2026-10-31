CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'password',
  provider_user_id TEXT,
  token_version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (auth_provider, provider_user_id)
);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  scheme_slug TEXT,
  scheme_name TEXT NOT NULL,
  official_url TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'ready_to_apply', 'submitted', 'under_review', 'approved', 'rejected', 'closed')),
  reference_number TEXT,
  notes TEXT NOT NULL DEFAULT '',
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS applications_user_updated_idx ON applications(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telegram_links (
  user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL UNIQUE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_eligibility_profiles (
  user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  age SMALLINT NOT NULL CHECK (age BETWEEN 1 AND 120),
  gender TEXT NOT NULL CHECK (gender IN ('female', 'male', 'other')),
  occupation TEXT NOT NULL CHECK (occupation IN ('farmer', 'farm_labour', 'student', 'salaried', 'self_employed', 'daily_wage', 'construction', 'street_vendor', 'artisan', 'unemployed', 'homemaker')),
  categories TEXT[] NOT NULL DEFAULT '{}' CHECK (categories <@ ARRAY['sc', 'st', 'obc', 'bpl', 'ews', 'minority', 'general']::TEXT[]),
  income_band TEXT NOT NULL CHECK (income_band IN ('lt50k', '50k_1l', '1l_25l', '25l_5l', '5l_8l', 'gt8l')),
  state TEXT NOT NULL,
  district TEXT,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telegram_preferences (
  user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  eligible_schemes_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  matched_scheme_ids TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telegram_link_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS telegram_link_tokens_user_idx ON telegram_link_tokens(user_id);
