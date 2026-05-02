import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Person, Quest } from "../types";

type PersonRow = Person & {
  personIndex: number;
  questIndex: number;
};

type PersonDraft = {
  name: string;
  role: string;
  nextTouch: string;
};

type PeopleWorkspaceProps = {
  draft: PersonDraft;
  onAddPerson: (event: FormEvent<HTMLFormElement>) => void;
  onCyclePersonStatus: (personIndex: number) => void;
  onDraftChange: Dispatch<SetStateAction<PersonDraft>>;
  onOpenQuest: (questIndex: number) => void;
  onRemovePerson: (personIndex: number) => void;
  onSelectedQuestIndexChange: (questIndex: number) => void;
  peopleRows: PersonRow[];
  peopleSummary: {
    active: number;
    quiet: number;
    waiting: number;
  };
  questList: Quest[];
  selectedQuestIndex: number;
};

export function PeopleWorkspace({
  draft,
  onAddPerson,
  onCyclePersonStatus,
  onDraftChange,
  onOpenQuest,
  onRemovePerson,
  onSelectedQuestIndexChange,
  peopleRows,
  peopleSummary,
  questList,
  selectedQuestIndex,
}: PeopleWorkspaceProps) {
  return (
    <section className="people-workspace panel">
      <div className="panel-header">
        <h2>People</h2>
        <span>{peopleRows.length} contacts</span>
      </div>

      <div className="people-board">
        <form className="people-workspace-form" onSubmit={onAddPerson}>
          <select
            aria-label="Person quest"
            onChange={(event) => onSelectedQuestIndexChange(Number(event.target.value))}
            value={selectedQuestIndex}
          >
            {questList.map((quest, index) => (
              <option key={quest.name} value={index}>{quest.name}</option>
            ))}
          </select>
          <input
            aria-label="Person name"
            onChange={(event) => onDraftChange((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
            placeholder="Name"
            value={draft.name}
          />
          <input
            aria-label="Person role"
            onChange={(event) => onDraftChange((currentDraft) => ({ ...currentDraft, role: event.target.value }))}
            placeholder="Role"
            value={draft.role}
          />
          <input
            aria-label="Next touch"
            onChange={(event) => onDraftChange((currentDraft) => ({ ...currentDraft, nextTouch: event.target.value }))}
            placeholder="Next touch"
            value={draft.nextTouch}
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
              <button data-status={person.status} onClick={() => onCyclePersonStatus(person.personIndex)} type="button">{person.status}</button>
              <button className="open-quest-button" onClick={() => onOpenQuest(person.questIndex)} type="button">Open Quest</button>
              <button className="remove-person-workspace" onClick={() => onRemovePerson(person.personIndex)} type="button" aria-label={`Remove ${person.name}`}>Remove</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
