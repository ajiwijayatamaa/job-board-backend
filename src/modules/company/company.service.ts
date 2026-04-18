import { Role } from "../../generated/prisma/enums.js";
import { PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { CreateCompanyDTO, UpdateCompanyDTO } from "./dto/company.dto.js";

export class CompanyService {
  constructor(private prisma: PrismaClient) {}

  create = async (
    adminId: number,
    body: CreateCompanyDTO
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
    const company = await this.prisma.company.findUnique({
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
  };

  updateByAdminId = async (
    adminId: number,
    body: UpdateCompanyDTO
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
