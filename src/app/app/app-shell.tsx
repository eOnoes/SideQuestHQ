"use client";

import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { HomeFeed } from "../components/HomeFeed";
import { CardView, type CardItem } from "../components/CardView";
import { GarageWorkspace } from "../components/workspaces/GarageWorkspace";
import { HousesWorkspace } from "../components/workspaces/HousesWorkspace";
import { LedgerWorkspace } from "../components/workspaces/LedgerWorkspace";
import { PaperTrailWorkspace } from "../components/workspaces/PaperTrailWorkspace";
import { ConnectsWorkspace } from "../components/workspaces/ConnectsWorkspace";
import { MenuCards } from "../components/MenuCards";
import { ScoutPanel } from "../components/ScoutPanel";
import { QuestWorkspace } from "../components/QuestWorkspace";
import { VoiceAgent } from "../components/VoiceAgent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { AppView, LedgerState } from "../types";
import { addChatMessage, getChatMessages, loadAll, isLoaded, subscribe, type ChatMessage } from "@/lib/store";
import {
  getQuests,
  addLedgerEntry,
  cycleLedgerState,
  removeLedgerEntry,
  addPaperItem,
  cyclePaperState,
  removePaperItem,
  addNote,
  removeNote,
  advanceStep,
  addPerson,
  getPeopleForQuest,
  cyclePersonStatus,
  removePerson,
} from "@/lib/store";

type LedgerDraft = { label: string; amount: string; state: LedgerState };
type PaperDraft = { label: string; meta: string; state: string };
type PersonDraft = { name: string; role: string; nextTouch: string };

const emptyQuest = {
  name: "Welcome", type: "Side Quest" as const, status: "Discovery",
  nextMove: "Start exploring!", value: "$0", progress: 0, tone: "discovery" as const,
  owner: "", target: "", due: "", summary: "",
  ledger: [], papers: [], steps: [], notes: [],
};

