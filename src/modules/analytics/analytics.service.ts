import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { GetAnalyticsDTO } from "./dto/analytics.dto.js";

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  // ========================= OVERVIEW =========================
  getOverview = async (adminId: number) => {
    const company = await this.prisma.company.findUnique({
      where: { adminId },
    });

    if (!company) throw new ApiError("Company tidak ditemukan", 404);

    const applicationWhere: Prisma.ApplicationWhereInput = {
      job: { companyId: company.id },
    };

    const [
      totalJobs,
      totalPublishedJobs,
      totalApplications,
      applicationsByStatus,
    ] = await Promise.all([
      this.prisma.job.count({ where: { companyId: company.id } }),
      this.prisma.job.count({
        where: { companyId: company.id, status: "PUBLISHED" },
      }),
      this.prisma.application.count({ where: applicationWhere }),
      this.prisma.application.groupBy({
        by: ["status"],
        where: applicationWhere,
        _count: { status: true },
      }),
    ]);

    return {
      totalJobs,
      totalPublishedJobs,
      totalApplications,
      applicationsByStatus: applicationsByStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
    };
  };

  // ========================= USER DEMOGRAPHICS =========================
  getDemographics = async (adminId: number, query: GetAnalyticsDTO) => {
    const company = await this.prisma.company.findUnique({
      where: { adminId },
    });

    if (!company) throw new ApiError("Company tidak ditemukan", 404);

    const applicationWhere: Prisma.ApplicationWhereInput = {
      job: { companyId: company.id },
    };

    if (query.startDate || query.endDate) {
      applicationWhere.appliedAt = {
        ...(query.startDate && { gte: query.startDate }),
        ...(query.endDate && { lte: query.endDate }),
      };
    }

    const applications = await this.prisma.application.findMany({
      where: applicationWhere,
      select: {
        user: {
          select: {
            gender: true,
            dateOfBirth: true,
            city: true,
          },
        },
      },
    });

    const users = applications.map((a) => a.user);

    // Gender
    const gender: Record<string, number> = { MALE: 0, FEMALE: 0, unknown: 0 };
    users.forEach((u) => {
      if (u.gender === "MALE") gender.MALE++;
      else if (u.gender === "FEMALE") gender.FEMALE++;
      else gender.unknown++;
    });

    // Age groups
    const now = new Date();
    const ageGroups: Record<string, number> = {
      "< 18": 0,
      "18 - 24": 0,
      "25 - 34": 0,
      "35 - 44": 0,
      "45+": 0,
      unknown: 0,
    };
    users.forEach((u) => {
      if (!u.dateOfBirth) {
        ageGroups.unknown++;
        return;
      }
      const age = now.getFullYear() - new Date(u.dateOfBirth).getFullYear();
      if (age < 18) ageGroups["< 18"]++;
      else if (age <= 24) ageGroups["18 - 24"]++;
      else if (age <= 34) ageGroups["25 - 34"]++;
      else if (age <= 44) ageGroups["35 - 44"]++;
      else ageGroups["45+"]++;
    });

    // Location
    const locationMap: Record<string, number> = {};
    users.forEach((u) => {
      const city = u.city?.toLowerCase() || "unknown";
      locationMap[city] = (locationMap[city] || 0) + 1;
    });

    const locations = Object.entries(locationMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);

    return { gender, ageGroups, locations };
  };

  // ========================= SALARY TRENDS =========================
  getSalaryTrends = async (adminId: number, query: GetAnalyticsDTO) => {
    const company = await this.prisma.company.findUnique({
      where: { adminId },
    });

    if (!company) throw new ApiError("Company tidak ditemukan", 404);

    const applicationWhere: Prisma.ApplicationWhereInput = {
      job: { companyId: company.id },
      expectedSalary: { not: null },
    };

    if (query.startDate || query.endDate) {
      applicationWhere.appliedAt = {
        ...(query.startDate && { gte: query.startDate }),
        ...(query.endDate && { lte: query.endDate }),
      };
    }

    // Salary by job category
    const applications = await this.prisma.application.findMany({
      where: applicationWhere,
      select: {
        expectedSalary: true,
        job: { select: { category: true, city: true, title: true } },
      },
    });

    // Group by category
    const categoryMap: Record<
      string,
      { total: number; count: number; min: number; max: number }
    > = {};

    applications.forEach((a) => {
      const salary = Number(a.expectedSalary);
      const category = a.job.category;

      if (!categoryMap[category]) {
        categoryMap[category] = {
          total: 0,
          count: 0,
          min: salary,
          max: salary,
        };
      }

      categoryMap[category].total += salary;
      categoryMap[category].count++;
      if (salary < categoryMap[category].min)
        categoryMap[category].min = salary;
      if (salary > categoryMap[category].max)
        categoryMap[category].max = salary;
    });

    const byCategory = Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        avgSalary: Math.round(data.total / data.count),
        minSalary: data.min,
        maxSalary: data.max,
        totalApplicants: data.count,
      }))
      .sort((a, b) => b.avgSalary - a.avgSalary);

    // Group by city
    const cityMap: Record<
      string,
      { total: number; count: number; min: number; max: number }
    > = {};

    applications.forEach((a) => {
      const salary = Number(a.expectedSalary);
      const city = a.job.city;

      if (!cityMap[city]) {
        cityMap[city] = { total: 0, count: 0, min: salary, max: salary };
      }

      cityMap[city].total += salary;
      cityMap[city].count++;
      if (salary < cityMap[city].min) cityMap[city].min = salary;
      if (salary > cityMap[city].max) cityMap[city].max = salary;
    });

    const byCity = Object.entries(cityMap)
      .map(([city, data]) => ({
        city,
        avgSalary: Math.round(data.total / data.count),
        minSalary: data.min,
        maxSalary: data.max,
        totalApplicants: data.count,
      }))
      .sort((a, b) => b.avgSalary - a.avgSalary);

    return { byCategory, byCity };
  };

  // ========================= APPLICANT INTERESTS =========================
  getApplicantInterests = async (adminId: number, query: GetAnalyticsDTO) => {
    const company = await this.prisma.company.findUnique({
      where: { adminId },
    });

    if (!company) throw new ApiError("Company tidak ditemukan", 404);

    const applicationWhere: Prisma.ApplicationWhereInput = {
      job: { companyId: company.id },
    };

    if (query.startDate || query.endDate) {
      applicationWhere.appliedAt = {
        ...(query.startDate && { gte: query.startDate }),
        ...(query.endDate && { lte: query.endDate }),
      };
    }

    const applications = await this.prisma.application.findMany({
      where: applicationWhere,
      select: {
        job: { select: { category: true, title: true, id: true } },
      },
    });

    // Group by category
    const categoryMap: Record<string, number> = {};
    applications.forEach((a) => {
      const cat = a.job.category;
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const byCategory = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Group by job title (top jobs)
    const titleMap: Record<string, { count: number; jobId: number }> = {};
    applications.forEach((a) => {
      const title = a.job.title;
      if (!titleMap[title]) {
        titleMap[title] = { count: 0, jobId: a.job.id };
      }
      titleMap[title].count++;
    });

    const topJobs = Object.entries(titleMap)
      .map(([title, data]) => ({ title, jobId: data.jobId, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { byCategory, topJobs };
  };
}
