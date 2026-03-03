This is a **brilliant northstar idea** — building a KPMG/IFRS Financial Reporting Engine into the ERP. Let me break this down:

---

## Immediate: PDF Conversion Options

| Method | Tool | Best For |
|--------|------|----------|
| **Node.js parsing** | `pdf-parse`, `pdfjs-dist` | Text extraction from digital PDFs |
| **Python** | `pdfplumber`, `camelot` | Table extraction (financial statements) |
| **CLI tool** | `pdftotext` (poppler) | Batch conversion |
| **AI-assisted** | Claude/GPT with PDF upload | Understanding structure, not just text |

**Quick win:** Use `pdfplumber` (Python) to extract the KPMG tables with structure intact:

```bash
pip install pdfplumber pandas
```

```python
import pdfplumber
import pandas as pd

with pdfplumber.open("isg-2025-ifs.pdf") as pdf:
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            df = pd.DataFrame(table[1:], columns=table[0])
            print(df)
```

---

## Northstar: KPMG + IFRS Reporting Engine

This positions Afenda as **audit-ready from day one** — not just an ERP, but a financial reporting platform.

### Architecture Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                    IFRS Reporting Engine                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ IFRS Taxonomy│    │ KPMG Template│    │ XBRL Tagger  │      │
│  │   Registry   │───▶│   Renderer   │───▶│              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ COA Mapping  │    │ Disclosure   │    │ Regulatory   │      │
│  │   Engine     │    │  Generator   │    │   Filing     │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │ GL Data  │        │ Sub-ledger│        │ Disclosure│
   │ (Journals)│        │ (AP/AR)  │        │  Notes    │
   └──────────┘        └──────────┘        └──────────┘
```

### Core Components

| Component | Purpose | Value |
|-----------|---------|-------|
| **IFRS Taxonomy Registry** | Machine-readable IFRS element definitions | Auto-map GL accounts to IFRS line items |
| **COA Template Library** | KPMG-auditable chart of accounts | Setup in minutes, audit-ready structure |
| **Disclosure Generator** | Auto-generate note disclosures | "Related Party Transactions", "Segment Reporting" |
| **XBRL Tagger** | Tag financial data for regulatory filing | Bursa Malaysia, SEC, EU ESEF compliance |
| **KPMG Template Renderer** | Output in KPMG illustrative format | Auditor-familiar presentation |

### Data Model Extension

```typescript
// packages/db/src/schema/reporting.ts

