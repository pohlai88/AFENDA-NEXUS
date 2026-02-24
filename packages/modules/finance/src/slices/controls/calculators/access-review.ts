/**
 * @see IC-09 — User access review: quarterly review of user permissions
 *
 * Pure calculator — no I/O, no side effects.
 * Analyzes user access records against policy rules and flags excessive privileges,
 * dormant accounts, SoD violations, and orphaned accounts.
 */

export type AccessRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AccessFinding =
  | "EXCESSIVE_PRIVILEGE"
  | "DORMANT_ACCOUNT"
  | "SOD_VIOLATION"
  | "ORPHANED_ACCOUNT"
  | "MISSING_APPROVAL"
  | "ROLE_ACCUMULATION";

export interface UserAccessRecord {
  readonly userId: string;
  readonly userName: string;
  readonly roles: readonly string[];
  readonly lastLoginDate: Date | null;
  readonly department: string;
  readonly isActive: boolean;
  readonly managerUserId: string | null;
  readonly grantedAt: Date;
}

export interface SodRule {
  readonly conflictingRoles: readonly [string, string];
  readonly description: string;
}

export interface AccessReviewConfig {
  readonly dormantDays: number;
  readonly maxRolesPerUser: number;
  readonly reviewDate: Date;
  readonly sodRules: readonly SodRule[];
  readonly privilegedRoles: readonly string[];
}

export interface AccessReviewFinding {
  readonly userId: string;
  readonly userName: string;
  readonly finding: AccessFinding;
  readonly riskLevel: AccessRiskLevel;
  readonly description: string;
  readonly recommendation: string;
}

export interface AccessReviewReport {
  readonly findings: readonly AccessReviewFinding[];
  readonly totalUsersReviewed: number;
  readonly totalFindings: number;
  readonly byRisk: {
    readonly critical: number;
    readonly high: number;
    readonly medium: number;
    readonly low: number;
  };
  readonly reviewDate: Date;
}

const DEFAULT_CONFIG: Omit<AccessReviewConfig, "reviewDate" | "sodRules"> = {
  dormantDays: 90,
  maxRolesPerUser: 5,
  privilegedRoles: ["ADMIN", "FINANCE_ADMIN", "SYSTEM_ADMIN", "SUPER_USER"],
};

export function reviewUserAccess(
  users: readonly UserAccessRecord[],
  config: AccessReviewConfig,
): { result: AccessReviewReport; explanation: string } {
  if (users.length === 0) {
    throw new Error("At least one user access record is required");
  }

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const findings: AccessReviewFinding[] = [];

  for (const user of users) {
    if (!user.isActive && user.roles.length > 0) {
      findings.push({
        userId: user.userId,
        userName: user.userName,
        finding: "ORPHANED_ACCOUNT",
        riskLevel: "HIGH",
        description: `Inactive account still has ${user.roles.length} role(s) assigned`,
        recommendation: "Remove all roles from inactive account immediately",
      });
    }

    if (user.isActive && user.lastLoginDate) {
      const daysSinceLogin = Math.floor(
        (cfg.reviewDate.getTime() - user.lastLoginDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceLogin > cfg.dormantDays) {
        findings.push({
          userId: user.userId,
          userName: user.userName,
          finding: "DORMANT_ACCOUNT",
          riskLevel: "MEDIUM",
          description: `No login for ${daysSinceLogin} days (threshold: ${cfg.dormantDays})`,
          recommendation: "Disable account or confirm continued need with manager",
        });
      }
    }

    if (user.isActive && user.lastLoginDate === null) {
      findings.push({
        userId: user.userId,
        userName: user.userName,
        finding: "DORMANT_ACCOUNT",
        riskLevel: "MEDIUM",
        description: "Account has never been used",
        recommendation: "Disable account or confirm continued need with manager",
      });
    }

    if (user.roles.length > cfg.maxRolesPerUser) {
      findings.push({
        userId: user.userId,
        userName: user.userName,
        finding: "ROLE_ACCUMULATION",
        riskLevel: "HIGH",
        description: `User has ${user.roles.length} roles (max recommended: ${cfg.maxRolesPerUser})`,
        recommendation: "Review role assignments and remove unnecessary roles",
      });
    }

    const hasPrivilegedRole = user.roles.some((r) => cfg.privilegedRoles.includes(r));
    if (hasPrivilegedRole && !user.managerUserId) {
      findings.push({
        userId: user.userId,
        userName: user.userName,
        finding: "MISSING_APPROVAL",
        riskLevel: "HIGH",
        description: "Privileged role assigned but no manager/approver on record",
        recommendation: "Assign a manager and obtain documented approval for privileged access",
      });
    }

    if (hasPrivilegedRole && user.roles.length > 1) {
      const nonPriv = user.roles.filter((r) => !cfg.privilegedRoles.includes(r));
      if (nonPriv.length > 0) {
        findings.push({
          userId: user.userId,
          userName: user.userName,
          finding: "EXCESSIVE_PRIVILEGE",
          riskLevel: "HIGH",
          description: `Has privileged role(s) plus ${nonPriv.length} operational role(s) — principle of least privilege violation`,
          recommendation: "Separate admin and operational access into different accounts",
        });
      }
    }

    for (const rule of cfg.sodRules) {
      const [roleA, roleB] = rule.conflictingRoles;
      if (user.roles.includes(roleA!) && user.roles.includes(roleB!)) {
        findings.push({
          userId: user.userId,
          userName: user.userName,
          finding: "SOD_VIOLATION",
          riskLevel: "CRITICAL",
          description: `Segregation of Duties violation: has both ${roleA} and ${roleB} — ${rule.description}`,
          recommendation: `Remove one of the conflicting roles (${roleA} or ${roleB})`,
        });
      }
    }
  }

  const byRisk = {
    critical: findings.filter((f) => f.riskLevel === "CRITICAL").length,
    high: findings.filter((f) => f.riskLevel === "HIGH").length,
    medium: findings.filter((f) => f.riskLevel === "MEDIUM").length,
    low: findings.filter((f) => f.riskLevel === "LOW").length,
  };

  return {
    result: {
      findings,
      totalUsersReviewed: users.length,
      totalFindings: findings.length,
      byRisk,
      reviewDate: cfg.reviewDate,
    },
    explanation: findings.length === 0
      ? `${users.length} user(s) reviewed — no findings`
      : `${users.length} user(s) reviewed — ${findings.length} finding(s): ${byRisk.critical} critical, ${byRisk.high} high, ${byRisk.medium} medium, ${byRisk.low} low`,
  };
}
