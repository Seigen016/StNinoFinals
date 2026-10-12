-- Migration: Add suffix and parent_email to admissions table
-- Run in Supabase SQL editor.

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS suffix TEXT DEFAULT NULL;

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS parent_email TEXT DEFAULT NULL;
