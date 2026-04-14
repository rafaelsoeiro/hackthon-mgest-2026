-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "FeedbackChannel" AS ENUM ('JIRA', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('INCIDENT', 'IMPROVEMENT', 'DOUBT');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "SystemCode" AS ENUM ('GM_CORE', 'GM_SUITE', 'GM_FIN', 'GM_LOG', 'GM_INFRA', 'GM_OTHER');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ROOT_CAUSE_IDENTIFIED', 'EPIC_CREATED');

-- CreateEnum
CREATE TYPE "FeedbackProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "raw_feedbacks" (
    "id" TEXT NOT NULL,
    "channel" "FeedbackChannel" NOT NULL,
    "externalId" TEXT,
    "sourceGroupId" TEXT,
    "sourceGroupName" TEXT,
    "authorId" TEXT,
    "authorName" TEXT,
    "rawContent" TEXT NOT NULL,
    "attachments" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "processingStatus" "FeedbackProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processingError" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_feedbacks" (
    "id" TEXT NOT NULL,
    "raw_feedback_id" TEXT NOT NULL,
    "systemCode" "SystemCode" NOT NULL,
    "feedbackType" "FeedbackType" NOT NULL,
    "severityScore" DOUBLE PRECISION NOT NULL,
    "aiSummary" TEXT NOT NULL,
    "keywordsFound" TEXT[],
    "originalCategory" TEXT,
    "reclassified" BOOLEAN NOT NULL DEFAULT false,
    "scoreS" DOUBLE PRECISION NOT NULL,
    "scoreV" DOUBLE PRECISION NOT NULL,
    "scoreR" DOUBLE PRECISION NOT NULL,
    "scoreT" DOUBLE PRECISION NOT NULL,
    "scoreK" DOUBLE PRECISION NOT NULL,
    "priorityScore" DOUBLE PRECISION NOT NULL,
    "priorityLevel" "PriorityLevel" NOT NULL,
    "overrideApplied" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "embedding" vector(384),
    "incident_group_id" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "manualPriorityLevel" "PriorityLevel",
    "manualAdjustedBy" TEXT,
    "manualAdjustedAt" TIMESTAMP(3),
    "manualAdjustReason" TEXT,

    CONSTRAINT "processed_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_groups" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "systemCode" "SystemCode" NOT NULL,
    "feedbackType" "FeedbackType" NOT NULL,
    "priorityScore" DOUBLE PRECISION NOT NULL,
    "priorityLevel" "PriorityLevel" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "feedbackCount" INTEGER NOT NULL DEFAULT 1,
    "recurrenceCount" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "rootCauseSummary" TEXT,
    "epicJiraKey" TEXT,
    "centroidEmbedding" vector(384),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_occurrences" (
    "id" TEXT NOT NULL,
    "incident_group_id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "scoreSnapshot" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "incident_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_windows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startHour" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL DEFAULT 0,
    "endHour" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL DEFAULT 0,
    "boost" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keyword_rules" (
    "id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "scoreK" INTEGER NOT NULL,
    "forceOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideMinPS" INTEGER,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keyword_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jira_sync_logs" (
    "id" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL,
    "issuesFetched" INTEGER NOT NULL,
    "issuesCreated" INTEGER NOT NULL,
    "issuesFailed" INTEGER NOT NULL,
    "lastJiraUpdated" TIMESTAMP(3),
    "errorDetails" JSONB,

    CONSTRAINT "jira_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_groups" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "memberCount" INTEGER,
    "isMonitored" BOOLEAN NOT NULL DEFAULT true,
    "systemHint" "SystemCode",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raw_feedbacks_channel_receivedAt_idx" ON "raw_feedbacks"("channel", "receivedAt");

-- CreateIndex
CREATE INDEX "raw_feedbacks_processingStatus_idx" ON "raw_feedbacks"("processingStatus");

-- CreateIndex
CREATE INDEX "raw_feedbacks_externalId_idx" ON "raw_feedbacks"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "processed_feedbacks_raw_feedback_id_key" ON "processed_feedbacks"("raw_feedback_id");

-- CreateIndex
CREATE INDEX "processed_feedbacks_systemCode_processedAt_idx" ON "processed_feedbacks"("systemCode", "processedAt");

-- CreateIndex
CREATE INDEX "processed_feedbacks_priorityLevel_priorityScore_idx" ON "processed_feedbacks"("priorityLevel", "priorityScore" DESC);

-- CreateIndex
CREATE INDEX "processed_feedbacks_incident_group_id_idx" ON "processed_feedbacks"("incident_group_id");

-- CreateIndex
CREATE INDEX "incident_groups_systemCode_priorityLevel_idx" ON "incident_groups"("systemCode", "priorityLevel");

-- CreateIndex
CREATE INDEX "incident_groups_status_lastSeenAt_idx" ON "incident_groups"("status", "lastSeenAt");

-- CreateIndex
CREATE INDEX "incident_occurrences_incident_group_id_occurredAt_idx" ON "incident_occurrences"("incident_group_id", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_groups_group_id_key" ON "whatsapp_groups"("group_id");

-- AddForeignKey
ALTER TABLE "processed_feedbacks" ADD CONSTRAINT "processed_feedbacks_raw_feedback_id_fkey" FOREIGN KEY ("raw_feedback_id") REFERENCES "raw_feedbacks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processed_feedbacks" ADD CONSTRAINT "processed_feedbacks_incident_group_id_fkey" FOREIGN KEY ("incident_group_id") REFERENCES "incident_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_occurrences" ADD CONSTRAINT "incident_occurrences_incident_group_id_fkey" FOREIGN KEY ("incident_group_id") REFERENCES "incident_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
