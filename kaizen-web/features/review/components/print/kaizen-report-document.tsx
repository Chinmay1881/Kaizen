import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { KaizenReportData } from "@/features/review/utils/kaizen-report-data";
import { findApprovalDate, findApprover, implementationReadiness } from "@/features/review/utils/kaizen-report-data";

/**
 * A genuine, standalone PDF document — built from `@react-pdf/renderer`'s own layout primitives
 * (`Page`/`View`/`Text`), not a screenshot of the on-screen Tailwind UI. Nothing here shares a
 * component with `review-document.tsx`/`decision-center.tsx`; those render live, interactive,
 * app-chrome-surrounded HTML for the browser, this renders a fixed-size A4 document for a PDF
 * consumer, and the two have fundamentally different layout constraints (flex-wrap-and-scroll vs.
 * fixed-page-and-paginate). Sharing JSX between them would mean fighting one engine's assumptions
 * to satisfy the other's.
 */

const COLORS = {
  ink: "#18181b",
  muted: "#71717a",
  border: "#e4e4e7",
  accent: "#0f172a",
  success: "#15803d",
  destructive: "#b91c1c",
  warning: "#b45309",
  chip: "#f4f4f5",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 70,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: COLORS.ink,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerCompany: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1, color: COLORS.muted, textTransform: "uppercase" },
  headerDoc: { fontSize: 8, color: COLORS.muted },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingTop: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: COLORS.muted,
  },
  titleBlock: { marginBottom: 14 },
  kaizenNumber: { fontSize: 8, color: COLORS.muted, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, marginBottom: 3 },
  title: { fontSize: 17, fontFamily: "Helvetica-Bold", color: COLORS.accent, marginBottom: 8 },
  factGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  factItem: { width: "23%", minWidth: 110 },
  factLabel: { fontSize: 7, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
  factValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  section: { marginTop: 16 },
  sectionHeading: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 4 },
  body: { fontSize: 9.5, lineHeight: 1.5, color: COLORS.ink },
  mutedText: { fontSize: 9, color: COLORS.muted },
  listItem: { flexDirection: "row", marginBottom: 4, gap: 6 },
  bullet: { width: 10, fontSize: 9.5 },
  listItemText: { flex: 1, fontSize: 9.5, lineHeight: 1.4 },
  card: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 3, padding: 8, marginBottom: 6 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  cardAuthor: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  cardMeta: { fontSize: 7.5, color: COLORS.muted },
  chip: { backgroundColor: COLORS.chip, borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6, fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  chipRow: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  timelineRow: { flexDirection: "row", gap: 8, marginBottom: 7 },
  timelineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent, marginTop: 3 },
  timelineBody: { flex: 1 },
  attachmentImage: { width: 160, height: 110, objectFit: "cover", borderRadius: 3, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, marginBottom: 8 },
  attachmentImageRow: { flexDirection: "row", flexWrap: "wrap" },
  signatureRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, gap: 20 },
  signatureBlock: { flex: 1 },
  signatureLine: { borderTopWidth: 1, borderTopColor: COLORS.ink, marginTop: 28, paddingTop: 4 },
  signatureRole: { fontSize: 8, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  signatureName: { fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 2 },
});

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeading} minPresenceAhead={30}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.factItem}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  DRAFT_CREATED: "Draft created",
  SUBMITTED: "Submitted for review",
  UNDER_REVIEW: "Review started",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  NEEDS_CHANGES: "Changes requested",
  COMMENT_ADDED: "Comment added",
  EVALUATION_SUBMITTED: "Evaluation submitted",
};

