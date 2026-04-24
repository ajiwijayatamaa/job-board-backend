import { plainToInstance } from "class-transformer";
import { Request, Response } from "express";

import { AuthService } from "./auth.service.js";
import {
  ForgotPasswordDTO,
  LoginDTO,
  RegisterDTO,
  ResetPasswordDTO,
} from "./dto/auth.dto.js";

import { ApiError } from "../../utils/api-error.js";
import { cookieOptions } from "../../config/cookie.js";

export class AuthController {
  constructor(private service: AuthService) {}

  googleLogin = async (req: Request, res: Response) => {
    const { token, role } = req.body;

    if (!token) {
      throw new ApiError("Google token is required", 400);
    }

    const result = await this.service.googleLogin(token, role);

    res
      .cookie("refreshToken", result.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .send(result);
  };

  register = async (req: Request, res: Response) => {
    const body = plainToInstance(RegisterDTO, req.body);

    const result = await this.service.register(body);

    res.status(201).send(result);
  };

  login = async (req: Request, res: Response) => {
    const body = plainToInstance(LoginDTO, req.body);

    const result = await this.service.login(body);

    res
      .cookie("refreshToken", result.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .send(result);
  };

  logout = async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;

    if (token) {
      await this.service.logout(token);
    }

    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).send({ message: "Logout success" });
  };

  refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new ApiError("Refresh token missing", 401);
    }

    const result = await this.service.refresh(refreshToken);

    res.cookie("refreshToken", result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).send(result);
  };

  forgotPassword = async (req: Request, res: Response) => {
    const body = plainToInstance(ForgotPasswordDTO, req.body);

    await this.service.forgotPassword(body.email);

    res.status(200).send({
      message:
        "If your email is registered, you will receive a reset link shortly",
    });
  };

  resetPassword = async (req: Request, res: Response) => {
    const body = plainToInstance(ResetPasswordDTO, req.body);

    const result = await this.service.resetPassword(body);

    res.status(200).send(result);
  };

  verifyEmail = async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      throw new ApiError("Invalid or missing verification token", 400);
    }

    const result = await this.service.verifyEmail(token);

    res.status(200).send(result);
  }
}