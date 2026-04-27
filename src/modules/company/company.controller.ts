import { NextFunction, Request, Response } from "express";
import { CompanyService } from "./company.service.js";
import { ApiError } from "../../utils/api-error.js";

export class CompanyController {
  constructor(private service: CompanyService) {}

  getPublicCompanies = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await this.service.getPublicCompanies();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getPublicCompanyById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const companyId = Number(req.params.id);
      const result = await this.service.getById(companyId); // Reusing existing service method
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

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
      const companyId = Number(req.params.id);
      if (isNaN(companyId)) {
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
