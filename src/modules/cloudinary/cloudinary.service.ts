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
   * Generate SHA1 signature
   */
  private generateSignature(params: Record<string, string | number>) {
    const sorted = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    return crypto
      .createHash("sha1")
      .update(sorted + this.apiSecret)
      .digest("hex");
  }

  /**
   * Core upload handler (image / raw)
   */
  private async uploadToCloudinary(
    file: Express.Multer.File,
    options: {
      folder: string;
      resourceType: ResourceType;
      publicId?: string;
    }
  ): Promise<{ url: string; publicId: string }> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);

      const params: Record<string, string | number> = {
        timestamp,
        folder: options.folder,
      };

      if (options.publicId) {
        params.public_id = options.publicId;
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
      formData.append("folder", options.folder);

      if (options.publicId) {
        formData.append("public_id", options.publicId);
      }

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/${options.resourceType}/upload`,
        formData,
        { headers: formData.getHeaders() }
      );

      return {
        url: response.data.secure_url,
        publicId: response.data.public_id,
      };
    } catch (err) {
      throw new ApiError("Cloudinary upload failed", 500);
    }
  }

  /**
   * Upload Image (jpg/png)
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
    publicId?: string
  ) {
    return this.uploadToCloudinary(file, {
      folder,
      resourceType: "image",
      publicId,
    });
  }

  /**
   * Upload PDF (CV)
   */
  async uploadPDF(
    file: Express.Multer.File,
    folder: string,
    publicId?: string
  ) {
    return this.uploadToCloudinary(file, {
      folder,
      resourceType: "raw",
      publicId,
    });
  }

  /**
   * Extract public_id from URL
   */
  private extractPublicId(url: string): string {
    const clean = url.split("?")[0];
    const parts = clean.split("/");

    const uploadIndex = parts.findIndex((p) => p === "upload");
    const publicParts = parts.slice(uploadIndex + 2);

    const filename = publicParts.join("/");
    return filename.replace(/\.[^/.]+$/, "");
  }

  /**
   * Delete by public_id
   */
  async delete(publicId: string, resourceType: ResourceType = "image") {
    try {
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
        { headers: formData.getHeaders() }
      );

      return response.data;
    } catch {
      throw new ApiError("Cloudinary delete failed", 500);
    }
  }

  /**
   * Delete by URL (helper)
   */
  async deleteByUrl(url: string, resourceType: ResourceType = "image") {
    const publicId = this.extractPublicId(url);
    return this.delete(publicId, resourceType);
  }
}