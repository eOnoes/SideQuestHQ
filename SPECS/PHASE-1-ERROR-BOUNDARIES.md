# Echo — Phase 1: Error Boundaries + Module Isolation

**From:** Cyony
**Date:** June 27, 2026
**Priority:** HIGH — Safety net for everything that follows

---

## Goal

Wrap every workspace in an error boundary so if one module crashes, the others keep running. This is the foundation for all future work.

---

## Tasks

### 1. Create `ErrorBoundary.tsx`

Create `src/components/ErrorBoundary.tsx` — a reusable React error boundary.

```tsx
"use client";

import { Component, type ReactNode } from "react";

type Props = {
  name: string;
  children: ReactNode;
  onRetry?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.name}]`, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <div className="error-boundary-card">
            <span className="error-boundary-icon">⚠</span>
            <span className="error-boundary-module">{this.props.name}</span>
            <span className="error-boundary-msg">
              {this.state.error?.message || "Something went wrong"}
            </span>
            <button
              className="error-boundary-retry"
              onClick={this.handleRetry}
              type="button"
            >
              ↻ retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 2. Add Error Boundary CSS

Add to `src/app/globals.css` (at the bottom, after existing imports):

```css
/* Error boundary fallback */
.error-boundary-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 24px;
}

.error-boundary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 32px;
  border: 1px solid var(--line, #333);
  border-radius: 8px;
  background: var(--surface, #1a1a1a);
  text-align: center;
  max-width: 300px;
}

.error-boundary-icon {
  font-size: 24px;
}

.error-boundary-module {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--muted, #888);
}

.error-boundary-msg {
  font-size: 12px;
  color: var(--text, #ccc);
}

.error-boundary-retry {
  margin-top: 8px;
  padding: 6px 16px;
  border: 1px solid var(--line, #333);
  border-radius: 4px;
  background: transparent;
  color: var(--text, #ccc);
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
}

.error-boundary-retry:hover {
  background: var(--surface-hover, #222);
}
```

### 3. Wrap Workspaces in `app-shell.tsx`

In `src/app/app/app-shell.tsx`, import ErrorBoundary and wrap each workspace:

```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";
```

Then wrap each workspace render like:

```tsx
// Example for Garage:
{activeView === "Garage" ? (
  <ErrorBoundary name="Garage" onRetry={() => setRefreshKey(k => k + 1)}>
    <GarageWorkspace onBack={() => setActiveView("Command")} />
  </ErrorBoundary>
) : ...}

// Example for Houses:
{activeView === "Assets" ? (
  <ErrorBoundary name="Houses" onRetry={() => setRefreshKey(k => k + 1)}>
    <HousesWorkspace onBack={() => setActiveView("Command")} />
  </ErrorBoundary>
) : ...}

// Example for Ledger:
{activeView === "Ledger" ? (
  <ErrorBoundary name="Ledger" onRetry={() => setRefreshKey(k => k + 1)}>
    <LedgerWorkspace onBack={() => setActiveView("Command")} />
  </ErrorBoundary>
) : ...}

// Example for Paper Trail:
{activeView === "Paper Trail" ? (
  <ErrorBoundary name="PaperTrail" onRetry={() => setRefreshKey(k => k + 1)}>
    <PaperTrailWorkspace onBack={() => setActiveView("Command")} />
  </ErrorBoundary>
) : ...}

// Example for Connects:
{activeView === "People" ? (
  <ErrorBoundary name="Connects" onRetry={() => setRefreshKey(k => k + 1)}>
    <ConnectsWorkspace onBack={() => setActiveView("Command")} />
  </ErrorBoundary>
) : ...}

// Also wrap the fallback CardView:
else {
  <ErrorBoundary name="Cards" onRetry={() => setRefreshKey(k => k + 1)}>
    <CardView ... />
  </ErrorBoundary>
}
```

**Do NOT wrap:** VoiceAgent, ScoutPanel, MenuCards, HomeFeed — these are core shell components, not workspace modules.

### 4. Verify

- [ ] `npx next build` passes with zero errors
- [ ] Each workspace renders correctly
- [ ] Intentionally throw an error in one workspace (add `throw new Error("test")` at top of GarageWorkspace) — verify the error boundary catches it and other workspaces still work
- [ ] Remove the test error
- [ ] Commit and push to main

---

## Constraints

- Do NOT change any existing component logic
- Do NOT add new dependencies
- Do NOT touch VoiceAgent.tsx, ScoutPanel.tsx, HomeFeed.tsx, or MenuCards.tsx
- Only create ErrorBoundary.tsx, modify app-shell.tsx (imports + wrapping), and add CSS
- TypeScript must pass: `npx tsc --noEmit`

---

*— Cyony*
