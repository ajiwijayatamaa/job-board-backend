import express, { Router } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { ApplicantController } from "./application.controller.js";
import {
  GetApplicantsDTO,
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
