# Pathfinder v0.1 - College Counseling Platform

AI-driven college counseling platform MVP for US high schools.

## Quick Start

1. Ensure Docker is running.
2. Run `./start.sh --demo` to build and launch the stack with a large-scale demo dataset.
3. Access the application:
   - **Student Portal**: `http://localhost:3000/student-login`
   - **Parent Portal**: `http://localhost:3000/parent-login`
   - **Counselor Portal**: `http://localhost:3000/counselor-login`
   - **Admin Portal**: `http://localhost:3000/admin-login`
   - **DB UI (Adminer)**: `http://localhost:8080`

## AI Quickstart (Agents & Chat)

The platform features AI Agents for **Interview Prep**, **Opportunity Scouting**, and **Academic Roadmaps**. You can use a cloud provider or run a model locally on your MacBook.

### 1. Configure the LLM
Edit your `.env` file to choose your provider:

**Option A: Local (Ollama - Recommended for privacy)**
1. Install [Ollama](https://ollama.com/).
2. **Network Setup**: By default, Ollama only listens to `localhost`. To allow the Docker container to connect, you must set `OLLAMA_HOST` to `0.0.0.0`.
   - On your Mac, stop Ollama and run:
     ```bash
     export OLLAMA_HOST=0.0.0.0
     ollama serve
     ```
3. Download your preferred model: 
   - `ollama pull gemma:latest` (Lighter/Faster)
   - `ollama pull llama3.1:8b` (Smarter/More detailed)
4. Update `.env` to point to your chosen model:
   ```env
   LLM_PROVIDER=local
   LLM_BASE_URL=http://host.docker.internal:11434/api/generate
   LLM_MODEL=llama3.1:8b  # Switch to gemma:latest if preferred
   ```

**Option B: Cloud (Gemini or OpenAI)**
1. Update `.env`:
   ```env
   LLM_PROVIDER=gemini  # or 'openai'
   LLM_API_KEY=your_api_key_here
   ```

### 2. Apply Changes
Restart the API to load the new configuration:
```bash
docker-compose up -d api
```

### 3. Test the Agents
- **Interview Mentor**: Go to `Interview Prep` -> `Practice with AI Mentor`.
- **Opportunity Scout**: Go to `Extracurriculars` -> `Discover Clubs`.
- **Roadmap**: Go to `Academic Roadmap` to see your AI-generated 4-year plan.

## Tech Stack
- **Frontend**: React 18, Vite, TypeScript, MUI v5, Vega-Lite, TanStack Query, Zustand.
- **Backend**: Python 3.11, FastAPI, Uvicorn, `mysql-connector-python` (Raw SQL).
- **Database**: MySQL 8.0 (Schema managed via `schema.sql`).
- **Proxy**: Nginx (Same-origin routing for secure cookie transmission).
- **Auth**: JWT with HTTP-only cookies (`auth_session`).

## Key Features

### Role-Based Portals
- **Admin**: Full system control, counselor & parent creation, active/inactive toggles, system-wide analytics.
- **Counselor**: Manage assigned student cohorts, track application pipelines, identify at-risk students.
- **Parent**: Multi-student association, view academic progress (GPA Trends), track upcoming college deadlines.
- **Student**: Manage academic records, log extracurriculars, view personalized roadmaps and scholarship matches.

### Analytics & Reporting
- **Custom Visuals**: Powered by Vega-Lite for role-specific insights.
- **Readiness Scoring**: Dynamic calculation based on GPA, weighted course load, and milestone completion.
- **Standardized Routing**: Strict trailing-slash enforcement (`/api/resource/`) for reliable API interactions.

## Environment Management

### Initial Startup
```bash
./start.sh --demo
```

### Full Rebuild
Cleanup all volumes, prune images, and start fresh with large demo data:
```bash
./rebuild.sh --demo
```

### Production Setup
```bash
./start.sh
```

## FERPA/COPPA Compliance

- [x] **FERPA**: `shareWithParents` toggle enforced in SQL queries.
- [x] **Data Integrity**: Raw SQL schema with foreign key constraints in `schema.sql`.
- [x] **Secure Sessions**: HTTP-only JWT cookies with Nginx proxying for same-origin security.
- [x] **Audit Ready**: All user actions are logged in the `AuditLog` table.

## Maintenance
- **Cleanup**: Run `./cleanup.sh` to stop containers and remove volumes.
- **Schema Updates**: Modify `schema.sql` and run `./rebuild.sh --demo` to apply changes.
