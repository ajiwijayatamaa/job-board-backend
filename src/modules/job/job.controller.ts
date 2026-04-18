import { plainToInstance } from "class-transformer";
import { Request, Response } from "express";
import { JobService } from "./job.service.js";
import { JobPublicService } from "./job-public.service.js";
import {
  GetJobsDTO,
  GetPublicJobsDTO,
  UpdateJobDTO,
  UpdateJobStatusDTO,
} from "./dto/job.dto.js";

export class JobController {
  constructor(
    private jobService: JobService,
    private jobPublicService: JobPublicService,
  ) {}

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

  getPublicJobs = async (req: Request, res: Response) => {
    const query = plainToInstance(GetPublicJobsDTO, req.query);
    const result = await this.jobPublicService.getPublicJobs(query);
    res.status(200).send(result);
  };

  getPublicJobById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await this.jobPublicService.getPublicJobById(id);
    res.status(200).send(result);
  };

  getRecommendedJobs = async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 4;
    const result = await this.jobPublicService.getRecommendedJobs(limit);
    res.status(200).send(result);
  };
}
