-- Migration: Add suffix column to users table
-- Run in Supabase SQL editor.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS suffix TEXT DEFAULT NULL;
