import { and, eq, lte, desc } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { fxRates, currencies } from "@afenda/db";
import { ok, err, NotFoundError, type Result } from "@afenda/core";
import type { FxRate } from "../entities/fx-rate.js";
import type { IFxRateRepo } from "../../../slices/fx/ports/fx-rate-repo.js";

export class DrizzleFxRateRepo implements IFxRateRepo {
  constructor(private readonly tx: TenantTx) {}

  async findRate(
    fromCurrency: string,
    toCurrency: string,
    effectiveDate: Date,
  ): Promise<Result<FxRate>> {
    // Resolve currency codes to IDs
    const [fromRow] = await this.tx
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.code, fromCurrency))
      .limit(1);
    if (!fromRow) return err(new NotFoundError("Currency", fromCurrency));

    const [toRow] = await this.tx
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.code, toCurrency))
      .limit(1);
    if (!toRow) return err(new NotFoundError("Currency", toCurrency));

    // Find the most recent rate effective on or before the given date
    const [row] = await this.tx
      .select()
      .from(fxRates)
      .where(
        and(
          eq(fxRates.fromCurrencyId, fromRow.id),
          eq(fxRates.toCurrencyId, toRow.id),
          lte(fxRates.effectiveDate, effectiveDate),
        ),
      )
      .orderBy(desc(fxRates.effectiveDate))
      .limit(1);

    if (!row) {
      return err(
        new NotFoundError("FxRate", `${fromCurrency}/${toCurrency} as of ${effectiveDate.toISOString()}`),
      );
    }

    return ok({
      id: row.id!,
      companyId: "" as never,
      fromCurrency,
      toCurrency,
      rate: Number(row.rate),
      effectiveDate: row.effectiveDate,
      source: row.source,
    });
  }
}
