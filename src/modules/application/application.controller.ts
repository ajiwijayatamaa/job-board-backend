import { plainToInstance } from "class-transformer";
import { Request, Response } from "express";
import { ApplicantService } from "./application.service.js";
import { ApplicantUserService } from "./applicant-user.service.js";
import {
  ApplyJobDTO,
  GetApplicantsDTO,
  GetMyApplicationsDTO,
  UpdateApplicantStatusDTO,
} from "./dto/applicant.dto.js";

export class ApplicantController {
  constructor(
    private applicantService: ApplicantService,
    private applicantUserService: ApplicantUserService,
  ) {}
  // ========================= ADMIN - FEATUR 2 (START) =========================
  getApplicants = async (req: Request, res: Response) => {
    const jobId = Number(req.params.jobId);
    const query = plainToInstance(GetApplicantsDTO, req.query);
    const adminId = res.locals.existingUser.id;

    const result = await this.applicantService.getApplicants(
      jobId,
      query,
      adminId,
    );
    res.status(200).send(result);
  };

  getApplicantById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = res.locals.existingUser.id;

    const result = await this.applicantService.getApplicantById(id, adminId);
    res.status(200).send(result);
  };

  updateApplicantStatus = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const body = plainToInstance(UpdateApplicantStatusDTO, req.body);
    const adminId = res.locals.existingUser.id;

    const result = await this.applicantService.updateApplicantStatus(
      id,
      body,
      adminId,
    );
    res.status(200).send(result);
  };
  // ========================= ADMIN - FEATUR 2 (END) =========================

  // ========================= USER - FEATUR 1 (START) =========================
  applyJob = async (req: Request, res: Response) => {
    const body = plainToInstance(ApplyJobDTO, req.body);
    const userId = res.locals.existingUser.id;
    const result = await this.applicantUserService.applyJob(userId, body);
    res.status(201).send(result);
  };
  // ========================= USER - FEATUR 1 (END) =========================

  // ========================= USER - FEATUR 2 (START) =========================
  getMyApplications = async (req: Request, res: Response) => {
    const query = plainToInstance(GetMyApplicationsDTO, req.query);
    const userId = res.locals.existingUser.id;
    const result = await this.applicantUserService.getMyApplications(userId, query);
    res.status(200).send(result);
  };

  getMyApplicationById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const userId = res.locals.existingUser.id;
    const result = await this.applicantUserService.getMyApplicationById(id, userId);
    res.status(200).send(result);
  };
  // ========================= USER - FEATUR 2 (END) =========================
}
