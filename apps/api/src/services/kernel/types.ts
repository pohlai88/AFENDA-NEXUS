import type { DbClient } from '@afenda/db';

export interface KernelDeps {
  db: DbClient;
}

export type { DbClient };
