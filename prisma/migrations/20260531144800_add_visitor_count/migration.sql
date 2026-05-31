-- CreateTable
CREATE TABLE "VisitorCount" (
    "id" SERIAL NOT NULL,
    "recordId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitorCount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitorCount_recordId_key" ON "VisitorCount"("recordId");

-- AddForeignKey
ALTER TABLE "VisitorCount" ADD CONSTRAINT "VisitorCount_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "AttendanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
