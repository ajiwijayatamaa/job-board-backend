import axios from "axios";
import crypto from "crypto";
import FormData from "form-data";
import { ApiError } from "../../utils/api-error.js";

type ResourceType = "image" | "raw";

export class CloudinaryService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    this.apiKey = process.env.CLOUDINARY_API_KEY!;
    this.apiSecret = process.env.CLOUDINARY_API_SECRET!;
  }

  /**
   * Generate Cloudinary signature (SHA1)
   */
  private generateSignature(params: Record<string, string | number>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    return crypto
      .createHash("sha1")
      .update(sortedParams + this.apiSecret)
      .digest("hex");
  }

  /**
   * Upload image (jpg/png) — untuk banner job, foto profil
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
    publicId?: string,
  ): Promise<{ url: string; publicId: string }> {
    const timestamp = Math.floor(Date.now() / 1000);

    const params: Record<string, string | number> = {
      folder,
      timestamp,
    };

    if (publicId) {
      params.public_id = publicId;
    }

    const signature = this.generateSignature(params);

    const formData = new FormData();
    formData.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    formData.append("api_key", this.apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    if (publicId) {
      formData.append("public_id", publicId);
    }

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      formData,
      { headers: formData.getHeaders() },
    );

    return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
    };
  }

  /**
   * Upload PDF (CV) — resource type raw + access_mode public
   * access_mode harus masuk ke signature agar Cloudinary menerimanya
   */
  async uploadPDF(
    file: Express.Multer.File,
    folder: string,
    publicId?: string,
  ): Promise<{ url: string; publicId: string }> {
    const timestamp = Math.floor(Date.now() / 1000);

    const params: Record<string, string | number> = {
      access_mode: "public",
      folder,
      timestamp,
    };

    if (publicId) {
      params.public_id = publicId;
    }

    const signature = this.generateSignature(params);

    const formData = new FormData();
    formData.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    formData.append("api_key", this.apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);
    formData.append("access_mode", "public");

    if (publicId) {
      formData.append("public_id", publicId);
    }

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/raw/upload`,
      formData,
      { headers: formData.getHeaders() },
    );

    return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
    };
  }

  /**
   * Extract public_id from secure_url — dipakai oleh deleteByUrl & streamFile
   * Contoh: https://res.cloudinary.com/xxx/raw/upload/v1234/cvs/cv-5-123.pdf
   * Hasil  : cvs/cv-5-123.pdf
   */
  extractPublicIdFromUrl(url: string): string {
    const withoutQuery = url.split("?")[0];
    const parts = withoutQuery.split("/");
    const uploadIndex = parts.findIndex((p) => p === "upload");
    const publicIdParts = parts.slice(uploadIndex + 2);
    return publicIdParts.join("/");
  }

  /**
   * Generate signed URL untuk akses PDF (berlaku 1 jam)
   * Dipakai oleh cv.service.ts → streamFile
   */
  generateSignedUrl(publicId: string): string {
    const expiration = Math.floor(Date.now() / 1000) + 3600;

    const signature = this.generateSignature({
      public_id: publicId,
      timestamp: expiration,
    });

    return (
      `https://res.cloudinary.com/${this.cloudName}/raw/upload/` +
      `s--${signature}--/` +
      `e_${expiration}/` +
      `${publicId}`
    );
  }

  /**
   * Delete image by URL
   */
  async deleteByUrl(url: string): Promise<any> {
    const publicId = this.extractPublicIdFromUrl(url);
    return this.deleteByPublicId(publicId, "image");
  }

  /**
   * Delete by public_id (image atau raw)
   */
  async deleteByPublicId(
    publicId: string,
    resourceType: ResourceType = "image",
  ): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = this.generateSignature({
      public_id: publicId,
      timestamp,
    });

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("api_key", this.apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/destroy`,
      formData,
      { headers: formData.getHeaders() },
    );

    return response.data;
  }
}
