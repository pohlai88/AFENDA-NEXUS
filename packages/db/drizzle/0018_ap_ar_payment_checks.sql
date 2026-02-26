-- 0018: AP/AR payment amount CHECK constraints
-- Belt-and-suspenders defense: DB prevents paid_amount from going negative
-- or exceeding total_amount. If overpayments are needed later, model them
-- as credit memos — do not remove these constraints.

ALTER TABLE erp.ap_invoices
  ADD CONSTRAINT ap_invoices_paid_nonneg CHECK (paid_amount >= 0),
  ADD CONSTRAINT ap_invoices_paid_cap    CHECK (paid_amount <= total_amount);

ALTER TABLE erp.ar_invoices
  ADD CONSTRAINT ar_invoices_paid_nonneg CHECK (paid_amount >= 0),
  ADD CONSTRAINT ar_invoices_paid_cap    CHECK (paid_amount <= total_amount);
