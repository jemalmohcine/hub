-- Remove demo rows shipped in 026 (not for production).
delete from public.veille_ia_items
where 'exemple-dev' = any (tags);
