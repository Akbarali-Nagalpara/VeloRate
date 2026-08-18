# VeloRate — Cycle Pricing Engine

## Overview
VeloRate is a comprehensive, intuitive cycle configuration and pricing intelligence workspace built for Hero Cycles salespersons. It eliminates manual Excel-based pricing management by providing a centralized database of parts, historical/future pricing, and dynamically calculated cycle configuration prices.

## Features
- **Parts Management:** View, create, and manage cycle components.
- **Price History & Future Scheduling:** View chronological pricing and set upcoming part prices.
- **Configurations:** Support for standard (Predefined) and user-modified (Custom) configurations.
- **Cycle Builder:** Select a base, add/remove components, and dynamically calculate the cycle's total price.
- **Price Impact Analysis:** Visibility into how changing a specific part's price affects all configurations utilizing that part.

## Tech Stack
- **Frontend/Backend:** Next.js, React, Tailwind CSS, Radix UI
- **Routing:** Next.js App Router
- **Database/Auth:** Supabase (PostgreSQL)

## Architecture
```text
Frontend (React / Next.js)
   ↓
API (Next.js API Routes / Server Actions)
   ↓
Database (Supabase PostgreSQL)
```

## Project Structure
```text
VeloRate/
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── supabase/               # Supabase config and SQL migrations
├── app/                    # Routing, main entry points, and app shell
├── components/             # Reusable UI components
├── lib/                    # Utilities, Server Functions (APIs), and business logic
├── hooks/                  # Custom React hooks
├── integrations/           # Third-party service clients
└── docs/                   # PDF and extra documentation
```

## Prerequisites
- Node.js (v18+)
- Supabase CLI (for local DB) or a remote Supabase project

## Installation
```bash
npm install
```

## Environment Variables
Create a `.env` file in the root with your Supabase credentials:
```env
SUPABASE_PROJECT_ID="your_project_id"
SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
SUPABASE_URL="your_supabase_url"
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
VITE_SUPABASE_URL="your_supabase_url"
```

## Database Setup
Ensure your Supabase project is running, then apply the migrations to set up the schema and seed data.
```bash
npx supabase start
npx supabase migration up
```

## Running Locally
```bash
npm run dev
```
The application will start on `http://localhost:5173` (default Vite port).

## Available Scripts
- `npm run dev` - Starts the Vite development server.
- `npm run build` - Builds the application for production.
- `npm run lint` - Runs ESLint.
- `npm run format` - Formats the code using Prettier.

## Testing
- **Manual Verification:** Test adding overlapping part prices, creating Custom configurations from Predefined bases, and verifying `Price Impact` logic.

## Documentation
For complete details on the architecture, features, database schema, and design philosophy, refer to the full PDF documentation:
[VeloRate Documentation](docs/Hero-Cycles-Pricing-Engine-Documentation.pdf)
