# Keyboard Shortcuts — Industry Benchmark & Proposal

Benchmark against SAP, Oracle NetSuite, Zoho, Xero, Microsoft Dynamics, and SaaS conventions. Proposal for Afenda ERP.

---

## 1. Competitor Benchmark Summary

### SAP (Enterprise ERP)

| Category | Shortcut | Action |
|----------|----------|--------|
| Command field | Ctrl+/ | Go to transaction code |
| Session | Ctrl++ | New session |
| Navigation | F3 | Back |
| Refresh | F5 | Refresh |
| Favorites | Ctrl+Shift+F5 | Create folder |
| Quick Launch | Ctrl+Alt+L | Focus Quick Launch |
| Tabs | Ctrl+T | New tab |
| Shortcuts | Ctrl+Shift+L | Show area-specific shortcuts |

### Oracle NetSuite

| Category | Shortcut | Action |
|----------|----------|--------|
| Search | Alt+G | Global search |
| Date | Alt+T | Today |
| Date | Alt+Y | Yesterday |
| Date | Alt+M | Last day of month |
| Form | Tab | Next field |
| Form | Enter | Save line, next |
| Report | Page Up/Down | Prev/next page |
| Report | Home/End | First/last page |

### Zoho Books (Primary Benchmark)

Zoho Books offers the most comprehensive and user-friendly shortcut model among SMB accounting tools. **Shortcuts are user-customizable** via the Edit icon next to each action.

| Category | Shortcut | Action |
|----------|----------|--------|
| **General** | Shift+/ | Keyboard shortcuts |
| | / | Search |
| | Option+/ | Advanced search |
| | S | Settings |
| | O | Organizations |
| **Go To** | Shift+I | Invoices |
| | Shift+J | Journals |
| | Shift+E | Quotes |
| | Shift+N | Credit Notes |
| | Shift+B | Bills |
| | Shift+S | Sales Orders |
| | Shift+P | Purchase Orders |
| | Shift+X | Expenses |
| | Shift+Z | Chart of Accounts |
| | Shift+R | Payments Received |
| | Shift+M | Payments Made |
| | Shift+1–7 | Dashboard, Items, Banking, Customers, Vendors, Reports, Documents |
| **Create** | N | New transaction (module context) |
| | C+I | New Invoice |
| | C+J | New Journal |
| | C+E | New Quote |
| | C+N | New Credit Note |
| | C+B | New Bill |
| | C+X | New Expense |
| | C+A | New Account |
| | C+T | Log time |
| | C+4 | New Customer |
| | C+5 | New Vendor |
| | C+1 | New Customer Payment |
| | C+M | New Vendor Payment |
| **Save** | Option+S | Save and Send |
| | Option+P | Save and Print |
| **Custom** | ✅ | User-customizable via Edit icon |

### Xero

| Category | Shortcut | Action |
|----------|----------|--------|
| Search | / | Quick find |
| Search | a,b,c,d,i,p,q,r,s | Navigate by letter |
| Date | Tab t | Today |
| Date | tom | Tomorrow |
| Form | Ctrl+Enter | Save |
| Form | Ctrl+Z | Undo |
| Form | + | Copy row above |

### Microsoft Dynamics 365 / Business Central

| Category | Shortcut | Action |
|----------|----------|--------|
| Search | Alt+Q | Tell me |
| New | Alt+N | New record |
| Save | Ctrl+S | Save |
| Save | Alt+S | Save and close |
| Delete | Ctrl+D | Delete |
| Search | F3 | Toggle search |
| Filter | Shift+F3 | Filter pane |
| Copy | F8 | Copy field above |

### SaaS Convention (Cmd+K, Intercom, Slack, etc.)

| Shortcut | Action |
|----------|--------|
| **mod+K** | Command palette / search |
| **?** | Show shortcuts |
| **Escape** | Close / cancel |
| **Arrow keys** | Navigate results |
| **Enter** | Select |

---

## 2. Zoho Books vs Afenda — Alignment

| Zoho | Afenda | Notes |
|------|--------|-------|
| Shift+/ | ? | Shortcut help (SaaS standard) |
| / | mod+K | Search / command palette |
| Shift+J | g j | Go to Journals |
| Shift+Z | g a | Go to Chart of Accounts |
| Shift+X | g x | Go to Expenses |
| Shift+B | g v | Go to Bills (AP) |
| Shift+I | g i | Go to Invoices (AR) |
| C+J | c j | Create Journal |
| C+I | c i | Create Invoice |
| C+B | c b | Create Bill |
| C+X | c x | Create Expense |
| C+A | c a | Create Account |
| — | Ctrl+Q | Quick Action picker (Afenda) |
| — | Ctrl+1…9 | Pinned Quick Actions (customizable) |

**Afenda uses `g` (go) and `c` (create) prefixes** to avoid single-character conflicts (WCAG 2.1.4) and to mirror Zoho’s two-key pattern.

---

## 3. WCAG 2.1.4 (Character Key Shortcuts)

Single-character shortcuts (e.g. `g`, `j`, `n`) can conflict with speech input and accessibility. WCAG 2.1.4 (Level A) requires:

- **Remap**: Allow users to change shortcuts to include modifiers (Ctrl, Alt)
- **Or**: Shortcut only active when component has focus
- **Or**: Mechanism to turn off

