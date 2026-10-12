-- Migration: create rooms table
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  capacity INTEGER,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed with existing hardcoded rooms
INSERT INTO rooms (name) VALUES
  ('Room 101'),
  ('Room 102'),
  ('Room 103'),
  ('Room 104'),
  ('Room 105'),
  ('Room 106'),
  ('Room 201'),
  ('Room 202'),
  ('Room 203'),
  ('Room 204'),
  ('Room 205'),
  ('Room 206'),
  ('Science Lab'),
  ('Computer Lab'),
  ('Library'),
  ('Audio-Visual Room'),
  ('Home Economics Room'),
  ('Music Room'),
  ('Art Room'),
  ('Gymnasium')
ON CONFLICT (name) DO NOTHING;
