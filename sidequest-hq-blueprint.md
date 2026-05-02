# SideQuest HQ Blueprint

## Product Idea

SideQuest HQ is a private command center for tracking side ventures, project money, paperwork, reminders, and follow-ups.

It is not a banking app. It does not connect to bank accounts, finance portals, payroll systems, retirement portals, or camera systems in version 1. It stores manual records, uploaded documents, AI-assisted receipt/photo extraction, and reminders that help keep real-world work organized.

## Core Pillars

### 1. Quests

A Quest is anything worth tracking.

Examples:

- Rental property
- Customer build project
- AI project for a client
- Personal AI build
- Investment in a friend's business
- 401k planning snapshot
- Personal payoff plan
- House/shop project

Each Quest should answer:

- What is this?
- What status is it in?
- What money is expected, owed, paid, spent, or recovered?
- What needs attention?
- What happened recently?
- What is the next move?

### 2. Paper Trail

Paper Trail is the receipt/document/photo inbox.

Examples:

- Receipts
- Invoices
- Quotes
- Screenshots of payments
- Photos of materials
- Photos of repairs
- Handwritten notes
- PDFs
- Contracts or agreement snapshots

AI can help extract useful information, but the user approves before anything is added to the ledger.

Rule:

> AI suggests. User approves.

### 3. Reminders

Reminders are first-class objects, not sticky-note leftovers.

Examples:

- Rent due
- Customer balance due
- Send customer update
- Follow up after quote
- Check project status
- Review investment quarterly
- Upload receipt
- Inspect property
- Tax prep item

Every reminder should belong to a Quest, ledger entry, document, task, person, or milestone.

## Recommended Tech Direction

### V1 Stack

- TypeScript
- React / Next.js
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- OpenAI vision/text extraction for Paper Trail
- PWA-friendly web app for desktop and phone

### Why This Stack

- One app can work on desktop and phone.
- Supabase gives login, database, file storage, and security rules.
- Postgres is a strong fit for structured tracking.
- TypeScript keeps the app safer and easier to grow.
- A PWA avoids separate native apps while the product shape is still forming.

## Main Screens

### Command

The home screen.

Shows:

- Needs attention
- Reminders due today
- Upcoming reminders
- Paper Trail items needing review
- Expected incoming money
- Unpaid customer balances
- Recent ledger activity
- Active Quests

### Quests

List and manage all tracked ventures.

Quest types:

- Rental property
- Customer project
- AI build
- Investment
- Personal goal
- General project

### Quest Detail

Shows:

- Status
- Summary
- Financial snapshot
- Ledger entries
- Paper Trail documents
- Reminders
- Tasks
- Milestones
- Contacts
- Notes/updates

### Paper Trail

Inbox for uploaded or scanned documents.

States:

- New
- AI processed
- Needs review
- Approved
- Linked to Quest
- Archived

### Ledger

Manual money tracking.

Entry examples:

- Expense
- Income
- Expected income
- Customer payment
- Material cost
- Labor cost
- Investment contribution
- Return/payment received
- Rent received
- Repair cost

### Reminders

Shows:

- Today
- Upcoming
- Overdue
- Recurring
- Completed

### People

Contacts tied to Quests.

Examples:

- Customer
- Tenant
- Vendor
- Business partner
- Friend/investment contact

### Reports

Later-stage view for summaries.

Examples:

- Money in/out by Quest
- Open balances
- Expense categories
- Monthly review
- Tax prep export

## Core Data Objects

### User

- id
- name
- email
- timezone
- notification preferences

### Quest

- id
- owner user id
- name
- type
- status
- summary
- start date
- target date
- archived flag
- created at
- updated at

### Ledger Entry

- id
- owner user id
- quest id
- type
- amount
- currency
- date
- vendor/customer/person
- category
- description
- payment status
- source document id
- created at
- updated at

### Paper Trail Document

- id
- owner user id
- quest id
- file path
- file type
- original filename
- extracted text
- ai extracted data
- review status
- confidence score
- approved ledger entry id
- created at
- updated at

### Reminder

- id
- owner user id
- quest id
- linked object type
- linked object id
- title
- notes
- due date/time
- recurrence rule
- priority
- notification mode
- completed at
- snoozed until
- created at
- updated at

### Task

- id
- owner user id
- quest id
- title
- description
- status
- due date
- priority
- created at
- updated at

### Milestone

- id
- owner user id
- quest id
- title
- target date
- completed date
- status
- notes

### Person

- id
- owner user id
- name
- role
- email
- phone
- notes

### Quest Person Link

- id
- quest id
- person id
- relationship

### Note / Update

- id
- owner user id
- quest id
- title
- body
- created at
- updated at

## V1 Build Scope

V1 should focus on the app being useful immediately.

Must have:

- Supabase login
- Create/edit/archive Quests
- Add ledger entries manually
- Add reminders manually
- Upload Paper Trail documents
- AI extraction draft for receipts/photos
- Review and approve extracted data
- Create ledger entry from approved document
- Command dashboard
- Mobile-friendly layout

Should have:

- Categories and tags
- Simple recurring reminders
- Basic search
- Export CSV for ledger entries
- Document preview

Not V1:

- Bank integrations
- 401k portal integrations
- Camera system embeds
- SMS reminders
- Shared multi-user access
- Native app store deployment
- Full accounting/tax automation

## Notification Strategy

Phase 1:

- In-app reminder center
- Today/Upcoming dashboard

Phase 2:

- Email reminders
- Daily digest

Phase 3:

- Browser/PWA notifications

Phase 4:

- Native push or SMS if needed

## Security Rules

- Every row belongs to a user.
- Users can only read/write their own data.
- Uploaded documents are private.
- AI output is unverified until approved.
- No financial portal credentials are stored.
- No bank account integration in early versions.
- Keep export/backup ability from the beginning.

## First Build Step

Start with a local Next.js app and a Supabase project.

Initial implementation order:

1. App shell and navigation
2. Supabase auth
3. Database schema
4. Quest CRUD
5. Ledger entries
6. Reminder center
7. Paper Trail upload
8. AI extraction review flow
9. Command dashboard

