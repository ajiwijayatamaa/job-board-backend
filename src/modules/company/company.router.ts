import express, { Router } from "express";
import { Role } from "../../generated/prisma/enums.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { CompanyController } from "./company.controller.js";
import { CreateCompanyDTO, UpdateCompanyDTO } from "./dto/company.dto.js";

export class CompanyRouter {
  private router: Router;

  constructor(
    private controller: CompanyController,
    private authMiddleware: AuthMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = (): void => {
    const verifyToken = this.authMiddleware.verifyToken(
      process.env.JWT_SECRET as string
    );

    const verifyAdmin = this.authMiddleware.verifyRole([Role.ADMIN]);

    this.router.post(
      "/",
      verifyToken,
      verifyAdmin,
      this.validationMiddleware.validateBody(CreateCompanyDTO),
      this.controller.create,
    );

    this.router.get(
      "/me",
      verifyToken,
      verifyAdmin,
      this.controller.getMyCompany,
    );

    this.router.patch(
      "/me",
      verifyToken,
      verifyAdmin,
      this.validationMiddleware.validateBody(UpdateCompanyDTO),
      this.controller.updateMyCompany,
    );

    this.router.get("/:id", this.controller.getById);
  };

  getRouter = (): Router => {
    return this.router;
  };
}
