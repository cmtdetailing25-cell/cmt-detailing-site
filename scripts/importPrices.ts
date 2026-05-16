/**
 * CMT Detailing — Historical Price Import
 * Run with: npx tsx scripts/importPrices.ts
 *
 * Matches jobs by clientFullName + jobDate and sets the price.
 * Idempotent: safe to re-run.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface PriceEntry {
  clientFullName: string;
  jobDate: Date;
  price: number;
  note?: string; // for disambiguation when same client has same-day jobs
}

const PRICES: PriceEntry[] = [
  // Joanne Weldon
  { clientFullName: "Joanne Weldon", jobDate: new Date("2024-10-02"), price: 150 },
  { clientFullName: "Joanne Weldon", jobDate: new Date("2025-05-18"), price: 140 },
  { clientFullName: "Joanne Weldon", jobDate: new Date("2026-05-16"), price: 150 },

  // Matt Blenneau
  { clientFullName: "Matt Blenneau", jobDate: new Date("2024-09-28"), price: 225 },

  // Abbey Doherty
  { clientFullName: "Abbey Doherty", jobDate: new Date("2024-09-29"), price: 100 },
  { clientFullName: "Abbey Doherty", jobDate: new Date("2025-05-26"), price: 200 },

  // Dan Murphy
  { clientFullName: "Dan Murphy", jobDate: new Date("2024-10-05"), price: 240 },

  // Candace LeMaire
  { clientFullName: "Candace LeMaire", jobDate: new Date("2024-10-14"), price: 240 },

  // Bryce Hillman
  { clientFullName: "Bryce Hillman", jobDate: new Date("2024-10-19"), price: 260 },

  // Ryan O'Connor (couch cleaning)
  { clientFullName: "Ryan O'Connor", jobDate: new Date("2024-10-19"), price: 210 },

  // Jay Hornung
  { clientFullName: "Jay Hornung", jobDate: new Date("2024-10-29"), price: 315 },

  // Brian Chaves — 3 same-day jobs, different prices
  { clientFullName: "Brian Chaves", jobDate: new Date("2024-11-27"), price: 270, note: "Equinox" },
  { clientFullName: "Brian Chaves", jobDate: new Date("2024-11-27"), price: 270, note: "SRX" },
  { clientFullName: "Brian Chaves", jobDate: new Date("2024-11-27"), price: 160, note: "Police" },

  // Stephanie Hoye
  { clientFullName: "Stephanie Hoye", jobDate: new Date("2025-05-18"), price: 230 },

  // Tom Hoye
  { clientFullName: "Tom Hoye", jobDate: new Date("2025-05-26"), price: 200 },

  // Brenda Mary — 2 same-day jobs
  { clientFullName: "Brenda Mary", jobDate: new Date("2025-05-25"), price: 160, note: "XC60" },
  { clientFullName: "Brenda Mary", jobDate: new Date("2025-05-25"), price: 200, note: "Crosstrek" },

  // Melanie Santos
  { clientFullName: "Melanie Santos", jobDate: new Date("2025-05-26"), price: 350 },

  // Michael Daley
  { clientFullName: "Michael Daley", jobDate: new Date("2026-01-08"), price: 200 },

  // Carolyn
  { clientFullName: "Carolyn", jobDate: new Date("2026-01-09"), price: 200 },
];

// Title fragments to disambiguate same-client same-day jobs
const NOTE_TITLE_MAP: Record<string, string> = {
  Equinox: "Equinox",
  SRX:     "SRX",
  Police:  "Police",
  XC60:    "XC60",
  Crosstrek: "Crosstrek",
};

async function main() {
  console.log("\n💰  CMT Detailing — Historical Price Import");
  console.log(`    ${PRICES.length} price entries to process\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const entry of PRICES) {
    const client = await prisma.client.findFirst({
      where: { fullName: entry.clientFullName },
    });

    if (!client) {
      console.log(`❌  Client not found: ${entry.clientFullName}`);
      notFound++;
      continue;
    }

    // Find matching jobs by clientId + jobDate
    const candidates = await prisma.detailJob.findMany({
      where: {
        clientId: client.id,
        jobDate:  entry.jobDate,
      },
    });

    if (candidates.length === 0) {
      console.log(`❌  No job found: ${entry.clientFullName} on ${entry.jobDate.toDateString()}`);
      notFound++;
      continue;
    }

    // If note provided, narrow by title fragment
    let job = candidates[0];
    if (entry.note && candidates.length > 1) {
      const titleFragment = NOTE_TITLE_MAP[entry.note] ?? entry.note;
      const match = candidates.find((j) => j.title.includes(titleFragment));
      if (match) job = match;
    }

    if (job.price === entry.price) {
      console.log(`⏭   Already set $${entry.price}: ${entry.clientFullName} — ${job.title}`);
      skipped++;
      continue;
    }

    await prisma.detailJob.update({
      where: { id: job.id },
      data:  { price: entry.price },
    });

    console.log(`✅  $${String(entry.price).padStart(3)} → ${entry.clientFullName.padEnd(20)} ${job.title}`);
    updated++;
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`  Updated:   ${updated}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Not found: ${notFound}`);
  console.log(`─────────────────────────────────────\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
