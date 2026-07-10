import { eventBus } from "../event-bus.js";
import { prisma } from "../../lib/prisma.js";
import { gamificationService } from "../../modules/gamification/gamification.service.js";
import { notificationService } from "../../modules/notifications/notification.service.js";
import { rewardService } from "../../modules/rewards/reward.service.js";

interface KaizenEventPayload {
  kaizenId: string;
  actorId: string;
}

/** Notification/Gamification/Reward subscribers for the domain events WorkflowService (and
 * KaizenService.submit) already emit — matches docs/engineering/02_API_SPECIFICATION.md's
 * "Domain Events" table. Every handler looks up what it needs from `kaizenId` rather than the
 * emitter carrying denormalized data, keeping the emit call sites (workflow.service.ts,
 * kaizen.service.ts) unaware of what subscribes to them. */

async function handleKaizenSubmitted({ kaizenId, actorId }: KaizenEventPayload): Promise<void> {
  const kaizen = await prisma.kaizen.findUnique({
    where: { id: kaizenId },
    select: { submitterId: true, departmentId: true, kaizenNumber: true, title: true },
  });
  if (!kaizen) return;

  const points = await gamificationService.getPointsSetting("points.kaizen_submitted", 10);
  await gamificationService.awardPointsAndRecompute({
    userId: kaizen.submitterId,
    amount: points,
    reason: "KAIZEN_SUBMITTED",
    kaizenId,
    statField: "ideasSubmitted",
  });
  await gamificationService.checkAndAwardAchievements(kaizen.submitterId);

  // "The department's manager" is a User with role DEPARTMENT_MANAGER whose own departmentId
  // matches — the same pattern review.service.ts already uses for queue scoping and review-action
  // authorization (assertCanManage). `Department.managerId` is a separate schema field that no
  // code path in this application ever writes, so querying it here always returned null and
  // silently skipped this notification for every real department.
  const manager = await prisma.user.findFirst({
    where: { departmentId: kaizen.departmentId, role: "DEPARTMENT_MANAGER", isActive: true },
    select: { id: true },
  });
  if (manager && manager.id !== actorId) {
    await notificationService.create({
      userId: manager.id,
      type: "KAIZEN_SUBMITTED",
      title: "New Kaizen submitted",
      body: `${kaizen.kaizenNumber} — ${kaizen.title} was submitted for review.`,
      entityType: "Kaizen",
      entityId: kaizenId,
    });
  }
}

async function handleKaizenApproved({ kaizenId }: KaizenEventPayload): Promise<void> {
  const kaizen = await prisma.kaizen.findUnique({
    where: { id: kaizenId },
    select: { submitterId: true, kaizenNumber: true, title: true },
  });
  if (!kaizen) return;

  const points = await gamificationService.getPointsSetting("points.idea_approved", 50);
  await gamificationService.awardPointsAndRecompute({
    userId: kaizen.submitterId,
    amount: points,
    reason: "KAIZEN_APPROVED",
    kaizenId,
    statField: "ideasApproved",
  });
  await gamificationService.checkAndAwardAchievements(kaizen.submitterId);

  await notificationService.create({
    userId: kaizen.submitterId,
    type: "KAIZEN_APPROVED",
    title: "Your Kaizen was approved!",
    body: `${kaizen.kaizenNumber} — ${kaizen.title} has been approved.`,
    entityType: "Kaizen",
    entityId: kaizenId,
  });
}

async function handleKaizenRejected({ kaizenId }: KaizenEventPayload): Promise<void> {
  const kaizen = await prisma.kaizen.findUnique({
    where: { id: kaizenId },
    select: { submitterId: true, kaizenNumber: true, title: true },
  });
  if (!kaizen) return;

  await notificationService.create({
    userId: kaizen.submitterId,
    type: "KAIZEN_REJECTED",
    title: "Your Kaizen was not approved",
    body: `${kaizen.kaizenNumber} — ${kaizen.title} was rejected during review.`,
    entityType: "Kaizen",
    entityId: kaizenId,
  });
}

async function handleKaizenNeedsChanges({ kaizenId }: KaizenEventPayload): Promise<void> {
  const kaizen = await prisma.kaizen.findUnique({
    where: { id: kaizenId },
    select: { submitterId: true, kaizenNumber: true, title: true },
  });
  if (!kaizen) return;

  await notificationService.create({
    userId: kaizen.submitterId,
    type: "KAIZEN_NEEDS_CHANGES",
    title: "Your Kaizen needs changes",
    body: `${kaizen.kaizenNumber} — ${kaizen.title} needs changes before it can proceed.`,
    entityType: "Kaizen",
    entityId: kaizenId,
  });
}

