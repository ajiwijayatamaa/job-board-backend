import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { ApplyJobDTO, GetMyApplicationsDTO } from "./dto/applicant.dto.js";

export class ApplicantUserService {
  constructor(private prisma: PrismaClient) {}

  applyJob = async (userId: number, body: ApplyJobDTO) => {
    const { jobId, cvId, expectedSalary, coverLetter } = body;

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.status !== "PUBLISHED") {
      throw new ApiError("Lowongan tidak ditemukan atau sudah ditutup", 404);
    }

    if (new Date() > new Date(job.deadline)) {
      throw new ApiError("Masa berlaku lowongan ini telah berakhir", 400);
    }

    const existingApplication = await this.prisma.application.findFirst({
      where: { userId, jobId },
    });

    if (existingApplication) {
      throw new ApiError("Anda sudah melamar ke lowongan ini sebelumnya", 400);
    }

    const cv = await this.prisma.cV.findFirst({
      where: { id: cvId, userId },
    });

    if (!cv) throw new ApiError("CV tidak valid atau tidak ditemukan", 404);

    const application = await this.prisma.application.create({
      data: {
        userId,
        jobId,
        cvId,
        expectedSalary,
        coverLetter,
        status: "PENDING",
      },
    });

    return {
      message: "Lamaran Anda berhasil dikirim",
      data: application,
    };
  };

  getMyApplications = async (userId: number, query: GetMyApplicationsDTO) => {
    const { page, take, sortBy, sortOrder } = query;
    const whereClause: Prisma.ApplicationWhereInput = { userId };

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where: whereClause,
        take,
        skip: (page - 1) * take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          job: {
            include: { company: { select: { companyName: true, photoProfile: true } } },
          },
        },
      }),
      this.prisma.application.count({ where: whereClause }),
    ]);

    return { data: applications, meta: { page, take, total } };
  };

  getMyApplicationById = async (id: number, userId: number) => {
    const application = await this.prisma.application.findFirst({
      where: { id, userId },
      include: {
        job: { include: { company: true } },
        cv: true,
        interview: true,
        testResult: true,
      },
    });

    if (!application) throw new ApiError("Data lamaran tidak ditemukan", 404);

    return application;
  };
}