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
  id         SERIAL PRIMARY KEY,
  email      TEXT   UNIQUE NOT NULL,
  first_name TEXT   NOT NULL,
  last_name  TEXT   NOT NULL,
  title      TEXT   NOT NULL DEFAULT '',
  office     TEXT   NOT NULL DEFAULT '',
  bio        TEXT   NOT NULL DEFAULT '',
  skills     TEXT   NOT NULL DEFAULT ''
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

CREATE TABLE IF NOT EXISTS catches (
  user_id       UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consultant_id INTEGER NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, consultant_id)
);
