import { prisma } from "@/lib/prisma";
import AutomationHubClient from "@/components/AutomationHubClient";
import type { CampaignRow, WorkflowRunRow, AssetRow, SettingsRow } from "@/components/AutomationHubClient";

export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  const [campaigns, workflowRuns, recentAssets, settings] = await Promise.all([
    prisma.marketingCampaign.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        assets: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { id: true, type: true, status: true, url: true, thumbnailUrl: true, title: true },
        },
        workflowRuns: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, status: true, workflowType: true, createdAt: true, errorMessage: true },
        },
        performanceStats: {
          orderBy: { date: "desc" },
          take: 1,
          select: { impressions: true, reach: true, likes: true, spend: true, leads: true },
        },
        client:       { select: { id: true, fullName: true } },
        trendInsight: { select: { id: true, title: true } },
      },
    }),
    prisma.automationWorkflowRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        campaign: { select: { id: true, title: true, type: true } },
      },
    }),
    prisma.marketingAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        campaign: { select: { id: true, title: true } },
      },
    }),
    prisma.automationSettings.findFirst(),
  ]);

  const serializedCampaigns: CampaignRow[] = campaigns.map((c) => ({
    id:           c.id,
    type:         c.type,
    status:       c.status,
    title:        c.title,
    goal:         c.goal,
    platform:     c.platform,
    budget:       c.budget,
    createdAt:    c.createdAt.toISOString(),
    updatedAt:    c.updatedAt.toISOString(),
    approvedStrategy:      c.approvedStrategy,
    approvedCaption:       c.approvedCaption,
    approvedHashtags:      c.approvedHashtags,
    approvedCreativeNotes: c.approvedCreativeNotes,
    isTest:                c.isTest,
    client:       c.client,
    trendInsight: c.trendInsight,
    assets:       c.assets.map((a) => ({
      id:          a.id,
      type:        a.type,
      status:      a.status,
      url:         a.url,
      thumbnailUrl:a.thumbnailUrl,
      title:       a.title,
    })),
    latestRun: c.workflowRuns[0]
      ? {
          id:           c.workflowRuns[0].id,
          status:       c.workflowRuns[0].status,
          workflowType: c.workflowRuns[0].workflowType,
          createdAt:    c.workflowRuns[0].createdAt.toISOString(),
          errorMessage: c.workflowRuns[0].errorMessage,
        }
      : null,
    latestStats: c.performanceStats[0] ?? null,
  }));

  const serializedRuns: WorkflowRunRow[] = workflowRuns.map((r) => ({
    id:             r.id,
    campaignId:     r.campaignId,
    workflowType:   r.workflowType,
    status:         r.status,
    n8nExecutionId: r.n8nExecutionId,
    errorMessage:   r.errorMessage,
    startedAt:      r.startedAt?.toISOString()   ?? null,
    completedAt:    r.completedAt?.toISOString()  ?? null,
    createdAt:      r.createdAt.toISOString(),
    campaign:       r.campaign ?? null,
  }));

  const serializedAssets: AssetRow[] = recentAssets.map((a) => ({
    id:          a.id,
    campaignId:  a.campaignId,
    type:        a.type,
    provider:    a.provider,
    url:         a.url,
    thumbnailUrl:a.thumbnailUrl,
    title:       a.title,
    status:      a.status,
    createdAt:   a.createdAt.toISOString(),
    campaign:    a.campaign ?? null,
  }));

  const serializedSettings: SettingsRow | null = settings
    ? {
        id:                         settings.id,
        n8nBaseUrl:                 settings.n8nBaseUrl,
        socialWorkflowWebhookUrl:   settings.socialWorkflowWebhookUrl,
        trendWorkflowWebhookUrl:    settings.trendWorkflowWebhookUrl,
        canvaWorkflowWebhookUrl:    settings.canvaWorkflowWebhookUrl,
        remotionWorkflowWebhookUrl: settings.remotionWorkflowWebhookUrl,
        metaAdsWorkflowWebhookUrl:  settings.metaAdsWorkflowWebhookUrl,
        webhookSecretIsSet:         !!settings.webhookSecret,
        isEnabled:                  settings.isEnabled,
      }
    : null;

  return (
    <AutomationHubClient
      initialCampaigns={serializedCampaigns}
      initialRuns={serializedRuns}
      initialAssets={serializedAssets}
      initialSettings={serializedSettings}
    />
  );
}
