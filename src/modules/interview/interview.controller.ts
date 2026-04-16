import { plainToInstance } from "class-transformer";
import { Request, Response } from "express";
import { InterviewService } from "./interview.service.js";
import { CreateInterviewDTO, UpdateInterviewDTO } from "./dto/interview.dto.js";

export class InterviewController {
  constructor(private interviewService: InterviewService) {}

  createInterview = async (req: Request, res: Response) => {
    const body = plainToInstance(CreateInterviewDTO, req.body);
    const adminId = res.locals.existingUser.id;

    const result = await this.interviewService.createInterview(body, adminId);
    res.status(201).send(result);
  };

  getInterviewsByJob = async (req: Request, res: Response) => {
    const jobId = Number(req.params.jobId);
    const adminId = res.locals.existingUser.id;

    const result = await this.interviewService.getInterviewsByJob(
      jobId,
      adminId,
    );
    res.status(200).send(result);
  };

  getInterviewById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = res.locals.existingUser.id;

    const result = await this.interviewService.getInterviewById(id, adminId);
    res.status(200).send(result);
  };

  updateInterview = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const body = plainToInstance(UpdateInterviewDTO, req.body);
    const adminId = res.locals.existingUser.id;

    const result = await this.interviewService.updateInterview(
      id,
      body,
      adminId,
    );
    res.status(200).send(result);
  };

  deleteInterview = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = res.locals.existingUser.id;

    const result = await this.interviewService.deleteInterview(id, adminId);
    res.status(200).send(result);
  };
}
