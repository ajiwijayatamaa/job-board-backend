import { NextFunction, Request, Response } from "express";
import { UserService } from "./user.service.js";

export class UserController {
  private userService = new UserService();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.userService.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    };
  }
}
