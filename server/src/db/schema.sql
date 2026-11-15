-- MORETOGETHER — PostgreSQL Schema
-- Member 4 owns: skills, user_skills, opportunities, applications, talent_listings
-- (Other entities listed here are stubs for integration with Members 1-3, 5)

CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- trigram fuzzy search
CREATE EXTENSION IF NOT EXISTS unaccent;   -- language-aware normalisation

-- ─── Identity (Member 5 owns full profile) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  biography             TEXT,
  location              TEXT,
  remote_preference     TEXT CHECK (remote_preference IN ('remote','onsite','hybrid','flexible')),
  availability_hours_pw INT,          -- hours per week available
  language_prefs        TEXT[],
  accessibility_prefs   JSONB,
  visibility            TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','connections')),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Skills canonical registry ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skills (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  category    TEXT NOT NULL,
  aliases     TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_skills_name_trgm ON skills USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_skills_aliases ON skills USING GIN (aliases);

-- ─── User skill directions (offer / need) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_skills (
  id                 SERIAL PRIMARY KEY,
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id           INT  NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  direction          TEXT NOT NULL CHECK (direction IN ('offer','need')),
  proficiency        TEXT,            -- e.g. 'beginner','intermediate','expert' or free text
  experience_desc    TEXT,
  weight             NUMERIC(4,3) NOT NULL DEFAULT 1.0 CHECK (weight BETWEEN 0 AND 1),
  UNIQUE (user_id, skill_id, direction)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id);

-- ─── Interests ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_interests (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest   TEXT NOT NULL,
  weight     NUMERIC(4,3) NOT NULL DEFAULT 1.0 CHECK (weight BETWEEN 0 AND 1),
  PRIMARY KEY (user_id, interest)
);

-- ─── Opportunities (Member 1 owns business logic) ────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID NOT NULL REFERENCES users(id),
  title               TEXT NOT NULL,
  description         TEXT,
  type                TEXT NOT NULL,  -- job, internship, freelance, volunteering, etc.
  is_paid             BOOLEAN NOT NULL DEFAULT FALSE,
  amount_min          NUMERIC(12,2),
  amount_max          NUMERIC(12,2),
  currency            TEXT DEFAULT 'INR',
  location            TEXT,
  latitude            NUMERIC(9,6),
  longitude           NUMERIC(9,6),
  remote_mode         TEXT CHECK (remote_mode IN ('remote','onsite','hybrid','flexible')),
  required_hours_pw   INT,
  accessibility_notes TEXT,
  deadline            DATE,
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','draft','cancelled')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opp_status   ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opp_type     ON opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opp_owner    ON opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_opp_title_trgm ON opportunities USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_opp_desc_trgm  ON opportunities USING GIN (description gin_trgm_ops);

-- Required skills per opportunity with importance weights
CREATE TABLE IF NOT EXISTS opportunity_skills (
  opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  skill_id        INT  NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  importance      NUMERIC(4,3) NOT NULL DEFAULT 1.0 CHECK (importance BETWEEN 0 AND 1),
  is_mandatory    BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (opportunity_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_opp_skills_opp   ON opportunity_skills(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_skills_skill ON opportunity_skills(skill_id);

-- ─── Applications (Member 1 owns) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id  UUID NOT NULL REFERENCES opportunities(id),
  applicant_id    UUID NOT NULL REFERENCES users(id),
  message         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','shortlisted','accepted','rejected','withdrawn')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (opportunity_id, applicant_id)
);

-- ─── Talent listings (Member 2 owns) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS talent_listings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  headline      TEXT,
  availability  TEXT,
  visibility    TEXT NOT NULL DEFAULT 'public',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Opportunity interests (for weighted similarity) ─────────────────────────
CREATE TABLE IF NOT EXISTS opportunity_interests (
  opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  interest        TEXT NOT NULL,
  weight          NUMERIC(4,3) NOT NULL DEFAULT 1.0,
  PRIMARY KEY (opportunity_id, interest)
);

-- ─── Matching result cache (optional, used for Opportunity Radar) ─────────────
CREATE TABLE IF NOT EXISTS match_cache (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  match_score    NUMERIC(5,2) NOT NULL,
  component_scores JSONB NOT NULL DEFAULT '{}',
  matched_skills   JSONB NOT NULL DEFAULT '[]',
  missing_reqs     JSONB NOT NULL DEFAULT '[]',
  reasons          TEXT[],
  computed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_match_cache_user ON match_cache(user_id, match_score DESC);
