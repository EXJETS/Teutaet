-- Flex/Lane – PostgreSQL schema
-- Run once: psql $DATABASE_URL -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users (passengers) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT         UNIQUE NOT NULL,
  name               TEXT,
  stripe_customer_id TEXT         UNIQUE,
  created_at         TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Operators (B2B network / GNet-style partners) ─────────────────────────
CREATE TABLE IF NOT EXISTS operators (
  id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT         NOT NULL,
  contact_email             TEXT,
  api_endpoint              TEXT,                          -- POST webhook for ride broadcast
  wholesale_rate_multiplier NUMERIC(5,4) NOT NULL DEFAULT 0.7000, -- fraction of passenger total
  is_active                 BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Bookings ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  reference                 TEXT         UNIQUE NOT NULL,    -- e.g. FL-4912-X

  -- Participants
  passenger_id              UUID         REFERENCES users(id),
  operator_id               UUID         REFERENCES operators(id),

  -- Service
  vehicle_class             TEXT         NOT NULL,           -- biz | suv | first
  trip_type                 TEXT         NOT NULL,           -- One-way | By the hour

  -- Locations
  pickup_address            TEXT         NOT NULL,
  pickup_lat                NUMERIC(10,7),
  pickup_lon                NUMERIC(10,7),
  dropoff_address           TEXT,
  dropoff_lat               NUMERIC(10,7),
  dropoff_lon               NUMERIC(10,7),

  -- Schedule
  pickup_at                 TIMESTAMPTZ  NOT NULL,
  duration_hours            INT,                             -- hourly bookings only
  distance_miles            NUMERIC(7,1),

  -- Flight tracking
  flight_number             TEXT,
  flight_origin             TEXT,
  flight_destination        TEXT,
  flight_scheduled_at       TIMESTAMPTZ,
  flight_actual_at          TIMESTAMPTZ,
  pickup_adjusted_at        TIMESTAMPTZ,                    -- recomputed on delay

  -- Financials (USD)
  base_fare                 NUMERIC(10,2) NOT NULL,
  tax_and_fees              NUMERIC(10,2) NOT NULL,
  chauffeur_tip             NUMERIC(10,2) NOT NULL DEFAULT 0, -- 20% built-in
  total_passenger           NUMERIC(10,2) NOT NULL,          -- held amount
  operator_payout           NUMERIC(10,2),                   -- set on acceptance
  platform_commission       NUMERIC(10,2),                   -- set on completion

  -- Stripe
  stripe_payment_intent_id  TEXT,
  stripe_customer_id        TEXT,
  stripe_charge_id          TEXT,

  -- State machine
  status                    TEXT         NOT NULL DEFAULT 'offered'
    CHECK (status IN ('offered','accepted','in_progress','completed','cancelled')),

  -- Timestamps
  offered_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  accepted_at               TIMESTAMPTZ,
  in_progress_at            TIMESTAMPTZ,
  completed_at              TIMESTAMPTZ,
  cancelled_at              TIMESTAMPTZ,

  -- Notes
  passenger_notes           TEXT,
  chauffeur_notes           TEXT,
  pickup_sign               TEXT,

  created_at                TIMESTAMPTZ  DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Audit log ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT        NOT NULL,
  actor       TEXT        NOT NULL DEFAULT 'system',  -- passenger|operator|chauffeur|system
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_status     ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_reference  ON bookings(reference);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger  ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_operator   ON bookings(operator_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_at  ON bookings(pickup_at);
CREATE INDEX IF NOT EXISTS idx_events_booking_id   ON booking_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at   ON booking_events(created_at);

-- ─── Auto-update trigger ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Seed: demo operator ───────────────────────────────────────────────────
INSERT INTO operators (name, contact_email, wholesale_rate_multiplier, is_active)
VALUES ('Premium Fleet Partners', 'ops@premiumfleet.example', 0.7000, TRUE)
ON CONFLICT DO NOTHING;
