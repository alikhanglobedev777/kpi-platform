# Repository credential safety

Patch 17 restores the `.env*` Git ignore pattern (retaining the tracked `.env.example`).
A previous commit accidentally removed `.env*` from `.gitignore`; check that no secrets
were committed during that window. Do not paste secrets into issues, screenshots,
AI chats or terminal screenshots.

Run `node scripts/check-repo-secrets.mjs` before every push. Check untracked files:
`git status --short --untracked-files=all` and verify `.env`, `.env.local`,
service-account key JSON files, and `config.bat` never appear.

If credentials **were previously committed**, merely deleting them from the
latest revision is insufficient. Rotate/revoke the Google service-account key,
rotate any exposed Neon password and session secrets, then arrange Git history
cleanup. Making the repository private does not revoke previously leaked keys.

The test/development sheet must be a separate restricted copy. Neither this
patch nor later patches should modify production spreadsheet values.
