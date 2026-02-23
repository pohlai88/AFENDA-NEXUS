import { describe, it, expect } from "vitest";
import { getJournal } from "../app/services/get-journal.js";
import { IDS, makeJournal, mockJournalRepo } from "./helpers.js";

describe("getJournal()", () => {
  it("returns a journal by ID", async () => {
    const journal = makeJournal();
    const repo = mockJournalRepo(new Map([[IDS.journal, journal]]));
    const result = await getJournal(IDS.journal, { journalRepo: repo });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.id).toBe(IDS.journal);
  });

  it("returns NOT_FOUND for missing journal", async () => {
    const repo = mockJournalRepo();
    const result = await getJournal("missing", { journalRepo: repo });
    expect(result.ok).toBe(false);
  });
});
