import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { GetPublicJobsDTO } from "./dto/job.dto.js";

export class JobPublicService {
  constructor(private prisma: PrismaClient) {}

  getPublicJobs = async (query: GetPublicJobsDTO) => {
    const {
      page,
      take,
      sortBy,
      sortOrder,
      search,
      category,
      city,
      latitude,
      longitude,
      minSalary,
      maxSalary,
      startDate,
      endDate,
    } = query;

    const whereClause: Prisma.JobWhereInput = {
      status: "PUBLISHED",
      deadline: { gte: new Date() },
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { company: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (category) whereClause.category = { contains: category, mode: "insensitive" };
    if (city) whereClause.city = { contains: city, mode: "insensitive" };

    if (minSalary !== undefined || maxSalary !== undefined) {
      whereClause.salary = {
        ...(minSalary !== undefined && { gte: minSalary }),
        ...(maxSalary !== undefined && { lte: maxSalary }),
      };
    }

    if (startDate || endDate) {
      whereClause.createdAt = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    // CASE 1: Nearest Location Search (Haversine + Bounding Box Optimization)

    if (latitude !== undefined && longitude !== undefined) {
      const radius = 50; // Radius pencarian dalam KM
      const latDelta = radius / 111;
      const lngDelta = radius / (111 * Math.cos((latitude * Math.PI) / 180));

      const bounds = {
        minLat: latitude - latDelta,
        maxLat: latitude + latDelta,
        minLng: longitude - lngDelta,
        maxLng: longitude + lngDelta,
      };

      const offset = (page - 1) * take;

      // Konstruksi filter tambahan untuk SQL mentah (Aman dari SQLi)
      const searchSql = search
        ? Prisma.sql`AND (j.title ILIKE ${"%" + search + "%"} OR c.company_name ILIKE ${"%" + search + "%"})`
        : Prisma.empty;
      const categorySql = category
        ? Prisma.sql`AND j.category ILIKE ${"%" + category + "%"}`
        : Prisma.empty;
      const citySql = city
        ? Prisma.sql`AND j.city ILIKE ${"%" + city + "%"}`
        : Prisma.empty;
      const minSalarySql = minSalary !== undefined
        ? Prisma.sql`AND j.salary >= ${minSalary}`
        : Prisma.empty;
      const maxSalarySql = maxSalary !== undefined
        ? Prisma.sql`AND j.salary <= ${maxSalary}`
        : Prisma.empty;
      const startDateSql = startDate
        ? Prisma.sql`AND j.created_at >= ${startDate}`
        : Prisma.empty;
      const endDateSql = endDate
        ? Prisma.sql`AND j.created_at <= ${endDate}`
        : Prisma.empty;

      // Query utama untuk mendapatkan data (Distance dihitung hanya pada baris di dalam Box)
      const jobs = await this.prisma.$queryRaw<any[]>`
        SELECT 
          j.*,
          json_build_object(
            'companyName', c.company_name, 
            'photoProfile', c.photo_profile, 
            'city', c.city
          ) as "company",
          (6371 * acos(
            cos(radians(${latitude})) * cos(radians(c.latitude)) * 
            cos(radians(c.longitude) - radians(${longitude})) + 
            sin(radians(${latitude})) * sin(radians(c.latitude))
          )) AS distance
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        WHERE j.status = 'PUBLISHED' 
          AND j.deadline >= NOW()
          AND c.latitude BETWEEN ${bounds.minLat} AND ${bounds.maxLat}
          AND c.longitude BETWEEN ${bounds.minLng} AND ${bounds.maxLng}
          ${searchSql}
          ${categorySql}
          ${citySql}
          ${minSalarySql}
          ${maxSalarySql}
          ${startDateSql}
          ${endDateSql}
        GROUP BY j.id, c.id
        HAVING (6371 * acos(
            cos(radians(${latitude})) * cos(radians(c.latitude)) * 
            cos(radians(c.longitude) - radians(${longitude})) + 
            sin(radians(${latitude})) * sin(radians(c.latitude))
          )) <= ${radius}
        ORDER BY distance ASC
        LIMIT ${take} OFFSET ${offset}
      `;

      // Query untuk menghitung total data guna metadata pagination
      const totalCount = await this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as count FROM (
          SELECT j.id FROM jobs j JOIN companies c ON j.company_id = c.id
          WHERE j.status = 'PUBLISHED' AND j.deadline >= NOW()
            AND c.latitude BETWEEN ${bounds.minLat} AND ${bounds.maxLat}
            AND c.longitude BETWEEN ${bounds.minLng} AND ${bounds.maxLng}
            ${searchSql} 
            ${categorySql} 
            ${citySql}
            ${minSalarySql} ${maxSalarySql}
            ${startDateSql} ${endDateSql}
          GROUP BY j.id, c.id
          HAVING (6371 * acos(cos(radians(${latitude})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(latitude)))) <= ${radius}
        ) AS filtered_jobs
      `;

      return { data: jobs, meta: { page, take, total: totalCount[0]?.count || 0 } };
    }

    // CASE 2: Standard Search (Jika koordinat tidak disediakan)

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where: whereClause,
        take,
        skip: (page - 1) * take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          company: { select: { companyName: true, photoProfile: true, city: true } },
        },
      }),
      this.prisma.job.count({ where: whereClause }),
    ]);

    return { data: jobs, meta: { page, take, total } };
  };

  getPublicJobById = async (id: number) => {
    const job = await this.prisma.job.findFirst({
      where: { id, status: "PUBLISHED" },
      include: {
        company: {
          select: {
            companyName: true,
            photoProfile: true,
            description: true,
            address: true,
            city: true,
          },
        },
      },
    });

    if (!job) throw new ApiError("Lowongan tidak ditemukan atau sudah ditutup", 404);
    return job;
  };

  getRecommendedJobs = async (limit: number = 4) => {
    const jobs = await this.prisma.job.findMany({
      where: {
        status: "PUBLISHED",
        deadline: { gte: new Date() },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        company: {
          select: {
            companyName: true,
            photoProfile: true,
          },
        },
      },
    });
    return { data: jobs };
  };
}