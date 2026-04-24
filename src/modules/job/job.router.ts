import express, { Router } from "express";
import { Role } from "../../generated/prisma/enums.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { JobController } from "./job.controller.js";
import {
  CreateJobDTO,
  GetPublicJobsDTO,
  UpdateJobDTO,
  UpdateJobStatusDTO,
} from "./dto/job.dto.js";

export class JobRouter {
  private router: Router;

  constructor(
    private jobController: JobController,
    private authMiddleware: AuthMiddleware,
    private uploadMiddleware: UploadMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    // GET — list semua job milik company
    this.router.get(
      "/",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyRole([Role.ADMIN]),
      this.jobController.getJobs,
    );

    // GET — detail job by id
    this.router.get(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyRole([Role.ADMIN]),
      this.jobController.getJobById,
    );

    // POST — buat job baru
    this.router.post(
      "/",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyRole([Role.ADMIN]),
      this.uploadMiddleware
        .uploadImage()
        .fields([{ name: "banner", maxCount: 1 }]),
      this.validationMiddleware.validateBody(CreateJobDTO),
      this.jobController.createJob,
    );

    // PATCH — update job
    this.router.patch(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyRole([Role.ADMIN]),
      this.uploadMiddleware
        .uploadImage()
        .fields([{ name: "banner", maxCount: 1 }]),
      this.validationMiddleware.validateBody(UpdateJobDTO),
      this.jobController.updateJob,
    );

    // PATCH — publish/unpublish job
    this.router.patch(
      "/:id/status",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyRole([Role.ADMIN]),
      this.validationMiddleware.validateBody(UpdateJobStatusDTO),
      this.jobController.updateJobStatus,
    );

    // DELETE — hapus job
    this.router.delete(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyRole([Role.ADMIN]),
      this.jobController.deleteJob,
    );
  };
  
  getRouter = () => {
    return this.router;
  };
}

export class JobPublicRouter {
  private router: Router;

  constructor(
    private jobController: JobController,
    private authMiddleware: AuthMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    // ========================= USER - FEATUR 1 (START) =========================
    this.router.get(
      "/",
      this.validationMiddleware.validateQuery(GetPublicJobsDTO),
      this.jobController.getPublicJobs,
    );

    this.router.get(
      "/:id",
      this.jobController.getPublicJobById,
    );
    // ========================= USER - FEATUR 1 (END) =========================
  };

  getRouter = () => {
    return this.router;
  };
}
