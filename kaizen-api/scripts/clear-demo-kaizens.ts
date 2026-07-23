import "dotenv/config";
import { PrismaClient } from "@prisma/client";

/**
 * ONE-TIME demo cleanup — deletes every Kaizen and every row that exists only because a Kaizen
 * exists. Does NOT touch Users, Departments, Categories, Achievements, ScoringParameters,
 * PlatformSettings, Announcements, SavedViews, Reports, LeaderboardSnapshots, sequence counters,
 * AuditLog, or any Clerk/auth data. Does NOT call Cloudinary — attachment *rows* are deleted, the
 * underlying uploaded files are left in storage untouched. Does NOT alter prisma/schema.prisma or
 * run a migration.
 *
 * Deletion order walks the FK graph in prisma/schema.prisma leaf-to-root so every delete succeeds
 * without relying on (and without needing to match) whatever ON DELETE behavior each column
 * actually has — deepest children first, Kaizen itself last.
 *
 * Also RESETS (never deletes) every `UserGamification` row's counters to the same defaults a
 * brand-new row gets at signup (see auth.service.ts's `data: { userId: user.id }` — every field
 * below just falls back to its schema default). This is necessary, not redundant with dynamic
 * computation: `GamificationService.getLeaderboard` recomputes `totalPoints`/rank live from
 * `PointsLedger` on every call (see its own doc comment — "always recomputes fresh"), so those
 * already read as zero the moment `PointsLedger` rows are gone. But the same method's
 * `ideasApproved` figure, and every "Ideas Submitted/Approved/Implemented" stat shown on a user's
 * own dashboard, are read directly off this cached row rather than recomputed — those would stay
 * stale without this reset. `LeaderboardSnapshot` is excluded from all of this on purpose: nothing
 * in the codebase ever reads it back (`recomputeLeaderboard` only ever writes it) — it's a
 * write-only cache with no live consumer, so leaving it stale is harmless and self-corrects on the
 * next leaderboard request regardless.
 */

const prisma = new PrismaClient();

async function deleteKaizenData(): Promise<Record<string, number>> {
  const kaizens = await prisma.kaizen.findMany({ select: { id: true } });
  const kaizenIds = kaizens.map((k) => k.id);

  if (kaizenIds.length === 0) {
    console.log("No Kaizens found — nothing to delete.");
    return {};
  }

  console.log(`Found ${kaizenIds.length} Kaizen(s). Deleting all Kaizen-related data in a single transaction...`);

  return prisma.$transaction(
    async (tx) => {
      const c: Record<string, number> = {};

      // --- Evaluations & scores ---
      c.evaluationScores = (
        await tx.evaluationScore.deleteMany({ where: { evaluation: { kaizenId: { in: kaizenIds } } } })
      ).count;
      c.evaluations = (await tx.evaluation.deleteMany({ where: { kaizenId: { in: kaizenIds } } })).count;

      // --- Attachments (DB rows only — Cloudinary files are left alone) ---
      c.kaizenAttachments = (
        await tx.kaizenAttachment.deleteMany({ where: { kaizenId: { in: kaizenIds } } })
      ).count;
      c.implementationAttachments = (
        await tx.implementationAttachment.deleteMany({
          where: { implementation: { kaizenId: { in: kaizenIds } } },
        })
      ).count;

      // --- Implementation & business impact ---
      c.implementations = (
        await tx.implementation.deleteMany({ where: { kaizenId: { in: kaizenIds } } })
      ).count;
      c.businessImpacts = (
        await tx.businessImpact.deleteMany({ where: { kaizenId: { in: kaizenIds } } })
      ).count;

      // --- Knowledge base & rewards ---
      c.knowledgeBaseEntries = (
        await tx.knowledgeBaseEntry.deleteMany({ where: { kaizenId: { in: kaizenIds } } })
      ).count;
      c.rewards = (await tx.reward.deleteMany({ where: { kaizenId: { in: kaizenIds } } })).count;

      // PointsLedger.kaizenId is nullable — only remove entries actually tied to a Kaizen, never
      // manually-issued points that have no Kaizen behind them.
      c.pointsLedger = (
        await tx.pointsLedger.deleteMany({ where: { kaizenId: { in: kaizenIds } } })
      ).count;

      // Notification.entityId is a polymorphic column, not a real foreign key — scope by the exact
      // (entityType, entityId) pairs the app itself writes for Kaizen events (see
      // src/events/handlers/index.ts) so achievement/report/announcement notifications are
      // untouched.
      c.notifications = (
        await tx.notification.deleteMany({ where: { entityType: "Kaizen", entityId: { in: kaizenIds } } })
      ).count;

      // --- Workflow history ---
      c.reviewComments = (
        await tx.reviewComment.deleteMany({ where: { kaizenId: { in: kaizenIds } } })
      ).count;
      c.timelineEvents = (
        await tx.timelineEvent.deleteMany({ where: { kaizenId: { in: kaizenIds } } })
      ).count;

      // --- Kaizen's own 1:1 child rows ---
      c.kaizenBenefits = (
        await tx.kaizenBenefit.deleteMany({ where: { kaizenId: { in: kaizenIds } } })
      ).count;
      c.kaizen5W1H = (await tx.kaizen5W1H.deleteMany({ where: { kaizenId: { in: kaizenIds } } })).count;
      c.kaizenCostOfImplementation = (
        await tx.kaizenCostOfImplementation.deleteMany({ where: { kaizenId: { in: kaizenIds } } })
      ).count;

      // --- Kaizen itself, last ---
      c.kaizens = (await tx.kaizen.deleteMany({ where: { id: { in: kaizenIds } } })).count;

      return c;
    },
    { timeout: 60_000 },
  );
}

/** UPDATE only — never touches which rows exist, only zeroes their counters. Runs unconditionally
 * (even if there were zero Kaizens to delete) since "stats consistent with an empty Kaizen
 * database" should hold regardless of what this particular run found. */
async function resetGamificationStats(): Promise<number> {
  const { count } = await prisma.userGamification.updateMany({
    data: { totalPoints: 0, ideasSubmitted: 0, ideasApproved: 0, ideasImplemented: 0, currentRank: null },
  });
  return count;
}

function printTable(title: string, counts: Record<string, number>) {
  const entries = Object.entries(counts);
  if (entries.length === 0) return;

  const width = Math.max(...entries.map(([table]) => table.length), "TOTAL".length);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  console.log(`\n${title}`);
  for (const [table, count] of entries) {
    console.log(`  ${table.padEnd(width)}  ${count}`);
  }
  console.log(`  ${"TOTAL".padEnd(width)}  ${total}`);
}

async function main() {
  const deleteCounts = await deleteKaizenData();
  printTable("Deleted records:", deleteCounts);

  const resetCount = await resetGamificationStats();
  printTable("Reset to default (rows updated, not deleted):", { userGamification: resetCount });

  console.log(
    "\nDone. Users, Departments, Categories, Achievements, and all configuration/auth data were left untouched.",
  );
}

main()
  .catch((error) => {
    console.error("\nCleanup failed — any deletion transaction that was still open was rolled back.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
