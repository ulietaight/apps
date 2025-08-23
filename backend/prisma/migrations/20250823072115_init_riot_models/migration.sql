-- CreateTable
CREATE TABLE "RiotAccount" (
    "puuid" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "tagLine" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiotAccount_pkey" PRIMARY KEY ("puuid")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "puuid" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RiotAccount_gameName_tagLine_idx" ON "RiotAccount"("gameName", "tagLine");

-- CreateIndex
CREATE INDEX "Match_puuid_idx" ON "Match"("puuid");