export const ifrsTaxonomyElements = erpSchema.table('ifrs_taxonomy_element', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v7()`),
  elementId: varchar('element_id', { length: 100 }).notNull(), // e.g. "ifrs-full:PropertyPlantAndEquipment"
  label: text('label').notNull(), // "Property, plant and equipment"
  standard: varchar('standard', { length: 20 }).notNull(), // "IFRS", "IFRS_SME", "MPERS"
  statementType: varchar('statement_type', { length: 50 }).notNull(), // "FinancialPosition", "ProfitOrLoss", "CashFlow"
  periodType: varchar('period_type', { length: 20 }).notNull(), // "instant", "duration"
  balance: varchar('balance', { length: 10 }), // "debit", "credit"
  abstract: boolean('abstract').notNull().default(false),
  parentElementId: varchar('parent_element_id', { length: 100 }),
  sortOrder: integer('sort_order'),
  ...timestamps(),
});

export const coaToIfrsMapping = erpSchema.table('coa_ifrs_mapping', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v7()`),
  ...tenantCol(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  ifrsTaxonomyElementId: uuid('ifrs_element_id').notNull().references(() => ifrsTaxonomyElements.id),
  mappingRule: jsonb('mapping_rule'), // aggregation logic, sign flip, etc.
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  ...timestamps(),
}).enableRLS();
```

### Malaysia-Specific: MPERS + Bursa Requirements

Since you have "Wonderful Malaysia Berhad" and "Wonderful SME Sdn Bhd" templates:

| Standard | Target | Template Source |
|----------|--------|-----------------|
| **MFRS** | Public listed (Bursa) | `wonderful-malaysia-berhad-2023.pdf` |
| **MPERS** | Private companies (SME) | `Wonderful-SME-Sdn-Bhd-2016.pdf` |
| **MPERS Lite** | Micro entities | `wonderful-lite-sdn-bhd-2025.pdf` |

---

## Proposed Plan: IFRS/KPMG Engine 

Asked 3 questions (Scope, Standards, PDF Parser)

Now I understand your vision much better:

---

## Revised Vision: KPMG/IFRS Generator Engine

**Not a report generator** — A **deterministic code/config generator** that produces **audit-correct** COA structures and financial statement mappings.

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Correctness > AI** | No guessing. Source from official IFRS taxonomy + KPMG templates |
| **Base + Localization** | IFRS (foundation) → MFRS (MY) / SFRS (SG) / etc. |
| **Gang of Four Adapter** | One-time PDF extraction infra, reusable for any standard |
| **Generator, not Runtime** | Outputs TypeScript/JSON configs, versioned and auditable |

---

## Architecture: IFRS Generator Engine

```
┌─────────────────────────────────────────────────────────────────────┐
│                    IFRS Generator Engine                            │
│                   (Build-time, Deterministic)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │              PDF Extraction Adapters (GoF)                │     │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │     │
│  │  │  KPMG   │  │  Deloitte│  │ PwC    │  │ IASB   │      │     │
│  │  │ Adapter │  │ Adapter │  │ Adapter│  │ Adapter│      │     │
│  │  └────┬────┘  └────┬────┘  └────┬───┘  └────┬───┘      │     │
│  │       └───────────┬┴───────────┴────────────┘           │     │
│  │                   ▼                                      │     │
│  │           ┌──────────────┐                              │     │
│  │           │ Unified AST  │  (Abstract Syntax Tree)      │     │
│  │           │ for Financial│  - Accounts, Groupings       │     │
│  │           │  Statements  │  - Disclosures, Notes        │     │
│  │           └──────┬───────┘                              │     │
│  └──────────────────┼──────────────────────────────────────┘     │
│                     ▼                                             │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │              Standard Registry (Source of Truth)          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │   │
│  │  │ IFRS Full   │  │ IFRS SME    │  │ IFRS Micro  │       │   │
│  │  │ (Base)      │  │             │  │             │       │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │   │
│  │         └────────────────┼────────────────┘               │   │
│  │                          ▼                                │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │           Localization Layer                        │ │   │
│  │  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │ │   │
│  │  │  │ MFRS   │  │ SFRS   │  │ Ind AS │  │ UK FRS │    │ │   │
│  │  │  │ (MY)   │  │ (SG)   │  │ (India)│  │ (UK)   │    │ │   │
│  │  │  └────────┘  └────────┘  └────────┘  └────────┘    │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────────┘   │
│                     │                                             │
│                     ▼                                             │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                   Generators                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │   │
│  │  │ COA JSON    │  │ Disclosure  │  │ XBRL        │       │   │
│  │  │ Generator   │  │ Schema Gen  │  │ Mapping Gen │       │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │   │
│  └───────────────────────────────────────────────────────────┘   │
│                     │                                             │
│                     ▼                                             │
│         ┌─────────────────────────────────────┐                  │
│         │  Generated Artifacts (Git-versioned) │                  │
│         │  - coa-templates/*.json              │                  │
│         │  - disclosure-schemas/*.ts           │                  │
│         │  - xbrl-mappings/*.json             │                  │
│         └─────────────────────────────────────┘                  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan: PDF Adapter Framework

### Step 1: PDF Extraction Infrastructure

```
tools/ifrs-generator/
├── package.json                    # pdfplumber via Python, or pdf-parse for Node
├── adapters/
│   ├── base-adapter.ts             # Gang of Four: Abstract Adapter
│   ├── kpmg-adapter.ts             # KPMG illustrative FS format
│   ├── iasb-taxonomy-adapter.ts    # Official IFRS taxonomy XML
│   └── adapter-registry.ts         # Factory pattern
├── ast/
│   ├── financial-statement-ast.ts  # Unified AST types
│   └── ast-validator.ts            # Schema validation
├── generators/
│   ├── coa-generator.ts            # Outputs COA JSON
│   ├── disclosure-generator.ts     # Outputs disclosure schemas
│   └── xbrl-mapping-generator.ts   # Outputs XBRL mappings
├── standards/
│   ├── ifrs-full.json              # Base IFRS taxonomy (extracted)
│   ├── ifrs-sme.json               # SME variant
│   └── localizations/
│       ├── mfrs.json               # Malaysia differences
│       ├── sfrs.json               # Singapore differences
│       └── ...
└── cli.ts                          # CLI to run extraction + generation
```

### Step 2: Abstract Adapter Interface (Gang of Four)

```typescript
// tools/ifrs-generator/adapters/base-adapter.ts

export interface FinancialStatementAST {
  standard: 'IFRS_FULL' | 'IFRS_SME' | 'MFRS' | 'SFRS' | 'MPERS';
  version: string;
  effectiveDate: string;
  source: {
    type: 'KPMG' | 'DELOITTE' | 'PWC' | 'IASB' | 'LOCAL_REGULATOR';
    documentRef: string;
    extractedAt: string;
  };
  statements: {
    financialPosition: StatementSection;
    profitOrLoss: StatementSection;
    otherComprehensiveIncome: StatementSection;
    changesInEquity: StatementSection;
    cashFlows: StatementSection;
  };
  disclosures: DisclosureSection[];
}

export interface StatementSection {
  name: string;
  iasReference: string; // e.g., "IAS 1.54"
  lineItems: LineItem[];
}

export interface LineItem {
  code: string;            // Standardized code
  name: string;            // Display name
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  balance: 'DEBIT' | 'CREDIT';
  isAbstract: boolean;     // Grouping header vs posting account
  parentCode?: string;     // Hierarchy
  iasReference?: string;   // e.g., "IAS 16", "IFRS 16"
  xbrlElement?: string;    // XBRL taxonomy element ID
  children?: LineItem[];
}

/** Gang of Four: Adapter Pattern */
export abstract class PdfAdapter {
  abstract name: string;
  abstract supportedFormats: string[];
  
