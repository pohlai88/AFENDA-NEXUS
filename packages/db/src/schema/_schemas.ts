import { pgSchema } from "drizzle-orm/pg-core";

export const platformSchema = pgSchema("platform");
export const erpSchema = pgSchema("erp");
export const auditSchema = pgSchema("audit");
