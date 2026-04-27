import express from "express";
import { ApiError } from "../utils/api-error.js";

export const errorMiddleware = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  // Multer file size validation
  if (err?.code === "LIMIT_FILE_SIZE") {
    const field = err?.field as string | undefined;
    const maxMb =
      field === "profilePhoto" ? 1 : field === "cv" ? 2 : undefined;

    const message = maxMb
      ? `File terlalu besar. Maksimum ${maxMb} MB.`
      : "File terlalu besar.";

    req.log.error(message);
    return res.status(400).send({ message });
  }

  const apiErr = err instanceof ApiError ? err : undefined;

  req.log.error(err?.message || String(err));
  const message = apiErr?.message || err?.message || "Something went wrong!";
  const status = apiErr?.status || err?.status || 500;
  res.status(status).send({ message });
};

export const notFoundMiddleware = (
  req: express.Request,
  res: express.Response,
) => {
  res.status(404).send({ message: "Route not found" });
};