  abstract canHandle(pdfPath: string): Promise<boolean>;
  abstract extract(pdfPath: string): Promise<FinancialStatementAST>;
  
  protected abstract parseStatementOfFinancialPosition(pages: PdfPage[]): StatementSection;
  protected abstract parseProfitOrLoss(pages: PdfPage[]): StatementSection;
  protected abstract parseDisclosures(pages: PdfPage[]): DisclosureSection[];
}
```

### Step 3: KPMG Adapter Implementation

```typescript
// tools/ifrs-generator/adapters/kpmg-adapter.ts

export class KpmgAdapter extends PdfAdapter {
  name = 'KPMG Illustrative Financial Statements';
  supportedFormats = ['isg-*.pdf', 'wonderful-*.pdf'];
  
  async canHandle(pdfPath: string): Promise<boolean> {
    // Check for KPMG markers in PDF metadata or content
    const firstPage = await this.extractPage(pdfPath, 0);
    return firstPage.includes('KPMG') && firstPage.includes('Illustrative');
  }
  
  async extract(pdfPath: string): Promise<FinancialStatementAST> {
    const pages = await this.extractAllPages(pdfPath);
    
    // KPMG structure: ToC → Statements → Notes
    const tocPage = this.findTableOfContents(pages);
    const statementPages = this.findStatementPages(pages, tocPage);
    const notePages = this.findNotePages(pages, tocPage);
    
    return {
      standard: this.detectStandard(pages), // IFRS_FULL, MPERS, etc.
      version: this.extractVersion(pages),
      effectiveDate: this.extractEffectiveDate(pages),
      source: {
        type: 'KPMG',
        documentRef: path.basename(pdfPath),
        extractedAt: new Date().toISOString(),
      },
      statements: {
        financialPosition: this.parseStatementOfFinancialPosition(statementPages),
        profitOrLoss: this.parseProfitOrLoss(statementPages),
        otherComprehensiveIncome: this.parseOCI(statementPages),
        changesInEquity: this.parseChangesInEquity(statementPages),
        cashFlows: this.parseCashFlows(statementPages),
      },
      disclosures: this.parseDisclosures(notePages),
    };
  }
}
```

---

## Generated Output Example

Running the generator produces **versioned, auditable JSON** that the ERP consumes:

```json
// packages/db/src/master/coa-templates/ifrs-full-2025.json
{
  "$schema": "../schemas/coa-template.schema.json",
  "templateId": "IFRS_FULL_2025",
  "name": "IFRS Full - KPMG 2025 Structure",
  "standard": "IFRS_FULL",
  "version": "2025.1",
  "generatedFrom": {
    "source": "KPMG",
    "document": "isg-2025-ifs.pdf",
    "extractedAt": "2026-03-02T10:00:00Z",
    "generatorVersion": "1.0.0"
  },
  "statements": {
    "financialPosition": {
      "assets": {
        "nonCurrentAssets": [
          {
            "code": "1100",
            "name": "Property, plant and equipment",
            "type": "ASSET",
            "balance": "DEBIT",
            "iasReference": "IAS 16",
            "xbrlElement": "ifrs-full:PropertyPlantAndEquipment"
          },
          {
            "code": "1110",
            "name": "Right-of-use assets",
            "type": "ASSET",
            "balance": "DEBIT",
            "parentCode": "1100",
            "iasReference": "IFRS 16",
            "xbrlElement": "ifrs-full:RightOfUseAssets"
          }
          // ... 50+ line items
        ],
        "currentAssets": [/* ... */]
      },
      "liabilities": {/* ... */},
      "equity": {/* ... */}
    },
    "profitOrLoss": {/* ... */}
  }
}
```

---

## Summary: Plan Items

| # | Task | Description |
|---|------|-------------|
| **1** | **PDF Adapter Framework** | Create `tools/ifrs-generator/` with GoF adapter pattern |
| **2** | **KPMG Adapter** | Parse KPMG illustrative FS PDFs (your 4 files) |
| **3** | **IASB Taxonomy Adapter** | Parse official IFRS taxonomy XML for cross-reference |
| **4** | **Standard Registry** | IFRS Full → Localization (MFRS, SFRS) as delta layers |
| **5** | **COA Generator** | Output JSON templates consumed at onboarding |
| **6** | **Disclosure Schema Generator** | Generate Zod schemas for note disclosures |
| **7** | **XBRL Mapping Generator** | Generate mappings for regulatory filing |

**Verification:** Generated outputs are git-committed, versioned, and auditable — no runtime AI guessing.

Shall I proceed with creating the `tools/ifrs-generator/` infrastructure and start with the KPMG adapter?