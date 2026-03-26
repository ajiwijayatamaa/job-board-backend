import { CookieOptions } from "express";

export const cookieOptions: CookieOptions = {
  httpOnly: true, // kalau dikasih true akses token tidak dapat di baca di browser hanya bisa di baca di BE
  secure: process.env.NODE_ENV === "production", // kalau belum di deploy ganti jadi = false ,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // ganti juga kalau belum di deploy jadi = "lax"
  path: "/",
};
