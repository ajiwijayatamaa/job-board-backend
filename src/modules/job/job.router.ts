import express, { Router } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { JobController } from "./job.controller.js";
import {
  CreateJobDTO,
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
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.jobController.getJobs,
    );

    // GET — detail job by id
    this.router.get(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.jobController.getJobById,
    );

    // POST — buat job baru
    this.router.post(
      "/",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.uploadMiddleware
        .uploadImage()
        .fields([{ name: "banner", maxCount: 1 }]),
      this.validationMiddleware.validateBody(CreateJobDTO),
      this.jobController.createJob,
    );

    // PATCH — update job
    this.router.patch(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.uploadMiddleware
        .uploadImage()
        .fields([{ name: "banner", maxCount: 1 }]),
      this.validationMiddleware.validateBody(UpdateJobDTO),
      this.jobController.updateJob,
    );

    // PATCH — publish/unpublish job
    this.router.patch(
      "/:id/status",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.validationMiddleware.validateBody(UpdateJobStatusDTO),
      this.jobController.updateJobStatus,
    );

    // DELETE — hapus job
    this.router.delete(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.jobController.deleteJob,
    );
  };

  getRouter = () => {
    return this.router;
  };
}
