// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentType = "POST" | "REEL" | "STORY";

export type ContentAngle =
  | "before-after"
  | "mobile-detailing"
  | "interior-refresh"
  | "exterior-gloss"
  | "paint-correction"
  | "ceramic-protection"
  | "maintenance-detail"
  | "customer-education"
  | "seasonal-protection";

export type CtaStyle =
  | "book-now"
  | "request-quote"
  | "dm-to-schedule"
  | "learn-more"
  | "soft-luxury";

export const CONTENT_ANGLES: { key: ContentAngle; label: string }[] = [
  { key: "before-after",        label: "Before / After Transformation" },
  { key: "mobile-detailing",    label: "Premium Mobile Detailing" },
  { key: "interior-refresh",    label: "Interior Refresh" },
  { key: "exterior-gloss",      label: "Exterior Gloss" },
  { key: "paint-correction",    label: "Paint Correction" },
  { key: "ceramic-protection",  label: "Ceramic Protection" },
  { key: "maintenance-detail",  label: "Maintenance Detail" },
  { key: "customer-education",  label: "Customer Education" },
  { key: "seasonal-protection", label: "Seasonal Protection" },
];

export const CTA_STYLES: { key: CtaStyle; label: string }[] = [
  { key: "book-now",       label: "Book Now" },
  { key: "request-quote",  label: "Request a Quote" },
  { key: "dm-to-schedule", label: "DM to Schedule" },
  { key: "learn-more",     label: "Learn More" },
  { key: "soft-luxury",    label: "Soft Luxury CTA" },
];

// Trend context passed from the Weekly Agent when an active TrendInsight is selected
export interface TrendContext {
  id?: string;
  title: string;
  exampleHook?: string | null;
  exampleCaptionAngle?: string | null;
  hashtags?: string | null;
  suggestedUse?: string | null;
}

export interface GenerateInput {
  contentType: ContentType;
  contentAngle: ContentAngle;
  ctaStyle: CtaStyle;
  notes?: string;
  mediaCount: number;
  serviceTypes?: string[];
  // Job / client / vehicle context (populated by the Weekly Agent; empty for manual drafts)
  vehicleInfo?: { year?: string | null; make?: string | null; model?: string | null; color?: string | null } | null;
  clientName?: string | null;
  jobServiceType?: string | null;
  jobDate?: string | null;
  mediaLabels?: string[];
  trendInsight?: TrendContext | null;
  settings?: {
    defaultHashtags?: string | null;
    brandVoice?: string | null;
    approvalRequired?: boolean;
  } | null;
}

export interface GenerateOutput {
  title: string;
  caption: string;
  hashtags: string;
  hook: string | null;
  notes: string | null;
}

// ─── Caption body templates ───────────────────────────────────────────────────

const CAPTIONS: Record<ContentAngle, string> = {
  "before-after":
    "The difference detail makes. This vehicle came in dull, swirled, and faded — it left with clean paint, crisp lines, and a finish worth protecting. Every job we do is a transformation worth showing.",
  "mobile-detailing":
    "We bring the detail to you. No drop-off, no waiting around — professional mobile detailing at your home or office in Taunton, MA. Clean results, reliable service, every time.",
  "interior-refresh":
    "Every surface cleaned, every corner addressed. Interior detailing done right means starting fresh — vacuumed, steam cleaned, and restored to the way it should feel inside.",
  "exterior-gloss":
    "Clean paint, crisp reflections, and protection that makes maintenance easier. This vehicle received a focused exterior detail designed to restore gloss and leave the finish looking sharp.",
  "paint-correction":
    "Swirl marks removed. Scratches minimized. The paint restored to the clarity it had when the car was new. Machine polishing done right — by hand where it counts.",
  "ceramic-protection":
    "Ceramic coating is the last detail you'll need to worry about for a long time. Hydrophobic protection, UV resistance, and a gloss that maintains itself. Applied right, it lasts years.",
  "maintenance-detail":
    "Consistency is how you protect your investment. Regular maintenance details keep your vehicle looking sharp without the need for full correction down the road. Stay on top of it.",
  "customer-education":
    "What's the difference between a wash and a detail? A wash removes surface dirt. A detail removes contamination, restores paint clarity, and protects every surface. Know what your vehicle actually needs.",
  "seasonal-protection":
    "Before the elements take their toll, protect what you've built. Seasonal protection details are the smart move — clean the damage of the past season, seal against the next one.",
};

