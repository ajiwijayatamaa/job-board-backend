import { NextFunction, Request, Response } from "express";
import { CompanyService } from "./company.service.js";
import { ApiError } from "../../utils/api-error.js";

export class CompanyController {
  private service: CompanyService;

  constructor() {
    this.service = new CompanyService();
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = res.locals.existingUser?.id;
      if (!adminId) return next(new ApiError("Unauthorized", 401));

      const { companyName, phone, description, address, latitude, longitude } =
        req.body;

      if (!companyName) {
        return next(new ApiError("companyName is required", 400));
      }

      const result = await this.service.create(adminId, {
        companyName,
        phone,
        description,
        address,
        latitude,
        longitude,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  getMyCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = res.locals.existingUser?.id;
      if (!adminId) return next(new ApiError("Unauthorized", 401));

      const result = await this.service.getByAdminId(adminId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const companyId = parseInt(rawId);

      if (Number.isNaN(companyId)) {
        return next(new ApiError("Invalid company id", 400));
      }

      const result = await this.service.getById(companyId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateMyCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = res.locals.existingUser?.id;
      if (!adminId) return next(new ApiError("Unauthorized", 401));

      const { companyName, phone, description, address, latitude, longitude } =
        req.body;

      const result = await this.service.updateByAdminId(adminId, {
        companyName,
        phone,
        description,
        address,
        latitude,
        longitude,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
