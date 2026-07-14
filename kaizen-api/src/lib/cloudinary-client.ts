import { v2 as cloudinary } from "cloudinary";

import { getCloudinaryConfig } from "../config/cloudinary.js";

let configured = false;

function ensureConfigured(): boolean {
  const config = getCloudinaryConfig();
  if (!config) return false;
  if (!configured) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true,
    });
    configured = true;
  }
  return true;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

/** Uploads a generated report file to Cloudinary as a `raw` resource (PDF/XLSX/CSV are not
 * images). Returns `null` when Cloudinary isn't configured — callers fall back to storing the
 * bytes directly in Postgres (`ReportExport.fileData`) rather than fabricating a URL. See the
 * Reports module notes for why no real Cloudinary account exists in this environment. */
export async function uploadReportFile(
  buffer: Buffer,
  options: { folder: string; publicId: string },
): Promise<CloudinaryUploadResult | null> {
  if (!ensureConfigured()) return null;

  const config = getCloudinaryConfig();
  if (!config) return null;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: `${config.folder}/${options.folder}`,
        public_id: options.publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result."));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    uploadStream.end(buffer);
  });
}

export async function deleteReportFile(publicId: string): Promise<void> {
  if (!ensureConfigured()) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}

export interface CloudinaryAttachmentUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
}

/** Uploads a Kaizen (or Implementation-evidence) attachment — `resource_type: "auto"` lets
 * Cloudinary itself classify images/video/PDF/other rather than this app pre-deciding, since the
 * only thing that matters for storage is "is it an image or video", which Cloudinary already
 * detects from the bytes. Throws (does not return `null`) when Cloudinary isn't configured — unlike
 * `uploadReportFile`, there is no non-Cloudinary fallback storage for attachment binaries, so the
 * caller should surface a clear "attachments aren't configured" error rather than silently no-op. */
export async function uploadAttachment(
  buffer: Buffer,
  options: { folder: string; publicId: string },
): Promise<CloudinaryAttachmentUploadResult> {
  if (!ensureConfigured()) {
    throw new Error("Cloudinary is not configured (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET).");
  }

  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error("Cloudinary is not configured (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET).");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: `${config.folder}/${options.folder}`,
        public_id: options.publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result."));
          return;
        }
        resolve({ publicId: result.public_id, url: result.url, secureUrl: result.secure_url });
      },
    );
    uploadStream.end(buffer);
  });
}

export async function deleteAttachment(publicId: string, resourceType: "image" | "video" | "raw" = "image"): Promise<void> {
  if (!ensureConfigured()) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
