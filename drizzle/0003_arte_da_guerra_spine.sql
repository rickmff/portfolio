-- The first cover imported for A Arte da Guerra was a blank black image; the replacement
-- cover is light, so refresh the spine colours derived from it (only if still the old ones).
UPDATE "books" SET "color" = '#F8F8E8', "ink" = '#111111'
WHERE "title" = 'A Arte da Guerra' AND "cover_url" = '/covers/a-arte-da-guerra.jpg' AND "color" = '#080808';