export default function AppShell() {
  const { user, loading } = useAuth();
  const [dataLoaded, setDataLoaded] = useState(isLoaded());

  // Load data from API on mount
  // Restore font size from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sqhq-font-size')
    if (stored) {
      const size = parseInt(stored, 10)
      const scale = size / 15
      document.documentElement.style.zoom = String(scale)
      document.documentElement.style.setProperty('--app-font-size', `${stored}px`)
    }
  }, [])
  useEffect(() => {
    if (!loading && user && !isLoaded()) {
      loadAll().then(() => setDataLoaded(true));
    }
  }, [loading, user]);

  // Subscribe to store changes for re-renders
  useEffect(() => {
    return subscribe(() => {
      setDataLoaded(true);
      setRefreshKey((k) => k + 1);
    });
  }, []);

  useEffect(() => {
    if (!loading && !user && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, [user, loading]);

  // ─── App-level navigation ──────────────────────

  const [appMode, setAppMode] = useState<"feed" | "cards" | "detail">("feed");
  const [activeView, setActiveView] = useState<AppView>("Command");
  const [selectedQuestIndex, setSelectedQuestIndex] = useState(0);
  const [showScout, setShowScout] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [scoutBusy, setScoutBusy] = useState<"text" | "voice" | null>(null);
  const [agentMode, setAgentMode] = useState<"text" | "voice">("text");
  const [latestReply, setLatestReply] = useState<ChatMessage | null>(null);
  const [messageCount, setMessageCount] = useState(getChatMessages().length);
  // App-wide color mode — purple=voice, yellow=text
  const [responseMode, setResponseMode] = useState<"text" | "voice">("text");
  // App-wide mood override
  const [mood, setMood] = useState<string>("auto");

  // Auto-dismiss the reply bubble after 5s
  useEffect(() => {
    if (!latestReply) return;
    const timer = setTimeout(() => {
      setLatestReply(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [latestReply]);

  // ─── Drafts for detail view ─────────────────────

  const [ledgerDraft, setLedgerDraft] = useState<LedgerDraft>({ label: "", amount: "", state: "Draft" });
  const [noteDraft, setNoteDraft] = useState("");
  const [paperDraft, setPaperDraft] = useState<PaperDraft>({ label: "", meta: "", state: "Review" });
  const [personDraft, setPersonDraft] = useState<PersonDraft>({ name: "", role: "", nextTouch: "" });

  // ─── Data ───────────────────────────────────────

  const [refreshKey, setRefreshKey] = useState(0);
  function refresh() { setRefreshKey((k) => k + 1); }

  const questList = getQuests();
  const selectedQuest = questList[selectedQuestIndex] ?? emptyQuest;
  const selectedPeople = getPeopleForQuest(selectedQuest.name);

  // ─── Detail handlers ────────────────────────────

  const detailHandlers = {
    addLedgerEntry(e: React.FormEvent) {
      e.preventDefault();
      if (!ledgerDraft.label) return;
      addLedgerEntry(selectedQuest.name, ledgerDraft);
      setLedgerDraft({ label: "", amount: "", state: "Draft" });
      refresh();
    },
    addNote(e: React.FormEvent) {
      e.preventDefault();
      if (!noteDraft.trim()) return;
      addNote(selectedQuest.name, noteDraft);
      setNoteDraft("");
      refresh();
    },
    addPaperItem(e: React.FormEvent) {
      e.preventDefault();
      if (!paperDraft.label) return;
      addPaperItem(selectedQuest.name, paperDraft);
      setPaperDraft({ label: "", meta: "", state: "Review" });
      refresh();
    },
    addPerson(e: React.FormEvent) {
      e.preventDefault();
      if (!personDraft.name) return;
      addPerson({
        name: personDraft.name,
        role: personDraft.role || "Contact",
        quest: selectedQuest.name,
        nextTouch: personDraft.nextTouch || "Not set",
        status: "Active",
      });
      setPersonDraft({ name: "", role: "", nextTouch: "" });
      refresh();
    },
    advanceStep(i: number) { advanceStep(selectedQuest.name, i); refresh(); },
    cycleLedgerState(i: number) { cycleLedgerState(selectedQuest.name, i); refresh(); },
    cyclePaperState(i: number) { cyclePaperState(selectedQuest.name, i); refresh(); },
    cyclePersonStatus(i: number) { cyclePersonStatus(i); refresh(); },
    removeLedgerEntry(i: number) { removeLedgerEntry(selectedQuest.name, i); refresh(); },
    removeNote(i: number) { removeNote(selectedQuest.name, i); refresh(); },
    removePaperItem(i: number) { removePaperItem(selectedQuest.name, i); refresh(); },
    removePerson(i: number) { removePerson(i); refresh(); },
    selectQuest(i: number) { setSelectedQuestIndex(i); },
  };

  // ─── Navigation handlers ────────────────────────

  function handleOpenReminder(reminderId: string) {
    setAppMode("cards");
  }

  function handleViewDetails(questName: string) {
    const idx = questList.findIndex((q) => q.name === questName);
    if (idx !== -1) setSelectedQuestIndex(idx);
    setAppMode("detail");
  }

  function handleBackToFeed() {
    setAppMode("feed");
  }

  function handleOpenMenu() {
    setShowScout(false);
    setShowMenu(true);
  }

  function handleRequestSent(mode: "text" | "voice") {
    setShowScout(false);
    setScoutBusy(mode);

    // Watch for the user's message — once it gets a scout reply, show the bubble
    const userText = getChatMessages().at(-1)?.text ?? "";
    const pollInterval = setInterval(() => {
      const msgs = getChatMessages();
      // Look for a scout message that appears AFTER the user's last message
      const found = msgs.find(
        (m) => m.role === "scout" && msgs.indexOf(m) > msgs.length - 3
      );
      if (found && found.text !== userText) {
        setLatestReply(found);
        setMessageCount(msgs.length);
        setScoutBusy(null);
        clearInterval(pollInterval);
      }
    }, 400);

    setTimeout(() => {
      clearInterval(pollInterval);
      setScoutBusy(null);
    }, 25000);
  }

  // ─── Loading state ──────────────────────────────

  if (loading || !user || !dataLoaded) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand-mark" style={{ width: 48, height: 48, fontSize: 24 }}>SQ</div>
          <h1>SideQuest HQ</h1>
          <p className="muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Map activeView to CardView category
  function viewToCategory(view: AppView): "all" | "rental" | "garage" | "investment" | "customer" {
    switch (view) {
      case "Quests": return "all";
      case "Assets": return "all";
      case "Ledger": return "all";
      case "Paper Trail": return "all";
      case "Reminders": return "all";
      case "People": return "all";
      default: return "all";
    }
  }

  // ─── Render ─────────────────────────────────────

  if (activeView === "Agent") {
    return <VoiceAgent onBack={() => setActiveView("Command")} onModeChange={setAgentMode} mood={mood} onMoodChange={setMood} />;
  }

  return (
    <div className="app-shell" data-mode={responseMode}>
      <div className="workspace" data-view={appMode === "detail" ? "quest" : "feed"} data-agent-mode={agentMode}>

        {appMode === "detail" ? (
          <div>
            <button
              className="card-view-back"
              onClick={() => setAppMode("feed")}
              type="button"
              style={{ margin: "12px 16px" }}
            >
              ← Back to feed
            </button>
            <QuestWorkspace
            key={refreshKey}
            ledgerDraft={ledgerDraft}
            noteDraft={noteDraft}
            onAddLedgerEntry={detailHandlers.addLedgerEntry}
            onAddNote={detailHandlers.addNote}
            onAddPaperItem={detailHandlers.addPaperItem}
            onAddPerson={detailHandlers.addPerson}
            onAdvanceStep={detailHandlers.advanceStep}
            onCycleLedgerState={detailHandlers.cycleLedgerState}
            onCyclePaperState={detailHandlers.cyclePaperState}
            onCyclePersonStatus={detailHandlers.cyclePersonStatus}
            onLedgerDraftChange={setLedgerDraft}
            onNoteDraftChange={setNoteDraft}
            onPaperDraftChange={setPaperDraft}
            onPersonDraftChange={setPersonDraft}
            onRemoveLedgerEntry={detailHandlers.removeLedgerEntry}
            onRemoveNote={detailHandlers.removeNote}
            onRemovePaperItem={detailHandlers.removePaperItem}
            onRemovePerson={detailHandlers.removePerson}
            onSelectedQuestIndexChange={detailHandlers.selectQuest}
            paperDraft={paperDraft}
            personDraft={personDraft}
            questList={questList}
            selectedPeople={selectedPeople}
            selectedQuest={selectedQuest}
            selectedQuestIndex={selectedQuestIndex}
          />
          </div>
        ) : activeView === "Command" ? (
          <HomeFeed
            onOpenReminder={handleOpenReminder}
            setActiveView={setActiveView}
          />
        ) : activeView === "Garage" ? (
          <ErrorBoundary name="Garage" onRetry={() => setRefreshKey(k => k + 1)}>
            <GarageWorkspace onBack={() => setActiveView("Command")} />
          </ErrorBoundary>
        ) : activeView === "Assets" ? (
          <ErrorBoundary name="Houses" onRetry={() => setRefreshKey(k => k + 1)}>
            <HousesWorkspace onBack={() => setActiveView("Command")} />
          </ErrorBoundary>
        ) : activeView === "Ledger" ? (
          <ErrorBoundary name="Ledger" onRetry={() => setRefreshKey(k => k + 1)}>
            <LedgerWorkspace onBack={() => setActiveView("Command")} />
          </ErrorBoundary>
        ) : activeView === "Paper Trail" ? (
          <ErrorBoundary name="PaperTrail" onRetry={() => setRefreshKey(k => k + 1)}>
            <PaperTrailWorkspace onBack={() => setActiveView("Command")} />
          </ErrorBoundary>
        ) : activeView === "People" ? (
          <ErrorBoundary name="Connects" onRetry={() => setRefreshKey(k => k + 1)}>
            <ConnectsWorkspace onBack={() => setActiveView("Command")} />
          </ErrorBoundary>
        ) : (
          <ErrorBoundary name="Cards" onRetry={() => setRefreshKey(k => k + 1)}>
            <CardView
              key={activeView}
              initialCategory={viewToCategory(activeView)}
              onBack={() => setActiveView("Command")}
              onViewDetails={handleViewDetails}
            />
          </ErrorBoundary>
        )}
      </div>

      {/* FAB + indicator + bubble — only on non-Agent views */}
      <div className="fab-container">
        {scoutBusy && (
          <div className="fab-indicator" data-mode={scoutBusy}>
            <span className="fab-scout-name">Scout</span>
            <span className="fab-dots">
              <span className="fab-dot" />
              <span className="fab-dot" />
              <span className="fab-dot" />
            </span>
          </div>
        )}
        {latestReply && !scoutBusy && (
          <div className="fab-bubble" onClick={() => { setLatestReply(null); setActiveView("Agent"); }}>
            <p>{latestReply.text.length > 100 ? latestReply.text.slice(0, 100) + "..." : latestReply.text}</p>
          </div>
        )}
        {/* Mode toggle — purple=voice, yellow=text */}
        <button
          className="mode-toggle-btn"
          data-active={responseMode}
          onClick={() => setResponseMode(responseMode === "text" ? "voice" : "text")}
          type="button"
          aria-label={`Switch to ${responseMode === "text" ? "voice" : "text"} mode`}
        >
          {responseMode === "text" ? "📝" : "🎙️"}
        </button>
        <button className="fab-button" onClick={() => setShowScout(true)} type="button" aria-label="Scout">
            🔧
          </button>
      </div>

      {/* Scout overlay */}
      {showScout && (
        <div className="scout-overlay" onClick={() => setShowScout(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <ScoutPanel
              onClose={() => setShowScout(false)}
              onOpenMenu={handleOpenMenu}
              onRequestSent={handleRequestSent}
              mood={mood}
              onMoodChange={setMood}
            />
          </div>
        </div>
      )}

      {/* Menu cards */}
      {showMenu && (
        <MenuCards
          onSelect={(view) => { setShowMenu(false); setActiveView(view); }}
          onClose={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
