-- CreateTable
CREATE TABLE "AiProbe" (
    "id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiProbe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiProbe_host_key" ON "AiProbe"("host");

-- CreateIndex
CREATE INDEX "AiProbe_requestedBy_createdAt_idx" ON "AiProbe"("requestedBy", "createdAt");
