import { Router } from "express";
import { Role } from "../../generated/prisma/enums.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { CompanyController } from "./company.controller.js";

export class CompanyRouter {
  private router: Router;

  constructor(
    private controller: CompanyController,
    private authMiddleware: AuthMiddleware,
    private uploadMiddleware: UploadMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const verifyToken = this.authMiddleware.verifyToken(
      process.env.JWT_ACCESS_SECRET as string,
    );

    const verifyAdmin = this.authMiddleware.verifyRole([Role.ADMIN]);

    this.router.post("/", verifyToken, verifyAdmin, this.controller.create);

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
      this.controller.updateMyCompany,
    );

    this.router.get("/:id", this.controller.getById);
  }

  public getRouter(): Router {
    return this.router;
  }
}