/** The API spec's Domain Events table lists only NotificationService for `implementation.completed`
 * — but docs/engineering/01_DATABASE_SCHEMA.md's MVP point-values table lists a concrete
 * "Implementation completed = 100" award with no other trigger point for it anywhere in either
 * doc. Treating the point-values table as authoritative for *when* points are earned (it's the
 * more specific of the two), this handler also awards points — topping up what reads as a gap
 * in the Domain Events table's subscriber list rather than a deliberate exclusion. */
async function handleImplementationCompleted({ kaizenId }: KaizenEventPayload): Promise<void> {
  const kaizen = await prisma.kaizen.findUnique({
    where: { id: kaizenId },
    select: { submitterId: true, kaizenNumber: true, title: true },
  });
  if (!kaizen) return;

  const points = await gamificationService.getPointsSetting("points.implementation_completed", 100);
  await gamificationService.awardPointsAndRecompute({
    userId: kaizen.submitterId,
    amount: points,
    reason: "IMPLEMENTATION_COMPLETED",
    kaizenId,
    statField: "ideasImplemented",
  });
  await gamificationService.checkAndAwardAchievements(kaizen.submitterId);

  await notificationService.create({
    userId: kaizen.submitterId,
    type: "IMPLEMENTATION_COMPLETED",
    title: "Implementation completed",
    body: `${kaizen.kaizenNumber} — ${kaizen.title} has been implemented.`,
    entityType: "Kaizen",
    entityId: kaizenId,
  });
}

/** business-impact.service.ts's own doc comment ("Side effects: Triggers reward issuance
 * automatically") describes exactly this — recording business impact automatically issues the
 * reward, which itself emits `reward.issued` (see handleRewardIssued below) for the points/
 * achievement/notification side effects. No notification type exists for "business impact
 * recorded" on its own (see the `NotificationType` enum) — this cascade is what the Domain
 * Events table's "business_impact.recorded -> NotificationService" entry resolves to. */
async function handleBusinessImpactRecorded({ kaizenId, actorId }: KaizenEventPayload): Promise<void> {
  await rewardService.autoIssue(kaizenId, actorId);
}

async function handleRewardIssued({ kaizenId }: KaizenEventPayload): Promise<void> {
  const [kaizen, reward] = await Promise.all([
    prisma.kaizen.findUnique({
      where: { id: kaizenId },
      select: { submitterId: true, kaizenNumber: true, title: true },
    }),
    prisma.reward.findFirst({ where: { kaizenId }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!kaizen || !reward) return;

  await gamificationService.awardPointsAndRecompute({
    userId: kaizen.submitterId,
    amount: reward.points,
    reason: "BUSINESS_IMPACT_VERIFIED",
    kaizenId,
  });
  await gamificationService.checkAndAwardAchievements(kaizen.submitterId);

  await notificationService.create({
    userId: kaizen.submitterId,
    type: "REWARD_ISSUED",
    title: "Reward issued!",
    body: `You earned ${reward.points} points — ${kaizen.kaizenNumber} — ${kaizen.title}'s business impact was verified.`,
    entityType: "Kaizen",
    entityId: kaizenId,
  });
}

export function registerEventHandlers() {
  eventBus.on("kaizen.submitted", (payload) => handleKaizenSubmitted(payload as KaizenEventPayload));
  eventBus.on("kaizen.approved", (payload) => handleKaizenApproved(payload as KaizenEventPayload));
  eventBus.on("kaizen.rejected", (payload) => handleKaizenRejected(payload as KaizenEventPayload));
  eventBus.on("kaizen.needs_changes", (payload) =>
    handleKaizenNeedsChanges(payload as KaizenEventPayload),
  );
  eventBus.on("implementation.completed", (payload) =>
    handleImplementationCompleted(payload as KaizenEventPayload),
  );
  eventBus.on("business_impact.recorded", (payload) =>
    handleBusinessImpactRecorded(payload as KaizenEventPayload),
  );
  eventBus.on("reward.issued", (payload) => handleRewardIssued(payload as KaizenEventPayload));
}
