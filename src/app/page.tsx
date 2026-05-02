"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Icon } from "./components/Icon";
import { AssetsWorkspace } from "./components/AssetsWorkspace";
import { CommandWorkspace } from "./components/CommandWorkspace";
import { LedgerWorkspace } from "./components/LedgerWorkspace";
import { PaperTrailWorkspace } from "./components/PaperTrailWorkspace";
import { Sidebar } from "./components/Sidebar";
import { QuestComposer, Topbar } from "./components/Topbar";
import {
  ASSETS_STORAGE_KEY,
  getQuestTypePreset,
  PEOPLE_STORAGE_KEY,
  REMINDERS_STORAGE_KEY,
  seedAssets,
  seedPeople,
  seedQuests,
  seedReminders,
  STORAGE_KEY,
} from "./data";
import type { AppView, Asset, LedgerState, PaperItem, Person, Quest, QuestType, Reminder, StepState } from "./types";
import { formatMoney, getMoneyRows, getMonthlyProjection, parseMoney } from "./utils";
export default function Home() {
  const [questList, setQuestList] = useState<Quest[]>(seedQuests);
  const [selectedQuestIndex, setSelectedQuestIndex] = useState(0);
  const [hasLoadedStoredData, setHasLoadedStoredData] = useState(false);
  const [showQuestComposer, setShowQuestComposer] = useState(false);
  const [activeView, setActiveView] = useState<AppView>("Command");
  const [questDraft, setQuestDraft] = useState<{ name: string; type: QuestType; value: string; due: string }>({ name: "", type: "Rental Property", value: "", due: "" });
  const [ledgerDraft, setLedgerDraft] = useState<{ label: string; amount: string; state: LedgerState }>({ label: "", amount: "", state: "Draft" });
  const [paperDraft, setPaperDraft] = useState({ label: "", meta: "", state: "Review" });
  const [peopleList, setPeopleList] = useState<Person[]>(seedPeople);
  const [personDraft, setPersonDraft] = useState({ name: "", role: "", nextTouch: "" });
  const [reminderList, setReminderList] = useState<Reminder[]>(seedReminders);
  const [reminderDraft, setReminderDraft] = useState({ label: "", due: "", priority: "Normal" as Reminder["priority"] });
  const [assetList, setAssetList] = useState<Asset[]>(seedAssets);
  const [assetDraft, setAssetDraft] = useState<Asset>({ name: "", type: "Rental", value: "", projected: "", frequency: "Monthly", status: "Producing" });
  const [noteDraft, setNoteDraft] = useState("");
  const selectedQuest = questList[Math.min(selectedQuestIndex, questList.length - 1)] ?? seedQuests[0];
  const moneyRows = useMemo(() => getMoneyRows(questList), [questList]);
  const selectedPeople = useMemo(() => peopleList.filter((person) => person.quest === selectedQuest.name), [peopleList, selectedQuest.name]);
  const peopleRows = useMemo(
    () =>
      peopleList.map((person, personIndex) => ({
        ...person,
        personIndex,
        questIndex: questList.findIndex((quest) => quest.name === person.quest),
      })),
    [peopleList, questList],
  );
  const peopleSummary = useMemo(
    () => ({
      active: peopleRows.filter((person) => person.status === "Active").length,
      quiet: peopleRows.filter((person) => person.status === "Quiet").length,
      waiting: peopleRows.filter((person) => person.status === "Waiting").length,
    }),
    [peopleRows],
  );
  const activeReminders = useMemo(() => reminderList.filter((reminder) => !reminder.done).slice(0, 4), [reminderList]);
  const reminderRows = useMemo(
    () =>
      reminderList.map((reminder, reminderIndex) => ({
        ...reminder,
        reminderIndex,
        questIndex: questList.findIndex((quest) => quest.name === reminder.quest),
      })),
    [questList, reminderList],
  );
  const reminderSummary = useMemo(
    () => ({
      active: reminderRows.filter((reminder) => !reminder.done).length,
      done: reminderRows.filter((reminder) => reminder.done).length,
      important: reminderRows.filter((reminder) => !reminder.done && reminder.priority === "Important").length,
    }),
    [reminderRows],
  );
  const ledgerRows = useMemo(
    () =>
      questList.flatMap((quest, questIndex) =>
        quest.ledger.map((entry, entryIndex) => ({
          ...entry,
          entryIndex,
          questIndex,
          questName: quest.name,
          questType: quest.type,
        })),
      ),
    [questList],
  );
  const ledgerSummary = useMemo(() => {
    const totalByState = (state: LedgerState) =>
      ledgerRows.filter((entry) => entry.state === state).reduce((total, entry) => total + parseMoney(entry.amount), 0);
    return {
      draft: totalByState("Draft"),
      open: totalByState("Open"),
      paid: totalByState("Paid"),
    };
  }, [ledgerRows]);
  const paperRows = useMemo(
    () =>
      questList.flatMap((quest, questIndex) =>
        quest.papers.map((paper, paperIndex) => ({
          ...paper,
          kind: paper.meta.toLowerCase().includes("image") || paper.meta.toLowerCase().includes("photo") ? "image" as const : "file" as const,
          paperIndex,
          questIndex,
          questName: quest.name,
          questType: quest.type,
        })),
      ),
    [questList],
  );
  const paperSummary = useMemo(() => {
    const reviewCount = paperRows.filter((paper) => paper.state.toLowerCase().includes("review") || paper.state.toLowerCase().includes("draft")).length;
    const filedCount = paperRows.filter((paper) => paper.state.toLowerCase().includes("filed")).length;
    const readyCount = paperRows.filter((paper) => paper.state.toLowerCase().includes("ready")).length;
    return { filedCount, readyCount, reviewCount };
  }, [paperRows]);
  const assetSummary = useMemo(() => {
    const monthlyProjected = assetList.reduce((total, asset) => total + getMonthlyProjection(asset), 0);
    return {
      activeCount: assetList.filter((asset) => asset.status === "Producing").length,
      monthlyProjected,
      annualProjected: monthlyProjected * 12,
    };
  }, [assetList]);
  const commandPulse = useMemo(
    () => [
      { label: "Assets", value: formatMoney(assetSummary.monthlyProjected), detail: "Projected / mo", view: "Assets" as AppView },
      { label: "Ledger", value: formatMoney(ledgerSummary.open), detail: "Open money", view: "Ledger" as AppView },
      { label: "Paper", value: String(paperSummary.reviewCount), detail: "Need review", view: "Paper Trail" as AppView },
      { label: "People", value: String(peopleSummary.waiting), detail: "Waiting touches", view: "People" as AppView },
    ],
    [assetSummary.monthlyProjected, ledgerSummary.open, paperSummary.reviewCount, peopleSummary.waiting],
  );
  const paperQueue = useMemo<PaperItem[]>(() => {
    const items = questList.flatMap((quest) =>
      quest.papers.map((paper) => ({
        title: paper.label,
        source: quest.name,
        state: paper.state,
        amount: quest.ledger[0]?.amount ?? "$0",
        kind: paper.meta.toLowerCase().includes("image") || paper.meta.toLowerCase().includes("photo") ? "image" as const : "file" as const,
      })),
    );

    return items.slice(0, 3);
  }, [questList]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Quest[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestList(parsed);
        }
      }

      const storedPeople = window.localStorage.getItem(PEOPLE_STORAGE_KEY);
      if (storedPeople) {
        const parsedPeople = JSON.parse(storedPeople) as Person[];
        if (Array.isArray(parsedPeople)) {
          setPeopleList(parsedPeople);
        }
      }

      const storedReminders = window.localStorage.getItem(REMINDERS_STORAGE_KEY);
      if (storedReminders) {
        const parsedReminders = JSON.parse(storedReminders) as Reminder[];
        if (Array.isArray(parsedReminders)) {
          setReminderList(parsedReminders);
        }
      }

      const storedAssets = window.localStorage.getItem(ASSETS_STORAGE_KEY);
      if (storedAssets) {
        const parsedAssets = JSON.parse(storedAssets) as Asset[];
        if (Array.isArray(parsedAssets)) {
          setAssetList(parsedAssets);
        }
      }
    } catch {
      setQuestList(seedQuests);
      setPeopleList(seedPeople);
      setReminderList(seedReminders);
      setAssetList(seedAssets);
    } finally {
      setHasLoadedStoredData(true);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedStoredData) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(questList));
      window.localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(peopleList));
      window.localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminderList));
      window.localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assetList));
    }
  }, [assetList, hasLoadedStoredData, peopleList, questList, reminderList]);

  function updateSelectedQuest(updater: (quest: Quest) => Quest) {
    setQuestList((current) => current.map((quest, index) => (index === selectedQuestIndex ? updater(quest) : quest)));
  }

  function addQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = questDraft.name.trim();
    if (!name) return;
    const preset = getQuestTypePreset(questDraft.type);

    const nextQuest: Quest = {
      name,
      type: preset.type,
      status: "Discovery",
      nextMove: preset.steps.find((step) => step.state === "Now")?.label ?? "Capture the first move.",
      value: questDraft.value.trim() || "$0 tracked",
      progress: 10,
      tone: "discovery",
      owner: preset.owner,
      target: preset.target,
      due: questDraft.due.trim() || "Next check: Soon",
      summary: preset.summary,
      ledger: [],
      papers: [],
      steps: preset.steps,
      notes: ["Fresh quest created. Add the first note when the next move is clear."],
    };

    setQuestList((current) => [...current, nextQuest]);
    setSelectedQuestIndex(questList.length);
    setQuestDraft({ name: "", type: "Rental Property", value: "", due: "" });
    setShowQuestComposer(false);
    setActiveView("Quests");
  }

  function addLedgerEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = ledgerDraft.label.trim();
    if (!label) return;

    updateSelectedQuest((quest) => ({
      ...quest,
      ledger: [...quest.ledger, { label, amount: ledgerDraft.amount.trim() || "$0", state: ledgerDraft.state }],
    }));
    setLedgerDraft({ label: "", amount: "", state: "Draft" });
  }

  function addPaperItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = paperDraft.label.trim();
    if (!label) return;

    updateSelectedQuest((quest) => ({
      ...quest,
      papers: [...quest.papers, { label, meta: paperDraft.meta.trim() || "Manual entry", state: paperDraft.state.trim() || "Review" }],
    }));
    setPaperDraft({ label: "", meta: "", state: "Review" });
  }

  function addAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = assetDraft.name.trim();
    if (!name) return;

    setAssetList((current) => [
      {
        ...assetDraft,
        name,
        value: assetDraft.value.trim() || "$0 tracked",
        projected: assetDraft.projected.trim() || "$0",
      },
      ...current,
    ]);
    setAssetDraft({ name: "", type: "Rental", value: "", projected: "", frequency: "Monthly", status: "Producing" });
  }

  function cycleAssetStatus(assetIndex: number) {
    const order: Asset["status"][] = ["Producing", "Watching", "Planning"];
    setAssetList((current) =>
      current.map((asset, index) => (index === assetIndex ? { ...asset, status: order[(order.indexOf(asset.status) + 1) % order.length] } : asset)),
    );
  }

  function cycleLedgerState(entryIndex: number) {
    cycleLedgerStateAt(selectedQuestIndex, entryIndex);
  }

  function cycleLedgerStateAt(questIndex: number, entryIndex: number) {
    const order: LedgerState[] = ["Draft", "Open", "Paid"];
    setQuestList((current) =>
      current.map((quest, index) => {
        if (index !== questIndex) return quest;
        return {
          ...quest,
          ledger: quest.ledger.map((entry, ledgerIndex) => {
            if (ledgerIndex !== entryIndex) return entry;
            const nextState = order[(order.indexOf(entry.state) + 1) % order.length];
            return { ...entry, state: nextState };
          }),
        };
      }),
    );
  }

  function cyclePaperState(paperIndex: number) {
    cyclePaperStateAt(selectedQuestIndex, paperIndex);
  }

  function cyclePaperStateAt(questIndex: number, paperIndex: number) {
    const order = ["Review", "Ready", "Filed"];
    setQuestList((current) =>
      current.map((quest, index) => {
        if (index !== questIndex) return quest;
        return {
          ...quest,
          papers: quest.papers.map((paper, currentPaperIndex) => {
            if (currentPaperIndex !== paperIndex) return paper;
            const currentIndex = order.findIndex((state) => state.toLowerCase() === paper.state.toLowerCase());
            return { ...paper, state: order[((currentIndex === -1 ? 0 : currentIndex) + 1) % order.length] };
          }),
        };
      }),
    );
  }

  function advanceStep(stepIndex: number) {
    const order: StepState[] = ["Next", "Now", "Done"];
    updateSelectedQuest((quest) => ({
      ...quest,
      steps: quest.steps.map((step, index) => {
        if (index !== stepIndex) return step;
        const nextState = order[(order.indexOf(step.state) + 1) % order.length];
        return { ...step, state: nextState };
      }),
      progress: Math.round((quest.steps.filter((step, index) => (index === stepIndex ? order[(order.indexOf(step.state) + 1) % order.length] === "Done" : step.state === "Done")).length / Math.max(quest.steps.length, 1)) * 100),
    }));
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const note = noteDraft.trim();
    if (!note) return;

    updateSelectedQuest((quest) => ({ ...quest, notes: [note, ...quest.notes].slice(0, 4) }));
    setNoteDraft("");
  }

  function addPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = personDraft.name.trim();
    if (!name) return;

    setPeopleList((current) => [
      ...current,
      {
        name,
        role: personDraft.role.trim() || "Contact",
        quest: selectedQuest.name,
        nextTouch: personDraft.nextTouch.trim() || "No next touch set",
        status: "Active",
      },
    ]);
    setPersonDraft({ name: "", role: "", nextTouch: "" });
  }

  function cyclePersonStatus(personIndex: number) {
    const selectedIndexes = peopleList
      .map((person, index) => ({ person, index }))
      .filter(({ person }) => person.quest === selectedQuest.name)
      .map(({ index }) => index);
    const targetIndex = selectedIndexes[personIndex];
    if (targetIndex === undefined) return;

    cyclePersonStatusAt(targetIndex);
  }

  function cyclePersonStatusAt(personIndex: number) {
    const order: Person["status"][] = ["Active", "Waiting", "Quiet"];
    setPeopleList((current) =>
      current.map((person, index) => (index === personIndex ? { ...person, status: order[(order.indexOf(person.status) + 1) % order.length] } : person)),
    );
  }

  function removePerson(personIndex: number) {
    const selectedIndexes = peopleList
      .map((person, index) => ({ person, index }))
      .filter(({ person }) => person.quest === selectedQuest.name)
      .map(({ index }) => index);
    const targetIndex = selectedIndexes[personIndex];
    if (targetIndex === undefined) return;

    setPeopleList((current) => current.filter((_, index) => index !== targetIndex));
  }

  function removePersonAt(personIndex: number) {
    setPeopleList((current) => current.filter((_, index) => index !== personIndex));
  }

  function addReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = reminderDraft.label.trim();
    if (!label) return;

    setReminderList((current) => [
      {
        label,
        quest: selectedQuest.name,
        due: reminderDraft.due.trim() || "Soon",
        priority: reminderDraft.priority,
        done: false,
      },
      ...current,
    ]);
    setReminderDraft({ label: "", due: "", priority: "Normal" });
  }

  function toggleReminderDone(reminderLabel: string, questName: string) {
    const reminderIndex = reminderList.findIndex((reminder) => reminder.label === reminderLabel && reminder.quest === questName);
    if (reminderIndex !== -1) toggleReminderDoneAt(reminderIndex);
  }

  function toggleReminderDoneAt(reminderIndex: number) {
    setReminderList((current) =>
      current.map((reminder, index) => (index === reminderIndex ? { ...reminder, done: !reminder.done } : reminder)),
    );
  }

  return (
    <main className="app-shell">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <section className="workspace">
        <Topbar activeView={activeView} onToggleQuestComposer={() => setShowQuestComposer((isOpen) => !isOpen)} />

        {showQuestComposer ? (
          <QuestComposer draft={questDraft} onChange={setQuestDraft} onSubmit={addQuest} />
        ) : null}

        {activeView === "Command" ? (
          <CommandWorkspace
            activeReminders={activeReminders}
            commandPulse={commandPulse}
            moneyRows={moneyRows}
            onAddReminder={addReminder}
            onReminderChange={setReminderDraft}
            onToggleReminder={toggleReminderDone}
            paperQueue={paperQueue}
            reminderDraft={reminderDraft}
            selectedQuest={selectedQuest}
            setActiveView={setActiveView}
          />
        ) : null}
        {activeView === "Ledger" ? (
          <LedgerWorkspace
            draft={ledgerDraft}
            ledgerRows={ledgerRows}
            ledgerSummary={ledgerSummary}
            onAddLedgerEntry={addLedgerEntry}
            onCycleLedgerState={cycleLedgerStateAt}
            onDraftChange={setLedgerDraft}
            onOpenQuest={(questIndex) => { setSelectedQuestIndex(questIndex); setActiveView("Quests"); }}
            questList={questList}
            selectedQuestIndex={selectedQuestIndex}
            setSelectedQuestIndex={setSelectedQuestIndex}
          />
        ) : null}
        {activeView === "Paper Trail" ? (
          <PaperTrailWorkspace
            draft={paperDraft}
            onAddPaperItem={addPaperItem}
            onCyclePaperState={cyclePaperStateAt}
            onDraftChange={setPaperDraft}
            onOpenQuest={(questIndex) => { setSelectedQuestIndex(questIndex); setActiveView("Quests"); }}
            paperRows={paperRows}
            paperSummary={paperSummary}
            questList={questList}
            selectedQuestIndex={selectedQuestIndex}
            setSelectedQuestIndex={setSelectedQuestIndex}
          />
        ) : null}
        {activeView === "Reminders" ? (
        <section className="reminders-workspace panel">
          <div className="panel-header">
            <h2>Reminders</h2>
            <span>{reminderSummary.active} active</span>
          </div>

          <div className="reminders-board">
            <form className="reminders-workspace-form" onSubmit={addReminder}>
              <select
                aria-label="Reminder quest"
                onChange={(event) => setSelectedQuestIndex(Number(event.target.value))}
                value={selectedQuestIndex}
              >
                {questList.map((quest, index) => (
                  <option key={quest.name} value={index}>{quest.name}</option>
                ))}
              </select>
              <input
                aria-label="Reminder label"
                onChange={(event) => setReminderDraft((draft) => ({ ...draft, label: event.target.value }))}
                placeholder="Reminder"
                value={reminderDraft.label}
              />
              <input
                aria-label="Reminder due"
                onChange={(event) => setReminderDraft((draft) => ({ ...draft, due: event.target.value }))}
                placeholder="Due"
                value={reminderDraft.due}
              />
              <select
                aria-label="Reminder priority"
                onChange={(event) => setReminderDraft((draft) => ({ ...draft, priority: event.target.value as Reminder["priority"] }))}
                value={reminderDraft.priority}
              >
                <option>Quiet</option>
                <option>Normal</option>
                <option>Important</option>
              </select>
              <button type="submit">Add</button>
            </form>

            <div className="reminder-total-strip">
              <div>
                <span>Important</span>
                <strong>{reminderSummary.important}</strong>
              </div>
              <div>
                <span>Active</span>
                <strong>{reminderSummary.active}</strong>
              </div>
              <div>
                <span>Done</span>
                <strong>{reminderSummary.done}</strong>
              </div>
            </div>

            <div className="reminder-workspace-list">
              {reminderRows.map((reminder) => (
                <article className="reminder-workspace-row" data-done={reminder.done} key={`${reminder.quest}-${reminder.label}-${reminder.reminderIndex}`}>
                  <button className="task-check" onClick={() => toggleReminderDoneAt(reminder.reminderIndex)} type="button" aria-label={`${reminder.done ? "Reopen" : "Complete"} ${reminder.label}`} />
                  <div>
                    <span>{reminder.quest}</span>
                    <strong>{reminder.label}</strong>
                  </div>
                  <div>
                    <span>{reminder.due}</span>
                    <strong data-priority={reminder.priority}>{reminder.priority}</strong>
                  </div>
                  <button data-state={reminder.done ? "Done" : "Open"} onClick={() => toggleReminderDoneAt(reminder.reminderIndex)} type="button">{reminder.done ? "Done" : "Open"}</button>
                  <button className="open-quest-button" onClick={() => { if (reminder.questIndex >= 0) setSelectedQuestIndex(reminder.questIndex); setActiveView("Quests"); }} type="button">Open Quest</button>
                </article>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {activeView === "People" ? (
        <section className="people-workspace panel">
          <div className="panel-header">
            <h2>People</h2>
            <span>{peopleRows.length} contacts</span>
          </div>

          <div className="people-board">
            <form className="people-workspace-form" onSubmit={addPerson}>
              <select
                aria-label="Person quest"
                onChange={(event) => setSelectedQuestIndex(Number(event.target.value))}
                value={selectedQuestIndex}
              >
                {questList.map((quest, index) => (
                  <option key={quest.name} value={index}>{quest.name}</option>
                ))}
              </select>
              <input
                aria-label="Person name"
                onChange={(event) => setPersonDraft((draft) => ({ ...draft, name: event.target.value }))}
                placeholder="Name"
                value={personDraft.name}
              />
              <input
                aria-label="Person role"
                onChange={(event) => setPersonDraft((draft) => ({ ...draft, role: event.target.value }))}
                placeholder="Role"
                value={personDraft.role}
              />
              <input
                aria-label="Next touch"
                onChange={(event) => setPersonDraft((draft) => ({ ...draft, nextTouch: event.target.value }))}
                placeholder="Next touch"
                value={personDraft.nextTouch}
              />
              <button type="submit">Add</button>
            </form>

            <div className="people-total-strip">
              <div>
                <span>Active</span>
                <strong>{peopleSummary.active}</strong>
              </div>
              <div>
                <span>Waiting</span>
                <strong>{peopleSummary.waiting}</strong>
              </div>
              <div>
                <span>Quiet</span>
                <strong>{peopleSummary.quiet}</strong>
              </div>
            </div>

            <div className="people-workspace-list">
              {peopleRows.map((person) => (
                <article className="people-workspace-row" key={`${person.name}-${person.role}-${person.personIndex}`}>
                  <div>
                    <span>{person.quest}</span>
                    <strong>{person.name}</strong>
                  </div>
                  <div>
                    <span>{person.role}</span>
                    <strong>{person.nextTouch}</strong>
                  </div>
                  <button data-status={person.status} onClick={() => cyclePersonStatusAt(person.personIndex)} type="button">{person.status}</button>
                  <button className="open-quest-button" onClick={() => { if (person.questIndex >= 0) setSelectedQuestIndex(person.questIndex); setActiveView("Quests"); }} type="button">Open Quest</button>
                  <button className="remove-person-workspace" onClick={() => removePersonAt(person.personIndex)} type="button" aria-label={`Remove ${person.name}`}>Remove</button>
                </article>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {activeView !== "Command" && activeView !== "Assets" && activeView !== "Ledger" && activeView !== "Paper Trail" && activeView !== "Reminders" && activeView !== "People" ? (
        <section className="quest-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Active Quests</p>
              <h2>Work, rentals, builds, investments</h2>
            </div>
            <button type="button" className="ghost-button">View All</button>
          </div>

          <div className="quest-focus-grid">
            <div className="quest-picker" aria-label="Quest selector">
              {questList.map((quest, index) => (
                <button
                  className="quest-card"
                  data-selected={index === selectedQuestIndex}
                  key={quest.name}
                  onClick={() => setSelectedQuestIndex(index)}
                  type="button"
                >
                  <div className="quest-card-top">
                    <span>{quest.type}</span>
                    <b data-status={quest.tone}>{quest.status}</b>
                  </div>
                  <h3>{quest.name}</h3>
                  <p>{quest.nextMove}</p>
                  <div className="progress-bar" aria-label={`${quest.name} progress`}>
                    <span style={{ width: `${quest.progress}%` }} />
                  </div>
                  <div className="quest-card-bottom">
                    <span>{quest.due}</span>
                    <strong>{quest.value}</strong>
                  </div>
                </button>
              ))}
            </div>

            <article className="quest-detail" aria-live="polite">
              <div className="quest-detail-main">
                <div>
                  <span className="detail-kicker">{selectedQuest.owner}</span>
                  <h3>{selectedQuest.name}</h3>
                  <p>{selectedQuest.summary}</p>
                  <form className="inline-note-form" onSubmit={addNote}>
                    <input
                      aria-label="Quest note"
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder="Add quick note"
                      value={noteDraft}
                    />
                    <button type="submit">Add</button>
                  </form>
                </div>
                <div className="detail-value">
                  <span>{selectedQuest.target}</span>
                  <strong>{selectedQuest.progress}%</strong>
                </div>
              </div>

              <div className="detail-columns">
                <section className="detail-column">
                  <div className="detail-column-head">
                    <h4>Ledger</h4>
                    <span>{selectedQuest.ledger.length}</span>
                  </div>
                  <form className="mini-form" onSubmit={addLedgerEntry}>
                    <input
                      aria-label="Ledger label"
                      onChange={(event) => setLedgerDraft((draft) => ({ ...draft, label: event.target.value }))}
                      placeholder="Label"
                      value={ledgerDraft.label}
                    />
                    <input
                      aria-label="Ledger amount"
                      onChange={(event) => setLedgerDraft((draft) => ({ ...draft, amount: event.target.value }))}
                      placeholder="$0"
                      value={ledgerDraft.amount}
                    />
                    <select
                      aria-label="Ledger state"
                      onChange={(event) => setLedgerDraft((draft) => ({ ...draft, state: event.target.value as LedgerState }))}
                      value={ledgerDraft.state}
                    >
                      <option>Draft</option>
                      <option>Open</option>
                      <option>Paid</option>
                    </select>
                    <button aria-label="Add ledger entry" type="submit">+</button>
                  </form>
                  {selectedQuest.ledger.map((entry, index) => (
                    <div className="mini-row" key={entry.label}>
                      <span>{entry.label}</span>
                      <strong>{entry.amount}</strong>
                      <button data-state={entry.state} onClick={() => cycleLedgerState(index)} type="button">{entry.state}</button>
                    </div>
                  ))}
                </section>

                <section className="detail-column">
                  <div className="detail-column-head">
                    <h4>Paper Trail</h4>
                    <span>{selectedQuest.papers.length}</span>
                  </div>
                  <form className="mini-form" onSubmit={addPaperItem}>
                    <input
                      aria-label="Paper trail label"
                      onChange={(event) => setPaperDraft((draft) => ({ ...draft, label: event.target.value }))}
                      placeholder="Receipt/photo"
                      value={paperDraft.label}
                    />
                    <input
                      aria-label="Paper trail meta"
                      onChange={(event) => setPaperDraft((draft) => ({ ...draft, meta: event.target.value }))}
                      placeholder="Photo, PDF..."
                      value={paperDraft.meta}
                    />
                    <input
                      aria-label="Paper trail state"
                      onChange={(event) => setPaperDraft((draft) => ({ ...draft, state: event.target.value }))}
                      placeholder="Review"
                      value={paperDraft.state}
                    />
                    <button aria-label="Add paper trail item" type="submit">+</button>
                  </form>
                  {selectedQuest.papers.map((paper, index) => (
                    <div className="mini-row" key={paper.label}>
                      <span>{paper.label}</span>
                      <strong>{paper.meta}</strong>
                      <button data-state={paper.state} onClick={() => cyclePaperState(index)} type="button">{paper.state}</button>
                    </div>
                  ))}
                </section>

                <section className="detail-column" id="people">
                  <div className="detail-column-head">
                    <h4>People</h4>
                    <span>{selectedPeople.length}</span>
                  </div>
                  <form className="people-form" onSubmit={addPerson}>
                    <input
                      aria-label="Person name"
                      onChange={(event) => setPersonDraft((draft) => ({ ...draft, name: event.target.value }))}
                      placeholder="Name"
                      value={personDraft.name}
                    />
                    <input
                      aria-label="Person role"
                      onChange={(event) => setPersonDraft((draft) => ({ ...draft, role: event.target.value }))}
                      placeholder="Role"
                      value={personDraft.role}
                    />
                    <input
                      aria-label="Next touch"
                      onChange={(event) => setPersonDraft((draft) => ({ ...draft, nextTouch: event.target.value }))}
                      placeholder="Next touch"
                      value={personDraft.nextTouch}
                    />
                    <button aria-label="Add person" type="submit">+</button>
                  </form>
                  {selectedPeople.length > 0 ? selectedPeople.map((person, index) => (
                    <div className="person-row" key={`${person.name}-${person.role}`}>
                      <span>{person.name}</span>
                      <div className="person-actions">
                        <strong>{person.role}</strong>
                        <button data-status={person.status} onClick={() => cyclePersonStatus(index)} type="button">{person.status}</button>
                        <button className="remove-person" onClick={() => removePerson(index)} type="button" aria-label={`Remove ${person.name}`}>x</button>
                      </div>
                      <em>{person.nextTouch}</em>
                    </div>
                  )) : (
                    <p className="empty-detail">No people linked yet.</p>
                  )}
                </section>

                <section className="detail-column">
                  <div className="detail-column-head">
                    <h4>Next Steps</h4>
                    <span>{selectedQuest.steps.length}</span>
                  </div>
                  {selectedQuest.steps.map((step, index) => (
                    <div className="step-row" data-step={step.state} key={step.label}>
                      <span />
                      <strong>{step.label}</strong>
                      <button onClick={() => advanceStep(index)} type="button">{step.state}</button>
                    </div>
                  ))}
                </section>
              </div>

              <div className="note-strip">
                <form className="note-form" onSubmit={addNote}>
                  <input
                    aria-label="Quest note"
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Add quick note"
                    value={noteDraft}
                  />
                  <button type="submit">Add</button>
                </form>
                {selectedQuest.notes.map((note) => (
                  <span key={note}>{note}</span>
                ))}
              </div>
            </article>
          </div>
        </section>

        ) : null}

        {activeView === "Assets" ? (
          <AssetsWorkspace
            assetDraft={assetDraft}
            assetList={assetList}
            assetSummary={assetSummary}
            onAddAsset={addAsset}
            onAssetDraftChange={setAssetDraft}
            onCycleAssetStatus={cycleAssetStatus}
          />
        ) : null}
      </section>
      <button className="fab" type="button" aria-label="Quick add"><Icon name="plus" /></button>
    </main>
  );
}
