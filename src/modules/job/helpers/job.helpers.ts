import type { PrismaClient } from "../../../generated/prisma/client.js";
import { JobStatus } from "../../../generated/prisma/enums.js";
import { ApiError } from "../../../utils/api-error.js";
import type { ListMyCompanyJobsQuery, ListPublishedJobsQuery } from "./job.types.js";

export function normalizeJobStatus(status?: JobStatus | string) {
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

export function parseDeadline(deadline: Date | string) {
  const date = deadline instanceof Date ? deadline : new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError("Invalid deadline date", 400);
  }
  return date;
}

export function normalizePagination(query?: {
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

  const sortOrder = (query?.sortOrder ?? "").toLowerCase() === "asc" ? "asc" : "desc";

  const skip = (page - 1) * take;
  const orderBy = { [sortBy]: sortOrder } as any;

  return { take, page, skip, orderBy };
}

export async function getCompanyIdByAdminIdOrThrow(
  prisma: PrismaClient,
  adminId: number,
) {
  const company = await prisma.company.findUnique({
    where: { adminId },
    select: { id: true },
  });

  if (!company) throw new ApiError("Company not found for this admin", 404);
  return company.id;
}

export async function assertJobOwnedByCompanyOrThrow(
  prisma: PrismaClient,
  jobId: number,
  companyId: number,
) {
  const existingJob = await prisma.job.findFirst({
    where: { id: jobId, companyId },
    select: { id: true },
  });
  if (!existingJob) throw new ApiError("Job not found", 404);
}

export function buildPublishedWhere(query?: ListPublishedJobsQuery) {
  const where: any = { status: JobStatus.PUBLISHED };

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

  return where;
}

export function buildCompanyJobsWhere(companyId: number, query?: ListMyCompanyJobsQuery) {
  const status = query?.status ? normalizeJobStatus(query.status) : undefined;
  return {
    companyId,
    ...(status ? { status } : {}),
  };
}

export function buildPaginatedResponse<T>(
  message: string,
  items: T[],
  total: number,
  page: number,
  take: number,
) {
  return {
    message,
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

