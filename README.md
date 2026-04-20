# Pathfinder v0.1 - College Counseling Platform

AI-driven college counseling platform MVP for US high schools.

## Quick Start

1. Ensure Docker is running.
2. Run `./start.sh` to build and launch the stack.
3. Access the application:
   - Web: `http://localhost:3000`
   - API: `http://localhost:4000`
   - DB UI (Adminer): `http://localhost:8080`

## Tech Stack
- **Frontend**: React 18, Vite, TypeScript, MUI v5, Vega-Lite, TanStack Query, Zustand.
- **Backend**: Node.js 20, Express, TypeScript, Prisma (MySQL), Lucia Auth.
- **Agents**: BullMQ + Redis for background processing.

## FERPA/COPPA Compliance Checklist

- [x] **COPPA**: Blocking sign-up for students under 13.
- [x] **FERPA**: `shareWithParents` toggle on `Student` model enforced in API middleware.
- [x] **Data Encryption**: AES-256-GCM encryption for all sensitive API keys in the database.
- [x] **Audit Logs**: All PII reads and admin configuration changes are logged to `audit_logs`.
- [x] **No PII in Git**: `.gitignore` strictly enforced; `.env` never committed.
- [x] **Session Management**: Secure cookies with Lucia Auth.

## Testing

### Backend Tests
Ensure the API logic and RBAC are correct:
```bash
cd api
npm test
```

### Frontend Tests
Verify UI components and rendering stability:
```bash
cd web
npm test
```

## Enabling Agents
Go to `/admin/settings` (as Admin) to toggle:
- **Opportunity Scout**: Background web scraping for local clubs.
- **Report Generator**: Automated PDF report generation with charts.
- **GuardianAgent**: Always On (cannot be disabled).

## Cleanup
Run `./cleanup.sh` to stop containers and prune volumes.
