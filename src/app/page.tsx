"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Icon } from "./components/Icon";
import { AssetsWorkspace } from "./components/AssetsWorkspace";
import { CommandWorkspace } from "./components/CommandWorkspace";
import { LedgerWorkspace } from "./components/LedgerWorkspace";
import { PaperTrailWorkspace } from "./components/PaperTrailWorkspace";
import { PeopleWorkspace } from "./components/PeopleWorkspace";
import { QuestWorkspace } from "./components/QuestWorkspace";
import { RentalsWorkspace } from "./components/RentalsWorkspace";
import { RemindersWorkspace } from "./components/RemindersWorkspace";
import { Sidebar } from "./components/Sidebar";
import { QuestComposer, ScanIntake, Topbar, type ScanDraft } from "./components/Topbar";
import { getQuestTypePreset, seedAssets, seedPeople, seedQuests, seedReminders, seedRentalBook } from "./data";
import { loadStoredAppData, saveStoredAppData } from "./persistence";
import {
  getActiveReminders,
  getAssetSummary,
  getCommandPulse,
  getLedgerRows,
  getLedgerSummary,
  getPaperQueue,
  getPaperRows,
  getPaperSummary,
  getPeopleRows,
  getPeopleSummary,
  getReminderRows,
  getReminderSummary,
  getSelectedPeople,
  getSelectedQuest,
} from "./selectors";
import type { AppView, Asset, LedgerState, Person, Quest, QuestType, Reminder, RentalBook, StepState } from "./types";
import { getMoneyRows } from "./utils";
export default function Home() {
  const [questList, setQuestList] = useState<Quest[]>(seedQuests);
  const [selectedQuestIndex, setSelectedQuestIndex] = useState(0);
  const [hasLoadedStoredData, setHasLoadedStoredData] = useState(false);
  const [showQuestComposer, setShowQuestComposer] = useState(false);
  const [showScanIntake, setShowScanIntake] = useState(false);
  const [activeView, setActiveView] = useState<AppView>("Command");
  const [questDraft, setQuestDraft] = useState<{ name: string; type: QuestType; value: string; due: string }>({ name: "", type: "Rental Property", value: "", due: "" });
  const [scanDraft, setScanDraft] = useState<ScanDraft>({ amount: "", fileName: "", label: "", notes: "", questIndex: 0, source: "Receipt", state: "Review" });
  const [ledgerDraft, setLedgerDraft] = useState<{ label: string; amount: string; state: LedgerState }>({ label: "", amount: "", state: "Draft" });
  const [paperDraft, setPaperDraft] = useState({ label: "", meta: "", state: "Review" });
  const [peopleList, setPeopleList] = useState<Person[]>(seedPeople);
  const [personDraft, setPersonDraft] = useState({ name: "", role: "", nextTouch: "" });
  const [reminderList, setReminderList] = useState<Reminder[]>(seedReminders);
  const [reminderDraft, setReminderDraft] = useState({ label: "", due: "", priority: "Normal" as Reminder["priority"] });
  const [assetList, setAssetList] = useState<Asset[]>(seedAssets);
  const [assetDraft, setAssetDraft] = useState<Asset>({ name: "", type: "Rental", value: "", projected: "", frequency: "Monthly", status: "Producing" });
  const [rentalBook, setRentalBook] = useState<RentalBook>(seedRentalBook);
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(0);
  const [noteDraft, setNoteDraft] = useState("");
  const selectedQuest = useMemo(() => getSelectedQuest(questList, selectedQuestIndex, seedQuests[0]), [questList, selectedQuestIndex]);
  const moneyRows = useMemo(() => getMoneyRows(questList), [questList]);
  const selectedPeople = useMemo(() => getSelectedPeople(peopleList, selectedQuest.name), [peopleList, selectedQuest.name]);
  const peopleRows = useMemo(() => getPeopleRows(peopleList, questList), [peopleList, questList]);
  const peopleSummary = useMemo(() => getPeopleSummary(peopleRows), [peopleRows]);
  const activeReminders = useMemo(() => getActiveReminders(reminderList), [reminderList]);
  const reminderRows = useMemo(() => getReminderRows(reminderList, questList), [questList, reminderList]);
  const reminderSummary = useMemo(() => getReminderSummary(reminderRows), [reminderRows]);
  const ledgerRows = useMemo(() => getLedgerRows(questList), [questList]);
  const ledgerSummary = useMemo(() => getLedgerSummary(ledgerRows), [ledgerRows]);
  const paperRows = useMemo(() => getPaperRows(questList), [questList]);
  const paperSummary = useMemo(() => getPaperSummary(paperRows), [paperRows]);
  const assetSummary = useMemo(() => getAssetSummary(assetList), [assetList]);
  const commandPulse = useMemo(
    () =>
      getCommandPulse({
        assetMonthlyProjected: assetSummary.monthlyProjected,
        ledgerOpen: ledgerSummary.open,
        paperReviewCount: paperSummary.reviewCount,
        peopleWaiting: peopleSummary.waiting,
      }),
    [assetSummary.monthlyProjected, ledgerSummary.open, paperSummary.reviewCount, peopleSummary.waiting],
  );
  const paperQueue = useMemo(() => getPaperQueue(questList), [questList]);

  useEffect(() => {
    setScanDraft((draft) => {
      const nextQuestIndex = Math.min(draft.questIndex, Math.max(questList.length - 1, 0));
      return nextQuestIndex === draft.questIndex ? draft : { ...draft, questIndex: nextQuestIndex };
    });
  }, [questList.length]);

  useEffect(() => {
    const storedData = loadStoredAppData();
    setQuestList(storedData.quests.length > 0 ? storedData.quests : seedQuests);
    setPeopleList(storedData.people);
    setReminderList(storedData.reminders);
    setAssetList(storedData.assets);
    setRentalBook(storedData.rentalBook);
    setHasLoadedStoredData(true);
  }, []);

  useEffect(() => {
    if (hasLoadedStoredData) {
      saveStoredAppData({ assets: assetList, people: peopleList, quests: questList, reminders: reminderList, rentalBook });
    }
  }, [assetList, hasLoadedStoredData, peopleList, questList, reminderList, rentalBook]);

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

  function addScanIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = scanDraft.label.trim();
    if (!label) return;

    const targetQuestIndex = Math.max(0, Math.min(scanDraft.questIndex, questList.length - 1));
    const fileName = scanDraft.fileName.trim();
    const notes = scanDraft.notes.trim();
    const metaParts = [scanDraft.source, fileName, notes].filter(Boolean);
    const amount = scanDraft.amount.trim();

    setQuestList((current) =>
      current.map((quest, index) => {
        if (index !== targetQuestIndex) return quest;

        return {
          ...quest,
          ledger: amount ? [{ label, amount, state: "Draft" }, ...quest.ledger] : quest.ledger,
          papers: [{ label, meta: metaParts.join(" / ") || scanDraft.source, state: scanDraft.state }, ...quest.papers],
          notes: notes ? [`Paper intake: ${notes}`, ...quest.notes].slice(0, 4) : quest.notes,
        };
      }),
    );

    setSelectedQuestIndex(targetQuestIndex);
    setScanDraft({ amount: "", fileName: "", label: "", notes: "", questIndex: targetQuestIndex, source: "Receipt", state: "Review" });
    setShowScanIntake(false);
    setActiveView("Paper Trail");
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

  function removeAsset(assetIndex: number) {
    setAssetList((current) => current.filter((_, index) => index !== assetIndex));
  }

  function openAssetQuest(assetIndex: number) {
    const asset = assetList[assetIndex];
    if (!asset) return;

    const existingQuestIndex = questList.findIndex((quest) => quest.name.toLowerCase() === asset.name.toLowerCase());
    if (existingQuestIndex !== -1) {
      setSelectedQuestIndex(existingQuestIndex);
      setActiveView("Quests");
      return;
    }

    const questType: QuestType =
      asset.type === "Rental" ? "Rental Property" :
      asset.type === "Build" ? "Build Project" :
      asset.type === "Other" ? "Side Quest" :
      "Investment";
    const preset = getQuestTypePreset(questType);
    const nextQuest: Quest = {
      name: asset.name,
      type: preset.type,
      status: asset.status,
      nextMove: "Review asset plan and confirm the next move.",
      value: asset.value || "$0 tracked",
      progress: asset.status === "Producing" ? 35 : 10,
      tone: asset.status === "Producing" ? "active" : "discovery",
      owner: preset.owner,
      target: asset.projected ? `${asset.projected} ${asset.frequency.toLowerCase()}` : preset.target,
      due: "Next check: Asset review",
      summary: `${asset.type} asset tracked from Assets. Projected return: ${asset.projected || "$0"} ${asset.frequency.toLowerCase()}.`,
      ledger: asset.projected ? [{ label: "Projected return", amount: asset.projected, state: "Draft" }] : [],
      papers: [],
      steps: preset.steps,
      notes: ["Created from Assets. Add receipts, updates, and next actions as this asset moves."],
    };

    setQuestList((current) => [...current, nextQuest]);
    setSelectedQuestIndex(questList.length);
    setActiveView("Quests");
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

  function removeLedgerEntry(entryIndex: number) {
    removeLedgerEntryAt(selectedQuestIndex, entryIndex);
  }

  function removeLedgerEntryAt(questIndex: number, entryIndex: number) {
    setQuestList((current) =>
      current.map((quest, index) => (index === questIndex ? { ...quest, ledger: quest.ledger.filter((_, currentEntryIndex) => currentEntryIndex !== entryIndex) } : quest)),
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

  function removePaperItem(paperIndex: number) {
    removePaperItemAt(selectedQuestIndex, paperIndex);
  }

  function removePaperItemAt(questIndex: number, paperIndex: number) {
    setQuestList((current) =>
      current.map((quest, index) => (index === questIndex ? { ...quest, papers: quest.papers.filter((_, currentPaperIndex) => currentPaperIndex !== paperIndex) } : quest)),
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

  function removeNote(noteIndex: number) {
    updateSelectedQuest((quest) => ({ ...quest, notes: quest.notes.filter((_, index) => index !== noteIndex) }));
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

  function removeReminderAt(reminderIndex: number) {
    setReminderList((current) => current.filter((_, index) => index !== reminderIndex));
  }

  return (
    <main className="app-shell">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <section className="workspace">
        <Topbar
          activeView={activeView}
          onToggleQuestComposer={() => setShowQuestComposer((isOpen) => !isOpen)}
          onToggleScanIntake={() => {
            setScanDraft((draft) => ({ ...draft, questIndex: selectedQuestIndex }));
            setShowScanIntake((isOpen) => !isOpen);
          }}
        />

        {showQuestComposer ? (
          <QuestComposer draft={questDraft} onChange={setQuestDraft} onSubmit={addQuest} />
        ) : null}

        {showScanIntake ? (
          <ScanIntake draft={scanDraft} onChange={setScanDraft} onSubmit={addScanIntake} questList={questList} />
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
            onRemoveLedgerEntry={removeLedgerEntryAt}
            questList={questList}
            selectedQuestIndex={selectedQuestIndex}
            setSelectedQuestIndex={setSelectedQuestIndex}
          />
        ) : null}
        {activeView === "Rentals" ? (
          <RentalsWorkspace
            rentalBook={rentalBook}
            selectedPropertyIndex={selectedPropertyIndex}
            onSelectedPropertyIndexChange={setSelectedPropertyIndex}
          />
        ) : null}
        {activeView === "Paper Trail" ? (
          <PaperTrailWorkspace
            draft={paperDraft}
            onAddPaperItem={addPaperItem}
            onCyclePaperState={cyclePaperStateAt}
            onDraftChange={setPaperDraft}
            onOpenQuest={(questIndex) => { setSelectedQuestIndex(questIndex); setActiveView("Quests"); }}
            onRemovePaperItem={removePaperItemAt}
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
            onRemoveReminder={removeReminderAt}
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

        {activeView !== "Command" && activeView !== "Assets" && activeView !== "Ledger" && activeView !== "Rentals" && activeView !== "Paper Trail" && activeView !== "Reminders" && activeView !== "People" ? (
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
            onRemoveLedgerEntry={removeLedgerEntry}
            onRemoveNote={removeNote}
            onRemovePaperItem={removePaperItem}
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
            onOpenAssetQuest={openAssetQuest}
            onRemoveAsset={removeAsset}
          />
        ) : null}
      </section>
      <button className="fab" type="button" aria-label="Quick add"><Icon name="plus" /></button>
    </main>
  );
}
