import { NextFunction, Request, Response, Router } from "express";
import { AuthController } from "./auth.controller.js";

export class AuthRouter {
  private router: Router;
  private controller: AuthController;

  constructor() {
    this.router = Router();
    this.controller = new AuthController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/register",
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.register(req, res, next).catch(next);
      }
    );

    this.router.post(
      "/login",
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.login(req, res, next).catch(next);
      }
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