// ─── Hook templates (for Reels / Stories) ────────────────────────────────────

const HOOKS: Record<ContentAngle, string> = {
  "before-after":        "Wait until you see the difference a single detail makes.",
  "mobile-detailing":    "We come to you — no drop-off, no hassle.",
  "interior-refresh":    "From grimy to clean — this is what an interior refresh actually looks like.",
  "exterior-gloss":      "This is what a proper exterior detail actually looks like.",
  "paint-correction":    "Removing years of swirl marks in one session.",
  "ceramic-protection":  "Why ceramic coating is worth every cent.",
  "maintenance-detail":  "This is how you protect your investment long term.",
  "customer-education":  "Most people don't know the difference — here it is.",
  "seasonal-protection": "Protect your paint before the next season hits.",
};

// ─── CTA lines ────────────────────────────────────────────────────────────────

const CTA_LINES: Record<CtaStyle, string> = {
  "book-now":       "Ready to book? Request a detail at cmtdetailing.com — we come to you.",
  "request-quote":  "Ready to bring your vehicle back to life? Request a quote with CMT Detailing.",
  "dm-to-schedule": "DM us to schedule your detail in Taunton, MA and surrounding areas.",
  "learn-more":     "Learn more about our services and availability at cmtdetailing.com.",
  "soft-luxury":    "Your vehicle deserves better. Let's make it right — CMT Detailing.",
};

// ─── Title templates ──────────────────────────────────────────────────────────

const TITLES: Record<ContentAngle, string> = {
  "before-after":        "Before & After Transformation",
  "mobile-detailing":    "Mobile Detailing — Taunton, MA",
  "interior-refresh":    "Interior Refresh Detail",
  "exterior-gloss":      "Exterior Detail — Gloss Restore",
  "paint-correction":    "Paint Correction",
  "ceramic-protection":  "Ceramic Coating Protection",
  "maintenance-detail":  "Maintenance Detail",
  "customer-education":  "What Makes a Real Detail",
  "seasonal-protection": "Seasonal Protection Detail",
};

// ─── Angle-specific hashtags ──────────────────────────────────────────────────

const ANGLE_HASHTAGS: Record<ContentAngle, string> = {
  "before-after":        "#BeforeAfter #DetailTransformation",
  "mobile-detailing":    "#WeComeToYou #MobileService",
  "interior-refresh":    "#InteriorDetailing #AutoInterior",
  "exterior-gloss":      "#ExteriorDetailing #CarGloss",
  "paint-correction":    "#PaintCorrection #SwirlRemoval #MachinePolish",
  "ceramic-protection":  "#CeramicCoating #PaintProtection",
  "maintenance-detail":  "#MaintenanceDetail #CarCare",
  "customer-education":  "#DetailingTips #CarCare101",
  "seasonal-protection": "#SeasonalDetail #WinterCarCare",
};

const DEFAULT_HASHTAGS =
  "#CMTDetailing #MobileDetailing #TauntonMA #AutoDetailing #CarDetailing #MassachusettsDetailing";

// ─── Vehicle-specific opening lines ──────────────────────────────────────────

function buildVehicleOpener(
  vehicleInfo: GenerateInput["vehicleInfo"],
  angle: ContentAngle
): string {
  if (!vehicleInfo?.make) return "";

  const parts   = [vehicleInfo.year, vehicleInfo.color, vehicleInfo.make, vehicleInfo.model].filter(Boolean);
  const vehicle = parts.join(" ");

  const openers: Record<ContentAngle, string> = {
    "before-after":
      `This ${vehicle} came in needing a complete transformation — it left looking like a different car.`,
    "mobile-detailing":
      `We brought the full detail experience directly to this ${vehicle} owner.`,
    "interior-refresh":
      `The interior on this ${vehicle} was overdue for a proper deep clean and refresh.`,
    "exterior-gloss":
      `This ${vehicle} received a focused exterior detail to restore the gloss and protect the paint.`,
    "paint-correction":
      `This ${vehicle} came in with heavy swirl marks throughout — machine correction brought the paint back to life.`,
    "ceramic-protection":
      `This ${vehicle} is now protected for years with a full ceramic coating application.`,
    "maintenance-detail":
      `Keeping this ${vehicle} in top condition with a regular maintenance detail.`,
    "customer-education":
      `Here's a look at what we found on this ${vehicle} and exactly how we addressed it.`,
    "seasonal-protection":
      `Getting this ${vehicle} protected and sealed before the season changes.`,
  };

  return openers[angle];
}

