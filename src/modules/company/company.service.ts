import { Role } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";

export class CompanyService {
  async create(
    adminId: number,
    body: {
      companyName: string;
      phone?: string;
      description?: string;
      address?: string;
      latitude?: number | string;
      longitude?: number | string;
    }
  ) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true },
    });

    if (!admin) {
      throw new ApiError("Admin user not found", 404);
    }

    if (admin.role !== Role.ADMIN) {
      throw new ApiError("Only ADMIN can create company", 403);
    }

    const existingCompany = await prisma.company.findUnique({
      where: { adminId },
      select: { id: true },
    });

    if (existingCompany) {
      throw new ApiError("Company already exists for this admin", 400);
    }

    const company = await prisma.company.create({
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
  }

  async getByAdminId(adminId: number) {
    const company = await prisma.company.findUnique({
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
  }

  async getById(companyId: number) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
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
  }

  async updateByAdminId(
    adminId: number,
    body: {
      companyName?: string;
      phone?: string | null;
      description?: string | null;
      address?: string | null;
      latitude?: number | string | null;
      longitude?: number | string | null;
    }
  ) {
    const existingCompany = await prisma.company.findUnique({
      where: { adminId },
      select: { id: true },
    });

    if (!existingCompany) {
      throw new ApiError("Company not found", 404);
    }

    const company = await prisma.company.update({
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
  }
}
