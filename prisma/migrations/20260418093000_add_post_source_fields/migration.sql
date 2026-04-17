-- AlterTable
ALTER TABLE "Post" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "Post" ADD COLUMN "sourceHost" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Post_sourceUrl_key" ON "Post"("sourceUrl");
