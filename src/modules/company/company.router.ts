import { Router } from "express";
import { Role } from "../../generated/prisma/enums.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { JobController } from "../job/job.controller.js"; // Import JobController
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

export class CompanyPublicRouter {
  private router: Router;

  constructor(
    private controller: CompanyController,
    private jobController: JobController, // Inject JobController
    private authMiddleware: AuthMiddleware, // Dapat digunakan untuk rute publik yang memerlukan otentikasi opsional di masa depan
    private validationMiddleware: ValidationMiddleware, // Dapat digunakan untuk rute publik dengan query params di masa depan
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // GET - list semua perusahaan publik (yang memiliki lowongan PUBLISHED)
    this.router.get("/", this.controller.getPublicCompanies);
    // GET - detail perusahaan publik
    this.router.get("/:id", this.controller.getPublicCompanyById); // New method for public company details
    // GET - lowongan publik dari sebuah perusahaan
    this.router.get("/:id/jobs", this.jobController.getPublicJobsByCompanyId); // Use JobController for company's jobs
  }

  public getRouter(): Router {
    return this.router;
  }
}
