
## App Deployment
- This app will be deployed using **Static Export**
- This app will be a **Progressive Web App** (**PWA**) with **offline capability**

### Static Export
- Only static files—`HTML`, `CSS`, `JS`, and assets—are generated.
- No Node.js server is required; it doesn't support dynamic server-side features like API routes or Server-Side Rendering (SSR).
- From the [Next.js documentation](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports):

### **Progressive Web App** (**PWA**) with **offline capability**
- **Service Workers:** Allow web apps to intercept network requests and serve cached content when offline.
- **Web App Manifest:** Helps the app "feel" more like a native app and supports installability.
- **Caching mechanisms:** Such as the Cache API, IndexedDB, or (historically) AppCache (now deprecated).

## Task Completion Workflow

After completing a task, run the following checks and make any needed changes:
1. Run linting (ESLint)
2. Run TypeScript type checks
3. Run tests

**Important**: If an existing test is failing, do not change the test without asking first.

## Running the environment

Use the docker compose setup to run the site locally

# Memory Box

## Project Overview
A Next.js web application implementing the Charlotte Mason memory system for memorizing quotations using a spaced repetition approach with different review schedules.

## Core Requirements

### Technical Architecture
- **Framework**: Next.js with static site generation (SSG)
- **Hosting**: Google Cloud Storage bucket (static files)
- **Offline Support**: Progressive Web App (PWA) capabilities
- **Data Storage**: IndexedDB for local browser storage
- **Future**: Sync service integration (TBD)

### Key Features (MVP)

#### 1. User Data Model
```
User
├── Box (single box per user for MVP)
    ├── Cards[]
        ├── id: string
        ├── quotation: string
        ├── author?: string
        ├── reference?: string
        ├── schedule: 'daily' | 'even' | 'odd' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | '1' | '2' | '3' | ... | '31'
        ├── timeAdded: Date
        ├── timeModified: Date
        ├── lastReviewed?: Date
        ├── nextReview: Date
        └── reviewHistory: Date[]
```

#### 2. Box System
- One box per user (MVP)
- Cards progress through different review schedules
- Charlotte Mason schedule system:
    - **Daily**: Review every day
    - **Even**: Review on even-numbered days (2, 4, 6, 8, etc.)
    - **Odd**: Review on odd-numbered days (1, 3, 5, 7, etc.)
    - **Sunday**: Review every Sunday
    - **Monday**: Review every Monday
    - **Tuesday**: Review every Tuesday
    - **Wednesday**: Review every Wednesday
    - **Thursday**: Review every Thursday
    - **Friday**: Review every Friday
    - **Saturday**: Review every Saturday
    - **1-31**: Review on specific day of each month (31 monthly schedules)

Total: 41 possible schedules (1 daily + 1 even + 1 odd + 7 weekdays + 31 monthly)

#### 3. Card Management
- **Create Card**: Add new quotation with metadata
- **View Card**: Display quotation for review
- **Edit Card**: Modify quotation, author, reference, and schedule
- **Delete Card**: Remove card from box
- **Move Card**: Progress through schedules based on successful recall

#### 4. Review System
- Show cards due for review based on current date
- Mark card as reviewed (successful recall)
- Track review history for each card
- Calculate next review date based on card's current schedule level

## Technology Stack

### Core
- Next.js 16+ (App Router)
- TypeScript
- React 19+

### Data & Storage
- Dexie.js (IndexedDB wrapper)
- Local storage (settings/preferences)

### UI/Styling
- Tailwind CSS (recommended)
- shadcn/ui or similar component library
- Lucide React (icons)

### PWA
- @ducanh2912/next-pwa (workbox-based)
- Web App Manifest

### Development
- ESLint
- Husky (git hooks)
- Vitest (testing framework)
- Testing Library (React testing utilities)

## File Structure
```
/memory-box-frontend-v2
├── /memory-box-next-app
│   ├── /src
│   │   ├── /app
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (dashboard/today's review)
│   │   │   ├── globals.css
│   │   │   ├── /box
│   │   │   │   └── page.tsx (box overview)
│   │   │   ├── /cards
│   │   │   │   ├── page.tsx (all cards)
│   │   │   │   ├── /new
│   │   │   │   │   └── page.tsx (create card)
│   │   │   │   ├── /view
│   │   │   │   │   └── page.tsx (view card)
│   │   │   │   └── /edit
│   │   │   │       └── page.tsx (edit card)
│   │   │   ├── /review
│   │   │   │   └── page.tsx (review interface)
│   │   │   ├── /offline
│   │   │   │   └── page.tsx (offline fallback page)
│   │   │   └── /dev
│   │   │       └── page.tsx (development utilities)
│   │   ├── /components
│   │   │   ├── /ui (shadcn components)
│   │   │   ├── /cards
│   │   │   │   ├── CardForm.tsx
│   │   │   │   ├── CardView.tsx
│   │   │   │   └── CardList.tsx
│   │   │   ├── /box
│   │   │   │   ├── ScheduleView.tsx
│   │   │   │   └── BoxOverview.tsx
│   │   │   ├── /review
│   │   │   │   └── ReviewSession.tsx
│   │   │   ├── /layout
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Footer.tsx
│   │   │   └── /providers
│   │   │       ├── DatabaseProvider.tsx
│   │   │       └── ServiceWorkerProvider.tsx
│   │   └── /lib
│   │       ├── /db
│   │       │   ├── schema.ts
│   │       │   ├── operations.ts
│   │       │   ├── init.ts
│   │       │   ├── useDatabase.ts
│   │       │   ├── testData.ts
│   │       │   └── sync.ts (future)
│   │       ├── /utils
│   │       │   ├── scheduling.ts
│   │       │   ├── dates.ts
│   │       │   └── uuid.ts
│   │       └── types.ts
│   ├── /public
│   │   ├── manifest.json
│   │   ├── icons/
│   │   └── sw.js (generated by PWA plugin)
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── .eslintrc.json
│   ├── vitest.config.ts
│   └── package.json
└── .git/
```


## General Notes
- All dates should be stored in ISO format
- Consider timezone handling for review scheduling
- Plan for eventual multi-device sync in data structure design
- Keep sync service integration points clearly defined
- Consider data migration strategy for future schema changes
- Handle edge cases for monthly schedules (e.g., Feb 30, 31)
- Code is written in a way that can be tested, and we add unit tests for every function/component that will benefit from them.
