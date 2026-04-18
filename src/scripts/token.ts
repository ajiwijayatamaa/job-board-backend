import cron from "node-cron";
import { prisma } from "../lib/prisma.js";

export const tokenCleanupScheduler = () => {
  // Jalankan setiap hari pukul 02:00 pagi
  cron.schedule("0 2 * * *", async () => {
    console.log("[CRON] Cleaning up expired verification and reset tokens...");

    try {
      // Menghitung waktu 24 jam yang lalu
      const threshold = new Date();
      threshold.setHours(threshold.getHours() - 24);

      // Menghapus token verifikasi dan reset password secara paralel
      const [verificationResult, resetResult] = await Promise.all([
        prisma.verificationToken.deleteMany({
          where: {
            expiresAt: { lt: threshold },
          },
        }),
        prisma.passwordResetToken.deleteMany({
          where: {
            expiresAt: { lt: threshold },
          },
        }),
      ]);

      if (verificationResult.count > 0) {
        console.log(`[CRON] Successfully deleted ${verificationResult.count} expired verification tokens.`);
      }
      
      if (resetResult.count > 0) {
        console.log(`[CRON] Successfully deleted ${resetResult.count} expired password reset tokens.`);
      }
    } catch (error) {
      console.error("[CRON] Error during token cleanup execution:", error);
    }
  });
};