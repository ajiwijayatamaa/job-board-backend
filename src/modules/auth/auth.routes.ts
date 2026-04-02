import { Router } from "express";
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
    this.router.post("/register", this.controller.register);
    this.router.post("/login", this.controller.login);
  }

  public getRouter(): Router {
    return this.router;
  }
}