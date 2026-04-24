"use client";

import { useState } from "react";

const SERVICE_OPTIONS = [
  { label: "Interior Detail",   value: "Interior Detail",               hint: "Deep clean inside" },
  { label: "Exterior Detail",   value: "Exterior Detail",               hint: "Wash, clay & protect" },
  { label: "Full Detail",       value: "Full Detail",                   hint: "Complete reset inside & out" },
  { label: "Paint Enhancement", value: "Paint Enhancement",             hint: "Remove light swirls & boost gloss" },
  { label: "Paint Correction",  value: "Paint Correction",              hint: "Restore near-perfect paint" },
  { label: "Ceramic Coating",   value: "Ceramic Coating",               hint: "Long-term paint protection" },
  { label: "Maintenance Plan",  value: "Maintenance Plan",              hint: "Regular scheduled service" },
  { label: "Not Sure",          value: "Not Sure — Help Me Choose",     hint: "We'll point you in the right direction" },
];

const TIME_OPTIONS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

const CONDITIONS = ["Light", "Moderate", "Heavy"] as const;
type Condition = (typeof CONDITIONS)[number];

type FormState = "idle" | "loading" | "success" | "error";

export default function BookingForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [serviceError, setServiceError] = useState(false);
  const [condition, setCondition] = useState<Condition | "">("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedService) {
      setServiceError(true);
      document.getElementById("service-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setServiceError(false);
    setState("loading");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Something went wrong");
      }

      setState("success");
      form.reset();
      setSelectedService("");
      setCondition("");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Submission failed");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full bg-accent/15 border border-accent/50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Booking Request Sent!</h2>
        <p className="text-zinc-400 leading-relaxed mb-2">
          We&apos;ll reach out within 24 hours to confirm your appointment and go over pricing.
        </p>
        <p className="text-zinc-500 text-sm mb-8">Keep an eye on your phone or email.</p>
        <button
          onClick={() => setState("idle")}
          className="text-sm text-accent-light hover:text-white transition-colors underline underline-offset-4"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-9">

      {/* ── Step 1: Service Picker ── */}
      <div id="service-picker">
        <div className="mb-4">
          <StepLabel step={1} title="Select Your Service" />
          <p className="text-zinc-400 text-sm mt-1 ml-9">
            Tell us what you need — not sure? Pick &ldquo;Not Sure&rdquo; and we&apos;ll help you choose.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SERVICE_OPTIONS.map((opt) => {
            const active = selectedService === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setSelectedService(opt.value); setServiceError(false); }}
                className={`relative flex flex-col gap-1 rounded-xl p-3.5 text-left border transition-all duration-200 ${
                  active
                    ? "bg-accent/10 border-accent shadow-[0_0_14px_rgba(66,109,182,0.2)]"
                    : "bg-zinc-800/60 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/90"
                }`}
              >
                {active && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-accent" />
                )}
                <span className={`font-semibold text-sm leading-snug ${active ? "text-white" : "text-zinc-200"}`}>
                  {opt.label}
                </span>
                <span className={`text-xs leading-snug ${active ? "text-accent-light" : "text-zinc-500"}`}>
                  {opt.hint}
                </span>
              </button>
            );
          })}
        </div>

        {/* Carries selected service into FormData */}
        <input type="hidden" name="serviceRequested" value={selectedService} />

        {serviceError && (
          <p className="mt-3 text-red-400 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Please select a service to continue.
          </p>
        )}
      </div>

      <div className="border-t border-zinc-800" />

      {/* ── Step 2: Contact Info ── */}
      <div>
        <StepLabel step={2} title="Contact Info" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Full Name" name="fullName" required placeholder="John Smith" />
          <Field label="Phone Number" name="phone" type="tel" required placeholder="(555) 000-0000" />
          <div className="md:col-span-2">
            <Field label="Email Address" name="email" type="email" required placeholder="john@example.com" />
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800" />

      {/* ── Step 3: Vehicle Info ── */}
      <div>
        <StepLabel step={3} title="Vehicle Info" />
        <div className="grid grid-cols-3 gap-4 mt-4 mb-5">
          <Field label="Year" name="vehicleYear" required placeholder="2019" />
          <Field label="Make" name="vehicleMake" required placeholder="Toyota" />
          <Field label="Model" name="vehicleModel" required placeholder="Camry" />
        </div>

        <div>
          <label className="block text-sm text-zinc-300 mb-2">
            Condition{" "}
            <span className="text-zinc-600 font-normal text-xs">(optional)</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(condition === c ? "" : c)}
                className={`py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                  condition === c
                    ? "bg-accent/10 border-accent text-white"
                    : "bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <input type="hidden" name="vehicleCondition" value={condition} />
        </div>
      </div>

      <div className="border-t border-zinc-800" />

      {/* ── Step 4: Schedule & Details ── */}
      <div>
        <StepLabel step={4} title="Schedule & Details" />
        <div className="flex flex-col gap-4 mt-4">
          <Field label="Town / Address" name="town" required placeholder="Taunton, MA" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Preferred Date" name="preferredDate" type="date" required />
            <div>
              <label className="block text-sm text-zinc-300 mb-1">
                Preferred Time <span className="text-zinc-600">*</span>
              </label>
              <select
                name="preferredTime"
                required
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-accent transition-colors"
              >
                <option value="">Select a time…</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">
              Notes or Special Requests{" "}
              <span className="text-zinc-600 font-normal text-xs">(optional)</span>
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Pet hair, specific areas of concern, gate code, anything we should know…"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {state === "error" && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/60 rounded-lg px-4 py-3 flex items-start gap-2.5">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errorMsg}
        </div>
      )}

      {/* ── Submit ── */}
      <div>
        <button
          type="submit"
          disabled={state === "loading"}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-200 text-base"
        >
          {state === "loading" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting…
            </span>
          ) : (
            "Request My Booking"
          )}
        </button>

        <p className="text-zinc-600 text-xs text-center mt-3">
          We&apos;ll reach out within 24 hours to confirm details and pricing.
        </p>
      </div>

    </form>
  );
}

function StepLabel({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 border border-accent/40 text-accent-light text-xs font-bold shrink-0">
        {step}
      </span>
      <h3 className="text-zinc-200 text-sm font-semibold uppercase tracking-[0.15em]">{title}</h3>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-zinc-300 mb-1">
        {label} {required && <span className="text-zinc-600">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}
