import type { DbClient } from '@afenda/db';
import { userPreferences } from '@afenda/db';
import { eq, sql } from 'drizzle-orm';
import {
  UserPreferencesSchema,
  type UserPreferences,
  type UpdateUserPreferences,
} from '@afenda/contracts';

/**
 * Read user preferences. Returns Zod-validated defaults if no row exists.
 */
export async function getUserPreferences(
  db: DbClient,
  userId: string
): Promise<UserPreferences> {
  const [row] = await db
    .select({ preferences: userPreferences.preferences })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return UserPreferencesSchema.parse(row?.preferences ?? {});
}

/**
 * Update user preferences via merge-patch. Upserts the row.
 * No audit logging needed — user-scoped UX data only.
 */
export async function updateUserPreferences(
  db: DbClient,
  userId: string,
  patch: UpdateUserPreferences
): Promise<UserPreferences> {
  const current = await getUserPreferences(db, userId);
  const merged = { ...current, ...patch };
  const validated = UserPreferencesSchema.parse(merged);

  await db
    .insert(userPreferences)
    .values({
      userId,
      preferences: validated as unknown as Record<string, unknown>,
      updatedAt: sql`now()`,
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        preferences: validated as unknown as Record<string, unknown>,
        updatedAt: sql`now()`,
      },
    });

  return validated;
}
