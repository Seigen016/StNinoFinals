-- Backfill users.gender for students, teachers and parents.
--
-- HOW TO USE (Supabase SQL editor): paste this whole file and click Run.
--   1. With save = false (below) it only PREVIEWS: one row per person whose
--      gender is blank or invalid, showing the proposed value and its source.
--      Nothing is changed.
--   2. Happy with it? Change `false` to `true` on the settings line, Run again.
--      The same list comes back, now saved.
-- It is a single statement, so there are no steps to run in order.
--
-- Where the value comes from, most reliable first:
--   existing     – a stored 'm' / 'male' / 'F' etc., normalized to Male/Female
--   relationship – guardians: linked to a student as father/mother/uncle/aunt...
--                  (skipped if their links disagree)
--   first name   – best guess from common Filipino given names; gender-neutral
--                  names (Angel, Jan, Kim, Jamie, Alex, Shane...) are not listed
--   (none)       – stays blank; set it with the Gender drop-down in the admin
--                  Students / Teachers / Parents tables
--
-- Only blank or invalid values are touched, so an admin-set Male/Female is never
-- overwritten and running it again is safe. A wrong guess in the preview? Remove
-- that name from the list below, or fix it afterwards with the drop-down.

WITH settings AS (
  SELECT false AS save            -- ← change to true to save
),
names (name, gender) AS (
  SELECT unnest(ARRAY[
  'aaron','adrian','aldrin','alfred','allan','alvin','andrei','andres','andrew','angelo','anthony','antonio',
  'archie','arnel','arnold','arthur','axel','benedict','benjamin','bernard','bienvenido','bryan','brian','bryle',
  'carl','carlo','carlos','cedric','charles','christian','christopher','clarence','clark','daniel','danilo','darwin',
  'david','dennis','dominic','edgar','edison','eduardo','edward','edwin','elijah','emmanuel','enrico','enrique',
  'eric','erwin','ethan','eugene','felix','ferdinand','fernando','francis','francisco','frederick','gabriel','gerald',
  'gilbert','gino','glenn','gregorio','harold','henry','ian','isaac','ivan','jacob','jaime','james','jason','jay',
  'jayson','jaypee','jeffrey','jerome','jerry','jesus','jhon','jhun','joel','john','johnny','jomar','jonathan',
  'jose','joseph','joshua','juan','julius','jun','justin','karl','kenneth','ken','kevin','kurt','kyle','lance',
  'lawrence','leo','leonardo','lester','louie','luis','manuel','marc','marco','mario','mark','marlon','martin',
  'marvin','matthew','michael','miguel','mike','nathan','nathaniel','neil','nelson','nicholas','noel','oliver',
  'oscar','patrick','paolo','paul','pedro','peter','philip','rafael','ralph','ramon','randy','raphael','raymond',
  'renz','rey','reynaldo','ricardo','richard','rico','robert','roberto','rodel','rodrigo','rogelio','roland',
  'romeo','ronald','ronnie','ruel','ryan','salvador','samuel','sean','sebastian','stephen','steven','teodoro',
  'timothy','tristan','vincent','virgilio','wilfredo','william','zachary'
  ]), 'Male'
  UNION ALL
  SELECT unnest(ARRAY[
  'abigail','ailyn','aileen','aira','alexa','alma','althea','alyssa','amelia','ana','andrea','angela','angelica',
  'angelie','angeline','anna','anne','annie','april','arlene','ashley','audrey','bea','beatrice','bernadette',
  'carla','carmela','carmen','carol','catherine','cecilia','charlene','charmaine','cherry','christine','claire',
  'clarissa','cristina','cynthia','daisy','danica','daphne','diana','divina','donna','dorothy','elaine','elena',
  'elizabeth','ella','ellen','eloisa','emily','erica','erika','estrella','esther','eunice','evelyn','faith',
  'fatima','flordeliza','florence','frances','gemma','gina','gladys','glenda','gloria','grace','hannah','hazel',
  'helen','irene','isabel','isabella','ivy','jane','janet','janice','janine','jasmine','jeanette','jenny',
  'jennifer','jessa','jessica','joan','joanna','jocelyn','josephine','joy','joyce','judith','julia','julie',
  'juliet','karen','katherine','kathleen','kathryn','katrina','kimberly','kristine','kristina','lara','laura',
  'lea','leah','leizel','liezel','lily','lorna','lorraine','lourdes','lovely','lucia','lyka','lynn','ma','ma.',
  'maria','mariel','marilyn','marissa','maricel','maricar','marites','martha','mary','maureen','melanie','melissa',
  'merly','michelle','mikaela','monica','myla','nancy','natalie','nicole','nina','norma','olivia','pamela',
  'patricia','pauline','precious','princess','rachel','rebecca','regina','rhea','rica','rizza','rosa','rosalie',
  'rose','rosemarie','ruby','ruth','sandra','sarah','sharon','sheila','shiela','sofia','sophia','stephanie','susan',
  'teresa','theresa','trisha','valerie','vanessa','veronica','victoria','vilma','wendy','yvonne','zenaida'
  ]), 'Female'
),
relationship AS (
  -- user_relationships.user_id is the guardian
  SELECT user_id, min(g) AS gender
  FROM (
    SELECT user_id,
           CASE
             WHEN lower(relationship_type) IN ('father', 'uncle', 'grandfather', 'brother', 'stepfather') THEN 'Male'
             WHEN lower(relationship_type) IN ('mother', 'aunt', 'grandmother', 'sister', 'stepmother') THEN 'Female'
           END AS g
    FROM user_relationships
  ) t
  WHERE g IS NOT NULL
  GROUP BY user_id
  HAVING count(DISTINCT g) = 1
),
candidates AS (
  SELECT u.id, u.role, u.student_number, u.first_name, u.last_name, u.gender AS old_gender,
         CASE WHEN lower(trim(u.gender)) IN ('m', 'male') THEN 'Male'
              WHEN lower(trim(u.gender)) IN ('f', 'female') THEN 'Female' END AS from_existing,
         CASE WHEN u.role = 'parent' THEN r.gender END AS from_relationship,
         n.gender AS from_name
  FROM users u
  LEFT JOIN relationship r ON r.user_id = u.id
  LEFT JOIN names n ON n.name = lower(split_part(trim(u.first_name), ' ', 1))
  WHERE u.role IN ('student', 'teacher', 'parent')
    AND (u.gender IS NULL OR u.gender NOT IN ('Male', 'Female'))
),
proposed AS (
  SELECT c.*,
         COALESCE(from_existing, from_relationship, from_name) AS new_gender,
         CASE WHEN from_existing IS NOT NULL THEN 'existing'
              WHEN from_relationship IS NOT NULL THEN 'relationship'
              WHEN from_name IS NOT NULL THEN 'first name'
              ELSE '(none) - set manually' END AS source
  FROM candidates c
),
saved AS (
  -- runs only when save = true; invalid values with no proposal become blank
  UPDATE users u
  SET gender = p.new_gender
  FROM proposed p, settings s
  WHERE s.save
    AND u.id = p.id
    AND u.gender IS DISTINCT FROM p.new_gender
  RETURNING u.id
)
SELECT CASE WHEN (SELECT save FROM settings) THEN 'saved' ELSE 'preview' END AS mode,
       p.role, p.student_number, p.first_name, p.last_name,
       p.old_gender, p.new_gender, p.source
FROM proposed p
ORDER BY (p.new_gender IS NULL), p.source, p.role, p.last_name, p.first_name;

-- Optional: set or correct many at once from a list (e.g. copied out of a
-- spreadsheet). Matches on email, which every role has. Replace the example
-- rows, then run just this statement. Unlike the above, this DOES overwrite.
--
-- UPDATE users u
-- SET gender = v.gender
-- FROM (VALUES
--   ('juan.delacruz@example.com', 'Male'),
--   ('maria.santos@example.com',  'Female')
-- ) AS v(email, gender)
-- WHERE lower(u.email) = lower(v.email)
--   AND v.gender IN ('Male', 'Female');
