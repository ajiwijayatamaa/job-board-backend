import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";
import {
  CreateJobDTO,
  GetJobsDTO,
  GetPublicJobsDTO,
  UpdateJobDTO,
  UpdateJobStatusDTO,
} from "./dto/job.dto.js";

export class JobService {
  constructor(
    private prisma: PrismaClient,
    private cloudinaryService: CloudinaryService,
  ) {}
  // ========================= ADMIN - FEATUR 2 (START) =========================
  getJobs = async (query: GetJobsDTO & { adminId: number }) => {
    const { page, take, sortBy, sortOrder, search, category, city, adminId } =
      query;

    const whereClause: Prisma.JobWhereInput = {
      company: { adminId },
    };

    if (search) {
      whereClause.title = { contains: search, mode: "insensitive" };
    }

    if (category) {
      whereClause.category = { contains: category, mode: "insensitive" };
    }
    if (city) {
      whereClause.city = { contains: city, mode: "insensitive" };
    }

    const jobs = await this.prisma.job.findMany({
      where: whereClause,
      take,
      skip: (page - 1) * take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    const total = await this.prisma.job.count({ where: whereClause });

    return {
      data: jobs,
      meta: { page, take, total },
    };
  };

  getJobById = async (id: number, adminId: number) => {
    const job = await this.prisma.job.findFirst({
      where: { id, company: { adminId } },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) throw new ApiError("Lowongan tidak ditemukan", 404);

    return job;
  };

  createJob = async (
    body: CreateJobDTO,
    adminId: number,
    banner?: Express.Multer.File,
  ) => {
    const company = await this.prisma.company.findUnique({
      where: { adminId },
    });

    if (!company) throw new ApiError("Company tidak ditemukan", 404);

    let bannerUrl: string | undefined;
    if (banner) {
      const { url } = await this.cloudinaryService.uploadImage(
        banner,
        "job-banners",
      );
      bannerUrl = url;
    }

    const newJob = await this.prisma.job.create({
      data: {
        ...body,
        banner: bannerUrl,
        companyId: company.id,
      },
    });

    return {
      message: "Lowongan berhasil dibuat",
      data: newJob,
    };
  };

  updateJob = async (
    id: number,
    body: UpdateJobDTO,
    adminId: number,
    banner?: Express.Multer.File,
  ) => {
    const job = await this.prisma.job.findFirst({
      where: { id, company: { adminId } },
    });

    if (!job)
      throw new ApiError("Lowongan tidak ditemukan atau bukan milik Anda", 404);

    let bannerUrl = job.banner;
    if (banner) {
      if (bannerUrl) {
        await this.cloudinaryService.deleteByUrl(bannerUrl);
      }
      const { url } = await this.cloudinaryService.uploadImage(
        banner,
        "job-banners",
      );
      bannerUrl = url;
    }

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        ...body,
        banner: bannerUrl,
      },
    });

    return {
      message: "Lowongan berhasil diperbarui",
      data: updatedJob,
    };
  };

  updateJobStatus = async (
    id: number,
    body: UpdateJobStatusDTO,
    adminId: number,
  ) => {
    const job = await this.prisma.job.findFirst({
      where: { id, company: { adminId } },
    });

    if (!job)
      throw new ApiError("Lowongan tidak ditemukan atau bukan milik Anda", 404);

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: { status: body.status },
    });

    const statusMessage = {
      PUBLISHED: "publish",
      DRAFT: "draft",
      CLOSED: "close",
    };

    return {
      message: `Lowongan berhasil di-${statusMessage[body.status]}`,
      data: updatedJob,
    };
  };

  deleteJob = async (id: number, adminId: number) => {
    const job = await this.prisma.job.findFirst({
      where: { id, company: { adminId } },
    });

    if (!job)
      throw new ApiError("Lowongan tidak ditemukan atau bukan milik Anda", 404);

    if (job.banner) {
      await this.cloudinaryService.deleteByUrl(job.banner);
    }

    await this.prisma.job.delete({ where: { id } });

    return { message: "Lowongan berhasil dihapus" };
  };
  // ========================= ADMIN - FEATUR 2 (END) =========================

  // ========================= USER - FEATUR 1 (START) =========================

  getPublicJobs = async (query: GetPublicJobsDTO) => {
    const {
      page,
      take,
      sortBy,
      sortOrder,
      search,
      category,
      city,
      tag,
      startDate,
      endDate,
    } = query;

    const whereClause: Prisma.JobWhereInput = {
      status: "PUBLISHED",
      deadline: { gte: new Date() },
    };

    if (search) {
      whereClause.title = { contains: search, mode: "insensitive" };
    }
    if (category) {
      whereClause.category = { contains: category, mode: "insensitive" };
    }
    if (city) {
      whereClause.city = { contains: city, mode: "insensitive" };
    }
    if (tag) {
      whereClause.tags = { has: tag };
    }

    if (startDate || endDate) {
      whereClause.createdAt = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    const allowedSortBy = new Set(["createdAt", "deadline"]);
    const effectiveSortBy = allowedSortBy.has(sortBy) ? sortBy : "createdAt";
    const effectiveSortOrder = sortOrder === "asc" ? "asc" : "desc";

    const jobs = await this.prisma.job.findMany({
      where: whereClause,
      take,
      skip: (page - 1) * take,
      orderBy: { [effectiveSortBy]: effectiveSortOrder },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            phone: true,
            address: true,
            latitude: true,
            longitude: true,
            description: true,
          },
        },
        _count: { select: { applications: true } },
      },
    });

    const total = await this.prisma.job.count({ where: whereClause });

    return {
      data: jobs,
      meta: { page, take, total },
    };
  };

  getPublicJobById = async (id: number) => {
    const job = await this.prisma.job.findFirst({
      where: { id, status: "PUBLISHED", deadline: { gte: new Date() } },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            phone: true,
            address: true,
            latitude: true,
            longitude: true,
            description: true,
          },
        },
        _count: { select: { applications: true } },
      },
    });

    if (!job) throw new ApiError("Lowongan tidak ditemukan atau sudah ditutup", 404);

    return job;
  };

  // ========================= USER - FEATUR 1 (END) =========================
}
