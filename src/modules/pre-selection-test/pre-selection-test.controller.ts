import { plainToInstance } from "class-transformer";
import { Request, Response } from "express";
import { PreSelectionTestService } from "./pre-selection-test.service.js";
import {
  CreatePreSelectionTestDTO,
  UpdatePreSelectionTestDTO,
  SubmitTestDTO,
} from "./dto/pre-selection-test.dto.js";

export class PreSelectionTestController {
  constructor(private preSelectionTestService: PreSelectionTestService) {}

  createTest = async (req: Request, res: Response) => {
    const body = plainToInstance(CreatePreSelectionTestDTO, req.body);
    const adminId = res.locals.existingUser.id;
    const result = await this.preSelectionTestService.createTest(body, adminId);
    res.status(201).send(result);
  };

  getTestByJobId = async (req: Request, res: Response) => {
    const jobId = Number(req.params.jobId);
    const adminId = res.locals.existingUser.id;
    const result = await this.preSelectionTestService.getTestByJobId(
      jobId,
      adminId,
    );
    res.status(200).send(result);
  };

  updateTest = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const body = plainToInstance(UpdatePreSelectionTestDTO, req.body);
    const adminId = res.locals.existingUser.id;
    const result = await this.preSelectionTestService.updateTest(
      id,
      body,
      adminId,
    );
    res.status(200).send(result);
  };

  deleteTest = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const adminId = res.locals.existingUser.id;
    const result = await this.preSelectionTestService.deleteTest(id, adminId);
    res.status(200).send(result);
  };

  // USER — ambil soal tanpa jawaban
  takeTest = async (req: Request, res: Response) => {
    const jobId = Number(req.params.jobId);
    const userId = res.locals.existingUser.id;
    const result = await this.preSelectionTestService.takeTest(jobId, userId);
    res.status(200).send(result);
  };

  // USER — submit jawaban
  submitTest = async (req: Request, res: Response) => {
    const body = plainToInstance(SubmitTestDTO, req.body);
    const userId = res.locals.existingUser.id;
    const result = await this.preSelectionTestService.submitTest(body, userId);
    res.status(201).send(result);
  };

  // ADMIN — lihat hasil tes semua pelamar
  getTestResults = async (req: Request, res: Response) => {
    const testId = Number(req.params.testId);
    const adminId = res.locals.existingUser.id;
    const result = await this.preSelectionTestService.getTestResults(
      testId,
      adminId,
    );
    res.status(200).send(result);
  };
}
