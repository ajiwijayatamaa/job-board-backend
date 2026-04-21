-- CreateTable
CREATE TABLE "test_answers" (
    "id" SERIAL NOT NULL,
    "test_result_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "selected_answer" VARCHAR(255) NOT NULL,

    CONSTRAINT "test_answers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_test_result_id_fkey" FOREIGN KEY ("test_result_id") REFERENCES "test_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "test_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
