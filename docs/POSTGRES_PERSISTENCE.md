# BOS PostgreSQL persistence

Point 11 implementation notes.

## Runtime

BOS uses PostgreSQL through the `postgres` Node.js client. The application reads `DATABASE_URL`.

No database credentials are committed to the repository.

## Configure

Set a PostgreSQL connection string in the deployment/local environment:

```
DATABASE_URL=postgresql://...
```

Then install dependencies and apply migrations:

```bash
npm install
npm run db:migrate
```

Migration state is stored in `bos_schema_migrations`.

## Application behavior during transition

The UI now reads Onboarding data through `lib/bos/onboardingRepository.ts`.

- when `DATABASE_URL` exists, reads come from PostgreSQL;
- when it is absent, the repository returns the point 6–8 demo fixtures so the existing preview remains usable.

This fallback is temporary and should be removed once the first real organization is provisioned and authentication/organization context exists.

## Persistence commands implemented

The repository contains database commands for:
- create Standard + first published StandardVersion + tasks in one transaction;
- archive Standard;
- create OnboardingProcess and its task-progress rows in one transaction;
- update individual task progress;
- close a process only when every task is DONE, creating OnboardingClosure and closing the process in one transaction.

Interactive forms are deliberately not allowed to invent actor IDs. They will be connected after authentication and organization membership are implemented in points 12–13.

## Tenant boundary

Repository methods accept an organization ID and all PostgreSQL reads/writes constrain tenant-owned records by organization ID. The current default demo organization ID is transitional only; it must be replaced by the organization derived from the authenticated Membership in point 13.

## Next migration rule

Do not edit an already applied migration in production. Add `002_...`, `003_...` etc.
