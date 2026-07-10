"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError } from "@/features/kaizen/components/field-error";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";

const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * UI only — kaizen-api has no Cloudinary SDK / upload-signing endpoint yet, so nothing here is
 * actually uploaded. Files are held in form state (name/size/type) purely for review-step display
 * and are dropped when the wizard submits. Real upload is a follow-up milestone once
 * `/uploads/sign` and `POST /kaizens/:id/attachments` exist.
 */
export function Step6Attachments() {
  const { control, formState } = useFormContext<WizardFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "attachments" });
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setLocalError(null);

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

    for (const file of incoming) {
      append({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Attach supporting images, videos, PDFs, or documents. Up to {MAX_FILES} files, 25 MB each.
        Files are attached to this draft locally — actual upload is coming soon.
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <Upload className="text-muted-foreground h-6 w-6" />
        <p className="text-sm font-medium">Drag & drop files here, or click to browse</p>
        <p className="text-muted-foreground text-xs">
          Images, videos, PDF, Word, Excel, PowerPoint
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>

      <FieldError message={localError ?? formState.errors.attachments?.message} />

      {fields.length > 0 ? (
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <FileText className="text-muted-foreground h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{field.name}</p>
                  <p className="text-muted-foreground text-xs">{formatFileSize(field.sizeBytes)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${field.name}`}
                  onClick={() => remove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
