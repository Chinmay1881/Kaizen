"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError } from "@/features/kaizen/components/field-error";
import { useDeleteKaizenAttachment, useUploadKaizenAttachment } from "@/features/kaizen/hooks/use-kaizen-draft-mutations";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";
import { ApiError } from "@/lib/api-client";

const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentUploaderProps {
  /** Set by the time this is reachable — the wizard always creates the draft on the first "Next"
   * click (step 1 -> 2), before a user can reach this uploader inside step 2. */
  draftId: string | null;
}

/**
 * Uploads each file to Cloudinary immediately on selection (`POST /kaizens/:id/attachments`,
 * multipart), against the draft already created for this wizard session — not deferred to submit
 * time. Removing a file calls `DELETE /kaizens/:id/attachments/:attachmentId` so an uploaded-then-
 * removed file doesn't linger as an orphaned Cloudinary asset attached to the Kaizen.
 *
 * Lives inside Step 2 (Process) rather than as its own wizard step — the images document the
 * current process being described there, so reviewers and the Details page show them in that same
 * section (see review-document.tsx / kaizen-case-study.tsx). The upload mechanics themselves
 * (endpoints, Cloudinary, size/type limits) are unchanged from before; only where this component
 * is mounted moved.
 */
export function AttachmentUploader({ draftId }: AttachmentUploaderProps) {
  const { control, formState } = useFormContext<WizardFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "attachments" });
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadAttachment = useUploadKaizenAttachment();
  const deleteAttachment = useDeleteKaizenAttachment();

  async function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setLocalError(null);

    if (!draftId) {
      setLocalError("Still saving your draft — try again in a moment.");
      return;
    }

    const incoming = Array.from(fileList);
    const oversized = incoming.find((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
      setLocalError(`"${oversized.name}" is larger than 25 MB.`);
      return;
    }
    if (fields.length + incoming.length > MAX_FILES) {
      setLocalError(`You can attach up to ${MAX_FILES} files.`);
      return;
    }

    setIsUploading(true);
    try {
      // Sequential, not parallel — the server enforces the same MAX_FILES cap per request, so
      // firing all uploads at once risks several requests racing past it at the same count.
      for (const file of incoming) {
        try {
          const attachment = await uploadAttachment.mutateAsync({ id: draftId, file });
          append({
            id: attachment.id,
            fileName: attachment.fileName,
            fileSizeBytes: attachment.fileSizeBytes,
            mimeType: attachment.mimeType,
            cloudinarySecureUrl: attachment.cloudinarySecureUrl,
          });
        } catch (error) {
          setLocalError(error instanceof ApiError ? error.message : `Could not upload "${file.name}".`);
          break;
        }
      }
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove(index: number, attachmentId: string) {
    if (!draftId) return;
    setRemovingId(attachmentId);
    try {
      await deleteAttachment.mutateAsync({ id: draftId, attachmentId });
      remove(index);
    } catch (error) {
      setLocalError(error instanceof ApiError ? error.message : "Could not remove this file.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Attach photos of the current process (or supporting videos/PDFs/documents). Up to {MAX_FILES} files, 25 MB each.
      </p>

      <div
        role="button"
        tabIndex={isUploading ? -1 : 0}
        aria-disabled={isUploading}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!isUploading && (event.key === "Enter" || event.key === " ")) inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isUploading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!isUploading) void addFiles(event.dataTransfer.files);
        }}
        className={`flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          isUploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${isDragging ? "border-primary bg-primary/5" : "border-border"}`}
      >
        {isUploading ? (
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        ) : (
          <Upload className="text-muted-foreground h-6 w-6" />
        )}
        <p className="text-sm font-medium">{isUploading ? "Uploading…" : "Drag & drop images here, or click to browse"}</p>
        <p className="text-muted-foreground text-xs">Images, videos, PDF, Word, Excel, PowerPoint</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          disabled={isUploading}
          className="hidden"
          onChange={(event) => {
            void addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <FieldError message={localError ?? formState.errors.attachments?.message} />

      {fields.length > 0 ? (
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => {
            const isImage = field.mimeType.startsWith("image/");
            const isRemoving = removingId === field.id;
            return (
              <Card key={field.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- attachments come from Cloudinary, an arbitrary external host
                    <img src={field.cloudinarySecureUrl} alt={field.fileName} className="h-10 w-10 shrink-0 rounded-md object-cover" />
                  ) : (
                    <FileText className="text-muted-foreground h-5 w-5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{field.fileName}</p>
                    <p className="text-muted-foreground text-xs">{formatFileSize(field.fileSizeBytes)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${field.fileName}`}
                    disabled={isRemoving}
                    onClick={() => void handleRemove(index, field.id)}
                  >
                    {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
