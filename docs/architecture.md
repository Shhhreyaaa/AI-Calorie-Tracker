# AI Calorie Tracker - System Architecture 🏗️

This document outlines the production-grade architecture, folder structure, database schema, and environment settings designed for the AI Calorie Tracker application.

---

## 📁 1. Recommended Folder Structure

We use the Next.js 15 **App Router** structure combined with a source (`src/`) directory to keep configuration files separated from core application code.

```text
AI-Calorie-Tracker/
├── ai-logs/                    # Auto-saved conversation logs (for development tracking)
├── docs/                       # Project documentation
│   └── architecture.md         # [THIS FILE] System Architecture details
├── screenshots/                # Application preview assets
├── src/
│   ├── app/                    # Next.js 15 Page & Route handlers
│   │   ├── layout.tsx          # Root Layout (providers, global style)
│   │   ├── page.tsx            # Landing / Welcome Page
│   │   ├── dashboard/          # Core Logged-in Dashboard
│   │   │   └── page.tsx        # Dashboard screen (Macro progress + Streak tracker)
│   │   ├── diary/              # Daily Logs View
│   │   │   └── page.tsx        # Daily diary timeline
│   │   ├── analytics/          # Weekly Charts Page
│   │   │   └── page.tsx        # Recharts visualization screen
│   │   └── api/                # Backend Serverless API Routes
│   │       ├── analyze/        # Gemini Vision food analyzer route
│   │       │   └── route.ts
│   │       └── logs/           # Supabase DB log sync helper
│   │           └── route.ts
│   ├── components/             # Reusable UI Components
│   │   ├── ui/                 # Atomic Shadcn components (Button, Input, Card, etc.)
│   │   ├── layout/             # Sidebar, Navbar, and Footer
│   │   ├── dashboard/          # Dashboard cards & progress bars
│   │   ├── diary/              # Diary list & entry items
│   │   └── shared/             # Camera/Upload interfaces, Modal popups
│   ├── hooks/                  # Custom React Hooks (useAuth, useStreak, useNutrition)
│   ├── lib/                    # SDK & Utility client initialization
│   │   ├── supabase.ts         # Supabase Client and Server helpers
│   │   ├── gemini.ts           # Google Gen AI initialization
│   │   └── utils.ts            # Tailwind Classname merger (cn)
│   └── types/                  # TypeScript Interfaces & Types
│       └── index.ts            # DB schemas & API response definitions
├── .env.example                # Template for environment configuration
├── package.json                # Project dependencies
├── tailwind.config.ts          # Styling tokens and Tailwind settings
└── tsconfig.json               # TypeScript rules
```

---

## 📦 2. Dependency List & Installation

To initialize this Next.js 15 codebase with TypeScript and configure Tailwind CSS, Recharts, Gemini SDK, and Supabase, run the following setup commands:

### Create Next.js App Template
```bash
npx create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### Required Dependencies
Install the required NPM packages for AI model access, Supabase backend integration, icons, and analytics charts:

```bash
npm install @supabase/supabase-js @supabase/ssr @google/generative-ai recharts lucide-react clsx tailwind-merge class-variance-authority
```

### Development Dependencies
For static types and linting:
```bash
npm install -D @types/react @types/react-dom @types/node typescript tailwindcss postcss autoprefixer
```

---

## 🔑 3. Environment Variables (`.env.example`)

Create a `.env.local` file at the root of the project with the following keys:

```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-for-admin-ops

# Gemini AI API Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# App Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗄️ 4. Supabase Database Schema

The database relies on PostgreSQL tables to track user statistics, daily meal entries, and tracking streaks.

### `profiles` (User settings & goals)
Manages user targets and streaks. Linked to Supabase Auth (`auth.users`).

| Column Name | Type | Key | Description |
|---|---|---|---|
| `id` | UUID | Primary | Matches `auth.users.id` |
| `email` | TEXT | | User email |
| `name` | TEXT | | Display name |
| `calorie_target` | INT | | Daily target (default: `2000`) |
| `protein_target` | INT | | Daily target in grams (default: `150`) |
| `carbs_target` | INT | | Daily target in grams (default: `200`) |
| `fat_target` | INT | | Daily target in grams (default: `65`) |
| `current_streak` | INT | | Active daily tracking streak |
| `last_tracked` | DATE | | Last date a log was added |
| `created_at` | TIMESTAMPTZ| | Date joined |

### `meal_logs` (Daily food diary entries)
Stores each food photo and its recognized nutritional contents.

| Column Name | Type | Key | Description |
|---|---|---|---|
| `id` | UUID | Primary | Unique ID |
| `user_id` | UUID | Foreign | References `profiles.id` |
| `image_url` | TEXT | | Link to Supabase Storage file |
| `food_name` | TEXT | | Gemini recognized title of the food |
| `calories` | INT | | Total calories |
| `protein` | INT | | Protein in grams |
| `carbs` | INT | | Carbs in grams |
| `fat` | INT | | Fat in grams |
| `logged_at` | TIMESTAMPTZ| | Timestamp when eaten/logged |

---

## 🎨 5. Component Breakdown

To keep the application highly maintainable, we divide the UI into focused components:

1. **Dashboard View** (`src/components/dashboard/`):
   - `StreakWidget.tsx`: Dynamic icon indicating current tracking streak.
   - `DailyMacroCircle.tsx`: Radial chart showing percentage of calorie and macro targets hit today.
   - `MacroCard.tsx`: Grid stats item displaying current vs target grams for a specific macro.

2. **Diary View** (`src/components/diary/`):
   - `DiaryTimeline.tsx`: Sequential list of meals logged today.
   - `MealItem.tsx`: Visual card for each logged meal showing image, food name, and macro counts.
   - `LogMealModal.tsx`: Popup window containing food image uploader and preview analysis details.

3. **Analytics View** (`src/components/analytics/`):
   - `WeeklyCaloriesChart.tsx`: Recharts bar chart showing total daily calories against target.
   - `WeeklyMacrosChart.tsx`: Stacked area or line chart illustrating macro ratios consumed.

4. **Shared Components** (`src/components/shared/`):
   - `CameraCapture.tsx`: Web camera capture interface for quick photo logging.
   - `ImageUpload.tsx`: Drag-and-drop file uploader with drag state UI.
