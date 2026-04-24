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

  getPublicJobs = async (query: GetPublicJobsDTO, userId?: number) => {
    let {
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
      latitude,
      longitude,
      radius = 50, // Default to 50km
    } = query;

    // Fallback: Jika koordinat tidak dikirim frontend, ambil dari profil user (jika login)
    if (latitude === undefined && longitude === undefined && userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        // Pastikan kolom latitude/longitude sudah ditambahkan di schema User Anda
        select: { latitude: true, longitude: true } as any,
      });

      if (user?.latitude && user?.longitude) {
        latitude = Number(user.latitude);
        longitude = Number(user.longitude);
      }
    }

    // Jika ada koordinat, gunakan Raw Query untuk Haversine distance
    if (latitude !== undefined && longitude !== undefined) {
      // --- BOUNDING BOX CALCULATION ---
      // Approx 1 degree latitude = 111km
      const deltaLat = radius / 111;
      // Approx 1 degree longitude = 111km * cos(latitude)
      const deltaLng = radius / (111 * Math.cos(latitude * (Math.PI / 180)));

      const minLat = latitude - deltaLat;
      const maxLat = latitude + deltaLat;
      const minLng = longitude - deltaLng;
      const maxLng = longitude + deltaLng;

      const pageNum = Math.max(Number(page) || 1, 1);
      const takeNum = Math.max(Number(take) || 10, 1);
      const offset = (pageNum - 1) * takeNum;

      // Bangun filter secara dinamis untuk Raw SQL
      const filters: Prisma.Sql[] = [
        Prisma.sql`j.status = 'PUBLISHED'`,
        Prisma.sql`j.deadline >= NOW()`,
      ];

      // Bounding Box filter (High performance using indexes)
      filters.push(Prisma.sql`CAST(c.latitude AS DOUBLE PRECISION) >= ${minLat}`);
      filters.push(Prisma.sql`CAST(c.latitude AS DOUBLE PRECISION) <= ${maxLat}`);
      filters.push(Prisma.sql`CAST(c.longitude AS DOUBLE PRECISION) >= ${minLng}`);
      filters.push(Prisma.sql`CAST(c.longitude AS DOUBLE PRECISION) <= ${maxLng}`);

      if (search) filters.push(Prisma.sql`j.title ILIKE ${`%${search}%`}`);
      if (category) filters.push(Prisma.sql`j.category ILIKE ${`%${category}%`}`);
      if (city) filters.push(Prisma.sql`j.city ILIKE ${`%${city}%`}`);
      if (tag) filters.push(Prisma.sql`${tag} = ANY(j.tags)`);
      if (startDate) filters.push(Prisma.sql`j.created_at >= ${startDate}`);
      if (endDate) filters.push(Prisma.sql`j.created_at <= ${endDate}`);

      const where = Prisma.join(filters, " AND ");

      // Query Raw dengan perhitungan Haversine (6371 untuk KM)
      const jobs = await this.prisma.$queryRaw<any[]>`
        SELECT 
          j.id, j.title, j.description, j.category, j.tags, j.banner, j.salary, j.city, j.deadline, j.status,
          j.company_id AS "companyId", 
          j.created_at AS "createdAt", 
          j.updated_at AS "updatedAt",
          json_build_object(
            'id', c.id,
            'companyName', c.company_name,
            'phone', c.phone,
            'address', c.address,
            'latitude', c.latitude,
            'longitude', c.longitude,
            'description', c.description
          ) AS company,
          (SELECT CAST(COUNT(*) AS INT) FROM applications a WHERE a.job_id = j.id) AS application_count,
          (6371 * acos(
            cos(radians(${latitude})) * cos(radians(CAST(c.latitude AS DOUBLE PRECISION))) *
            cos(radians(CAST(c.longitude AS DOUBLE PRECISION)) - radians(${longitude})) +
            sin(radians(${latitude})) * sin(radians(CAST(c.latitude AS DOUBLE PRECISION)))
          )) AS distance
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        WHERE ${where}
        ORDER BY distance ASC
        LIMIT ${takeNum} OFFSET ${offset}
      `;

      const countResult = await this.prisma.$queryRaw<any[]>`
        SELECT CAST(COUNT(*) AS INT) as count FROM jobs j
        JOIN companies c ON j.company_id = c.id
        WHERE ${where}
      `;
      const total = countResult[0]?.count || 0;

      const formattedJobs = jobs.map((j) => ({
        ...j,
        _count: { applications: j.application_count },
      }));

      return {
        data: formattedJobs,
        meta: { page: pageNum, take: takeNum, total },
      };
    }

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
