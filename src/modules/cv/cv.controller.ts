import { Request, Response, NextFunction } from "express";
import { CVService } from "./cv.service.js";

export class CVController {
  private service = new CVService();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.create(
        res.locals.existingUser.id,
        req.body.cvName,
        req.file
      );

      res.status(201).json({
        message: "CV uploaded",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getAll(res.locals.existingUser.id);

      res.json({
        message: "Success",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  setPrimary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.setPrimary(
        res.locals.existingUser.id,
        Number(req.params.id)
      );

      res.json({
        message: "Primary CV updated",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(
        res.locals.existingUser.id,
        Number(req.params.id)
      );

      res.json({
        message: "CV deleted",
      });
    } catch (err) {
      next(err);
    }
  };
}