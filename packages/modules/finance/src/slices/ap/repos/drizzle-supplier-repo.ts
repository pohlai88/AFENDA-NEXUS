import { eq, and, count, desc, sql } from 'drizzle-orm';
import { ok, err, NotFoundError } from '@afenda/core';
import type { Result, PaginationParams, PaginatedResult } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import {
  suppliers,
  supplierSites,
  supplierBankAccounts,
  supplierUsers,
  currencies,
} from '@afenda/db';
import type { Supplier, SupplierSite, SupplierBankAccount } from '../entities/supplier.js';
import type {
  ISupplierRepo,
  CreateSupplierInput,
  UpdateSupplierInput,
  CreateSupplierSiteInput,
  CreateSupplierBankAccountInput,
} from '../ports/supplier-repo.js';

type SupplierRow = typeof suppliers.$inferSelect;
type SiteRow = typeof supplierSites.$inferSelect;
type BankRow = typeof supplierBankAccounts.$inferSelect;

function mapSiteToDomain(row: SiteRow): SupplierSite {
  return {
    id: row.id,
    supplierId: row.supplierId,
    siteCode: row.siteCode,
    name: row.name,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2 ?? null,
    city: row.city,
    region: row.region ?? null,
    postalCode: row.postalCode ?? null,
    countryCode: row.countryCode,
    isPrimary: row.isPrimary,
    isPaySite: row.isPaySite,
    isPurchasingSite: row.isPurchasingSite,
    isRemitTo: row.isRemitTo,
    contactName: row.contactName ?? null,
    contactEmail: row.contactEmail ?? null,
    contactPhone: row.contactPhone ?? null,
    isActive: row.isActive,
  };
}

function mapBankToDomain(row: BankRow, currencyCode: string): SupplierBankAccount {
  return {
    id: row.id,
    supplierId: row.supplierId,
    siteId: row.siteId ?? null,
    bankName: row.bankName,
    accountName: row.accountName,
    accountNumber: row.accountNumber,
    iban: row.iban ?? null,
    swiftBic: row.swiftBic ?? null,
    localBankCode: row.localBankCode ?? null,
    currencyCode,
    isPrimary: row.isPrimary,
    isVerified: row.isVerified,
    verifiedBy: row.verifiedBy ?? null,
    verifiedAt: row.verifiedAt ?? null,
    verificationMethod: row.verificationMethod ?? null,
    isActive: row.isActive,
  };
}

