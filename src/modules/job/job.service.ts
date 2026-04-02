import { JobStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";

export class JobService {
  private normalizeJobStatus(status?: JobStatus | string) {
    if (!status) return JobStatus.DRAFT;
    if (typeof status !== "string") return status;

    const normalized = status.toUpperCase();
    if (
      normalized === JobStatus.DRAFT ||
      normalized === JobStatus.PUBLISHED ||
      normalized === JobStatus.CLOSED
    ) {
      return normalized as JobStatus;
    }

    throw new ApiError("Invalid status. Use DRAFT, PUBLISHED, or CLOSED", 400);
  }

  private parseDeadline(deadline: Date | string) {
    const date = deadline instanceof Date ? deadline : new Date(deadline);
    if (Number.isNaN(date.getTime())) {
      throw new ApiError("Invalid deadline date", 400);
    }
    return date;
  }

  private normalizePagination(query?: {
    take?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const take = Math.max(1, Math.min(100, query?.take ?? 5));
    const page = Math.max(1, query?.page ?? 1);

    const allowedSortBy = new Set(["createdAt", "updatedAt", "deadline"]);
    const sortBy = allowedSortBy.has(query?.sortBy ?? "")
      ? (query!.sortBy as string)
      : "createdAt";

    const sortOrder =
      (query?.sortOrder ?? "").toLowerCase() === "asc" ? "asc" : "desc";

    const skip = (page - 1) * take;
    const orderBy = { [sortBy]: sortOrder } as any;

    return { take, page, skip, orderBy };
  }

  async create(
    adminId: number,
    body: {
      title: string;
      description: string;
      banner?: string;
      salary?: number | string;
      city: string;
      deadline: Date | string;
      status?: JobStatus | string;
      preTest?: boolean;
    }
  ) {
    const company = await prisma.company.findUnique({
      where: { adminId },
      select: { id: true },
    });

    if (!company) {
      throw new ApiError("Company not found for this admin", 404);
    }

    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        title: body.title,
        description: body.description,
        banner: body.banner,
        salary: body.salary as any,
        city: body.city,
        deadline: this.parseDeadline(body.deadline),
        status: this.normalizeJobStatus(body.status),
        preTest: body.preTest ?? false,
      },
      include: { company: true },
    });

    return {
      message: "Create job success",
      data: job,
    };
  }

  async getById(jobId: number) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        _count: { select: { applications: true } },
      },
    });

    if (!job) {
      throw new ApiError("Job not found", 404);
    }

    return {
      message: "Get job success",
      data: job,
    };
  }

  async update(
    adminId: number,
    jobId: number,
    body: {
      title?: string;
      description?: string;
      banner?: string | null;
      salary?: number | string | null;
      city?: string;
      deadline?: Date | string;
      status?: JobStatus | string;
      preTest?: boolean;
    }
  ) {
    const company = await prisma.company.findUnique({
      where: { adminId },
      select: { id: true },
    });

    if (!company) {
      throw new ApiError("Company not found for this admin", 404);
    }

    const existingJob = await prisma.job.findFirst({
      where: { id: jobId, companyId: company.id },
      select: { id: true },
    });

    if (!existingJob) {
      throw new ApiError("Job not found", 404);
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        title: body.title,
        description: body.description,
        banner: body.banner ?? undefined,
        salary: (body.salary ?? undefined) as any,
        city: body.city,
        deadline: body.deadline ? this.parseDeadline(body.deadline) : undefined,
        status: body.status ? this.normalizeJobStatus(body.status) : undefined,
        preTest: body.preTest,
      },
      include: { company: true },
    });

    return {
      message: "Update job success",
      data: job,
    };
  }

  async remove(adminId: number, jobId: number) {
    const company = await prisma.company.findUnique({
      where: { adminId },
      select: { id: true },
    });

    if (!company) {
      throw new ApiError("Company not found for this admin", 404);
    }

    const existingJob = await prisma.job.findFirst({
      where: { id: jobId, companyId: company.id },
      select: { id: true },
    });

    if (!existingJob) {
      throw new ApiError("Job not found", 404);
    }

    await prisma.job.delete({ where: { id: jobId } });

    return { message: "Delete job success" };
  }

  async listPublished(query?: {
    q?: string;
    city?: string;
    take?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const { take, page, skip, orderBy } = this.normalizePagination(query);

    const where: any = {
      status: JobStatus.PUBLISHED,
    };

    if (query?.city) {
      where.city = { equals: query.city, mode: "insensitive" };
    }

    if (query?.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
        { company: { companyName: { contains: query.q, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: { company: true },
        orderBy,
        take,
        skip,
      }),
      prisma.job.count({ where }),
    ]);

    return {
      message: "Get jobs success",
      data: {
        items,
        meta: {
          total,
          page,
          take,
          pageCount: Math.ceil(total / take),
        },
      },
    };
  }

  async listByAdminCompany(
    adminId: number,
    query?: {
      status?: JobStatus | string;
      take?: number;
      page?: number;
      sortBy?: string;
      sortOrder?: string;
    }
  ) {
    const company = await prisma.company.findUnique({
      where: { adminId },
      select: { id: true },
    });

    if (!company) {
      throw new ApiError("Company not found for this admin", 404);
    }

    const { take, page, skip, orderBy } = this.normalizePagination(query);

    const status = query?.status ? this.normalizeJobStatus(query.status) : undefined;
    const where = {
      companyId: company.id,
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: { company: true },
        orderBy,
        take,
        skip,
      }),
      prisma.job.count({ where }),
    ]);

    return {
      message: "Get jobs success",
      data: {
        items,
        meta: {
          total,
          page,
          take,
          pageCount: Math.ceil(total / take),
        },
      },
    };
  }
}
