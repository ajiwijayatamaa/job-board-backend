import { ApiError } from "../utils/api-error.js";
import { Request } from "express";
import multer from "multer";

type FileType = "image" | "pdf";

export class UploadMiddleware {
  private storage = multer.memoryStorage();

  private getFileFilter(type: FileType) {
    return (_req: Request, file: Express.Multer.File, cb: any) => {
      if (type === "image") {
        const allowed = ["image/jpeg", "image/png"];

        if (!allowed.includes(file.mimetype)) {
          return cb(new ApiError("Only JPG/PNG files are allowed", 400));
        }
      }

      if (type === "pdf") {
        if (file.mimetype !== "application/pdf") {
          return cb(new ApiError("Only PDF files are allowed", 400));
        }
      }

      cb(null, true);
    };
  }

  upload(type: FileType, maxSize: number = 2) {
    return multer({
      storage: this.storage,
      limits: {
        fileSize: maxSize * 1024 * 1024,
      },
      fileFilter: this.getFileFilter(type),
    });
  }

  /**
   * Shortcut: upload image (profile photo, banner)
   */
  uploadImage(maxSize: number = 2) {
    return this.upload("image", maxSize);
  }

  /**
   * Shortcut: upload PDF (CV)
   */
  uploadPDF(maxSize: number = 2) {
    return this.upload("pdf", maxSize);
  }
}
