import type { KaizenAttachmentItem, KaizenDetail, KaizenListItem } from "./kaizen.types.js";

const KAIZEN_LIST_SELECT = {
  id: true,
  kaizenNumber: true,
  title: true,
  status: true,
  priority: true,
  estimatedImpact: true,
  category: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  submitter: { select: { id: true, displayName: true } },
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type KaizenListRow = {
  id: string;
  kaizenNumber: string;
  title: string;
  status: string;
  priority: string;
  estimatedImpact: string;
  category: { id: string; name: string } | null;
  department: { id: string; name: string };
  submitter: { id: string; displayName: string };
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toListItem(kaizen: KaizenListRow): KaizenListItem {
  return {
    id: kaizen.id,
    kaizenNumber: kaizen.kaizenNumber,
    title: kaizen.title,
    status: kaizen.status as KaizenListItem["status"],
    priority: kaizen.priority as KaizenListItem["priority"],
    estimatedImpact: kaizen.estimatedImpact as KaizenListItem["estimatedImpact"],
    category: kaizen.category,
    department: kaizen.department,
    submitter: kaizen.submitter,
    submittedAt: kaizen.submittedAt?.toISOString() ?? null,
    createdAt: kaizen.createdAt.toISOString(),
    updatedAt: kaizen.updatedAt.toISOString(),
  };
}

const KAIZEN_DETAIL_INCLUDE = {
  category: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  submitter: { select: { id: true, displayName: true } },
  fiveW1H: true,
  fiveWhys: { orderBy: { level: "asc" as const } },
  benefits: { orderBy: { sortOrder: "asc" as const } },
  attachments: {
    orderBy: { createdAt: "asc" as const },
    include: { uploadedBy: { select: { id: true, displayName: true } } },
  },
} as const;

type KaizenAttachmentRow = {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSizeBytes: bigint;
  cloudinaryPublicId: string;
  cloudinarySecureUrl: string;
  uploadedBy: { id: string; displayName: string };
  createdAt: Date;
};

type KaizenWithRelations = {
  id: string;
  kaizenNumber: string;
  title: string;
  status: string;
  priority: string;
  estimatedImpact: string;
  location: string | null;
  problemStatement: string | null;
  currentProcess: string | null;
  proposedSolution: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string } | null;
  department: { id: string; name: string };
  submitter: { id: string; displayName: string };
  fiveW1H: {
    what: string | null;
    whereLocation: string | null;
    whenOccurs: string | null;
    who: string | null;
    why: string | null;
    how: string | null;
  } | null;
  fiveWhys: { level: number; answer: string }[];
  benefits: { id: string; benefitType: string; description: string; isCustom: boolean }[];
  attachments: KaizenAttachmentRow[];
};

function toAttachmentItem(attachment: KaizenAttachmentRow): KaizenAttachmentItem {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    fileType: attachment.fileType,
    mimeType: attachment.mimeType,
    fileSizeBytes: Number(attachment.fileSizeBytes),
    cloudinaryPublicId: attachment.cloudinaryPublicId,
    cloudinarySecureUrl: attachment.cloudinarySecureUrl,
    uploadedBy: attachment.uploadedBy,
    createdAt: attachment.createdAt.toISOString(),
  };
}

function toDetail(kaizen: KaizenWithRelations): KaizenDetail {
  return {
    id: kaizen.id,
    kaizenNumber: kaizen.kaizenNumber,
    title: kaizen.title,
    status: kaizen.status as KaizenDetail["status"],
    priority: kaizen.priority as KaizenDetail["priority"],
    estimatedImpact: kaizen.estimatedImpact as KaizenDetail["estimatedImpact"],
    location: kaizen.location,
    problemStatement: kaizen.problemStatement,
    currentProcess: kaizen.currentProcess,
    proposedSolution: kaizen.proposedSolution,
    category: kaizen.category,
    department: kaizen.department,
    submitter: kaizen.submitter,
    submittedAt: kaizen.submittedAt?.toISOString() ?? null,
    createdAt: kaizen.createdAt.toISOString(),
    updatedAt: kaizen.updatedAt.toISOString(),
    fiveW1H: kaizen.fiveW1H
      ? {
          what: kaizen.fiveW1H.what ?? undefined,
          whereLocation: kaizen.fiveW1H.whereLocation ?? undefined,
          whenOccurs: kaizen.fiveW1H.whenOccurs ?? undefined,
          who: kaizen.fiveW1H.who ?? undefined,
          why: kaizen.fiveW1H.why ?? undefined,
          how: kaizen.fiveW1H.how ?? undefined,
        }
      : null,
    fiveWhy: kaizen.fiveWhys.map((entry) => ({ level: entry.level, answer: entry.answer })),
    benefits: kaizen.benefits.map((entry) => ({
      id: entry.id,
      benefitType: entry.benefitType,
      description: entry.description,
      isCustom: entry.isCustom,
    })),
    attachments: kaizen.attachments.map(toAttachmentItem),
  };
}

export { KAIZEN_DETAIL_INCLUDE, KAIZEN_LIST_SELECT, toAttachmentItem, toDetail, toListItem };
