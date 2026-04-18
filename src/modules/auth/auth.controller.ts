import { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { ForgotPasswordDTO, LoginDTO, RegisterDTO, ResetPasswordDTO } from "./dto/auth.dto.js";

export class AuthController {
  constructor(private service: AuthService) {}

  register = async (req: Request, res: Response) => {
    const body = req.body as RegisterDTO;
    const result = await this.service.register(body);

    res.status(201).send(result);
  };

  login = async (req: Request, res: Response) => {
    const body = req.body as LoginDTO;
    const result = await this.service.login(body);

    res.status(200).send(result);
  };

  forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body as ForgotPasswordDTO;

    await this.service.forgotPassword(email);

    res.status(200).send({
      message: "If your email is registered, you will receive a reset link shortly",
    });
  };

  resetPassword = async (req: Request, res: Response) => {
    const body = req.body as ResetPasswordDTO;
    const result = await this.service.resetPassword(body);

    res.status(200).send(result);
  };

  verifyEmail = async (req: Request, res: Response) => {
    const { token } = req.query;
    const result = await this.service.verifyEmail(token as string);

    res.status(200).send(result);
  };

  resendVerification = async (req: Request, res: Response) => {
    const userId = res.locals.existingUser.id;
    const result = await this.service.resendVerification(userId);

    res.status(200).send(result);
  };
}
