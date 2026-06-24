"use client";

import { appViews } from "../data";
import type { AppView } from "../types";
import { Icon } from "./Icon";

type MobileNavProps = {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
};

export function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  return (
    <nav className="mobile-nav" role="tablist" aria-label="Navigation">
      {appViews.map((view) => (
        <button
          key={view.label}
          role="tab"
          aria-selected={activeView === view.label}
          className={`mobile-nav-item${activeView === view.label ? " active" : ""}`}
          onClick={() => onViewChange(view.label)}
          type="button"
        >
          <Icon name={view.icon} />
          <span className="mobile-nav-label">{view.label}</span>
        </button>
      ))}
    </nav>
  );
}
