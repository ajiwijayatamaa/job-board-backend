import cron from "node-cron";
import { prisma } from "../lib/prisma.js";

export const jobDeadlineScheduler = () => {
  // Jalankan setiap hari pukul 00:00 (tengah malam)
  // Format: "menit jam hari bulan hari-dalam-seminggu"
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Checking for expired job deadlines...");

    try {
      const now = new Date();

      // Update semua lowongan yang statusnya PUBLISHED tapi deadline sudah terlewati
      const result = await prisma.job.updateMany({
        where: {
          status: "PUBLISHED",
          deadline: {
            lt: now,
          },
        },
        data: {
          status: "CLOSED",
        },
      });

      if (result.count > 0) {
        console.log(`[CRON] Successfully closed ${result.count} expired job(s).`);
      } else {
        console.log("[CRON] No expired jobs found today.");
      }
    } catch (error) {
      console.error("[CRON] Error during job deadline execution:", error);
    }
  });
};