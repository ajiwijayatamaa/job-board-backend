import { PrismaClient } from "../../generated/prisma/client.js";
import { Role } from "../../generated/prisma/enums.js";
import { ApiError } from "../../utils/api-error.js";
import { startOfTodayUtc } from "../../utils/date.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";

export class CompanyService {
  constructor(
    private prisma: PrismaClient,
    private cloudinaryService: CloudinaryService,
  ) {}

  getPublicCompanies = async () => {
    const todayStartUtc = startOfTodayUtc();
    const companies = await this.prisma.company.findMany({
      where: {
        jobs: {
          some: {
            status: "PUBLISHED",
            deadline: { gte: todayStartUtc }, // Hanya lowongan yang masih aktif
          },
        },
      },
      include: {
        _count: {
          select: {
            jobs: {
              where: { status: "PUBLISHED", deadline: { gte: todayStartUtc } },
            },
          },
        },
      },
      orderBy: { jobs: { _count: "desc" } }, // Urutkan berdasarkan jumlah lowongan yang dipublikasikan
    });
    return { data: companies };
  };

  create = async (
    adminId: number,
    body: {
      companyName: string;
      phone?: string;
      description?: string;
      address?: string;
      latitude?: number | string;
      longitude?: number | string;
    }
  ) => {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true },
    });

    if (!admin) {
      throw new ApiError("Admin user not found", 404);
    }

    if (admin.role !== Role.ADMIN) {
      throw new ApiError("Only ADMIN can create company", 403);
    }

    const existingCompany = await this.prisma.company.findUnique({
      where: { adminId },
      select: { id: true },
    });

    if (existingCompany) {
      throw new ApiError("Company already exists for this admin", 400);
    }

    const company = await this.prisma.company.create({
      data: {
        adminId,
        companyName: body.companyName,
        phone: body.phone,
        description: body.description,
        address: body.address,
        latitude: body.latitude as any,
        longitude: body.longitude as any,
      },
    });

    return {
      message: "Create company success",
      data: company,
    };
  };

  getByAdminId = async (adminId: number) => {
    const company = await this.prisma.company.findUnique({
      where: { adminId },
      include: {
        admin: { select: { id: true, email: true, fullName: true, role: true } },
      },
    });

    if (!company) {
      throw new ApiError("Company not found", 404);
    }

    return {
      message: "Get company success",
      data: company,
    };
  };

  getById = async (companyId: number) => {
    const todayStartUtc = startOfTodayUtc();
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        admin: { select: { id: true, email: true, fullName: true, role: true } },
        _count: {
          select: {
            jobs: {
              where: { status: "PUBLISHED", deadline: { gte: todayStartUtc } },
            },
          },
        },
        // Assuming these fields exist in your Prisma schema for Company
        // If not, you'll need to add them to your schema.prisma
        // e.g., industry: true, size: true, founded: true, website: true, benefits: true,
      },
    });

    if (!company) {
      throw new ApiError("Company not found", 404);
    }

    return {
      message: "Get company success",
      data: company,
    };
  };

  updateByAdminId = async (
    adminId: number,
    body: {
      companyName?: string;
      phone?: string | null;
      description?: string | null;
      address?: string | null;
      latitude?: number | string | null;
      longitude?: number | string | null;
    }
  ) => {
    const existingCompany = await this.prisma.company.findUnique({
      where: { adminId },
      select: { id: true },
    });

    if (!existingCompany) {
      throw new ApiError("Company not found", 404);
    }

    const company = await this.prisma.company.update({
      where: { adminId },
      data: {
        companyName: body.companyName,
        phone: body.phone ?? undefined,
        description: body.description ?? undefined,
        address: body.address ?? undefined,
        latitude: (body.latitude ?? undefined) as any,
        longitude: (body.longitude ?? undefined) as any,
      },
    });

    return {
      message: "Update company success",
      data: company,
    };
  };
}
