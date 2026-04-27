import { plainToInstance } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import { JobService } from "./job.service.js";
import {
  GetJobsDTO,
  GetPublicJobsDTO,
  UpdateJobDTO,
  UpdateJobStatusDTO,
} from "./dto/job.dto.js";

export class JobController {
  constructor(private jobService: JobService) {}

  // ========================= USER - FEATUR 1 (START) =========================
  getPublicJobsByCompanyId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const companyId = Number(req.params.id); // Changed from companyId to id to match router path
      const result = await this.jobService.getPublicJobsByCompanyId(companyId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getPublicJobs = async (req: Request, res: Response) => {
    const query = plainToInstance(GetPublicJobsDTO, req.query);
    const userId = res.locals.existingUser?.id;
    const result = await this.jobService.getPublicJobs(query, userId);
    res.status(200).send(result);
  };

  getPublicJobById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await this.jobService.getPublicJobById(id);
    res.status(200).send(result);
  };
  // ========================= USER - FEATUR 1 (END) =========================

  getJobs = async (req: Request, res: Response) => {
    const query = plainToInstance(GetJobsDTO, req.query);
    const adminId = res.locals.existingUser.id;
    const result = await this.jobService.getJobs({ ...query, adminId });
    res.status(200).send(result);
  };

  getJobById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = res.locals.existingUser.id;
    const result = await this.jobService.getJobById(id, adminId);
    res.status(200).send(result);
  };

  createJob = async (req: Request, res: Response) => {
    const body = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const banner = files?.banner?.[0]; // opsional
    const adminId = res.locals.existingUser.id;
    const result = await this.jobService.createJob(body, adminId, banner);
    res.status(201).send(result);
  };

  updateJob = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const body = plainToInstance(UpdateJobDTO, req.body);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const banner = files?.banner?.[0]; // opsional
    const adminId = res.locals.existingUser.id;
    const result = await this.jobService.updateJob(id, body, adminId, banner);
    res.status(200).send(result);
  };

  updateJobStatus = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const body = plainToInstance(UpdateJobStatusDTO, req.body);
    const adminId = res.locals.existingUser.id;
    const result = await this.jobService.updateJobStatus(id, body, adminId);
    res.status(200).send(result);
  };

  deleteJob = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = res.locals.existingUser.id;
    const result = await this.jobService.deleteJob(id, adminId);
    res.status(200).send(result);
  };
}
