import express, { Router } from "express";
import { PreSelectionTestController } from "./pre-selection-test.controller.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import {
  CreatePreSelectionTestDTO,
  UpdatePreSelectionTestDTO,
  SubmitTestDTO,
} from "./dto/pre-selection-test.dto.js";

export class PreSelectionTestRouter {
  private router: Router;

  constructor(
    private preSelectionTestController: PreSelectionTestController,
    private authMiddleware: AuthMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    this.router.post(
      "/",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.validationMiddleware.validateBody(CreatePreSelectionTestDTO),
      this.preSelectionTestController.createTest,
    );

    this.router.get(
      "/job/:jobId",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.preSelectionTestController.getTestByJobId,
    );

    this.router.put(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.validationMiddleware.validateBody(UpdatePreSelectionTestDTO),
      this.preSelectionTestController.updateTest,
    );

    this.router.delete(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.preSelectionTestController.deleteTest,
    );

    this.router.get(
      "/:testId/results",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.preSelectionTestController.getTestResults,
    );

    // ── USER ───────────────────────────────────────────────
    this.router.get(
      "/take/:jobId",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["USER"]),
      this.preSelectionTestController.takeTest,
    );

    this.router.post(
      "/submit",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["USER"]),
      this.validationMiddleware.validateBody(SubmitTestDTO),
      this.preSelectionTestController.submitTest,
    );
  };

  getRouter = () => {
    return this.router;
  };
}
