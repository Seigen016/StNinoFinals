-- LRN (DepEd Learner Reference Number) is 12 digits; these were created as VARCHAR(11)
ALTER TABLE users ALTER COLUMN lrn TYPE VARCHAR(12);
ALTER TABLE admissions ALTER COLUMN lrn TYPE VARCHAR(12);
