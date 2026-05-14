-- Fix company names imported from SIIGO before the array-join fix.
-- SIIGO returns name as a JSON array for natural persons; the pg driver
-- serialized JS arrays as {el1,el2} PostgreSQL notation into the VARCHAR column.
-- This update reads the original SIIGO payload from siigo_customer_integrations
-- and re-derives the correct name.

UPDATE companies c
SET
  name       = sub.fixed_name,
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (sci.company_id)
    sci.company_id,
    CASE
      WHEN jsonb_typeof(sci.request_payload -> 'name') = 'array'
        THEN (
          SELECT string_agg(elem, ' ')
          FROM jsonb_array_elements_text(sci.request_payload -> 'name') AS elem
        )
      ELSE sci.request_payload ->> 'name'
    END AS fixed_name
  FROM siigo_customer_integrations sci
  WHERE sci.status = 'success'
    AND sci.operation = 'import'
  ORDER BY sci.company_id, sci.created_at DESC
) sub
WHERE c.id = sub.company_id
  AND c.name LIKE '{%}';