export function KaizenReportDocument({ kaizen, score, timeline, comments, implementation, businessImpact }: KaizenReportData) {
  const approvalDate = findApprovalDate(timeline);
  const approver = findApprover(timeline);
  const imageAttachments = kaizen.attachments.filter((a) => a.mimeType.startsWith("image/"));
  const otherAttachments = kaizen.attachments.filter((a) => !a.mimeType.startsWith("image/"));
  const reviewerNames = score?.evaluations.map((e) => e.reviewer.displayName).join(", ") || "Not yet evaluated";

  return (
    <Document title={`${kaizen.kaizenNumber} — ${kaizen.title}`} author="Muliya Kaizan">
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <Text style={styles.headerCompany}>Muliya Gold &amp; Jewellers LLP</Text>
          <Text style={styles.headerDoc}>Kaizen Report · {kaizen.kaizenNumber}</Text>
        </View>
        <View style={styles.footer} fixed>
          <Text>Muliya Kaizan — Confidential</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.kaizenNumber}>{kaizen.kaizenNumber}</Text>
          <Text style={styles.title}>{kaizen.title}</Text>
          <View style={styles.factGrid}>
            <Fact label="Status" value={kaizen.status.replaceAll("_", " ")} />
            <Fact label="Department" value={kaizen.department.name} />
            <Fact label="Category" value={kaizen.category?.name ?? "—"} />
            <Fact label="Priority" value={kaizen.priority} />
            <Fact label="Submitter" value={kaizen.submitter.displayName} />
            <Fact label="Reviewer(s)" value={reviewerNames} />
            <Fact label="Submission Date" value={formatDate(kaizen.submittedAt)} />
            <Fact label="Approval Date" value={formatDate(approvalDate)} />
            <Fact label="Score" value={score ? `${score.overallRating.toFixed(1)} / 10` : "—"} />
          </View>
        </View>

        <Section title="Problem Statement">
          <Text style={styles.body}>{kaizen.problemStatement || "Not provided."}</Text>
        </Section>

        <Section title="Current Process">
          <Text style={styles.body}>{kaizen.currentProcess || "Not provided."}</Text>
        </Section>

        <Section title="Root Cause Analysis (5 Why)">
          {kaizen.fiveWhy.length > 0 ? (
            kaizen.fiveWhy
              .sort((a, b) => a.level - b.level)
              .map((entry) => (
                <View key={entry.level} style={styles.listItem} wrap={false}>
                  <Text style={styles.bullet}>{entry.level}.</Text>
                  <Text style={styles.listItemText}>{entry.answer}</Text>
                </View>
              ))
          ) : (
            <Text style={styles.mutedText}>Not provided.</Text>
          )}
        </Section>

        <Section title="Proposed Improvement">
          <Text style={styles.body}>{kaizen.proposedSolution || "Not provided."}</Text>
        </Section>

        <Section title="Expected Benefits">
          {kaizen.benefits.length > 0 ? (
            kaizen.benefits.map((benefit) => (
              <View key={benefit.id} style={styles.listItem} wrap={false}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listItemText}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>{benefit.benefitType.replaceAll("_", " ")}: </Text>
                  {benefit.description}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.mutedText}>No benefits recorded.</Text>
          )}
        </Section>

        <Section title="Business Impact">
          {businessImpact ? (
            <>
              <View style={styles.factGrid}>
                <Fact label="Money Saved" value={formatCurrency(businessImpact.moneySaved)} />
                <Fact label="Hours Saved" value={businessImpact.hoursSaved != null ? String(businessImpact.hoursSaved) : "—"} />
                <Fact label="Employees Benefited" value={businessImpact.employeesBenefited != null ? String(businessImpact.employeesBenefited) : "—"} />
                <Fact label="Customers Benefited" value={businessImpact.customersBenefited != null ? String(businessImpact.customersBenefited) : "—"} />
              </View>
              {businessImpact.remarks ? <Text style={[styles.body, { marginTop: 6 }]}>{businessImpact.remarks}</Text> : null}
            </>
          ) : (
            <Text style={styles.mutedText}>Not yet recorded — estimated impact at submission: {kaizen.estimatedImpact}.</Text>
          )}
        </Section>

        {implementation ? (
          <Section title="Implementation">
            <View style={styles.factGrid}>
              <Fact label="Readiness" value={implementationReadiness(kaizen, implementation)} />
              <Fact label="Owner" value={implementation.owner.displayName} />
              <Fact label="Assigned Department" value={implementation.assignedDepartment.name} />
              <Fact label="Progress" value={`${implementation.progressPercent}%`} />
              <Fact label="Estimated Cost" value={formatCurrency(implementation.estimatedCost)} />
              <Fact label="Actual Cost" value={formatCurrency(implementation.actualCost)} />
              <Fact label="Due Date" value={formatDate(implementation.dueDate)} />
              <Fact label="Verification" value={implementation.verificationStatus} />
            </View>
            {implementation.description ? (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.factLabel}>Implementation Notes</Text>
                <Text style={styles.body}>{implementation.description}</Text>
              </View>
            ) : null}
            {implementation.completionNotes ? (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.factLabel}>Completion Notes</Text>
                <Text style={styles.body}>{implementation.completionNotes}</Text>
              </View>
            ) : null}
          </Section>
        ) : null}

        <Section title="Attachments">
          {kaizen.attachments.length === 0 ? (
            <Text style={styles.mutedText}>No attachments.</Text>
          ) : (
            <>
              {imageAttachments.length > 0 ? (
                <View style={styles.attachmentImageRow}>
                  {imageAttachments.map((attachment) => (
                    // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image has no `alt` prop; it's a PDF drawing primitive, not an HTML <img>
                    <Image key={attachment.id} src={attachment.cloudinarySecureUrl} style={styles.attachmentImage} />
                  ))}
                </View>
              ) : null}
              {otherAttachments.map((attachment) => (
                <View key={attachment.id} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listItemText}>
                    {attachment.fileName} <Text style={styles.mutedText}>— uploaded by {attachment.uploadedBy.displayName}</Text>
                  </Text>
                </View>
              ))}
            </>
          )}
        </Section>

        <Section title="Reviewer Comments">
          {comments.length === 0 ? (
            <Text style={styles.mutedText}>No comments.</Text>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.card} wrap={false}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardAuthor}>
                    {comment.author.displayName} <Text style={styles.mutedText}>({comment.author.role.replaceAll("_", " ")})</Text>
                  </Text>
                  <Text style={styles.cardMeta}>{formatDateTime(comment.createdAt)}</Text>
                </View>
                <Text style={styles.body}>{comment.body}</Text>
                {comment.isResolved ? (
                  <Text style={[styles.chip, { alignSelf: "flex-start", marginTop: 4, color: COLORS.success }]}>Resolved</Text>
                ) : null}
              </View>
            ))
          )}
        </Section>

        <Section title="Timeline &amp; Decision History">
          {timeline.length === 0 ? (
            <Text style={styles.mutedText}>No timeline events.</Text>
          ) : (
            timeline.map((event) => (
              <View key={event.id} style={styles.timelineRow} wrap={false}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineBody}>
                  <Text style={styles.cardAuthor}>
                    {EVENT_TYPE_LABEL[event.eventType] ?? event.eventType.replaceAll("_", " ")}
                    {event.actor ? <Text style={styles.mutedText}> — {event.actor.displayName}</Text> : null}
                  </Text>
                  <Text style={styles.mutedText}>{formatDateTime(event.createdAt)}</Text>
                  {event.description ? <Text style={[styles.body, { marginTop: 1 }]}>{event.description}</Text> : null}
                </View>
              </View>
            ))
          )}
        </Section>

        <Section title="Approval Status">
          <View style={styles.chipRow}>
            <Text style={styles.chip}>{kaizen.status.replaceAll("_", " ")}</Text>
            {approver ? <Text style={styles.mutedText}>Approved by {approver} on {formatDate(approvalDate)}</Text> : null}
          </View>
        </Section>

        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureRole}>Prepared By</Text>
              <Text style={styles.signatureName}>{kaizen.submitter.displayName}</Text>
            </View>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureRole}>Reviewed By</Text>
              <Text style={styles.signatureName}>{reviewerNames}</Text>
            </View>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureRole}>Approved By</Text>
              <Text style={styles.signatureName}>{approver ?? "Pending"}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
