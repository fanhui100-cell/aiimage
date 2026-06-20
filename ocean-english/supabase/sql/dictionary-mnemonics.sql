-- Deprecated compatibility file.
--
-- The app reads mnemonic data from public.word_mnemonics only.
-- public.dictionary_mnemonics was an older/generated table name and should not
-- be recreated. Keep this file as a no-op so old runbooks that reference the
-- path do not accidentally reintroduce the second table.

do $$
begin
  raise notice 'dictionary_mnemonics is deprecated; use public.word_mnemonics.';
end $$;
