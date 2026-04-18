import { PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";
import { CreateCVDTO } from "./dto/cv.dto.js";

export class CVService {
  constructor(
    private prisma: PrismaClient,
    private cloudinaryService: CloudinaryService,
  ) {}

  create = async (
    userId: number,
    body: CreateCVDTO,
    file?: Express.Multer.File
  ) => {
    if (!file) {
      throw new ApiError("CV file is required", 400);
    }

    const { url } = await this.cloudinaryService.uploadPDF(
      file,
      "cvs",
      `cv-${userId}-${Date.now()}.pdf`
    );

    const cv = await this.prisma.cV.create({
      data: {
        userId,
        cvName: body.cvName,
        fileUrl: url,
      },
    });

    return {
      message: "CV uploaded success",
      data: cv,
    };
  };

  getAll = async (userId: number) => {
    const items = await this.prisma.cV.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return {
      message: "Get all CVs success",
      data: items,
    };
  };

  setPrimary = async (userId: number, cvId: number) => {
    const cv = await this.prisma.cV.findFirst({
      where: { id: cvId, userId },
    });

    if (!cv) {
      throw new ApiError("CV not found", 404);
    }

    await this.prisma.cV.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });

    const updatedCv = await this.prisma.cV.update({
      where: { id: cvId },
      data: { isPrimary: true },
    });

    return {
      message: "Primary CV updated success",
      data: updatedCv,
    };
  };

  delete = async (userId: number, cvId: number) => {
    const cv = await this.prisma.cV.findFirst({
      where: { id: cvId, userId },
    });

    if (!cv) {
      throw new ApiError("CV not found", 404);
    }

    // Hapus file dari Cloudinary (PDF menggunakan resourceType: "raw")
    await this.cloudinaryService.deleteByUrl(cv.fileUrl, "raw");

    await this.prisma.cV.delete({
      where: { id: cvId },
    });

    return {
      message: "CV deleted success",
    };
  };
}
