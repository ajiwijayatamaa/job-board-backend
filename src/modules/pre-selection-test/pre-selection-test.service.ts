import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import {
  CreatePreSelectionTestDTO,
  UpdatePreSelectionTestDTO,
  SubmitTestDTO,
  GetTestResultsDTO,
} from "./dto/pre-selection-test.dto.js";

export class PreSelectionTestService {
  constructor(private prisma: PrismaClient) {}

  private mapQuestions = (questions: any[]) => {
    return questions.map((q) => ({
      questionText: q.questionText,
      correctAnswer: q.correctAnswer,
      options: {
        create: q.options.map((o: any) => ({
          optionText: o.optionText,
          isCorrect: o.isCorrect,
        })),
      },
    }));
  };

  private calculateScore(questions: any[], answers: any[]): number {
    const correct = answers.reduce((count: number, ans: any) => {
      const q = questions.find((quest) => quest.id === ans.questionId);
      return q?.correctAnswer === ans.selectedAnswer ? count + 1 : count;
    }, 0);
    return (correct / questions.length) * 100;
  }
  // ========================= ADMIN - FEATUR 2 (START) =========================
  createTest = async (body: CreatePreSelectionTestDTO, adminId: number) => {
    const job = await this.prisma.job.findFirst({
      where: { id: body.jobId, company: { adminId } },
    });
    if (!job)
      throw new ApiError("Job tidak ditemukan atau bukan milik Anda", 404);

    const isExist = await this.prisma.preSelectionTest.findUnique({
      where: { jobId: body.jobId },
    });
    if (isExist)
      throw new ApiError("Job ini sudah memiliki pre selection test", 400);

    return await this.prisma.$transaction(async (tx) => {
      const test = await tx.preSelectionTest.create({
        data: {
          jobId: body.jobId,
          title: body.title,
          questions: { create: this.mapQuestions(body.questions) },
        },
        include: { questions: { include: { options: true } } },
      });
      await tx.job.update({
        where: { id: body.jobId },
        data: { preTest: true },
      });
      return test;
    });
  };

  getTestByJobId = async (jobId: number, adminId: number) => {
    const test = await this.prisma.preSelectionTest.findFirst({
      where: { jobId, job: { company: { adminId } } },
      include: { questions: { include: { options: true } } },
    });
    if (!test) throw new ApiError("Pre selection test tidak ditemukan", 404);
    return test;
  };

  updateTest = async (
    id: number,
    body: UpdatePreSelectionTestDTO,
    adminId: number,
  ) => {
    const test = await this.prisma.preSelectionTest.findFirst({
      where: { id, job: { company: { adminId } } },
    });
    if (!test)
      throw new ApiError("Test tidak ditemukan atau bukan milik Anda", 404);

    return await this.prisma.$transaction(async (tx) => {
      if (body.questions) {
        await tx.testQuestion.deleteMany({ where: { testId: id } });
      }

      return await tx.preSelectionTest.update({
        where: { id },
        data: {
          title: body.title,
          ...(body.questions && {
            questions: { create: this.mapQuestions(body.questions) },
          }),
        },
        include: { questions: { include: { options: true } } },
      });
    });
  };

  deleteTest = async (id: number, adminId: number) => {
    const test = await this.prisma.preSelectionTest.findFirst({
      where: { id, job: { company: { adminId } } },
    });
    if (!test)
      throw new ApiError("Test tidak ditemukan atau bukan milik Anda", 404);

    return await this.prisma.$transaction(async (tx) => {
      await tx.job.update({
        where: { id: test.jobId },
        data: { preTest: false },
      });
      await tx.preSelectionTest.delete({ where: { id } });

      return { message: "Pre selection test berhasil dihapus" };
    });
  };

  // Admin melihat semua hasil tes pelamar
  getTestResults = async (
    testId: number,
    adminId: number,
    query: GetTestResultsDTO,
  ) => {
    const test = await this.prisma.preSelectionTest.findFirst({
      where: { id: testId, job: { company: { adminId } } },
    });
    if (!test)
      throw new ApiError("Test tidak ditemukan atau bukan milik Anda", 404);

    const { page, take, sortBy, sortOrder, search } = query;

    const whereClause: Prisma.TestResultWhereInput = {
      preSelectionTestId: testId,
      ...(search && {
        application: {
          user: { fullName: { contains: search, mode: "insensitive" } },
        },
      }),
    };

    const [results, total] = await this.prisma.$transaction([
      this.prisma.testResult.findMany({
        where: whereClause,
        include: {
          user: {
            // ✅ ambil langsung dari TestResult
            select: {
              id: true,
              fullName: true,
              email: true,
              profilePhoto: true,
            },
          },
          application: true, // tetap include untuk info status lamaran
        },
        orderBy: { [sortBy]: sortOrder },
        take,
        skip: (page - 1) * take,
      }),
      this.prisma.testResult.count({ where: whereClause }),
    ]);

    return {
      data: results,
      meta: { page, take, total },
    };
  };
  // ========================= ADMIN - FEATUR 2 (END) =========================

  // ========================= USER - FEATUR 1 (START) =========================
  // Ambil soal untuk dikerjakan user (tanpa correctAnswer)
  takeTest = async (jobId: number, userId: number) => {
    const test = await this.prisma.preSelectionTest.findFirst({
      where: { jobId, job: { preTest: true, status: "PUBLISHED" } },
      include: {
        questions: {
          omit: { correctAnswer: true },
          include: {
            options: {
              omit: { isCorrect: true },
            },
          },
        },
      },
    });
    if (!test) throw new ApiError("Pre selection test tidak ditemukan", 404);

    const existingResult = await this.prisma.testResult.findUnique({
      where: {
        userId_preSelectionTestId: {
          // Memanfaatkan @@unique constraint
          userId: userId,
          preSelectionTestId: test.id,
        },
      },
    });

    if (existingResult)
      throw new ApiError("Anda sudah mengerjakan tes untuk lowongan ini", 400);

    return test;
  };

  submitTest = async (body: SubmitTestDTO, userId: number) => {
    const { jobId, answers } = body;
    const test = await this.prisma.preSelectionTest.findFirst({
      where: {
        jobId,
        job: { preTest: true, status: "PUBLISHED" },
      },
      include: { questions: true },
    });

    if (!test || test.questions.length === 0)
      throw new ApiError("Tes tidak valid", 404);

    const validQuestionIds = new Set(test.questions.map((q) => q.id));
    const invalidAnswers = answers.filter(
      (a) => !validQuestionIds.has(a.questionId),
    );
    if (invalidAnswers.length > 0)
      throw new ApiError("Terdapat soal yang tidak valid", 400);

    const score = this.calculateScore(test.questions, answers);

    return await this.prisma.$transaction(async (tx) => {
      const existingResult = await tx.testResult.findUnique({
        where: {
          userId_preSelectionTestId: {
            userId,
            preSelectionTestId: test.id,
          },
        },
      });
      if (existingResult)
        throw new ApiError("Anda sudah mengerjakan tes ini", 400);

      const result = await tx.testResult.create({
        data: { userId, preSelectionTestId: test.id, score },
      });
      await tx.application.updateMany({
        where: { userId, jobId },
        data: { testResultId: result.id },
      });
      return result;
    });
  };
  // ========================= USER - FEATUR 1 (END) =========================
}
