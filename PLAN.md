# Memory Box - Charlotte Mason Memory System

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

## Technical Implementation Plan

### Phase 1: Project Setup
1. ~~Initialize Next.js project with TypeScript~~
2. ~~Configure for static export (`output: 'export'`)~~
3. ~~Set up PWA configuration (@ducanh2912/next-pwa?)~~
4. ~~Configure IndexedDB wrapper (Dexie.js recommended)~~
5. ~~Set up basic routing structure~~

### Phase 2: Data Layer
1. ~~Design IndexedDB schema~~
2. ~~Create database initialization logic~~
3. ~~Implement CRUD operations for Cards~~
4. ~~Create Box management functions~~
5. ~~Implement review scheduling logic~~
6. Add data export/import utilities (for backup)

### Phase 3: UI Components
1. ~~**Layout Components**~~
   - ~~App shell with navigation~~
   - ~~Header/Footer~~
   - ~~Responsive design (mobile-first)~~

2. ~~**Box View**~~
   - ~~Overview of all schedule levels~~
   - ~~Card count per schedule level~~
   - ~~Due cards indicator~~

3. ~~**Card Components**~~
   - ~~Card creation form~~
   - ~~Card display/review view~~
   - ~~Card edit form~~
   - ~~Card list view~~

4. **Review Interface**
   - Today's review queue
   - Review card display
   - Recall success/failure actions
   - Progress indicator

### Phase 4: Core Features
1. Add new card functionality
2. Daily review workflow
3. Card progression through schedule levels
4. Review history tracking
5. Search/filter cards
6. Statistics dashboard (optional)

### Phase 5: Offline & PWA
1. Service worker configuration
2. Cache strategies for static assets
3. Offline page
4. Install prompt
5. Background sync preparation (for future API)

### Phase 6: Polish & Testing
1. Responsive design testing
2. Accessibility improvements
3. Performance optimization
4. User experience refinements
5. Documentation

## Future Enhancements (Post-MVP)
- Multiple boxes per user
- Cloud sync service integration
- User authentication
- Sharing/collaboration features
- Audio recording for oral recitation
- Image attachments to cards
- Category/tagging system
- Import from various formats
- Analytics and insights
- Customizable schedule intervals

## Technology Stack

### Core
- Next.js 14+ (App Router)
- TypeScript
- React 18+

### Data & Storage
- Dexie.js (IndexedDB wrapper)
- Local storage (settings/preferences)

### UI/Styling
- Tailwind CSS (recommended)
- shadcn/ui or similar component library
- Lucide React (icons)

### PWA
- next-pwa or workbox
- Web App Manifest

### Development
- ESLint
- Prettier
- Husky (git hooks)

## File Structure
```
/memory-box-frontend-v2
├── PLAN.md
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
│   │   │   │   └── /[id]
│   │   │   │       ├── page.tsx (view card)
│   │   │   │       └── /edit
│   │   │   │           └── page.tsx (edit card)
│   │   │   └── /review
│   │   │       └── page.tsx (review interface)
│   │   ├── /components
│   │   │   ├── /ui (shadcn components)
│   │   │   ├── /cards
│   │   │   │   ├── CardForm.tsx
│   │   │   │   ├── CardView.tsx
│   │   │   │   └── CardList.tsx
│   │   │   └── /box
│   │   │       ├── ScheduleView.tsx
│   │   │       └── BoxOverview.tsx
│   │   └── /lib
│   │       ├── /db
│   │       │   ├── schema.ts
│   │       │   ├── operations.ts
│   │       │   └── sync.ts (future)
│   │       ├── /utils
│   │       │   ├── scheduling.ts
│   │       │   └── dates.ts
│   │       └── types.ts
│   ├── /public
│   │   ├── manifest.json
│   │   └── icons/
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── .eslintrc.json
│   └── package.json
└── .git/
```

## Development Phases Timeline (Estimated)

1. **Setup & Data Layer**: 2-3 days
2. **Core UI Components**: 3-4 days
3. **Review System**: 2-3 days
4. **PWA & Offline**: 1-2 days
5. **Polish & Testing**: 2-3 days

**Total Estimated**: 10-15 days of development

## Success Metrics
- App loads and works offline after initial visit
- Users can create and review cards
- Review scheduling follows Charlotte Mason system accurately
- Data persists reliably in IndexedDB
- App is installable as PWA
- Static export deploys successfully to Google Cloud Storage

## Questions to Address
1. Should users be able to manually change a card's schedule type? - yes
2. What is the progression path through schedules? - Users can set it to anything they want it to be. It will stay the same until they set it. 
3. Should there be a limit on cards per box? - Not right now.
4. What export format for backup data? - JSON is good, but let's not do backup yet. That can be a future addition as well.
5. Should there be sample data for first-time users? - Not in the MVP.
6. Notification system for daily reviews? - Not in the MVP
7. For monthly schedules (1-31), what happens on months with fewer days? - They will be skipped on those months

## Schedule System Implementation Notes

### Schedule Values
The system uses 41 different schedule values stored in a single `schedule` field:
1. **'daily'** - Every day
2. **'even'** - Days 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30
3. **'odd'** - Days 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31
4. **'sunday'** through **'saturday'** - Specific weekdays (7 values)
5. **'1'** through **'31'** - Specific day of each month (31 values as strings)

### Calculating Next Review Date
```typescript
function calculateNextReview(card: Card, currentDate: Date): Date {
  const schedule = card.schedule;

  // Check if it's a number (monthly schedule)
  if (!isNaN(Number(schedule))) {
    const monthlyDay = Number(schedule);
    return nextMonthlyDate(currentDate, monthlyDay);
  }

  // Handle named schedules
  switch(schedule) {
    case 'daily':
      return addDays(currentDate, 1);
    case 'even':
      return nextEvenDay(currentDate);
    case 'odd':
      return nextOddDay(currentDate);
    case 'sunday':
    case 'monday':
    case 'tuesday':
    case 'wednesday':
    case 'thursday':
    case 'friday':
    case 'saturday':
      return nextWeekday(currentDate, schedule);
    default:
      throw new Error(`Invalid schedule: ${schedule}`);
  }
}
```

### Schedule Progression
Based on the plan notes, users manually set the schedule for each card. Cards don't automatically progress through schedules - users change the schedule as needed.

Possible progression example (user-controlled):
- 'daily' → 'even' → 'odd' → 'sunday' → '1' (monthly on 1st)

Users have full flexibility to set any schedule value at any time.

## General Notes
- All dates should be stored in ISO format
- Consider timezone handling for review scheduling
- Plan for eventual multi-device sync in data structure design
- Keep sync service integration points clearly defined
- Consider data migration strategy for future schema changes
- Handle edge cases for monthly schedules (e.g., Feb 30, 31)
- Code is written in a way that can be tested, and we add unit tests for every function/component that will benefit from them.
