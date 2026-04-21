import express, { Router } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { AnalyticsController } from "./analytics.controller.js";
import { GetAnalyticsDTO } from "./dto/analytics.dto.js";

export class AnalyticsRouter {
  private router: Router;

  constructor(
    private analyticsController: AnalyticsController,
    private authMiddleware: AuthMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    // GET — ringkasan total jobs, applications, status breakdown
    this.router.get(
      "/overview",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.analyticsController.getOverview,
    );

    // GET — demografi pelamar (gender, usia, lokasi)
    this.router.get(
      "/demographics",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.validationMiddleware.validateQuery(GetAnalyticsDTO),
      this.analyticsController.getDemographics,
    );

    // GET — rata-rata salary berdasarkan kategori & kota
    this.router.get(
      "/salary-trends",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.validationMiddleware.validateQuery(GetAnalyticsDTO),
      this.analyticsController.getSalaryTrends,
    );

    // GET — minat pelamar berdasarkan kategori & job terpopuler
    this.router.get(
      "/applicant-interests",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.validationMiddleware.validateQuery(GetAnalyticsDTO),
      this.analyticsController.getApplicantInterests,
    );
  };

  getRouter = () => {
    return this.router;
  };
}
