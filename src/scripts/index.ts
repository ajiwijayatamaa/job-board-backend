import { interviewReminderScheduler } from "./interview.js";
import { jobDeadlineScheduler } from "./job.js";
import { tokenCleanupScheduler } from "./token.js";

export const initScheduler = () => {
  interviewReminderScheduler();
  jobDeadlineScheduler(); // Menangani penutupan lowongan otomatis berdasarkan deadline
  tokenCleanupScheduler(); // Menghapus token verifikasi yang expired > 24 jam
};
