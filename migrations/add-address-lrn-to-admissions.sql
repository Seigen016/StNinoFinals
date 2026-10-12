-- Migration: Add address (permanent/current) and LRN to the admissions table.
-- Run in Supabase SQL editor.

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL;

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS address_type TEXT DEFAULT NULL; -- 'permanent' | 'current'

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS lrn VARCHAR(11) DEFAULT NULL;
