/**
 * Placeholder Trend Provider — v1
 *
 * Generates structured TrendInsight candidates from seeded detailing patterns.
 * No external API calls. Safe to run in any environment.
 *
 * Replace/supplement with real providers (instagramGraphProvider, publicWebProvider)
 * when API credentials are available.
 */

import type { TrendProvider, TrendCandidate, TrendResearchContext } from "./trendProviderTypes";

// Expiry: 30 days from now (trends should be reviewed monthly)
const thirtyDaysOut = () => new Date(Date.now() + 30 * 86_400_000);

const SEEDED_TRENDS: Omit<TrendCandidate, "source">[] = [
  {
    title:               "Before/After Transformation Carousel",
    platform:            "Instagram",
    category:            "BEFORE_AFTER_TRANSFORMATIONS",
    trendType:           "CONTENT_FORMAT",
    summary:             "Side-by-side or swipe-through before/after posts consistently top engagement charts in the detailing niche. Viewers stop to compare, save, and share the results.",
    suggestedUse:        "Use for any job where you captured media at intake and at delivery. Lead with the worst before shot, close with the cleanest after.",
    exampleHook:         "Wait until you see what this car looked like before we touched it.",
    exampleCaptionAngle: "Before and afters are consistently the highest-performing content in detailing — here is this week's transformation.",
    hashtags:            "#BeforeAndAfter #DetailTransformation #CarDetailingTransformation #AutoDetail",
    confidenceScore:     9,
    popularityScore:     9,
    expiresAt:           thirtyDaysOut(),
  },
  {
    title:               "Dirty Interior Reset Reel",
    platform:            "Instagram",
    category:            "INTERIOR_DETAILING",
    trendType:           "REEL_STRUCTURE",
    summary:             "Short-form reels showing a heavily soiled interior being reset to showroom condition. High emotional payoff — viewers feel the satisfaction of the transformation.",
    suggestedUse:        "Film the intake condition, key cleaning moments, and the final reveal. 30–60 seconds works best. No narration needed — let the visuals speak.",
    exampleHook:         "This interior was a disaster. Watch the full reset.",
    exampleCaptionAngle: "Interior reels that show the full cleaning process stop scrollers cold — the dirtier the start, the better the payoff.",
    hashtags:            "#DirtyToClean #InteriorDetail #CarInterior #DeepClean",
    confidenceScore:     8,
    popularityScore:     9,
    expiresAt:           thirtyDaysOut(),
  },
  {
    title:               "Satisfying Wheel Cleaning Reel",
    platform:            "Instagram",
    category:            "EXTERIOR_DETAILING",
    trendType:           "REEL_STRUCTURE",
    summary:             "Wheel cleaning content — especially with iron remover bleeding, pressure washing, and brush work — performs exceptionally well due to its visually satisfying nature.",
    suggestedUse:        "Capture the wheel at its worst, show the chemical reaction if using iron remover, then the rinse and dry. Even a 15-second clip can perform.",
    exampleHook:         "There is something deeply satisfying about a perfectly clean wheel.",
    exampleCaptionAngle: "Wheel cleaning content performs well because viewers find the transformation visually satisfying — and it opens the door to paint protection conversations.",
    hashtags:            "#WheelCleaning #DetailingASMR #SatisfyingCars #CleanWheels",
    confidenceScore:     7,
    popularityScore:     8,
    expiresAt:           thirtyDaysOut(),
  },
  {
    title:               "Ceramic Coating Water Beading Demo",
    platform:            "Instagram",
    category:            "CERAMIC_COATING",
    trendType:           "CONTENT_FORMAT",
    summary:             "Hydrophobic water-beading demos are one of the top-performing content formats for ceramic coating providers. They show the result in a single clip that requires no explanation.",
    suggestedUse:        "After any ceramic coating job, film water being poured or sprayed over the hood or roof. Slow-motion increases impact significantly.",
    exampleHook:         "This is what ceramic coating looks like in the rain.",
    exampleCaptionAngle: "Hydrophobic demos consistently drive ceramic coating inquiries — one 10-second clip communicates the value better than any paragraph.",
    hashtags:            "#CeramicCoating #WaterBeading #Hydrophobic #PaintProtection",
    confidenceScore:     9,
    popularityScore:     8,
    expiresAt:           thirtyDaysOut(),
  },
  {
    title:               "Paint Correction Reflection Shot",
    platform:            "Instagram",
    category:            "PAINT_CORRECTION",
    trendType:           "CONTENT_FORMAT",
    summary:             "Close-up reflection shots after paint correction show a mirror-like finish that immediately communicates quality. Side-by-side with swirled paint is particularly powerful.",
    suggestedUse:        "Use a phone or camera to capture the sky or a light source reflecting perfectly in the corrected panel. Post as a standalone reveal or part of a before/after series.",
    exampleHook:         "This is what machine polishing actually does to your paint.",
    exampleCaptionAngle: "Reflection shots after paint correction show the value of the work better than any description could — the paint does the talking.",
    hashtags:            "#PaintCorrection #SwirlRemoval #MachinePolish #PaintPolish",
    confidenceScore:     8,
    popularityScore:     7,
    expiresAt:           thirtyDaysOut(),
  },
  {
    title:               "Mobile Detailing Day-in-the-Life",
    platform:            "Instagram",
    category:            "MOBILE_DETAILING",
    trendType:           "REEL_STRUCTURE",
    summary:             "Day-in-the-life reels build trust with local audiences by showing the human side of the business — the setup, the drive, the work, the client handoff.",
    suggestedUse:        "Capture quick clips throughout one job day: loading the van, arriving at the client's home, setting up, working, the reveal. Stitch into a 30–60 second reel.",
    exampleHook:         "A day in the life of a mobile detailer in Massachusetts.",
    exampleCaptionAngle: "Day-in-the-life content builds trust with local audiences by making your process visible — people hire who they know and trust.",
    hashtags:            "#MobileDetailing #DetailLife #BehindTheScenes #MobileDetailer",
    confidenceScore:     8,
    popularityScore:     8,
    expiresAt:           thirtyDaysOut(),
  },
  {
    title:               "Maintenance Detail Education Post",
    platform:            "Instagram",
    category:            "CUSTOMER_EDUCATION",
    trendType:           "CAPTION_STYLE",
    summary:             "Education posts explaining the difference between a wash, a detail, and a maintenance detail perform well with saves — meaning Instagram pushes them to more people over time.",
    suggestedUse:        "Write a caption that clearly explains what a maintenance detail is, what it costs, and why regular clients save money long-term. Pair with a clean-car photo.",
    exampleHook:         "Most people don't know the difference between a car wash and a detail. Here it is.",
    exampleCaptionAngle: "Education posts that explain what a detail actually is drive saves, shares, and future bookings — especially from people who've never hired a detailer.",
    hashtags:            "#CarCare101 #DetailingTips #AutoDetailing #CarMaintenance",
    confidenceScore:     7,
    popularityScore:     7,
    expiresAt:           thirtyDaysOut(),
  },
  {
    title:               "Seasonal Protection Tips Carousel",
    platform:            "Instagram",
    category:            "SEASONAL_PROTECTION",
    trendType:           "SEASONAL_TOPIC",
    summary:             "Seasonal content performs well because it feels timely and urgent. Tips for protecting paint before winter, or removing winter grime in spring, resonate with local audiences.",
    suggestedUse:        "Create a 3–5 slide carousel with actionable tips. End with a soft CTA to book before the season hits. Tailor language to current weather in Taunton / South Shore MA.",
    exampleHook:         "Your car isn't ready for this season. Here is what to do.",
    exampleCaptionAngle: "Seasonal protection content feels timely and urgent — and local audiences respond because the conditions you're describing are exactly what they're dealing with.",
    hashtags:            "#SeasonalDetail #CarProtection #WinterCarCare #SpringDetail",
    confidenceScore:     8,
    popularityScore:     7,
    expiresAt:           thirtyDaysOut(),
  },
  {
    title:               "Luxury Car Care: Myth vs Fact",
    platform:            "Instagram",
    category:            "LUXURY_CAR_CARE",
    trendType:           "CONTENT_FORMAT",
    summary:             "Myth-vs-fact posts drive saves and shares, which are Instagram's strongest engagement signals. Works especially well for luxury or high-end vehicle owners who are skeptical about detailing.",
    suggestedUse:        "Pick 3–5 common misconceptions about car care and pair each with the correct answer. E.g., 'Myth: Automatic car washes are fine. Fact: They cause swirl marks in your clear coat.'",
    exampleHook:         "The biggest myth about luxury car detailing — and why it costs people thousands.",
    exampleCaptionAngle: "Myth-vs-fact posts drive saves and shares because people want to screenshot and keep them — which tells Instagram to show the post to more people.",
    hashtags:            "#LuxuryCars #CarFacts #DetailingFacts #AutoMyths",
    confidenceScore:     7,
    popularityScore:     8,
    expiresAt:           thirtyDaysOut(),
  },
  {
    title:               "Things Detailers Notice Immediately Reel",
    platform:            "Instagram",
    category:            "CUSTOMER_EDUCATION",
    trendType:           "REEL_STRUCTURE",
    summary:             "POV and list-style reels perform exceptionally well in the automotive niche. 'Things X notices immediately' is a proven scroll-stopping format that drives curiosity and shares.",
    suggestedUse:        "Film a quick intake walk-around with voiceover or text overlays pointing out swirl marks, missed spots, contamination, etc. Keep it under 30 seconds.",
    exampleHook:         "Things detailers notice the second they open your car door.",
    exampleCaptionAngle: "POV-style reels that reveal what professionals see create curiosity and make viewers inspect their own car — which turns into a booking.",
    hashtags:            "#DetailerEye #CarLife #AutoDetailing #DetailingReels",
    confidenceScore:     8,
    popularityScore:     9,
    expiresAt:           thirtyDaysOut(),
  },
];

export const placeholderProvider: TrendProvider = {
  name: "Placeholder / Seeded Patterns",

  isAvailable() {
    return true;
  },

  async research(_context: TrendResearchContext): Promise<TrendCandidate[]> {
    return SEEDED_TRENDS.map((t) => ({
      ...t,
      source: "Trend Research Agent v1 — Seeded Patterns",
    }));
  },
};
