// ─── Types ───────────────────────────────────────────────────────────────────

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

export interface GenerateInput {
  contentType: ContentType;
  contentAngle: ContentAngle;
  ctaStyle: CtaStyle;
  notes?: string;
  mediaCount: number;
  serviceTypes?: string[];
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

// ─── Caption templates ────────────────────────────────────────────────────────

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

// ─── Main generator ───────────────────────────────────────────────────────────
//
// Swap this function body for real AI (OpenAI / Claude) once ready.
// The interface stays the same — only the implementation changes.

export function generateDraftContent(input: GenerateInput): GenerateOutput {
  const { contentType, contentAngle, ctaStyle, notes, settings } = input;

  const bodyCaption  = CAPTIONS[contentAngle];
  const ctaLine      = CTA_LINES[ctaStyle];
  const caption      = `${bodyCaption}\n\n${ctaLine}`;

  const baseHashtags  = settings?.defaultHashtags ?? DEFAULT_HASHTAGS;
  const angleHashtags = ANGLE_HASHTAGS[contentAngle];
  const hashtags      = `${baseHashtags} ${angleHashtags}`;

  const hook = contentType !== "POST" ? HOOKS[contentAngle] : null;

  const baseTitle = TITLES[contentAngle];
  const title =
    contentType === "REEL"  ? `Reel — ${baseTitle}` :
    contentType === "STORY" ? `Story — ${baseTitle}` :
    baseTitle;

  const noteLines = [
    "Generated from manual selection via Draft Generator.",
    notes?.trim() ? `Additional notes: ${notes.trim()}` : null,
  ].filter(Boolean);

  return {
    title,
    caption,
    hashtags,
    hook,
    notes: noteLines.join("\n") || null,
  };
}
