import { Request, Response } from "express";
import { CVService } from "./cv.service.js";

export class CVController {
  constructor(private service: CVService) {}

  create = async (req: Request, res: Response) => {
    const userId = res.locals.existingUser.id;
    const { cvName } = req.body;
    const result = await this.service.create(userId, cvName, req.file);
    res.status(201).send(result);
  };

  getAll = async (req: Request, res: Response) => {
    const userId = res.locals.existingUser.id;
    const result = await this.service.getAll(userId);
    res.status(200).send(result);
  };

  setPrimary = async (req: Request, res: Response) => {
    const userId = res.locals.existingUser.id;
    const cvId = Number(req.params.id);
    const result = await this.service.setPrimary(userId, cvId);
    res.status(200).send(result);
  };

  delete = async (req: Request, res: Response) => {
    const userId = res.locals.existingUser.id;
    const cvId = Number(req.params.id);
    const result = await this.service.delete(userId, cvId);
    res.status(200).send(result);
  };
}