-- The owner asked to drop the Stack and Certificates sections from the About page (imported from the old site).
UPDATE "settings"
SET "value" = regexp_replace("value", '\n## Certificates\n.*?(?=\n## |$)', '', 's')
WHERE "key" = 'about' AND "value" LIKE '%## Certificates%';
--> statement-breakpoint
UPDATE "settings"
SET "value" = regexp_replace("value", '\n## Stack\n.*?(?=\n## |$)', '', 's')
WHERE "key" = 'about' AND "value" LIKE '%## Stack%';
