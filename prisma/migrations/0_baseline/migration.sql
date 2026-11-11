-- CMT Detailing: baseline of the pre-Prospect production schema (Nov 11, 2026).
-- The production database was built with `prisma db push`, so it holds all of
-- these tables but has NO `_prisma_migrations` history. This migration exists
-- only so `prisma migrate deploy` has something to mark as already applied:
-- it is recorded with `prisma migrate resolve --applied 0_baseline` and its SQL
-- is NEVER executed against production (the tables already exist there).
-- It is a faithful hand-translation of prisma/schema.prisma at parent commit
-- 231d01a (the pre-Prospect schema): every enum, every model, every column,
-- default, unique constraint, index, and foreign key.
-- Generated WITHOUT the Prisma CLI (npm registry unreachable in this VM), so
-- verify against the schema before relying on it for a fresh database.

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'BOOKED', 'LOST');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('LEAD', 'ACTIVE', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SocialContentType" AS ENUM ('POST', 'REEL', 'STORY');

-- CreateEnum
CREATE TYPE "SocialContentStatus" AS ENUM ('IDEA', 'DRAFT', 'NEEDS_APPROVAL', 'APPROVED', 'SCHEDULED', 'POSTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SocialContentSource" AS ENUM ('AUTO_AGENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "SocialAgentRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TrendCategory" AS ENUM ('MOBILE_DETAILING', 'CERAMIC_COATING', 'PAINT_CORRECTION', 'INTERIOR_DETAILING', 'EXTERIOR_DETAILING', 'BEFORE_AFTER_TRANSFORMATIONS', 'SEASONAL_PROTECTION', 'CUSTOMER_EDUCATION', 'LUXURY_CAR_CARE', 'LOCAL_BUSINESS_MARKETING');

-- CreateEnum
CREATE TYPE "TrendType" AS ENUM ('HASHTAG', 'CONTENT_FORMAT', 'CAPTION_STYLE', 'REEL_STRUCTURE', 'AUDIO_IDEA', 'SEASONAL_TOPIC', 'LOCAL_TREND', 'COMPETITOR_INSPIRATION');

-- CreateEnum
CREATE TYPE "TrendResearchRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('ORGANIC_POST', 'REEL', 'VIDEO_AD', 'META_AD', 'STORY', 'CAROUSEL');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('IDEA', 'TREND_REVIEW', 'STRATEGY_PENDING_APPROVAL', 'CREATIVE_PENDING', 'CREATIVE_PENDING_APPROVAL', 'VIDEO_RENDER_PENDING', 'VIDEO_READY_REVIEW', 'APPROVED_TO_PUBLISH', 'PUBLISHED', 'ACTIVE_AD', 'COMPLETED', 'ARCHIVED', 'FAILED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('IMAGE', 'CANVA_DESIGN', 'REMOTION_VIDEO', 'FINAL_VIDEO', 'FINAL_IMAGE', 'COPY_DOC');

-- CreateEnum
CREATE TYPE "AssetProvider" AS ENUM ('VERCEL_BLOB', 'CANVA', 'REMOTION', 'META', 'N8N');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PENDING', 'READY', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AutomationWorkflowType" AS ENUM ('TREND_RESEARCH', 'CLAUDE_STRATEGY', 'CANVA_ASSET_CREATION', 'REMOTION_VIDEO_CREATION', 'META_PUBLISHING', 'META_AD_CREATION', 'PERFORMANCE_SYNC');

-- CreateEnum
CREATE TYPE "AutomationRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "state" TEXT,
    "notes" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "leadSource" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'LEAD',
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "color" TEXT,
    "plate" TEXT,
    "vin" TEXT,
    "nickname" TEXT,
    "notes" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetailJob" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "vehicleId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "serviceType" TEXT,
    "jobDate" TIMESTAMP(3),
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "scheduleStatus" TEXT,
    "location" TEXT,
    "description" TEXT,
    "internalNotes" TEXT,
    "socialSummary" TEXT,
    "price" DOUBLE PRECISION,
    "leadId" TEXT,
    "isSocialReady" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetailJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "vehicleYear" TEXT NOT NULL,
    "vehicleMake" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "serviceRequested" TEXT NOT NULL,
    "town" TEXT NOT NULL,
    "preferredDate" TEXT NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "vehicleCondition" TEXT,
    "notes" TEXT,
    "clientId" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushLog" (
    "id" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "emailFallback" BOOLEAN NOT NULL DEFAULT false,
    "errors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "relatedBookingId" TEXT,
    "relatedClientId" TEXT,
    "relatedVehicleId" TEXT,
    "relatedJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitePhoto" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "socialTitle" TEXT,
    "socialNotes" TEXT,
    "contentScore" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "marketingScore" INTEGER NOT NULL DEFAULT 0,
    "isSocialReady" BOOLEAN NOT NULL DEFAULT false,
    "isReelCandidate" BOOLEAN NOT NULL DEFAULT false,
    "isPostCandidate" BOOLEAN NOT NULL DEFAULT false,
    "isBeforeAfterCandidate" BOOLEAN NOT NULL DEFAULT false,
    "isFavoriteForSocial" BOOLEAN NOT NULL DEFAULT false,
    "contentTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "serviceType" TEXT,
    "visualCategory" TEXT,
    "contentAngle" TEXT,
    "seasonalRelevance" TEXT,
    "lastReviewedForSocial" TIMESTAMP(3),
    "reviewedByAgent" BOOLEAN NOT NULL DEFAULT false,
    "fileType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration" DOUBLE PRECISION,
    "detailJobId" TEXT,

    CONSTRAINT "SitePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAgentRun" (
    "id" TEXT NOT NULL,
    "status" "SocialAgentRunStatus" NOT NULL DEFAULT 'PENDING',
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "postsTarget" INTEGER NOT NULL DEFAULT 3,
    "reelsTarget" INTEGER NOT NULL DEFAULT 2,
    "draftsCreated" INTEGER NOT NULL DEFAULT 0,
    "postsGenerated" INTEGER NOT NULL DEFAULT 0,
    "reelsGenerated" INTEGER NOT NULL DEFAULT 0,
    "mediaReviewed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialContentDraft" (
    "id" TEXT NOT NULL,
    "type" "SocialContentType" NOT NULL,
    "status" "SocialContentStatus" NOT NULL DEFAULT 'IDEA',
    "source" "SocialContentSource" NOT NULL DEFAULT 'MANUAL',
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "hashtags" TEXT,
    "hook" TEXT,
    "notes" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "instagramPostId" TEXT,
    "generatedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agentRunId" TEXT,
    "detailJobId" TEXT,
    "trendInsightId" TEXT,

    CONSTRAINT "SocialContentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialContentMedia" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "sitePhotoId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialContentMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialTrendIdea" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "popularityScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialTrendIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAgentSettings" (
    "id" TEXT NOT NULL,
    "weeklyPostTarget" INTEGER NOT NULL DEFAULT 3,
    "weeklyReelTarget" INTEGER NOT NULL DEFAULT 2,
    "defaultHashtags" TEXT,
    "brandVoice" TEXT,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "autoGenerateEnabled" BOOLEAN NOT NULL DEFAULT false,
    "preferredPostingDays" TEXT,
    "preferredPostingTimes" TEXT,
    "lastGeneratedAt" TIMESTAMP(3),
    "nextGenerationAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAgentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendResearchSettings" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "researchFrequency" TEXT NOT NULL DEFAULT 'manual',
    "targetPlatforms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "targetHashtags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "competitorAccounts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "serviceCategories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "locationKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "minConfidenceScore" INTEGER NOT NULL DEFAULT 6,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendResearchSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendResearchRun" (
    "id" TEXT NOT NULL,
    "status" "TrendResearchRunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "trendsFound" INTEGER NOT NULL DEFAULT 0,
    "sourcesChecked" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendResearchRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendInsight" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "source" TEXT,
    "category" "TrendCategory" NOT NULL,
    "trendType" "TrendType" NOT NULL,
    "summary" TEXT,
    "suggestedUse" TEXT,
    "exampleHook" TEXT,
    "exampleCaptionAngle" TEXT,
    "hashtags" TEXT,
    "confidenceScore" INTEGER NOT NULL DEFAULT 5,
    "popularityScore" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trendSourceId" TEXT,

    CONSTRAINT "TrendInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationSettings" (
    "id" TEXT NOT NULL,
    "n8nBaseUrl" TEXT,
    "socialWorkflowWebhookUrl" TEXT,
    "trendWorkflowWebhookUrl" TEXT,
    "canvaWorkflowWebhookUrl" TEXT,
    "remotionWorkflowWebhookUrl" TEXT,
    "metaAdsWorkflowWebhookUrl" TEXT,
    "webhookSecret" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingCampaign" (
    "id" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'IDEA',
    "title" TEXT NOT NULL,
    "goal" TEXT,
    "platform" TEXT,
    "campaignBrief" TEXT,
    "approvedStrategy" TEXT,
    "approvedCaption" TEXT,
    "approvedHashtags" TEXT,
    "approvedCreativeNotes" TEXT,
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "budget" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "detailJobId" TEXT,
    "clientId" TEXT,
    "vehicleId" TEXT,
    "trendInsightId" TEXT,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingAsset" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "provider" "AssetProvider" NOT NULL,
    "url" TEXT,
    "thumbnailUrl" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationWorkflowRun" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "workflowType" "AutomationWorkflowType" NOT NULL,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'PENDING',
    "n8nExecutionId" TEXT,
    "inputPayload" JSONB,
    "outputPayload" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationWorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingPerformanceStat" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "postUrl" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costPerLead" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingPerformanceStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignMedia" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sitePhotoId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'general',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMedia_campaignId_sitePhotoId_key" ON "CampaignMedia"("campaignId", "sitePhotoId");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailJob" ADD CONSTRAINT "DetailJob_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailJob" ADD CONSTRAINT "DetailJob_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailJob" ADD CONSTRAINT "DetailJob_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitePhoto" ADD CONSTRAINT "SitePhoto_detailJobId_fkey" FOREIGN KEY ("detailJobId") REFERENCES "DetailJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialContentDraft" ADD CONSTRAINT "SocialContentDraft_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "SocialAgentRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialContentDraft" ADD CONSTRAINT "SocialContentDraft_detailJobId_fkey" FOREIGN KEY ("detailJobId") REFERENCES "DetailJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialContentDraft" ADD CONSTRAINT "SocialContentDraft_trendInsightId_fkey" FOREIGN KEY ("trendInsightId") REFERENCES "TrendInsight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialContentMedia" ADD CONSTRAINT "SocialContentMedia_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "SocialContentDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialContentMedia" ADD CONSTRAINT "SocialContentMedia_sitePhotoId_fkey" FOREIGN KEY ("sitePhotoId") REFERENCES "SitePhoto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendInsight" ADD CONSTRAINT "TrendInsight_trendSourceId_fkey" FOREIGN KEY ("trendSourceId") REFERENCES "TrendSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_detailJobId_fkey" FOREIGN KEY ("detailJobId") REFERENCES "DetailJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_trendInsightId_fkey" FOREIGN KEY ("trendInsightId") REFERENCES "TrendInsight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingAsset" ADD CONSTRAINT "MarketingAsset_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationWorkflowRun" ADD CONSTRAINT "AutomationWorkflowRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPerformanceStat" ADD CONSTRAINT "MarketingPerformanceStat_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMedia" ADD CONSTRAINT "CampaignMedia_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMedia" ADD CONSTRAINT "CampaignMedia_sitePhotoId_fkey" FOREIGN KEY ("sitePhotoId") REFERENCES "SitePhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