// ─── Main generator ───────────────────────────────────────────────────────────
//
// Swap this function body for real AI (OpenAI / Claude) once ready.
// The interface is stable — only the implementation changes.

export function generateDraftContent(input: GenerateInput): GenerateOutput {
  const {
    contentType, contentAngle, ctaStyle, notes, settings,
    vehicleInfo, clientName, jobServiceType, jobDate, mediaLabels, trendInsight,
  } = input;

  // ── Caption ─────────────────────────────────────────────────────────────────

  const vehicleOpener = buildVehicleOpener(vehicleInfo, contentAngle);

  // If the trend insight supplies a caption angle, use it as a framing sentence
  // before the standard body paragraph
  const trendFrame  = trendInsight?.exampleCaptionAngle?.trim() ?? null;
  const bodyCaption = CAPTIONS[contentAngle];
  const ctaLine     = CTA_LINES[ctaStyle];

  const hasBeforeAfter = mediaLabels?.some((l) => /before|after/i.test(l));
  const swipeLine      = hasBeforeAfter ? "Swipe to see the full transformation." : null;

  const captionParts = [vehicleOpener, trendFrame, bodyCaption, swipeLine, ctaLine].filter(Boolean);
  const caption      = captionParts.join("\n\n");

  // ── Hashtags ─────────────────────────────────────────────────────────────────

  const baseHashtags  = settings?.defaultHashtags ?? DEFAULT_HASHTAGS;
  const angleHashtags = ANGLE_HASHTAGS[contentAngle];
  const trendHashtags = trendInsight?.hashtags?.trim() ?? "";
  const hashtags      = [baseHashtags, angleHashtags, trendHashtags].filter(Boolean).join(" ");

  // ── Hook ─────────────────────────────────────────────────────────────────────

  let hook: string | null = null;
  if (contentType !== "POST") {
    // Prefer trend-supplied hook, fall back to template
    hook = trendInsight?.exampleHook?.trim() ?? HOOKS[contentAngle];
  }

  // ── Title ────────────────────────────────────────────────────────────────────

  const baseTitle    = TITLES[contentAngle];
  const vehicleLabel = vehicleInfo?.make
    ? ` — ${[vehicleInfo.make, vehicleInfo.model].filter(Boolean).join(" ")}`
    : "";
  const typePrefix =
    contentType === "REEL"  ? "Reel — " :
    contentType === "STORY" ? "Story — " : "";
  const title = `${typePrefix}${baseTitle}${vehicleLabel}`;

  // ── Notes (admin-facing context) ──────────────────────────────────────────

  const isFromAgent = !!(clientName || vehicleInfo?.make || jobServiceType || trendInsight);
  const noteLines: string[] = [];

  if (clientName)       noteLines.push(`Client: ${clientName}`);
  if (vehicleInfo?.make) {
    const veh = [vehicleInfo.year, vehicleInfo.make, vehicleInfo.model].filter(Boolean).join(" ");
    noteLines.push(`Vehicle: ${veh}`);
  }
  if (jobServiceType)   noteLines.push(`Service: ${jobServiceType}`);
  if (jobDate)          noteLines.push(`Job date: ${jobDate}`);
  if (trendInsight)     noteLines.push(`Trend reference: ${trendInsight.title}`);
  if (notes?.trim())    noteLines.push(notes.trim());

  noteLines.push(
    isFromAgent
      ? `Auto-generated by Weekly Agent v2.`
      : "Generated from manual selection via Draft Generator."
  );

  return {
    title,
    caption,
    hashtags,
    hook,
    notes: noteLines.join("\n"),
  };
}
