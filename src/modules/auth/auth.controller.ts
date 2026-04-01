import { NextFunction, Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { ApiError } from "../../utils/api-error.js";

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return next(new ApiError("Name, email and password are required", 400));
      }

      const result = await this.service.register({
        name,
        email,
        password,
        role,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ApiError("Email and password are required", 400));
      }

      const result = await this.service.login({
        email,
        password,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    };
  }
}
