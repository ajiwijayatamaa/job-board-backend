import { NextFunction, Request, Response } from "express";
import { JobService } from "./job.service.js";
import { ApiError } from "../../utils/api-error.js";

export class JobController {
  private service: JobService;

  constructor() {
    this.service = new JobService();
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = res.locals.existingUser?.id;
      if (!adminId) return next(new ApiError("Unauthorized", 401));

      const {
        title,
        description,
        banner,
        salary,
        city,
        deadline,
        status,
        preTest,
      } = req.body;

      if (!title || !description || !city || !deadline) {
        return next(
          new ApiError("title, description, city and deadline are required", 400)
        );
      }

      const result = await this.service.create(adminId, {
        title,
        description,
        banner,
        salary,
        city,
        deadline,
        status,
        preTest,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const jobId = parseInt(rawId);

      if (Number.isNaN(jobId)) {
        return next(new ApiError("Invalid job id", 400));
      }

      const result = await this.service.getById(jobId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = res.locals.existingUser?.id;
      if (!adminId) return next(new ApiError("Unauthorized", 401));

      const rawId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const jobId = parseInt(rawId);
      if (Number.isNaN(jobId)) {
        return next(new ApiError("Invalid job id", 400));
      }

      const {
        title,
        description,
        banner,
        salary,
        city,
        deadline,
        status,
        preTest,
      } = req.body;

      const result = await this.service.update(adminId, jobId, {
        title,
        description,
        banner,
        salary,
        city,
        deadline,
        status,
        preTest,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = res.locals.existingUser?.id;
      if (!adminId) return next(new ApiError("Unauthorized", 401));

      const rawId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const jobId = parseInt(rawId);
      if (Number.isNaN(jobId)) {
        return next(new ApiError("Invalid job id", 400));
      }

      const result = await this.service.remove(adminId, jobId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  listPublished = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, city, take, page, sortBy, sortOrder } = req.query;

      const result = await this.service.listPublished({
        q: q?.toString(),
        city: city?.toString(),
        take: take ? parseInt(take.toString()) : undefined,
        page: page ? parseInt(page.toString()) : undefined,
        sortBy: sortBy?.toString(),
        sortOrder: sortOrder?.toString(),
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  listMyCompanyJobs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const adminId = res.locals.existingUser?.id;
      if (!adminId) return next(new ApiError("Unauthorized", 401));

      const { status, take, page, sortBy, sortOrder } = req.query;

      const result = await this.service.listByAdminCompany(adminId, {
        status: status?.toString(),
        take: take ? parseInt(take.toString()) : undefined,
        page: page ? parseInt(page.toString()) : undefined,
        sortBy: sortBy?.toString(),
        sortOrder: sortOrder?.toString(),
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
