import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import {
  GetApplicantsDTO,
  UpdateApplicantStatusDTO,
} from "./dto/applicant.dto.js";

export class ApplicantService {
  constructor(private prisma: PrismaClient) {}
  // ========================= ADMIN - FEATUR 2 (START) =========================
  getApplicants = async (
    jobId: number,
    query: GetApplicantsDTO,
    adminId: number,
  ) => {
    const {
      page,
      take,
      sortBy,
      sortOrder,
      search,
      minAge,
      maxAge,
      minExpectedSalary,
      maxExpectedSalary,
      education,
    } = query;

    // pastikan job milik admin yang sedang login
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, company: { adminId } },
    });

    if (!job) throw new ApiError("Lowongan tidak ditemukan", 404);

    // bangun filter user secara dinamis
    const userFilter: Prisma.UserWhereInput = {};

    if (search) {
      userFilter.fullName = { contains: search, mode: "insensitive" };
    }

    if (education) {
      userFilter.education = { contains: education, mode: "insensitive" };
    }

    // konversi filter usia ke rentang tanggal lahir
    if (minAge !== undefined || maxAge !== undefined) {
      const now = new Date();
      const dateOfBirthFilter: Prisma.DateTimeNullableFilter = {};

      if (maxAge !== undefined) {
        // lahir setelah (sekarang - maxAge tahun) → usia <= maxAge
        dateOfBirthFilter.gte = new Date(
          now.getFullYear() - maxAge,
          now.getMonth(),
          now.getDate(),
        );
      }

      if (minAge !== undefined) {
        // lahir sebelum (sekarang - minAge tahun) → usia >= minAge
        dateOfBirthFilter.lte = new Date(
          now.getFullYear() - minAge,
          now.getMonth(),
          now.getDate(),
        );
      }

      userFilter.dateOfBirth = dateOfBirthFilter;
    }

    const whereClause: Prisma.ApplicationWhereInput = { jobId };

    if (Object.keys(userFilter).length > 0) {
      whereClause.user = userFilter;
    }

    // filter ekspektasi gaji
    if (minExpectedSalary !== undefined || maxExpectedSalary !== undefined) {
      const salaryFilter: Prisma.DecimalNullableFilter = {};
      if (minExpectedSalary !== undefined) salaryFilter.gte = minExpectedSalary;
      if (maxExpectedSalary !== undefined) salaryFilter.lte = maxExpectedSalary;
      whereClause.expectedSalary = salaryFilter;
    }

    const applications = await this.prisma.application.findMany({
      where: whereClause,
      take,
      skip: (page - 1) * take,
      // default: paling awal apply tampil duluan sesuai requirement
      orderBy: sortBy ? { [sortBy]: sortOrder } : { appliedAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePhoto: true, // thumbnail foto
            dateOfBirth: true,
            gender: true,
            education: true,
            city: true,
          },
        },
        cv: {
          select: {
            id: true,
            cvName: true,
            fileUrl: true, // untuk preview
            isPrimary: true,
          },
        },
        testResult: true,
      },
    });

    const total = await this.prisma.application.count({ where: whereClause });

    return {
      data: applications,
      meta: { page, take, total },
    };
  };

  getApplicantById = async (applicationId: number, adminId: number) => {
    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { company: { adminId } },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePhoto: true,
            dateOfBirth: true,
            gender: true,
            education: true,
            address: true,
            city: true,
          },
        },
        cv: true,
        job: {
          select: {
            id: true,
            title: true,
            category: true,
            city: true,
          },
        },
        testResult: true,
        interview: true,
      },
    });

    if (!application) throw new ApiError("Data pelamar tidak ditemukan", 404);

    return application;
  };

  updateApplicantStatus = async (
    applicationId: number,
    body: UpdateApplicantStatusDTO,
    adminId: number,
  ) => {
    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { company: { adminId } },
      },
    });

    if (!application) throw new ApiError("Data pelamar tidak ditemukan", 404);

    // validasi urutan transisi status
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ["PROCESSED"],
      PROCESSED: ["INTERVIEW", "REJECTED"],
      INTERVIEW: ["ACCEPTED", "REJECTED"],
      ACCEPTED: [],
      REJECTED: [],
    };

    const currentStatus = application.status;
    const allowed = allowedTransitions[currentStatus] ?? [];

    if (!allowed.includes(body.status)) {
      throw new ApiError(
        `Tidak dapat mengubah status dari ${currentStatus} ke ${body.status}`,
        400,
      );
    }

    // rejection reason wajib diisi jika status REJECTED
    if (body.status === "REJECTED" && !body.rejectionReason) {
      throw new ApiError("Alasan penolakan wajib diisi", 400);
    }

    const updatedApplication = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: body.status,
        // bersihkan rejection reason jika status bukan REJECTED
        rejectionReason:
          body.status === "REJECTED" ? body.rejectionReason : null,
      },
    });

    const statusMessage: Record<string, string> = {
      PROCESSED: "diproses",
      INTERVIEW: "dijadwalkan untuk interview",
      ACCEPTED: "diterima",
      REJECTED: "ditolak",
    };

    return {
      message: `Pelamar berhasil ${statusMessage[body.status]}`,
      data: updatedApplication,
    };
  };
  // ========================= ADMIN - FEATUR 2 (END) =========================

  // ========================= USER - FEATUR 1 (START) =========================

  // ========================= USER - FEATUR 2 (END) =========================
}
