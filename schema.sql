-- ============================================================
-- Gotta Meet Em All — Full Database Schema
-- Run this in the Neon SQL Editor to set up a fresh database.
-- All tables must be created before the app will work.
-- ============================================================

-- ---- NextAuth tables ----------------------------------------
-- These are NOT created automatically — run them once manually.

CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT        NOT NULL,
  token      TEXT        NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS users (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT,
  email          TEXT        UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image          TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id                 SERIAL      PRIMARY KEY,
  "userId"           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type               TEXT        NOT NULL,
  provider           TEXT        NOT NULL,
  "providerAccountId" TEXT       NOT NULL,
  refresh_token      TEXT,
  access_token       TEXT,
  expires_at         BIGINT,
  id_token           TEXT,
  scope              TEXT,
  session_state      TEXT,
  token_type         TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id             SERIAL      PRIMARY KEY,
  "userId"       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires        TIMESTAMPTZ NOT NULL,
  "sessionToken" TEXT        NOT NULL UNIQUE
);

-- ---- Application tables -------------------------------------

CREATE TABLE IF NOT EXISTS consultants (
  id           SERIAL PRIMARY KEY,
  email        TEXT   UNIQUE NOT NULL,
  first_name   TEXT   NOT NULL,
  last_name    TEXT   NOT NULL,
  title        TEXT   NOT NULL DEFAULT '',
  office       TEXT   NOT NULL DEFAULT '',
  bio          TEXT   NOT NULL DEFAULT '',
  skills       TEXT   NOT NULL DEFAULT '',
  photo_url    TEXT   NOT NULL DEFAULT '',
  photo_url_l1 TEXT   NOT NULL DEFAULT '',
  photo_url_l2 TEXT   NOT NULL DEFAULT '',
  photo_url_l3 TEXT   NOT NULL DEFAULT ''
);

-- Opaque, single-use pointers to real magic-link URLs. Lets the email
-- contain only a meaningless ticket instead of the real sign-in token,
-- so corporate link-scanning gateways can't consume the real token by
-- fetching/crawling the link before the user clicks it.
CREATE TABLE IF NOT EXISTS link_tickets (
  ticket     TEXT        PRIMARY KEY,
  url        TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tracks magic-link send requests so we can rate-limit sign-in spam
-- (e.g. email-bombing a coworker, or burning the Resend send quota).
CREATE TABLE IF NOT EXISTS sign_in_attempts (
  id         SERIAL      PRIMARY KEY,
  identifier TEXT        NOT NULL,
  ip         TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sign_in_attempts_identifier_idx ON sign_in_attempts (identifier, created_at);
CREATE INDEX IF NOT EXISTS sign_in_attempts_ip_idx ON sign_in_attempts (ip, created_at);

CREATE TABLE IF NOT EXISTS catches (
  user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consultant_id INTEGER      NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  level         SMALLINT     NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
  caught_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, consultant_id)
);

-- One row per SEI office/region. The slug is the URL segment (/office/cincinnati).
-- unlock_xp = global XP a user must have to browse this office.
-- 0 = always accessible; >0 = locked until threshold is reached.
CREATE TABLE IF NOT EXISTS offices (
  id          SERIAL  PRIMARY KEY,
  name        TEXT    UNIQUE NOT NULL,  -- matches consultants.office exactly
  slug        TEXT    UNIQUE NOT NULL,
  unlock_xp   INTEGER NOT NULL DEFAULT 0,
  description TEXT    NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Seed the initial offices.
INSERT INTO offices (name, slug, unlock_xp, description, sort_order) VALUES
  ('Cincinnati', 'cincinnati', 0,   'Home base.',      1),
  ('Services',   'services',   0,   'SEI Services.',   2),
  ('Charlotte',  'charlotte',  100, 'Charlotte office.', 3)
ON CONFLICT (name) DO NOTHING;
