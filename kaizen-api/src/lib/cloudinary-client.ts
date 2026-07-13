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
