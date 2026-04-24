import express, { Router } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { ApplicantController } from "./application.controller.js";
import {
  CreateApplicationDTO,
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
    // ========================= USER - FEATUR 1 (START) =========================
    // POST — apply ke job
    this.router.post(
      "/job/:jobId",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyVerified(),
      this.authMiddleware.verifyRole(["USER"]),
      this.validationMiddleware.validateBody(CreateApplicationDTO),
      this.applicantController.applyToJob,
    );

    // GET — list semua lamaran user yang sedang login
    this.router.get(
      "/me",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyVerified(),
      this.authMiddleware.verifyRole(["USER"]),
      this.validationMiddleware.validateQuery(GetMyApplicationsDTO),
      this.applicantController.getMyApplications,
    );

    // GET — detail lamaran user yang sedang login
    this.router.get(
      "/me/:id",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyVerified(),
      this.authMiddleware.verifyRole(["USER"]),
      this.applicantController.getMyApplicationById,
    );

    // DELETE — batalkan lamaran (hanya jika status masih PENDING)
    this.router.delete(
      "/me/:id",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyVerified(),
      this.authMiddleware.verifyRole(["USER"]),
      this.applicantController.withdrawMyApplication,
    );
    // ========================= USER - FEATUR 1 (END) =========================

    // GET — list pelamar berdasarkan jobId
    this.router.get(
      "/job/:jobId",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.validationMiddleware.validateQuery(GetApplicantsDTO),
      this.applicantController.getApplicants,
    );

    // GET — detail pelamar by application id
    this.router.get(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.applicantController.getApplicantById,
    );

    // PATCH — update status pelamar (processed, rejected, etc)
    this.router.patch(
      "/:id/status",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.validationMiddleware.validateBody(UpdateApplicantStatusDTO),
      this.applicantController.updateApplicantStatus,
    );
  };

  getRouter = () => {
    return this.router;
  };
}
