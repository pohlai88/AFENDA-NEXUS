import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/v1/finance/journals", () => {
    return HttpResponse.json({
      items: [
        {
          id: "j-001",
          tenantId: "t-001",
          ledgerId: "l-001",
          periodId: "p-001",
          reference: "JE-0001",
          description: "Opening balance",
          status: "POSTED",
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
      total: 1,
    });
  }),

  http.get("/api/v1/finance/journals/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      tenantId: "t-001",
      ledgerId: "l-001",
      periodId: "p-001",
      reference: "JE-0001",
      description: "Opening balance",
      status: "POSTED",
      lines: [],
      createdAt: "2026-01-01T00:00:00Z",
    });
  }),

  http.get("/api/v1/finance/accounts", () => {
    return HttpResponse.json({
      items: [
        { id: "a-001", code: "1000", name: "Cash", type: "ASSET", isActive: true },
        { id: "a-002", code: "2000", name: "Accounts Payable", type: "LIABILITY", isActive: true },
      ],
      total: 2,
    });
  }),

  http.get("/api/v1/finance/periods", () => {
    return HttpResponse.json({
      items: [
        { id: "p-001", name: "Jan 2026", startDate: "2026-01-01", endDate: "2026-01-31", status: "OPEN" },
      ],
      total: 1,
    });
  }),

  http.get("/api/v1/finance/trial-balance", () => {
    return HttpResponse.json({
      rows: [
        { accountId: "a-001", accountCode: "1000", accountName: "Cash", debit: "100000", credit: "0" },
        { accountId: "a-002", accountCode: "2000", accountName: "Accounts Payable", debit: "0", credit: "100000" },
      ],
      totalDebit: "100000",
      totalCredit: "100000",
    });
  }),
];
