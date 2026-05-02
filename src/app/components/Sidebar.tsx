import { appViews } from "../data";
import type { AppView } from "../types";
import { Icon } from "./Icon";

type SidebarProps = {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
};

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="brand">
        <span className="brand-mark">SQ</span>
        <div>
          <strong>SideQuest HQ</strong>
          <small>Private command board</small>
        </div>
      </div>

      <nav className="nav-list">
        {appViews.map((view) => (
          <button
            className={`nav-item${activeView === view.label ? " nav-item-active" : ""}`}
            key={view.label}
            onClick={() => onViewChange(view.label)}
            type="button"
          >
            <Icon name={view.icon} />
            <span>{view.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" />
        <span>Local prototype</span>
      </div>
    </aside>
  );
}
