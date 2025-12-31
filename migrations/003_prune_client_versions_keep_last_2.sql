-- Keep only the last 2 client versions (by created_at DESC, id DESC)
-- and remove all older rows.

WITH keep AS (
    SELECT id
    FROM client_versions
    ORDER BY created_at DESC NULLS LAST, id DESC
    LIMIT 2
)
DELETE FROM client_versions
WHERE id NOT IN (SELECT id FROM keep);

-- Ensure only one active version remains among the kept rows
WITH keep AS (
    SELECT id
    FROM client_versions
    ORDER BY created_at DESC NULLS LAST, id DESC
    LIMIT 2
), chosen_active AS (
    SELECT id
    FROM client_versions
    WHERE id IN (SELECT id FROM keep)
      AND is_active = true
    ORDER BY created_at DESC NULLS LAST, id DESC
    LIMIT 1
)
UPDATE client_versions
SET is_active = (id IN (SELECT id FROM chosen_active))
WHERE id IN (SELECT id FROM keep);
