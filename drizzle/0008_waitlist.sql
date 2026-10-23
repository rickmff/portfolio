-- "Up next" is folded into the waitlist shelf; new and edited books can no longer pick it.
UPDATE "books" SET "status" = 'wishlist' WHERE "status" = 'next';
