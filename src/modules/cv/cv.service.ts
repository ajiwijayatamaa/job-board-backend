import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { CloudinaryService } from "../../modules/cloudinary/cloudinary.service.js";

export class CVService {
  private cloudinary = new CloudinaryService();

  async create(
    userId: number,
    cvName: string,
    file?: Express.Multer.File
  ) {
    if (!file) {
      throw new ApiError("CV file is required", 400);
    }

    const { url, publicId } = await this.cloudinary.uploadPDF(
      file,
      "cvs",
      `cv-${userId}-${Date.now()}`
    );

    return prisma.cV.create({
      data: {
        userId,
        cvName,
        fileUrl: url,
      },
    });
  }

  async getAll(userId: number) {
    return prisma.cV.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async setPrimary(userId: number, cvId: number) {
    const cv = await prisma.cV.findFirst({
      where: { id: cvId, userId },
    });

    if (!cv) {
      throw new ApiError("CV not found", 404);
    }

    await prisma.cV.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });

    return prisma.cV.update({
      where: { id: cvId },
      data: { isPrimary: true },
    });
  }

  async delete(userId: number, cvId: number) {
    const cv = await prisma.cV.findFirst({
      where: { id: cvId, userId },
    });

    if (!cv) {
      throw new ApiError("CV not found", 404);
    };

    await prisma.cV.delete({
      where: { id: cvId },
    });
  }
}