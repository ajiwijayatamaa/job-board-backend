import { ApplicationStatus, JobStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";

export class ApplicationService {
  private normalizeStatus(status: ApplicationStatus | string) {
    if (typeof status !== "string") return status;

    const normalized = status.toUpperCase();
    if (
      normalized === ApplicationStatus.PENDING ||
      normalized === ApplicationStatus.PROCESSED ||
      normalized === ApplicationStatus.INTERVIEW ||
      normalized === ApplicationStatus.ACCEPTED ||
      normalized === ApplicationStatus.REJECTED
    ) {
      return normalized as ApplicationStatus;
    }

    throw new ApiError(
      "Invalid status. Use PENDING, PROCESSED, INTERVIEW, ACCEPTED, or REJECTED",
      400
    );
  }

  private normalizePagination(query?: { take?: number; page?: number }) {
    const take = Math.max(1, Math.min(100, query?.take ?? 10));
    const page = Math.max(1, query?.page ?? 1);
    const skip = (page - 1) * take;
    return { take, page, skip };
  }

  async apply(
    userId: number,
    body: { jobId: number; cvId: number; expectedSalary?: number | string }
  ) {
    const job = await prisma.job.findUnique({
      where: { id: body.jobId },
      select: {
        id: true,
        status: true,
        deadline: true,
      },
    });

    if (!job) {
      throw new ApiError("Job not found", 404);
    }

    if (job.status !== JobStatus.PUBLISHED) {
      throw new ApiError("Job is not published", 400);
    }

    if (new Date(job.deadline).getTime() < Date.now()) {
      throw new ApiError("Job application deadline has passed", 400);
    }

    const cv = await prisma.cV.findFirst({
      where: { id: body.cvId, userId },
      select: { id: true },
    });

    if (!cv) {
      throw new ApiError("CV not found", 404);
    }

    const existing = await prisma.application.findFirst({
      where: { userId, jobId: body.jobId },
      select: { id: true },
    });

    if (existing) {
      throw new ApiError("You have already applied to this job", 400);
    }

    const application = await prisma.application.create({
      data: {
        userId,
        jobId: body.jobId,
        cvId: body.cvId,
        expectedSalary: body.expectedSalary as any,
        status: ApplicationStatus.PENDING,
      },
      include: {
        job: { include: { company: true } },
        cv: true,
      },
    });

    return {
      message: "Apply job success",
      data: application,
    };
  }

  async getMyApplications(
    userId: number,
    query?: { take?: number; page?: number; status?: ApplicationStatus | string }
  ) {
    const { take, page, skip } = this.normalizePagination(query);
    const status = query?.status ? this.normalizeStatus(query.status) : undefined;

    const where = {
      userId,
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          job: { include: { company: true } },
          cv: true,
        },
        orderBy: { appliedAt: "desc" },
        take,
        skip,
      }),
      prisma.application.count({ where }),
    ]);

    return {
      message: "Get applications success",
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

  async getById(applicationId: number) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        job: { include: { company: true } },
        cv: true,
        interview: true,
        testResult: true,
      },
    });

    if (!application) {
      throw new ApiError("Application not found", 404);
    }

    return {
      message: "Get application success",
      data: application,
    };
  }

  async getApplicantsByJob(
    adminId: number,
    jobId: number,
    query?: { take?: number; page?: number; status?: ApplicationStatus | string }
  ) {
    const company = await prisma.company.findUnique({
      where: { adminId },
      select: { id: true },
    });

    if (!company) {
      throw new ApiError("Company not found for this admin", 404);
    }

    const job = await prisma.job.findFirst({
      where: { id: jobId, companyId: company.id },
      select: { id: true },
    });

    if (!job) {
      throw new ApiError("Job not found", 404);
    }

    const { take, page, skip } = this.normalizePagination(query);
    const status = query?.status ? this.normalizeStatus(query.status) : undefined;

    const where = {
      jobId,
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, fullName: true } },
          cv: true,
          interview: true,
          testResult: true,
        },
        orderBy: { appliedAt: "desc" },
        take,
        skip,
      }),
      prisma.application.count({ where }),
    ]);

    return {
      message: "Get applications success",
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

  async updateStatus(
    adminId: number,
    applicationId: number,
    body: { status: ApplicationStatus | string; rejectionReason?: string }
  ) {
    const existing = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        jobId: true,
        status: true,
        job: { select: { companyId: true } },
      },
    });

    if (!existing) {
      throw new ApiError("Application not found", 404);
    }

    const company = await prisma.company.findUnique({
      where: { adminId },
      select: { id: true },
    });

    if (!company) {
      throw new ApiError("Company not found for this admin", 404);
    }

    if (existing.job.companyId !== company.id) {
      throw new ApiError("You don't have access to this resource", 403);
    }

    const status = this.normalizeStatus(body.status);

    if (status === ApplicationStatus.REJECTED && !body.rejectionReason) {
      throw new ApiError("rejectionReason is required when status is REJECTED", 400);
    }

    const application = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        rejectionReason:
          status === ApplicationStatus.REJECTED
            ? body.rejectionReason
            : null,
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        job: { include: { company: true } },
        cv: true,
      },
    });

    return {
      message: "Update application status success",
      data: application,
    };
  }
}