**Recommendation**: Use modifier sequences (e.g. `g j` not `j`) and support user customization.

---

## 4. Proposed Afenda Shortcut List

### 4.1 Core (SaaS Standard)

| Keys | Action | Benchmark |
|------|--------|-----------|
| **mod+K** | Command palette / search | Zoho, Slack, Intercom, Notion |
| **?** | Show keyboard shortcuts | Zoho, SAP |
| **mod+B** | Toggle sidebar | Common |
| **Ctrl+Q** | Quick Action picker | Afenda-specific |
| **Ctrl+1…9** | Pinned Quick Actions | Customizable |
| **mod+=** | Calculator | Afenda |
| **Escape** | Close dialog / clear | Universal |

### 4.2 Navigation (Go To) — `g` prefix

| Keys | Action | Benchmark |
|------|--------|-----------|
| **g d** | Dashboard | Zoho Shift+1, Xero d |
| **g j** | Journals | Zoho Shift+J |
| **g a** | Chart of Accounts | Zoho Shift+Z |
| **g p** | Periods | — |
| **g l** | Ledgers | — |
| **g b** | Banking | Zoho Shift+3 |
| **g x** | Expenses | Zoho Shift+X |
| **g s** | Settings | Zoho S |
| **g h** | Home | — |
| **g i** | Invoice (AR) | Zoho Shift+I |
| **g v** | Bills (AP) | Zoho Shift+B |
| **g r** | Reports | Zoho Shift+6 |

### 4.3 Create Actions — `c` prefix

| Keys | Action | Benchmark |
|------|--------|-----------|
| **c j** | New Journal Entry | Zoho C+J |
| **c i** | New Invoice (AR) | Zoho C+I |
| **c b** | New Bill (AP) | Zoho C+B |
| **c x** | New Expense Claim | Zoho C+X |
| **c a** | New Account | Zoho C+A |

### 4.4 Module-Level Actions

| Keys | Action | Benchmark |
|------|--------|-----------|
| **n** | New (context) | Zoho N, Dynamics Alt+N |
| **mod+S** | Save | Xero, Dynamics |
| **mod+Enter** | Save and close | Dynamics Alt+S |

### 4.5 Date Shortcuts (in date fields)

| Keys | Action | Benchmark |
|------|--------|-----------|
| **t** | Today | NetSuite Alt+T |
| **y** | Yesterday | NetSuite Alt+Y |
| **m** | Month end | NetSuite Alt+M |

### 4.6 Table / List Actions

| Keys | Action | Benchmark |
|------|--------|-----------|
| **mod+A** | Select all | Zoho Option+A |
| **F8** | Copy row above | Dynamics |
| **F9** | Refresh | SAP F5 |

---

## 4. Customizable Shortcuts (Recommendation)

| Priority | Action | Default | Customizable |
|----------|--------|---------|--------------|
| High | Quick Actions 1–9 | Ctrl+1…9 | Yes |
| High | All navigation (g *) | As above | Yes |
| High | Create actions (c *) | As above | Yes |
| Medium | Command palette | mod+K | Yes |
| Medium | Shortcut help | ? | Yes |
| Low | Sidebar toggle | mod+B | Yes |

**Implementation**: Store user overrides in `localStorage` or user preferences (e.g. `shell-preferences`).

---

## 6. Comparison Matrix

| Feature | Afenda (current) | SAP | NetSuite | Zoho | Xero | Dynamics |
|---------|------------------|-----|----------|------|------|----------|
| Command palette | mod+K | Ctrl+/ | Alt+G | / | / | Alt+Q |
| Shortcut help | ? | Ctrl+Shift+L | — | Shift+/ | — | — |
| Go To prefix | g | — | — | Shift+ | — | — |
| Create prefix | — | — | — | C+ | — | Alt+N |
| Customizable | Quick Actions | — | — | Yes | — | — |
| Date shortcuts | — | — | Yes | — | Yes | — |

---

## 7. Implementation Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1** | Expand SHELL_SHORTCUTS with g i, g v, g r, g h | ✅ Done |
| **Phase 2** | Add c j, c i, c b, c x, c a create shortcuts | ✅ Done |
| **Phase 3** | User preference persistence for custom shortcuts | Pending |
| **Phase 4** | Date field shortcuts (t, y, m) in forms | Pending |
| **Phase 5** | Table shortcuts (F8, mod+A) in data grids | Pending |
| **Phase 6** | Module-level actions (n, mod+S, mod+Enter) | Pending |

**→ See [keyboard-shortcuts-implementation-plan.md](./keyboard-shortcuts-implementation-plan.md) for detailed tasks and implementation order.**

---

## 8. References

- [WCAG 2.1.4 Character Key Shortcuts](https://www.w3.org/WAI/WCAG21/Understanding/character-key-shortcuts.html)
- [Zoho Books Keyboard Shortcuts](https://www.zoho.com/books/help/getting-started/keyboard-shortcuts.html)
- [Oracle NetSuite Keyboard Shortcuts](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N474926.html)
- [Microsoft Dynamics 365 Shortcuts](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/get-started/shortcut-keys)
- [SAP Keyboard Shortcuts](https://community.sap.com/t5/additional-blog-posts-by-members/sap-keyboard-shortcuts/bc-p/12915365)