function mapToDomain(
  row: SupplierRow,
  currencyCode: string,
  sites: SiteRow[],
  bankRows: BankRow[],
  bankCurrencyCodes: Map<string, string>
): Supplier {
  return {
    id: row.id,
    tenantId: row.tenantId,
    companyId: row.companyId,
    code: row.code,
    name: row.name,
    tradingName: row.tradingName ?? null,
    registrationNumber: row.registrationNumber ?? null,
    countryOfIncorporation: row.countryOfIncorporation ?? null,
    legalForm: row.legalForm ?? null,
    taxId: row.taxId ?? null,
    currencyCode,
    defaultPaymentTermsId: row.defaultPaymentTermsId ?? null,
    defaultPaymentMethod: row.defaultPaymentMethod as Supplier['defaultPaymentMethod'],
    whtRateId: row.whtRateId ?? null,
    remittanceEmail: row.remittanceEmail ?? null,
    status: row.status as Supplier['status'],
    onboardingStatus: row.onboardingStatus as Supplier['onboardingStatus'],
    accountGroup: row.accountGroup as Supplier['accountGroup'],
    category: row.category as Supplier['category'],
    industryCode: row.industryCode ?? null,
    industryDescription: row.industryDescription ?? null,
    parentSupplierId: row.parentSupplierId ?? null,
    isGroupHeader: row.isGroupHeader,
    sites: sites.map(mapSiteToDomain),
    bankAccounts: bankRows.map((b) =>
      mapBankToDomain(b, bankCurrencyCodes.get(b.currencyId) ?? currencyCode)
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierRepo implements ISupplierRepo {
  constructor(private readonly tx: TenantTx) { }

  private async resolveCurrencyCode(currencyId: string): Promise<string> {
    const curr = await this.tx.query.currencies.findFirst({
      where: eq(currencies.id, currencyId),
    });
    if (!curr) throw new NotFoundError('Currency', currencyId);
    return curr.code;
  }

  private async loadSubEntities(
    supplierId: string,
    _supplierCurrencyCode: string
  ): Promise<{ sites: SiteRow[]; bankRows: BankRow[]; bankCurrencyCodes: Map<string, string> }> {
    const [sites, bankRows] = await Promise.all([
      this.tx.query.supplierSites.findMany({
        where: eq(supplierSites.supplierId, supplierId),
      }),
      this.tx.query.supplierBankAccounts.findMany({
        where: eq(supplierBankAccounts.supplierId, supplierId),
      }),
    ]);

    const bankCurrencyCodes = new Map<string, string>();
    const uniqueCurrencyIds = [...new Set(bankRows.map((b) => b.currencyId))];
    for (const cid of uniqueCurrencyIds) {
      bankCurrencyCodes.set(cid, await this.resolveCurrencyCode(cid));
    }

    return { sites, bankRows, bankCurrencyCodes };
  }

  async create(input: CreateSupplierInput): Promise<Result<Supplier>> {
    const curr = await this.tx.query.currencies.findFirst({
      where: eq(currencies.code, input.currencyCode),
    });
    if (!curr) return err(new NotFoundError('Currency', input.currencyCode));

    const [row] = await this.tx
      .insert(suppliers)
      .values({
        tenantId: input.tenantId,
        companyId: input.companyId,
        code: input.code,
        name: input.name,
        tradingName: input.tradingName ?? null,
        registrationNumber: input.registrationNumber ?? null,
        countryOfIncorporation: input.countryOfIncorporation ?? null,
        legalForm: input.legalForm ?? null,
        taxId: input.taxId,
        currencyId: curr.id,
        defaultPaymentTermsId: input.defaultPaymentTermsId,
        defaultPaymentMethod:
          input.defaultPaymentMethod as typeof suppliers.$inferSelect.defaultPaymentMethod,
        whtRateId: input.whtRateId,
        remittanceEmail: input.remittanceEmail,
        accountGroup: (input.accountGroup ?? 'TRADE') as typeof suppliers.$inferSelect.accountGroup,
        category: (input.category ?? 'GOODS') as typeof suppliers.$inferSelect.category,
        industryCode: input.industryCode ?? null,
        industryDescription: input.industryDescription ?? null,
        parentSupplierId: input.parentSupplierId ?? null,
        isGroupHeader: input.isGroupHeader ?? false,
      })
      .returning();

    if (!row) return err(new NotFoundError('Supplier', 'new'));

    return ok(mapToDomain(row, input.currencyCode, [], [], new Map()));
  }

  async findById(id: string): Promise<Result<Supplier>> {
    const row = await this.tx.query.suppliers.findFirst({
      where: eq(suppliers.id, id),
    });
    if (!row) return err(new NotFoundError('Supplier', id));

    const cc = await this.resolveCurrencyCode(row.currencyId);
    const { sites, bankRows, bankCurrencyCodes } = await this.loadSubEntities(id, cc);
    return ok(mapToDomain(row, cc, sites, bankRows, bankCurrencyCodes));
  }

  async findByCode(code: string): Promise<Result<Supplier>> {
    const row = await this.tx.query.suppliers.findFirst({
      where: eq(suppliers.code, code),
    });
    if (!row) return err(new NotFoundError('Supplier', code));

    const cc = await this.resolveCurrencyCode(row.currencyId);
    const { sites, bankRows, bankCurrencyCodes } = await this.loadSubEntities(row.id, cc);
    return ok(mapToDomain(row, cc, sites, bankRows, bankCurrencyCodes));
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<Supplier>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.suppliers.findMany({
        orderBy: [desc(suppliers.createdAt), desc(suppliers.id)],
        limit,
        offset,
      }),
      this.tx.select({ total: count() }).from(suppliers),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(
      rows.map(async (r) => {
        const cc = await this.resolveCurrencyCode(r.currencyId);
        const { sites, bankRows, bankCurrencyCodes } = await this.loadSubEntities(r.id, cc);
        return mapToDomain(r, cc, sites, bankRows, bankCurrencyCodes);
      })
    );

    return { data, total, page, limit };
  }

  async findByStatus(
    status: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<Supplier>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.suppliers.findMany({
        where: eq(suppliers.status, status as typeof suppliers.$inferSelect.status),
        orderBy: [desc(suppliers.createdAt), desc(suppliers.id)],
        limit,
        offset,
      }),
      this.tx
        .select({ total: count() })
        .from(suppliers)
        .where(eq(suppliers.status, status as typeof suppliers.$inferSelect.status)),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(
      rows.map(async (r) => {
        const cc = await this.resolveCurrencyCode(r.currencyId);
        const { sites, bankRows, bankCurrencyCodes } = await this.loadSubEntities(r.id, cc);
        return mapToDomain(r, cc, sites, bankRows, bankCurrencyCodes);
      })
    );

    return { data, total, page, limit };
  }

  async update(id: string, input: UpdateSupplierInput): Promise<Result<Supplier>> {
    const values: Record<string, unknown> = { updatedAt: new Date() };

    if (input.name !== undefined) values.name = input.name;
    if (input.tradingName !== undefined) values.tradingName = input.tradingName;
    if (input.registrationNumber !== undefined) values.registrationNumber = input.registrationNumber;
    if (input.countryOfIncorporation !== undefined)
      values.countryOfIncorporation = input.countryOfIncorporation;
    if (input.legalForm !== undefined) values.legalForm = input.legalForm;
    if (input.taxId !== undefined) values.taxId = input.taxId;
    if (input.defaultPaymentTermsId !== undefined)
      values.defaultPaymentTermsId = input.defaultPaymentTermsId;
    if (input.defaultPaymentMethod !== undefined)
      values.defaultPaymentMethod = input.defaultPaymentMethod;
    if (input.whtRateId !== undefined) values.whtRateId = input.whtRateId;
    if (input.remittanceEmail !== undefined) values.remittanceEmail = input.remittanceEmail;
    if (input.status !== undefined) values.status = input.status;
    if (input.onboardingStatus !== undefined) values.onboardingStatus = input.onboardingStatus;
    if (input.accountGroup !== undefined) values.accountGroup = input.accountGroup;
    if (input.category !== undefined) values.category = input.category;
    if (input.industryCode !== undefined) values.industryCode = input.industryCode;
    if (input.industryDescription !== undefined)
      values.industryDescription = input.industryDescription;
    if (input.parentSupplierId !== undefined) values.parentSupplierId = input.parentSupplierId;
    if (input.isGroupHeader !== undefined) values.isGroupHeader = input.isGroupHeader;

    if (input.currencyCode !== undefined) {
      const curr = await this.tx.query.currencies.findFirst({
        where: eq(currencies.code, input.currencyCode),
      });
      if (!curr) return err(new NotFoundError('Currency', input.currencyCode));
      values.currencyId = curr.id;
    }

    await this.tx.update(suppliers).set(values).where(eq(suppliers.id, id));
    return this.findById(id);
  }

  async findByUserId(userId: string): Promise<Result<Supplier>> {
    const link = await this.tx.query.supplierUsers.findFirst({
      where: and(eq(supplierUsers.userId, userId), eq(supplierUsers.isActive, true)),
    });
    if (!link) return err(new NotFoundError('SupplierUser', userId));

    return this.findById(link.supplierId);
  }

  async findByTaxId(tenantId: string, taxId: string): Promise<Supplier | null> {
    const row = await this.tx.query.suppliers.findFirst({
      where: and(eq(suppliers.tenantId, tenantId), eq(suppliers.taxId, taxId)),
    });
    if (!row) return null;

    const cc = await this.resolveCurrencyCode(row.currencyId);
    const { sites, bankRows, bankCurrencyCodes } = await this.loadSubEntities(row.id, cc);
    return mapToDomain(row, cc, sites, bankRows, bankCurrencyCodes);
  }

  async findByNameNormalized(tenantId: string, normalizedName: string): Promise<Supplier | null> {
    const rows = await this.tx
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.tenantId, tenantId),
          sql`upper(
            regexp_replace(
              regexp_replace(
                ${suppliers.name}, 
                '\\s+(SDN BHD|BERHAD|LTD|LIMITED|INC|INCORPORATED|PLC|PTE|CO\\.|CORP|CORPORATION|LLC|LLP|S\\.A\\.|GMBH|AG|B\\.V\\.|N\\.V\\.)\\s*$', 
                '', 
                'i'
              ),
              '[^A-Za-z0-9 ]', 
              '', 
              'g'
            )
          ) = ${normalizedName}`
        )
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    const cc = await this.resolveCurrencyCode(row.currencyId);
    const { sites, bankRows, bankCurrencyCodes } = await this.loadSubEntities(row.id, cc);
    return mapToDomain(row, cc, sites, bankRows, bankCurrencyCodes);
  }

  async addSite(input: CreateSupplierSiteInput): Promise<Result<SupplierSite>> {
    const supplier = await this.tx.query.suppliers.findFirst({
      where: eq(suppliers.id, input.supplierId),
    });
    if (!supplier) return err(new NotFoundError('Supplier', input.supplierId));

    const [row] = await this.tx
      .insert(supplierSites)
      .values({
        tenantId: supplier.tenantId,
        supplierId: input.supplierId,
        siteCode: input.siteCode,
        name: input.name,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        region: input.region,
        postalCode: input.postalCode,
        countryCode: input.countryCode,
        isPrimary: input.isPrimary,
        isPaySite: input.isPaySite ?? false,
        isPurchasingSite: input.isPurchasingSite ?? false,
        isRemitTo: input.isRemitTo ?? false,
        contactName: input.contactName ?? null,
        contactEmail: input.contactEmail ?? null,
        contactPhone: input.contactPhone ?? null,
      })
      .returning();

    if (!row) return err(new NotFoundError('SupplierSite', 'new'));
    return ok(mapSiteToDomain(row));
  }

  async addBankAccount(
    input: CreateSupplierBankAccountInput
  ): Promise<Result<SupplierBankAccount>> {
    const supplier = await this.tx.query.suppliers.findFirst({
      where: eq(suppliers.id, input.supplierId),
    });
    if (!supplier) return err(new NotFoundError('Supplier', input.supplierId));

    const curr = await this.tx.query.currencies.findFirst({
      where: eq(currencies.code, input.currencyCode),
    });
    if (!curr) return err(new NotFoundError('Currency', input.currencyCode));

    const [row] = await this.tx
      .insert(supplierBankAccounts)
      .values({
        tenantId: supplier.tenantId,
        supplierId: input.supplierId,
        siteId: input.siteId ?? null,
        bankName: input.bankName,
        accountName: input.accountName,
        accountNumber: input.accountNumber,
        iban: input.iban,
        swiftBic: input.swiftBic,
        localBankCode: input.localBankCode,
        currencyId: curr.id,
        isPrimary: input.isPrimary,
      })
      .returning();

    if (!row) return err(new NotFoundError('SupplierBankAccount', 'new'));
    return ok(mapBankToDomain(row, input.currencyCode));
  }

  async findChildren(
    parentId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<Supplier>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.suppliers.findMany({
        where: eq(suppliers.parentSupplierId, parentId),
        orderBy: [desc(suppliers.createdAt), desc(suppliers.id)],
        limit,
        offset,
      }),
      this.tx
        .select({ total: count() })
        .from(suppliers)
        .where(eq(suppliers.parentSupplierId, parentId)),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(
      rows.map(async (r) => {
        const cc = await this.resolveCurrencyCode(r.currencyId);
        const { sites, bankRows, bankCurrencyCodes } = await this.loadSubEntities(r.id, cc);
        return mapToDomain(r, cc, sites, bankRows, bankCurrencyCodes);
      })
    );

    return { data, total, page, limit };
  }

  async findGroupHeaders(
    params?: PaginationParams
  ): Promise<PaginatedResult<Supplier>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      this.tx.query.suppliers.findMany({
        where: eq(suppliers.isGroupHeader, true),
        orderBy: [desc(suppliers.createdAt), desc(suppliers.id)],
        limit,
        offset,
      }),
      this.tx
        .select({ total: count() })
        .from(suppliers)
        .where(eq(suppliers.isGroupHeader, true)),
    ]);
    const total = countRows[0]?.total ?? 0;

    const data = await Promise.all(
      rows.map(async (r) => {
        const cc = await this.resolveCurrencyCode(r.currencyId);
        const { sites, bankRows, bankCurrencyCodes } = await this.loadSubEntities(r.id, cc);
        return mapToDomain(r, cc, sites, bankRows, bankCurrencyCodes);
      })
    );

    return { data, total, page, limit };
  }
}
