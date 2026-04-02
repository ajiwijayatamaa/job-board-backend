import { Router } from "express";
import { Role } from "../../generated/prisma/enums.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { CompanyController } from "./company.controller.js";

export class CompanyRouter {
  private router: Router;
  private controller: CompanyController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.controller = new CompanyController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const verifyToken = this.authMiddleware.verifyToken(
      process.env.JWT_SECRET as string
    );

    const verifyAdmin = this.authMiddleware.verifyRole([Role.ADMIN]);

    this.router.post(
      "/",
      verifyToken,
      verifyAdmin,
      this.controller.create
    );

    this.router.get(
      "/me",
      verifyToken,
      verifyAdmin,
      this.controller.getMyCompany
    );

    this.router.patch(
      "/me",
      verifyToken,
      verifyAdmin,
      this.controller.updateMyCompany
    );

    this.router.get("/:id", this.controller.getById);
  }

  public getRouter(): Router {
    return this.router;
  }
}