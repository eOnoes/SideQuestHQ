import type { Asset, IconName, LedgerState, Quest } from "./types";

export function parseMoney(value: string) {
  const amount = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0, style: "currency", currency: "USD" }).format(value);
}

export function getMonthlyProjection(asset: Asset) {
  const amount = parseMoney(asset.projected);
  if (asset.frequency === "Annual") return amount / 12;
  if (asset.frequency === "One-time") return 0;
  return amount;
}

export function getMoneyRows(questList: Quest[]): Array<{
  label: string;
  value: string;
  trend: string;
  trendTone: "up" | "down" | "neutral";
  icon: IconName;
}> {
  const openEntries = questList.flatMap((quest) => quest.ledger.filter((entry) => entry.state === "Open"));
  const paidEntries = questList.flatMap((quest) => quest.ledger.filter((entry) => entry.state === "Paid"));
  const draftEntries = questList.flatMap((quest) => quest.ledger.filter((entry) => entry.state === "Draft"));
  const reviewPapers = questList.flatMap((quest) => quest.papers.filter((paper) => paper.state.toLowerCase().includes("review") || paper.state.toLowerCase().includes("draft")));

  return [
    { label: "Expected In", value: formatMoney(openEntries.reduce((total, entry) => total + parseMoney(entry.amount), 0)), trend: `${openEntries.length} open`, trendTone: "up", icon: "dollar" },
    { label: "Open Balances", value: formatMoney(draftEntries.reduce((total, entry) => total + parseMoney(entry.amount), 0)), trend: `${draftEntries.length} drafts`, trendTone: "down", icon: "receipt" },
    { label: "Recent Paid", value: formatMoney(paidEntries.reduce((total, entry) => total + parseMoney(entry.amount), 0)), trend: `${paidEntries.length} logged`, trendTone: "neutral", icon: "card" },
    { label: "Paper Trail Drafts", value: String(reviewPapers.length), trend: "Needs review", trendTone: "neutral", icon: "edit" },
  ];
}

export function totalLedgerByState(questList: Quest[], state: LedgerState) {
  return questList.flatMap((quest) => quest.ledger).filter((entry) => entry.state === state).reduce((total, entry) => total + parseMoney(entry.amount), 0);
}
