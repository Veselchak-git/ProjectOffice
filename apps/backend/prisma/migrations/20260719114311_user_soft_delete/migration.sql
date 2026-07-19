-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserTableSetting" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "page" TEXT NOT NULL,
    "settings" JSONB NOT NULL,

    CONSTRAINT "UserTableSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTableSetting_userId_page_key" ON "UserTableSetting"("userId", "page");

-- AddForeignKey
ALTER TABLE "UserTableSetting" ADD CONSTRAINT "UserTableSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
