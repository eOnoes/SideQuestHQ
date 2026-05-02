"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Icon } from "./components/Icon";
import { AssetsWorkspace } from "./components/AssetsWorkspace";
import { CommandWorkspace } from "./components/CommandWorkspace";
import { LedgerWorkspace } from "./components/LedgerWorkspace";
import { PaperTrailWorkspace } from "./components/PaperTrailWorkspace";
import { PeopleWorkspace } from "./components/PeopleWorkspace";
import { QuestWorkspace } from "./components/QuestWorkspace";
import { RemindersWorkspace } from "./components/RemindersWorkspace";
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
          <RemindersWorkspace
            draft={reminderDraft}
            onAddReminder={addReminder}
            onDraftChange={setReminderDraft}
            onOpenQuest={(questIndex) => {
              if (questIndex >= 0) setSelectedQuestIndex(questIndex);
              setActiveView("Quests");
            }}
            onSelectedQuestIndexChange={setSelectedQuestIndex}
            onToggleReminder={toggleReminderDoneAt}
            questList={questList}
            reminderRows={reminderRows}
            reminderSummary={reminderSummary}
            selectedQuestIndex={selectedQuestIndex}
          />
        ) : null}

        {activeView === "People" ? (
          <PeopleWorkspace
            draft={personDraft}
            onAddPerson={addPerson}
            onCyclePersonStatus={cyclePersonStatusAt}
            onDraftChange={setPersonDraft}
            onOpenQuest={(questIndex) => {
              if (questIndex >= 0) setSelectedQuestIndex(questIndex);
              setActiveView("Quests");
            }}
            onRemovePerson={removePersonAt}
            onSelectedQuestIndexChange={setSelectedQuestIndex}
            peopleRows={peopleRows}
            peopleSummary={peopleSummary}
            questList={questList}
            selectedQuestIndex={selectedQuestIndex}
          />
        ) : null}

        {activeView !== "Command" && activeView !== "Assets" && activeView !== "Ledger" && activeView !== "Paper Trail" && activeView !== "Reminders" && activeView !== "People" ? (
          <QuestWorkspace
            ledgerDraft={ledgerDraft}
            noteDraft={noteDraft}
            onAddLedgerEntry={addLedgerEntry}
            onAddNote={addNote}
            onAddPaperItem={addPaperItem}
            onAddPerson={addPerson}
            onAdvanceStep={advanceStep}
            onCycleLedgerState={cycleLedgerState}
            onCyclePaperState={cyclePaperState}
            onCyclePersonStatus={cyclePersonStatus}
            onLedgerDraftChange={setLedgerDraft}
            onNoteDraftChange={setNoteDraft}
            onPaperDraftChange={setPaperDraft}
            onPersonDraftChange={setPersonDraft}
            onRemovePerson={removePerson}
            onSelectedQuestIndexChange={setSelectedQuestIndex}
            paperDraft={paperDraft}
            personDraft={personDraft}
            questList={questList}
            selectedPeople={selectedPeople}
            selectedQuest={selectedQuest}
            selectedQuestIndex={selectedQuestIndex}
          />
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
