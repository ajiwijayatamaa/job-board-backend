import express, { Router } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { InterviewController } from "./interview.controller.js";
import { CreateInterviewDTO, UpdateInterviewDTO } from "./dto/interview.dto.js";

export class InterviewRouter {
  private router: Router;

  constructor(
    private interviewController: InterviewController,
    private authMiddleware: AuthMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    // POST / — buat jadwal interview baru untuk satu pelamar
    this.router.post(
      "/",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.validationMiddleware.validateBody(CreateInterviewDTO),
      this.interviewController.createInterview,
    );

    // GET /job/:jobId — list semua jadwal interview berdasarkan job
    this.router.get(
      "/job/:jobId",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.interviewController.getInterviewsByJob,
    );

    // GET /:id — detail satu jadwal interview
    this.router.get(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.interviewController.getInterviewById,
    );

    // PATCH /:id — perbarui jadwal interview
    this.router.patch(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.validationMiddleware.validateBody(UpdateInterviewDTO),
      this.interviewController.updateInterview,
    );

    // DELETE /:id — hapus jadwal interview
    this.router.delete(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ADMIN"]),
      this.interviewController.deleteInterview,
    );
  };

  getRouter = () => {
    return this.router;
  };
}
