import { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import { ApplicationService } from "./application.service.js";

export class ApplicationController {
  private service: ApplicationService;

  constructor() {
    this.service = new ApplicationService();
  }

  apply = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = res.locals.existingUser?.id;
      if (!userId) return next(new ApiError("Unauthorized", 401));

      const { jobId, cvId, expectedSalary } = req.body;

      if (jobId === undefined || cvId === undefined) {
        return next(new ApiError("jobId and cvId are required", 400));
      }

      const parsedJobId = typeof jobId === "string" ? parseInt(jobId) : jobId;
      const parsedCvId = typeof cvId === "string" ? parseInt(cvId) : cvId;

      if (Number.isNaN(parsedJobId) || Number.isNaN(parsedCvId)) {
        return next(new ApiError("jobId and cvId must be a number", 400));
      }

      const result = await this.service.apply(userId, {
        jobId: parsedJobId,
        cvId: parsedCvId,
        expectedSalary,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  getMyApplications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = res.locals.existingUser?.id;
      if (!userId) return next(new ApiError("Unauthorized", 401));

      const { take, page, status } = req.query;

      const result = await this.service.getMyApplications(userId, {
        take: take ? parseInt(take.toString()) : undefined,
        page: page ? parseInt(page.toString()) : undefined,
        status: status?.toString(),
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const applicationId = parseInt(rawId);

      if (Number.isNaN(applicationId)) {
        return next(new ApiError("Invalid application id", 400));
      }

      const result = await this.service.getById(applicationId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getApplicantsByJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = res.locals.existingUser?.id;
      if (!adminId) return next(new ApiError("Unauthorized", 401));

      const rawJobId = Array.isArray(req.params.jobId)
        ? req.params.jobId[0]
        : (req.params.jobId ?? req.params.id);
      const jobId = parseInt(rawJobId);

      if (Number.isNaN(jobId)) {
        return next(new ApiError("Invalid job id", 400));
      }

      const { take, page, status } = req.query;

      const result = await this.service.getApplicantsByJob(adminId, jobId, {
        take: take ? parseInt(take.toString()) : undefined,
        page: page ? parseInt(page.toString()) : undefined,
        status: status?.toString(),
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = res.locals.existingUser?.id;
      if (!adminId) return next(new ApiError("Unauthorized", 401));

      const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const applicationId = parseInt(rawId);

      if (Number.isNaN(applicationId)) {
        return next(new ApiError("Invalid application id", 400));
      }

      const { status, rejectionReason } = req.body;
      if (!status) {
        return next(new ApiError("status is required", 400));
      }

      const result = await this.service.updateStatus(adminId, applicationId, {
        status,
        rejectionReason,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
