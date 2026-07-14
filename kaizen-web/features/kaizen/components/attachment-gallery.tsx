import { FileText, Paperclip } from "lucide-react";

import type { KaizenAttachment } from "@/features/kaizen/types/kaizen";

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentGalleryProps {
  attachments: KaizenAttachment[];
}

/** Shared real-image display for a Kaizen's submitted attachments — reused by the Review
 * Workspace, My Ideas, and Implementation's "Original Kaizen" section (three separate document
 * views that each already independently rendered "N file(s) attached." with no actual images).
 * Images render as a thumbnail grid; everything else (video/PDF/doc) as a clickable file row,
 * mirroring the pattern `implementation-document.tsx` already used for Implementation-evidence
 * attachments. */
export function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
  if (attachments.length === 0) {
    return (
      <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <Paperclip className="h-3.5 w-3.5" />
        No attachments.
      </p>
    );
  }

  const images = attachments.filter((attachment) => attachment.mimeType.startsWith("image/"));
  const others = attachments.filter((attachment) => !attachment.mimeType.startsWith("image/"));

  return (
    <div className="flex flex-col gap-3">
      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.cloudinarySecureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-lg border"
              title={attachment.fileName}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- attachments come from Cloudinary, an arbitrary external host */}
              <img
                src={attachment.cloudinarySecureUrl}
                alt={attachment.fileName}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </a>
          ))}
        </div>
      ) : null}

      {others.length > 0 ? (
        <ul className="flex flex-col gap-1.5 text-sm">
          {others.map((attachment) => (
            <li key={attachment.id} className="flex items-center gap-1.5">
              <FileText className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              <a
                href={attachment.cloudinarySecureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary truncate hover:underline"
              >
                {attachment.fileName}
              </a>
              <span className="text-muted-foreground shrink-0 text-xs">
                {formatFileSize(attachment.fileSizeBytes)} · {attachment.uploadedBy.displayName}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
