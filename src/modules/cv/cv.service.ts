import { PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";

export class CVService {
  constructor(
    private prisma: PrismaClient,
    private cloudinary: CloudinaryService,
  ) {}

  create = async (userId: number, cvName: string, file?: Express.Multer.File) => {
    if (!cvName || !cvName.trim()) {
      throw new ApiError("CV name is required", 400);
    }

    if (!file) {
      throw new ApiError("CV file is required", 400);
    }

    const { url } = await this.cloudinary.uploadPDF(
      file,
      "cvs",
      `cv-${userId}-${Date.now()}.pdf`,
    );

    const existingPrimary = await this.prisma.cV.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });

    const cv = await this.prisma.cV.create({
      data: {
        userId,
        cvName: cvName.trim(),
        fileUrl: url,
        isPrimary: !existingPrimary,
      },
    });

    return {
      message: "Create CV success",
      data: cv,
    };
  };

  getAll = async (userId: number) => {
    const cvs = await this.prisma.cV.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return {
      message: "Get all CV success",
      data: cvs,
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
      message: "Set primary CV success",
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

    await this.prisma.cV.delete({
      where: { id: cvId },
    });

    if (cv.isPrimary) {
      const latestCv = await this.prisma.cV.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (latestCv) {
        await this.prisma.cV.update({
          where: { id: latestCv.id },
          data: { isPrimary: true },
        });
      }
    }

    return {
      message: "Delete CV success",
    };
  };
}
