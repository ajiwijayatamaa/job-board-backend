import { Request, Response } from "express";
import { CVService } from "./cv.service.js";
import { CreateCVDTO } from "./dto/cv.dto.js";

export class CVController {
  constructor(private service: CVService) {}

  create = async (req: Request, res: Response) => {
    const body = req.body as CreateCVDTO;
    const result = await this.service.create(
      res.locals.existingUser.id,
      body,
      req.file
    );

    res.status(201).send(result);
  };

  getAll = async (req: Request, res: Response) => {
    const result = await this.service.getAll(res.locals.existingUser.id);

    res.status(200).send(result);
  };

  setPrimary = async (req: Request, res: Response) => {
    const result = await this.service.setPrimary(
      res.locals.existingUser.id,
      Number(req.params.id)
    );

    res.status(200).send(result);
  };

  delete = async (req: Request, res: Response) => {
    const result = await this.service.delete(
      res.locals.existingUser.id,
      Number(req.params.id)
    );

    res.status(200).send(result);
  };
}
