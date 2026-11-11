-- CMT Detailing: add Prospect model for the admin Prospects section (Nov 11, 2026).
-- Additive only: creates one new table + one new enum. No existing table is touched.
-- Seeds the 28 ranked prospects (11 A / 9 B / 8 C) + 22 excluded/watchlist rows
-- from prospect scans #1-3. Nothing here has been contacted; Cameron sends all DMs himself.

-- CreateEnum
CREATE TYPE "ProspectStatus" AS ENUM ('STAGED', 'SENT', 'REPLIED', 'BOOKED', 'NO_RESPONSE', 'EXCLUDED', 'WATCHLIST');

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "tier" TEXT,
    "isProvisional" BOOLEAN NOT NULL DEFAULT false,
    "followers" TEXT,
    "localPctEst" TEXT,
    "town" TEXT,
    "category" TEXT NOT NULL,
    "mentionCode" TEXT,
    "dmDraft" TEXT,
    "dmDraftStatus" TEXT,
    "status" "ProspectStatus" NOT NULL DEFAULT 'STAGED',
    "dateAdded" TIMESTAMP(3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_handle_key" ON "Prospect"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "Prospect_mentionCode_key" ON "Prospect"("mentionCode");

-- Seed: 28 prospects + 22 excluded/watchlist rows (from prospect-scan-1/2/3 + master Excel).
INSERT INTO "Prospect" ("id", "handle", "tier", "isProvisional", "followers", "localPctEst", "town", "category", "mentionCode", "dmDraft", "dmDraftStatus", "status", "dateAdded", "sortOrder", "notes") VALUES
($p$prospect_01$p$, $p$@silver_city_stance$p$, $p$A$p$, false, $p$unverified$p$, $p$~90%$p$, $p$Taunton$p$, $p$Car club / meet host$p$, $p$CMT-SILVERCITY$p$, $p$Hey — Cameron from CMT Detailing in Taunton. I was at the "We Need You Here" show on Weir St in August and the turnout you pulled for The Kacie Project was unreal — the silver 370Z and purple WRX on the flyer, the whole lot packed. That's the Taunton car scene at its best.

I'd love to detail one of the club's hero cars for free — a full interior + exterior detail (normally $250–350), about 3 hours, at your driveway. I bring my own water and power, so anywhere works. In exchange I'd just ask for a grid reel or post + 3 stories tagging @cmt_detailing with my booking link, posted within a week of the detail, and I keep repost rights.

One timing note: I'm off for school until summer, so the detail itself would be booked for my restart on May 1, 2027 — you'd be one of the first cars I do when I'm back. If that works, anyone who books through you just mentions "SILVERCITY" and I'll track it.

Want to pick a car and lock in a May slot? — Cameron, CMT Detailing (cmtdetailing.com)$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 1, $p$Taunton's own car club; hosts season opener + Aug 16 charity show, 336 Weir St. Follower count unverified — verify in-app before send. Meet-host rule = Tier A. Month 1 pick — awaiting Luca's approval.$p$),
($p$prospect_02$p$, $p$@streetspecofficial$p$, $p$A$p$, false, $p$~6,600$p$, $p$~85%$p$, $p$Fall River$p$, $p$Meet host / creator$p$, $p$CMT-STREETSPEC$p$, $p$Hey — Cameron from CMT Detailing, mobile detailer based in Taunton. I saw the Cars & Cans meet you ran at Kennedy Park on Oct 10 — free entry, police detail, canned goods for Angels Anonymous, no burnouts, no drama. That's exactly how a meet should be run, and the JDM lineup on the flyer (blue Civic hatch, RX-7, Type R) was clean.

I'd like to offer you a free Full Detail — interior + exterior, normally $250–350, about 3 hours at your driveway, I bring my own water and power. In return: a grid reel or post + 3 stories tagging @cmt_detailing with the booking link, within 7 days of the detail, and I keep repost rights.

Timing: I'm off for school until summer, so the detail would be fulfilled at my May 1, 2027 restart — first-week slot, your pick. Anyone who books through you mentions "STREETSPEC" so I can track it.

Interested? Happy to detail the Evo or whichever car you want shown off. — Cameron, CMT Detailing$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 2, $p$Hosts 'Cars & Cans' charity meet, Kennedy Park Fall River. Brand-safe, family-friendly. Month 1 pick — awaiting Luca's approval.$p$),
($p$prospect_03$p$, $p$@blown69charger$p$, $p$A$p$, false, $p$~300,000$p$, $p$~15–25%$p$, $p$Taunton$p$, $p$Creator (show car)$p$, $p$CMT-BLOWN69$p$, $p$Hey Anthony — Cameron from CMT Detailing in Taunton. Your blown '69 Charger at the "We Need You Here" show on Weir St in August stopped the whole lot — the trailer, the Toretto quote, the crowd around it. You brought a Fast & Furious moment to a Taunton charity show and it showed.

I'd love to give the Charger a free Full Detail — interior + exterior, normally $250–350, about 3 hours, at your driveway (I bring my own water and power, so no hookups needed). In exchange: a grid reel or post + 3 stories tagging @cmt_detailing with the booking link, within 7 days, and I keep repost rights. That black paint after a proper correction-ready detail would film insanely well.

Timing: I'm off for school until summer, so it'd be booked for my May 1, 2027 restart — first-week slot. Your followers can mention "BLOWN69" when they book and I'll track it.

Worth a conversation? — Cameron, CMT Detailing (cmtdetailing.com)$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 3, $p$Anthony Badaracco's blown '69 Charger; audience mostly national Fast & Furious fandom. Value = content/credibility, not direct bookings. Spend an A slot only if Luca wants the halo.$p$),
($p$prospect_04$p$, $p$@vhrdj_$p$, $p$A$p$, false, $p$~7,700$p$, $p$~60%$p$, $p$Massachusetts (VQ scene)$p$, $p$Meet host / creator$p$, $p$CMT-VQ$p$, $p$Hey — Cameron from CMT Detailing, Taunton. Your June 2 VQ meet reel is the best argument I've seen for VQ owners running their own show — the purple G37, the white 370Z, the whole park full, and 2.6K likes from people asking for an invite to the next one. That community is real.

I'd like to offer you a free Full Detail — interior + exterior, normally $250–350, about 3 hours at your driveway, I bring my own water and power. In return: a grid reel or post + 3 stories tagging @cmt_detailing with the booking link, within 7 days of the detail, and I keep repost rights. A clean G37/Q50/370Z after a full detail is exactly the kind of before/after that plays well.

Timing: I'm off for school until summer, so the detail is booked for my May 1, 2027 restart — first-week slot. Your people can mention "VQ" when they book and I'll track it.

Up for it? — Cameron, CMT Detailing$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 4, $p$Hosts VQ-engine meets (G37/Q50/370Z) in MA parks; 2.6K likes on Jun 2 meet reel. Highest-engagement mid-size creator on the list.$p$),
($p$prospect_05$p$, $p$@screamhollywood$p$, $p$A$p$, false, $p$~23,000$p$, $p$~50%$p$, $p$Massachusetts$p$, $p$Meet creator$p$, $p$CMT-HOLLY$p$, $p$Hey Holly — Cameron from CMT Detailing, mobile detailer in Taunton. I watched your Solar Smash reel from Hingham — you heading to the meet just to look at cool cars, then panning across that lineup (green Mustang, white Charger, red Trackhawk, the 350Z convertible) is exactly the energy that makes people actually go to meets.

I'd love to offer you a free Full Detail — interior + exterior, normally $250–350, about 3 hours at your driveway, I bring my own water and power. In return: a grid reel or post + 3 stories tagging @cmt_detailing with the booking link, within 7 days, and I keep repost rights.

Timing: I'm off for school until summer, so it'd be fulfilled at my May 1, 2027 restart — first-week slot, your car, your pick of day. Your followers can mention "HOLLY" when they book.

Interested? — Cameron, CMT Detailing (cmtdetailing.com)$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 5, $p$Holly R — MA car-meet creator; Solar Smash Hingham meet. Local % is MA-wide, not SouthCoast-specific.$p$),
($p$prospect_06$p$, $p$@rexxjones$p$, $p$A$p$, false, $p$~10,000$p$, $p$~55%$p$, $p$Massachusetts$p$, $p$Podcast host / creator$p$, $p$CMT-REXX$p$, $p$Hey Rex — Cameron from CMT Detailing in Taunton. I've been following your Summer Send-Off coverage and the TunerStatus Podcast — you're one of the few people actually documenting the MA car community instead of just posting their own car. That "The Car Community" post from the July 20 show says it all.

I'd like to offer you a free Full Detail — interior + exterior, normally $250–350, about 3 hours at your driveway, I bring my own water and power. In return: a grid reel or post + 3 stories tagging @cmt_detailing with the booking link, within 7 days of the detail, and I keep repost rights. Happy for it to be a podcast segment too if you want — a live before/after on your car.

Timing: I'm off for school until summer, so the detail would be booked for my May 1, 2027 restart — first-week slot. Your listeners can mention "REXX" when they book.

Want to set it up? — Cameron, CMT Detailing$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 6, $p$Host, TunerStatus Podcast; documents Summer Send-Off + MA meets.$p$),
($p$prospect_07$p$, $p$@camdunlapcars$p$, $p$A$p$, false, $p$~26,000$p$, $p$~50%$p$, $p$Massachusetts$p$, $p$Rally organizer / creator$p$, $p$CMT-CAM$p$, $p$Hey Cam — Cameron from CMT Detailing, Taunton. Your season-closer rally reel — Braintree meetup, pizza, then the drive through Miles Standish out to Marconi Beach — is the kind of thing that makes people actually show up. And the black Volvo as the rally car is a great choice.

I'd like to offer you a free Full Detail — interior + exterior, normally $250–350, about 3 hours at your driveway, I bring my own water and power. In return: a grid reel or post + 3 stories tagging @cmt_detailing with the booking link, within 7 days, and I keep repost rights. A rally car that's just done 100+ miles of Cape roads is the perfect before/after.

Timing: I'm off for school until summer, so it'd be fulfilled at my May 1, 2027 restart — first-week slot. Your followers can mention "CAM" when they book.

Interested? — Cameron, CMT Detailing (cmtdetailing.com)$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 7, $p$Organizes MA car rallies (season closer Braintree → Marconi Beach); black Volvo build.$p$),
($p$prospect_08$p$, $p$@torched_c8$p$, $p$A$p$, false, $p$~55,000$p$, $p$~30–40%$p$, $p$Fall River$p$, $p$Show promoter / creator$p$, $p$CMT-TORCHED$p$, $p$Hey — Cameron from CMT Detailing, mobile detailer in Taunton. I saw your posts for the New England Shelby Owners Group charity show at Bristol Community College in Fall River on Oct 3 — the black Shelby with the red-accented wheels, in memory of Chris "Gorilla" Botelho, benefiting a family in need. That's a show with real heart behind it, and your flyer did the work getting cars there.

I'd like to offer you a free Full Detail — interior + exterior, normally $250–350, about 3 hours at your driveway, I bring my own water and power. In return: a grid reel or post + 3 stories tagging @cmt_detailing with the booking link, within 7 days of the detail, and I keep repost rights.

Timing: I'm off for school until summer, so the detail would be booked for my May 1, 2027 restart — first-week slot. Anyone who books through you mentions "TORCHED" and I'll track it.

Want to pick a car and a May date? — Cameron, CMT Detailing$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 8, $p$Promotes New England Shelby Owners Group charity show, Fall River. Audience skews national.$p$),
($p$prospect_09$p$, $p$@streettrendz_metal_art$p$, $p$A$p$, false, $p$~15,000$p$, $p$~55%$p$, $p$Rockland, MA$p$, $p$Show organizer$p$, $p$CMT-SENDOFF$p$, $p$Hey Jamie — Cameron from CMT Detailing, Taunton. Your Summer Send-Off Car Show & Meet in Rockland on Sep 20 looked like the real deal — roll-in at 7am, show cars till 5pm, "roll in, hang out, make memories." A show that runs a full day and still feels welcoming is rare.

I'd like to offer you a free Full Detail — interior + exterior, normally $250–350, about 3 hours at your driveway, I bring my own water and power. In return: a grid reel or post + 3 stories tagging @cmt_detailing with the booking link, within 7 days of the detail, and I keep repost rights.

Timing: I'm off for school until summer, so it'd be fulfilled at my May 1, 2027 restart — first-week slot. Your followers can mention "SENDOFF" when they book.

Interested? — Cameron, CMT Detailing (cmtdetailing.com)$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 9, $p$Jamie Kelly — Summer Send-Off Car Show & Meet, Rockland Sep 20.$p$),
($p$prospect_10$p$, $p$@newbedfordguide$p$, $p$A$p$, false, $p$~90,000$p$, $p$~85%$p$, $p$New Bedford$p$, $p$Local guide page$p$, $p$CMT-NBGUIDE$p$, $p$Hey — Cameron from CMT Detailing, mobile detailer based in Taunton. I saw your live coverage of the Mustangs & More show at Bristol Community College in Fall River on June 20 — 200+ cars, the '57 Bel Air, the skeleton Challenger, the Empire Ford sponsorship. You cover the SouthCoast car scene like nobody else does.

I'd like to offer your team a free Full Detail — interior + exterior, normally $250–350, about 3 hours at the car owner's driveway, I bring my own water and power. A show car or staff car, your pick. In return: a grid reel or post + 3 stories tagging @cmt_detailing with the booking link, within 7 days of the detail, and I keep repost rights.

Timing: I'm off for school until summer, so the detail would be booked for my May 1, 2027 restart — first-week slot. Your readers can mention "NBGUIDE" when they book.

Worth a chat? — Cameron, CMT Detailing$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 10, $p$SouthCoast local guide page; covered Mustangs & More show. General-interest, not car-specific.$p$),
($p$prospect_11$p$, $p$@empirefordofnewbedford$p$, $p$A$p$, false, $p$unverified$p$, $p$~90%$p$, $p$Fall River / New Bedford$p$, $p$Dealership$p$, $p$CMT-EMPIRE$p$, $p$Hey — Cameron from CMT Detailing, mobile detailer in Taunton. Empire's Mustangs & More show at Bristol Community College in Fall River — 8th annual this past June, 200+ cars, family-friendly, free admission — is the best-run dealer-backed show on the SouthCoast, and it shows in the turnout.

I'd like to offer a free Full Detail on a show car or a customer delivery vehicle — interior + exterior, normally $250–350, about 3 hours, on-site, I bring my own water and power. In return: a grid reel or post + 3 stories tagging @cmt_detailing with the booking link, within 7 days, and I keep repost rights. If it goes well, I'd love to talk about being the detailer you recommend when a customer wants their new car looking its best — I'm mobile across Taunton, Raynham, Fall River, and the surrounding towns.

Timing: I'm off for school until summer, so the detail would be fulfilled at my May 1, 2027 restart — first-week slot. Anyone who books through you mentions "EMPIRE" and I'll track it.

Open to a quick call? — Cameron Dorr, CMT Detailing (cmtdetailing.com)$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 11, $p$Empire Ford — sponsors/co-hosts Mustangs & More show. Handle + follower count unconfirmed — verify before outreach.$p$),
($p$prospect_12$p$, $p$@truth_juice_onthe_run$p$, $p$B$p$, false, $p$~5,900$p$, $p$~65%$p$, $p$Massachusetts$p$, $p$Vendor / creator$p$, $p$CMT-TRUTHJUICE$p$, $p$Hey — Cameron from CMT Detailing in Taunton. I saw your weekend-schedule reel for the Aug 15–16 shows — Saturday at the Dot, then the Silver City Stance charity show on Weir St on Sunday. You're one of the accounts actually telling people where to go that weekend, and the Taunton scene is better for it.

I'd like to offer you a free Exterior Detail — hand wash, wheels and tires, paint decon, protective finish (normally $100–180) — or 50% off a Full Detail if you'd rather go all-in. About 1–2 hours at your driveway, I bring my own water and power. In return: a post or reel + 2 stories tagging @cmt_detailing, within 7 days of the detail.

Timing: I'm off for school until summer, so it'd be booked for my May 1, 2027 restart. Your followers can mention "TRUTHJUICE" when they book.

Up for it? — Cameron, CMT Detailing$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 12, $p$Car-scene vendor/creator; promoted the Aug 15–16 Taunton show weekend. Month 1 pick — awaiting Luca's approval.$p$),
($p$prospect_13$p$, $p$@catchmerunningnaked$p$, $p$B$p$, false, $p$~2,800$p$, $p$~85%$p$, $p$Taunton$p$, $p$Scene regular / creator$p$, $p$CMT-CATCHME$p$, $p$Hey — Cameron from CMT Detailing, Taunton. You posted the Silver City Stance charity-show flyer back in July and were thanking sponsors by name after the show — that kind of follow-through is why that Aug 16 show at 336 Weir St raised what it did for The Kacie Project. The Taunton scene runs on people like you.

I'd like to offer you a free Exterior Detail — hand wash, wheels/tires, paint decon, protective finish (normally $100–180) — or 50% off a Full Detail. At your driveway, I bring my own water and power. In return: a post or reel + 2 stories tagging @cmt_detailing, within 7 days.

Timing: I'm off for school until summer, so the detail would be fulfilled at my May 1, 2027 restart. Your people can mention "CATCHME" when they book.

Interested? — Cameron, CMT Detailing$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 13, $p$Taunton scene regular; posted SCS charity-show flyer + sponsor thank-yous. Month 1 pick — awaiting Luca's approval.$p$),
($p$prospect_14$p$, $p$@tws_motors$p$, $p$B$p$, false, $p$~2,600$p$, $p$~85%$p$, $p$Taunton$p$, $p$Shop / page$p$, $p$CMT-TWS$p$, $p$Hey — Cameron from CMT Detailing in Taunton. I saw your flyer for the Jay Bettencourt Memorial Car Show on June 20 at the Lafayette Club — Mopar theme, $20 entry, all proceeds to the Joslin Diabetes Center. A memorial show done right, and the red classic doing a burnout on the flyer says everything about Jay.

I'd like to offer you a free Exterior Detail — hand wash, wheels/tires, paint decon, protective finish (normally $100–180) — or 50% off a Full Detail. At your driveway, I bring my own water and power. In return: a post or reel + 2 stories tagging @cmt_detailing, within 7 days of the detail.

Timing: I'm off for school until summer, so it'd be booked for my May 1, 2027 restart. Anyone who books through you mentions "TWS" and I'll track it.

Want to set it up? — Cameron, CMT Detailing$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 14, $p$Taunton shop; Jay Bettencourt Memorial Car Show, Lafayette Club.$p$),
($p$prospect_15$p$, $p$@2016_c.r.e.a.m$p$, $p$B$p$, false, $p$~2,800$p$, $p$~85%$p$, $p$Fall River$p$, $p$Photographer$p$, $p$CMT-CREAM$p$, $p$Hey Luis — Cameron from CMT Detailing, Taunton. Your Oct 11 Kennedy Park carousel is the best record I've seen of the Fall River meet — the white Civic hatch with the SpeedFactory decal, the lavender Evo, the purple RX-7 next to the purple Type R, the white S2000. You shoot the scene like someone who actually goes to it.

I'd like to offer you a free Exterior Detail — hand wash, wheels/tires, paint decon, protective finish (normally $100–180) — or 50% off a Full Detail. At your driveway, I bring my own water and power. In return: a post or reel + 2 stories tagging @cmt_detailing, within 7 days.

Timing: I'm off for school until summer, so the detail would be fulfilled at my May 1, 2027 restart. Your followers can mention "CREAM" when they book.

Up for it? — Cameron, CMT Detailing$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 15, $p$Fall River meet photographer; Oct 11 Kennedy Park carousel.$p$),
($p$prospect_16$p$, $p$@thebrianbuckley$p$, $p$B$p$, false, $p$~2,900$p$, $p$~70%$p$, $p$Massachusetts$p$, $p$Photographer$p$, $p$CMT-BUCKLEY$p$, $p$Hey Brian — Cameron from CMT Detailing in Taunton. Your April 27 shot of the black Rabbit GTI flanked by the blue Jetta GLI at the roadside meet is exactly the kind of photo that makes a car look like it deserves to be looked at — shallow depth of field, crowd behind it, MA plates. You shoot the New England scene properly.

I'd like to offer you a free Exterior Detail — hand wash, wheels/tires, paint decon, protective finish (normally $100–180) — or 50% off a Full Detail. At your driveway, I bring my own water and power. In return: a post or reel + 2 stories tagging @cmt_detailing, within 7 days — and honestly, if you wanted to shoot the before/after yourself, that would be the best version of this.

Timing: I'm off for school until summer, so it'd be booked for my May 1, 2027 restart. Your followers can mention "BUCKLEY" when they book.

Interested? — Cameron, CMT Detailing$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 16, $p$Automotive photographer; VW Rabbit GTI / Jetta GLI roadside-meet shoot.$p$),
($p$prospect_17$p$, $p$@dee_heightz$p$, $p$B$p$, false, $p$~2,400$p$, $p$~60%$p$, $p$Rhode Island / MA$p$, $p$Photographer / reels$p$, $p$CMT-DEE$p$, $p$Hey Dee — Cameron from CMT Detailing, Taunton. Your June reel from the Boston meet — blue Stinger, white G8, the teal sports car, the Supra with the door open, fireworks at the end — is a proper meet recap, not just a clip dump. You clearly shoot for the community, not just yourself.

I'd like to offer you a free Exterior Detail — hand wash, wheels/tires, paint decon, protective finish (normally $100–180) — or 50% off a Full Detail. At your driveway, I bring my own water and power. In return: a post or reel + 2 stories tagging @cmt_detailing, within 7 days of the detail.

Timing: I'm off for school until summer, so it'd be fulfilled at my May 1, 2027 restart. Your followers can mention "DEE" when they book.

Up for it? — Cameron, CMT Detailing$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 17, $p$Car-meet photographer/reels; RI-based, covers MA meets.$p$),
($p$prospect_18$p$, $p$@902kartography$p$, $p$B$p$, false, $p$~2,300$p$, $p$~60%$p$, $p$Massachusetts (unverified town)$p$, $p$Drone videographer$p$, $p$CMT-902$p$, $p$Hey — Cameron from CMT Detailing in Taunton. Your drone reel from the Sep 30 meet — the line of dark sedans pulling back to reveal the whole row, Evo and WRX in there, autumn light — is a perspective nobody else in the MA scene is shooting. Drone + car meets is a great combination.

I'd like to offer you a free Exterior Detail — hand wash, wheels/tires, paint decon, protective finish (normally $100–180) — or 50% off a Full Detail. At your driveway, I bring my own water and power. In return: a post or reel + 2 stories tagging @cmt_detailing, within 7 days — a drone pass over a fresh detail would be a first for my page.

Timing: I'm off for school until summer, so it'd be booked for my May 1, 2027 restart. Your followers can mention "902" when they book.

Interested? — Cameron, CMT Detailing$p$, $p$DRAFT$p$, 'STAGED', $p$2026-10-28 00:00:00$p$, 18, $p$Drone videographer of MA car meets. Town unverified — confirm MA base before sending.$p$),
($p$prospect_19$p$, $p$@ambitiousdreamzcarclub$p$, $p$C$p$, false, $p$~1,300$p$, $p$~90%$p$, $p$Taunton$p$, $p$Car club$p$, $p$CMT-DREAMZ$p$, NULL, NULL, 'STAGED', $p$2026-10-28 00:00:00$p$, 19, $p$Taunton car club; documented Aug 16 SCS charity show. Graduates to B if the code produces bookings.$p$),
($p$prospect_20$p$, $p$@gabriel.storm_$p$, $p$C$p$, false, $p$~740$p$, $p$~90%$p$, $p$Taunton$p$, $p$Show car owner$p$, $p$CMT-STORM$p$, NULL, NULL, 'STAGED', $p$2026-10-28 00:00:00$p$, 20, $p$Teal turbo Foxbody Mustang; Best in Show at Aug 16 SCS charity show.$p$),
($p$prospect_21$p$, $p$@508.msactive$p$, $p$C$p$, false, $p$~870$p$, $p$~85%$p$, $p$Massachusetts (508)$p$, $p$Meet promoter$p$, $p$CMT-508$p$, NULL, NULL, 'STAGED', $p$2026-10-28 00:00:00$p$, 21, $p$508-area meet promoter/host (day + night meet footage).$p$),
($p$prospect_22$p$, $p$@mass.auto.club.cruises$p$, $p$C$p$, false, $p$~1,100$p$, $p$~70%$p$, $p$Weymouth, MA$p$, $p$Car club$p$, $p$CMT-MAC$p$, NULL, NULL, 'STAGED', $p$2026-10-28 00:00:00$p$, 22, $p$M.A.C. car club; Friday Funday meets, Weymouth.$p$),
($p$prospect_23$p$, $p$@baggedmeatball$p$, $p$C$p$, false, $p$~1,200$p$, $p$~90%$p$, $p$Fall River$p$, $p$Creator (stanced)$p$, $p$CMT-MEATBALL$p$, NULL, NULL, 'STAGED', $p$2026-10-28 00:00:00$p$, 23, $p$Slammed orange sedan, Fall River / Braga Bridge.$p$),
($p$prospect_24$p$, $p$@bekosjourney86$p$, $p$C$p$, false, $p$~800$p$, $p$~80%$p$, $p$Fall River / MA$p$, $p$Photographer$p$, $p$CMT-BEKO$p$, NULL, NULL, 'STAGED', $p$2026-10-28 00:00:00$p$, 24, $p$Fall River meet photographer.$p$),
($p$prospect_25$p$, $p$@alexpm$p$, $p$C$p$, false, $p$~720$p$, $p$~85%$p$, $p$Fall River$p$, $p$Creator$p$, $p$CMT-ALEXPM$p$, NULL, NULL, 'STAGED', $p$2026-10-28 00:00:00$p$, 25, $p$Cars & Cans collaborator; warm intro path via @streetspecofficial.$p$),
($p$prospect_26$p$, $p$@massstreetscene$p$, $p$B$p$, false, $p$2,700$p$, $p$~70%$p$, $p$Massachusetts$p$, $p$Meet host / organizer$p$, $p$CMT-MSS$p$, $p$Hey — Cameron from CMT Detailing, mobile detailer in Taunton. I saw your October meet reel — the multi-club lineup in one lot (Integra Type S, R34 Skyline, M4, the Vantage convertible, the vintage Continental) is exactly the kind of Massachusetts scene I want to be part of. You clearly bring the clubs together instead of just posting your own car, and the "Respect The Lot" rules on your flyers are how meets should be run.

I'd like to offer you a free Exterior Detail — hand wash, wheels and tires, paint decon, protective finish (normally $100–180) — or 50% off a Full Detail if you'd rather go all-in. About 1–2 hours at your driveway, I bring my own water and power. In return: a post or reel + 2 stories tagging @cmt_detailing, within 7 days of the detail.

Timing: I'm off for school until summer, so it'd be booked for my May 1, 2027 restart. Your followers can mention "MSS" when they book and I'll track it.

Up for it? — Cameron, CMT Detailing (cmtdetailing.com)$p$, $p$REVISED$p$, 'STAGED', $p$2026-11-04 00:00:00$p$, 26, $p$DOWNGRADED Nov 11: was provisional Tier A; 2.7K followers confirmed (below 8K bar). Organized lot meets with posted rules; caution: lost a lot once after a VW two-stepping. Draft rewritten to Tier B terms (free Exterior or 50% off Full).$p$),
($p$prospect_27$p$, $p$@new_englandperformance$p$, $p$B$p$, true, $p$4,500$p$, $p$~50%$p$, $p$New England (meets MA/RI)$p$, $p$Meet organizer$p$, $p$CMT-NEP$p$, $p$Hey — Cameron from CMT Detailing, mobile detailer in Taunton. I've been following New England Performance — 2,500+ members, 25+ meets a year, and the July 17 West Warwick meet flyer with "Respect the lot. Respect the town. Respect each other." is exactly the standard the scene needs. You're one of the few groups actually building the New England car community instead of just filming it.

I'd like to offer you a free Exterior Detail — hand wash, wheels and tires, paint decon, protective finish (normally $100–180) — or 50% off a Full Detail. About 1–2 hours at your driveway, I bring my own water and power. In return: a post or reel + 2 stories tagging @cmt_detailing, within 7 days of the detail. A show car fresh off a detail is the best before/after there is.

Timing: I'm off for school until summer, so it'd be booked for my May 1, 2027 restart — first-week slot. Your members can mention "NEP" when they book and I'll track it.

Interested? — Cameron, CMT Detailing (cmtdetailing.com)$p$, $p$DRAFT$p$, 'STAGED', $p$2026-11-11 00:00:00$p$, 27, $p$PROVISIONAL — brand-safety call needed before any send: meet flyers enforce strict rules, but content includes drift clips. 2,500+ members, 25+ meets/yr, website live. DO NOT SEND until brand-safety call clears.$p$),
($p$prospect_28$p$, $p$@joshua_strong04$p$, $p$C$p$, false, $p$1,700$p$, $p$~60%$p$, $p$Massachusetts$p$, $p$Meet documenter / photographer$p$, $p$CMT-JOSHUA$p$, NULL, NULL, 'STAGED', $p$2026-11-11 00:00:00$p$, 28, $p$MA meet documenter/photographer; covered a 250-car meet, Larz Anderson show.$p$),
($p$excluded_01$p$, $p$Xecutive Touch$p$, NULL, false, NULL, NULL, NULL, $p$Competitor detailer$p$, NULL, NULL, NULL, 'EXCLUDED', $p$2026-11-11 00:00:00$p$, 101, $p$Competitor detailer — never pitch competitors.$p$),
($p$excluded_02$p$, $p$Innovative Auto Detailing$p$, NULL, false, NULL, NULL, NULL, $p$Competitor detailer$p$, NULL, NULL, NULL, 'EXCLUDED', $p$2026-11-11 00:00:00$p$, 102, $p$Competitor detailer — never pitch competitors.$p$),
($p$excluded_03$p$, $p$Diamond Detailing$p$, NULL, false, NULL, NULL, NULL, $p$Competitor detailer$p$, NULL, NULL, NULL, 'EXCLUDED', $p$2026-11-11 00:00:00$p$, 103, $p$Competitor detailer — never pitch competitors.$p$),
($p$excluded_04$p$, $p$North East Detail$p$, NULL, false, NULL, NULL, NULL, $p$Competitor detailer$p$, NULL, NULL, NULL, 'EXCLUDED', $p$2026-11-11 00:00:00$p$, 104, $p$Competitor detailer — never pitch competitors.$p$),
($p$excluded_05$p$, $p$@luistrikz$p$, NULL, false, NULL, NULL, NULL, $p$Excluded$p$, NULL, NULL, NULL, 'EXCLUDED', $p$2026-11-11 00:00:00$p$, 105, $p$1.5M followers, Fast & Furious actor — national/international audience, not a local prospect.$p$),
($p$excluded_06$p$, $p$@brokeallday$p$, NULL, false, NULL, NULL, NULL, $p$Excluded$p$, NULL, NULL, NULL, 'EXCLUDED', $p$2026-11-11 00:00:00$p$, 106, $p$37K — broke. EAST. Meet, Franklin County Fairgrounds, ~70 mi out of radius.$p$),
($p$excluded_07$p$, $p$@ct.s.w$p$, NULL, false, NULL, NULL, NULL, $p$Excluded$p$, NULL, NULL, NULL, 'EXCLUDED', $p$2026-11-11 00:00:00$p$, 107, $p$33K — Connecticut-based, out of radius.$p$),
($p$excluded_08$p$, $p$@newenglandwickedfords$p$, NULL, false, NULL, NULL, NULL, $p$Excluded$p$, NULL, NULL, NULL, 'EXCLUDED', $p$2026-11-11 00:00:00$p$, 108, $p$120 followers, Stoneham — out of radius.$p$),
($p$excluded_09$p$, $p$@southwestunelite / @413certifiedmeets_$p$, NULL, false, NULL, NULL, NULL, $p$Excluded$p$, NULL, NULL, NULL, 'EXCLUDED', $p$2026-11-11 00:00:00$p$, 109, $p$Tiny and/or out of radius.$p$),
($p$excluded_10$p$, $p$@_masscarscene$p$, NULL, false, NULL, NULL, NULL, $p$Excluded$p$, NULL, NULL, NULL, 'EXCLUDED', $p$2026-11-11 00:00:00$p$, 110, $p$Brand-safety: promotes late-night multi-state pop-up meets with takeover connotations.$p$),
($p$excluded_11$p$, $p$@illestwhips_newengland$p$, NULL, false, NULL, NULL, NULL, $p$Excluded$p$, NULL, NULL, NULL, 'EXCLUDED', $p$2026-11-11 00:00:00$p$, 111, $p$Meets in Winchester, NH — out of the 30-mi radius.$p$),
($p$excluded_12$p$, $p$@nexusnewengland$p$, NULL, false, NULL, NULL, NULL, $p$Excluded$p$, NULL, NULL, NULL, 'EXCLUDED', $p$2026-11-11 00:00:00$p$, 112, $p$Framingham-area — outside the 30-mi radius, general-NE not SouthCoast-local.$p$),
($p$excluded_13$p$, $p$@new_england_competitive_racing$p$, NULL, false, NULL, NULL, NULL, $p$Excluded$p$, NULL, NULL, NULL, 'EXCLUDED', $p$2026-11-11 00:00:00$p$, 113, $p$First meet Cape Cod Canal, Bourne — just outside radius; 'competitive racing' framing needs a brand-safety read.$p$),
($p$excluded_14$p$, $p$@official_stationnation$p$, NULL, false, NULL, NULL, NULL, $p$Excluded$p$, NULL, NULL, NULL, 'EXCLUDED', $p$2026-11-11 00:00:00$p$, 114, $p$Station Nation Car Club — meets in Newburyport, MA, out of radius. Commenters mention a 'burnout competition' — brand-safety caution on top of geography.$p$),
($p$excluded_15$p$, $p$Mass Wagens$p$, NULL, false, NULL, NULL, NULL, $p$Watchlist — no handle$p$, NULL, NULL, NULL, 'WATCHLIST', $p$2026-11-11 00:00:00$p$, 115, $p$VW club, Star Drive-In Taunton + Dorothy Cox's Fall River meets. No IG handle found — do not guess one.$p$),
($p$excluded_16$p$, $p$Grieco Ford of Raynham$p$, NULL, false, NULL, NULL, NULL, $p$Watchlist — no handle$p$, NULL, NULL, NULL, 'WATCHLIST', $p$2026-11-11 00:00:00$p$, 116, $p$Dealership, 1651 New State Hwy, Raynham. No dealer IG handle confirmed — do NOT pitch the salesperson accounts (@truckcommander_official, @eddycarz), they tie mostly to Florida stores.$p$),
($p$excluded_17$p$, $p$South Shore Stance Co$p$, NULL, false, NULL, NULL, NULL, $p$Watchlist — no handle$p$, NULL, NULL, NULL, 'WATCHLIST', $p$2026-11-11 00:00:00$p$, 117, $p$Meets across Plymouth County / South Shore. Website + email found; no IG handle.$p$),
($p$excluded_18$p$, $p$Mass Cruisers Auto Club$p$, NULL, false, NULL, NULL, NULL, $p$Watchlist — no handle$p$, NULL, NULL, NULL, 'WATCHLIST', $p$2026-11-11 00:00:00$p$, 118, $p$Wrentham. Facebook/Instagram mentioned on site, no IG handle found.$p$),
($p$excluded_19$p$, $p$Downshifters of New England$p$, NULL, false, NULL, NULL, NULL, $p$Watchlist — no handle$p$, NULL, NULL, NULL, 'WATCHLIST', $p$2026-11-11 00:00:00$p$, 119, $p$Nightly cruises SE MA / northern RI. No IG handle found.$p$),
($p$excluded_20$p$, $p$Bristol County Corvette Club$p$, NULL, false, NULL, NULL, NULL, $p$Watchlist — no handle$p$, NULL, NULL, NULL, 'WATCHLIST', $p$2026-11-11 00:00:00$p$, 120, $p$Somerset (core town). No IG handle found.$p$),
($p$excluded_21$p$, $p$Bay State Street Machines$p$, NULL, false, NULL, NULL, NULL, $p$Watchlist — no handle$p$, NULL, NULL, NULL, 'WATCHLIST', $p$2026-11-11 00:00:00$p$, 121, $p$North Dighton (core town). No IG handle found.$p$),
($p$excluded_22$p$, $p$Cruisin' 4 Vets$p$, NULL, false, NULL, NULL, NULL, $p$Watchlist — no handle$p$, NULL, NULL, NULL, 'WATCHLIST', $p$2026-11-11 00:00:00$p$, 122, $p$Hot-rod cruise + car show, American Legion Post 77, Berkley. No IG handle found.$p$);
