import type { AppView, Asset, LedgerState, PaperItem, Person, Quest, Reminder } from "./types";
import { formatMoney, getMonthlyProjection, parseMoney } from "./utils";

export type PersonRow = Person & {
  personIndex: number;
  questIndex: number;
};

export type ReminderRow = Reminder & {
  reminderIndex: number;
  questIndex: number;
};

export type LedgerRow = Quest["ledger"][number] & {
  entryIndex: number;
  questIndex: number;
  questName: string;
  questType: string;
};

export type PaperRow = Quest["papers"][number] & {
  kind: "image" | "file";
  paperIndex: number;
  questIndex: number;
  questName: string;
  questType: string;
};

export function getSelectedQuest(questList: Quest[], selectedQuestIndex: number, fallbackQuest: Quest) {
  return questList[Math.min(selectedQuestIndex, questList.length - 1)] ?? fallbackQuest;
}

export function getSelectedPeople(peopleList: Person[], selectedQuestName: string) {
  return peopleList.filter((person) => person.quest === selectedQuestName);
}

export function getPeopleRows(peopleList: Person[], questList: Quest[]): PersonRow[] {
  return peopleList.map((person, personIndex) => ({
    ...person,
    personIndex,
    questIndex: questList.findIndex((quest) => quest.name === person.quest),
  }));
}

export function getPeopleSummary(peopleRows: PersonRow[]) {
  return {
    active: peopleRows.filter((person) => person.status === "Active").length,
    quiet: peopleRows.filter((person) => person.status === "Quiet").length,
    waiting: peopleRows.filter((person) => person.status === "Waiting").length,
  };
}

export function getActiveReminders(reminderList: Reminder[]) {
  return reminderList.filter((reminder) => !reminder.done).slice(0, 4);
}

export function getReminderRows(reminderList: Reminder[], questList: Quest[]): ReminderRow[] {
  return reminderList.map((reminder, reminderIndex) => ({
    ...reminder,
    reminderIndex,
    questIndex: questList.findIndex((quest) => quest.name === reminder.quest),
  }));
}

export function getReminderSummary(reminderRows: ReminderRow[]) {
  return {
    active: reminderRows.filter((reminder) => !reminder.done).length,
    done: reminderRows.filter((reminder) => reminder.done).length,
    important: reminderRows.filter((reminder) => !reminder.done && reminder.priority === "Important").length,
  };
}

export function getLedgerRows(questList: Quest[]): LedgerRow[] {
  return questList.flatMap((quest, questIndex) =>
    quest.ledger.map((entry, entryIndex) => ({
      ...entry,
      entryIndex,
      questIndex,
      questName: quest.name,
      questType: quest.type,
    })),
  );
}

export function getLedgerSummary(ledgerRows: LedgerRow[]) {
  const totalByState = (state: LedgerState) =>
    ledgerRows.filter((entry) => entry.state === state).reduce((total, entry) => total + parseMoney(entry.amount), 0);

  return {
    draft: totalByState("Draft"),
    open: totalByState("Open"),
    paid: totalByState("Paid"),
  };
}

export function getPaperKind(meta: string): "image" | "file" {
  const normalizedMeta = meta.toLowerCase();
  return normalizedMeta.includes("image") || normalizedMeta.includes("photo") ? "image" : "file";
}

export function getPaperRows(questList: Quest[]): PaperRow[] {
  return questList.flatMap((quest, questIndex) =>
    quest.papers.map((paper, paperIndex) => ({
      ...paper,
      kind: getPaperKind(paper.meta),
      paperIndex,
      questIndex,
      questName: quest.name,
      questType: quest.type,
    })),
  );
}

export function getPaperSummary(paperRows: PaperRow[]) {
  const reviewCount = paperRows.filter((paper) => paper.state.toLowerCase().includes("review") || paper.state.toLowerCase().includes("draft")).length;
  const filedCount = paperRows.filter((paper) => paper.state.toLowerCase().includes("filed")).length;
  const readyCount = paperRows.filter((paper) => paper.state.toLowerCase().includes("ready")).length;
  return { filedCount, readyCount, reviewCount };
}

export function getAssetSummary(assetList: Asset[]) {
  const monthlyProjected = assetList.reduce((total, asset) => total + getMonthlyProjection(asset), 0);
  return {
    activeCount: assetList.filter((asset) => asset.status === "Producing").length,
    monthlyProjected,
    annualProjected: monthlyProjected * 12,
  };
}

export function getCommandPulse(input: {
  assetMonthlyProjected: number;
  ledgerOpen: number;
  paperReviewCount: number;
  peopleWaiting: number;
}): Array<{ label: string; value: string; detail: string; view: AppView }> {
  return [
    { label: "Assets", value: formatMoney(input.assetMonthlyProjected), detail: "Projected / mo", view: "Assets" },
    { label: "Ledger", value: formatMoney(input.ledgerOpen), detail: "Open money", view: "Ledger" },
    { label: "Paper", value: String(input.paperReviewCount), detail: "Need review", view: "Paper Trail" },
    { label: "People", value: String(input.peopleWaiting), detail: "Waiting touches", view: "People" },
  ];
}

export function getPaperQueue(questList: Quest[]): PaperItem[] {
  const items = questList.flatMap((quest) =>
    quest.papers.map((paper) => ({
      title: paper.label,
      source: quest.name,
      state: paper.state,
      amount: quest.ledger[0]?.amount ?? "$0",
      kind: getPaperKind(paper.meta),
    })),
  );

  return items.slice(0, 3);
}
