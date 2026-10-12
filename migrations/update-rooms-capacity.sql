-- Migration: set room capacities
-- Run this in Supabase SQL editor

UPDATE rooms SET capacity = 40 WHERE name IN ('Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105', 'Room 106');
UPDATE rooms SET capacity = 45 WHERE name IN ('Room 201', 'Room 202', 'Room 203', 'Room 204', 'Room 205', 'Room 206');
UPDATE rooms SET capacity = 30 WHERE name = 'Science Lab';
UPDATE rooms SET capacity = 35 WHERE name = 'Computer Lab';
UPDATE rooms SET capacity = 60 WHERE name = 'Library';
UPDATE rooms SET capacity = 80 WHERE name = 'Audio-Visual Room';
UPDATE rooms SET capacity = 25 WHERE name = 'Home Economics Room';
UPDATE rooms SET capacity = 35 WHERE name = 'Music Room';
UPDATE rooms SET capacity = 30 WHERE name = 'Art Room';
UPDATE rooms SET capacity = 300 WHERE name = 'Gymnasium';
