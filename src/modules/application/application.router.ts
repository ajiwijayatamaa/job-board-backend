import express, { Router } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { ApplicantController } from "./application.controller.js";
import {
  ApplyJobDTO,
  GetApplicantsDTO,
  GetMyApplicationsDTO,
  UpdateApplicantStatusDTO,
} from "./dto/applicant.dto.js";

export class ApplicantRouter {
  private router: Router;

  constructor(
    private applicantController: ApplicantController,
    private authMiddleware: AuthMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    // ========================= USER ROUTES =========================
    // POST — Apply lowongan kerja
    this.router.post(
      "/apply",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyVerified(),
      this.authMiddleware.verifyRole(["USER"]),
      this.validationMiddleware.validateBody(ApplyJobDTO),
      this.applicantController.applyJob,
    );

    // GET — List lamaran saya
    this.router.get(
      "/my-applications",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyVerified(),
      this.authMiddleware.verifyRole(["USER"]),
      this.validationMiddleware.validateQuery(GetMyApplicationsDTO),
      this.applicantController.getMyApplications,
    );

    // GET — Detail lamaran saya
    this.router.get(
      "/my-applications/:id",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyVerified(),
      this.authMiddleware.verifyRole(["USER"]),
      this.applicantController.getMyApplicationById,
    );

    // ========================= ADMIN ROUTES =========================
    // GET — list pelamar berdasarkan jobId
    this.router.get(
      "/job/:jobId",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyVerified(),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.validationMiddleware.validateQuery(GetApplicantsDTO),
      this.applicantController.getApplicants,
    );

    // GET — detail pelamar by application id
    this.router.get(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyVerified(),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.applicantController.getApplicantById,
    );

    // PATCH — update status pelamar (processed, rejected, etc)
    this.router.patch(
      "/:id/status",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyVerified(),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.validationMiddleware.validateBody(UpdateApplicantStatusDTO),
      this.applicantController.updateApplicantStatus,
    );
  };

  getRouter = () => {
    return this.router;
  };
}
