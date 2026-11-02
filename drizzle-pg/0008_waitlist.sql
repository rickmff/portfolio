-- "Up next" is folded into the waitlist shelf; new and edited books can no longer pick it.
-- Dynamic SQL so a fresh database (where 0002 added these enum values in the same transaction)
-- never casts them; it only runs when there is something to move.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "books" WHERE "status"::text = 'next') THEN
    EXECUTE 'UPDATE "books" SET "status" = ''wishlist'' WHERE "status"::text = ''next''';
  END IF;
END $$;
