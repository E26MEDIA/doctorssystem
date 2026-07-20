export const clinic = {
  name: "Meridian Health",
  doctor: "Dr. Anika Rao",
  credentials: "MD, Internal Medicine",
  tagline: "Thoughtful medicine for a longer, clearer life.",
  phone: "+91 80 4567 8901",
  email: "care@meridianhealth.clinic",
  address: {
    line1: "42, 12th Main Road",
    line2: "Indiranagar, Bengaluru 560038",
  },
  hours: [
    { day: "Monday – Friday", time: "9:00 AM – 6:00 PM" },
    { day: "Saturday", time: "9:00 AM – 1:00 PM" },
    { day: "Sunday", time: "Closed" },
  ],
  social: {
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com",
  },
} as const;

export const services = [
  {
    slug: "annual-physical",
    title: "Annual Physical",
    summary:
      "A full systems review with labs, risk scoring, and a clear plan for the year ahead.",
    duration: "60 min",
    details:
      "Includes vitals, cardiovascular screening, metabolic panel review, lifestyle assessment, and written recommendations you can act on immediately.",
  },
  {
    slug: "preventive-care",
    title: "Preventive Care",
    summary:
      "Screenings and guidance designed to catch issues early — before they become crises.",
    duration: "45 min",
    details:
      "Age-appropriate cancer screening, vaccination review, bone and heart health checks, and personalized prevention timelines.",
  },
  {
    slug: "chronic-disease",
    title: "Chronic Disease Management",
    summary:
      "Steady, collaborative care for hypertension, diabetes, thyroid, and metabolic conditions.",
    duration: "45 min",
    details:
      "Medication optimization, home monitoring plans, nutrition coaching, and quarterly progress reviews with measurable goals.",
  },
  {
    slug: "womens-health",
    title: "Women’s Health",
    summary:
      "Hormone health, midlife transitions, and reproductive wellness with space to ask anything.",
    duration: "45 min",
    details:
      "Perimenopause support, PCOS guidance, bone density counseling, and coordinated referrals when specialty care is needed.",
  },
  {
    slug: "executive-checkup",
    title: "Executive Checkup",
    summary:
      "A deep dive for busy professionals who want clarity without wasted time.",
    duration: "90 min",
    details:
      "Expanded labs, stress and sleep assessment, cardiovascular risk modeling, and a same-day summary you can take to work.",
  },
  {
    slug: "teleconsult",
    title: "Video Consult",
    summary:
      "Follow-ups and second opinions from home when an in-clinic visit isn’t required.",
    duration: "30 min",
    details:
      "Secure video visits for medication reviews, lab discussions, travel advice, and acute but non-emergency concerns.",
  },
] as const;

export const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
] as const;

export const testimonials = [
  {
    quote:
      "Dr. Rao listens like she has all the time in the world — then gives you a plan that actually fits your life.",
    name: "Priya M.",
    detail: "Patient since 2021",
  },
  {
    quote:
      "The executive checkup caught a blood pressure pattern I’d been ignoring. Calm, precise, no scare tactics.",
    name: "Arjun K.",
    detail: "Patient since 2023",
  },
  {
    quote:
      "I finally understand my labs. Meridian made medicine feel collaborative instead of confusing.",
    name: "Neha S.",
    detail: "Patient since 2022",
  },
] as const;

export const articles = [
  {
    slug: "reading-your-bloodwork",
    title: "How to actually read your bloodwork",
    excerpt:
      "What CRP, HbA1c, and lipid panels really tell you — and which numbers deserve a follow-up.",
    date: "2026-03-12",
    readTime: "6 min",
  },
  {
    slug: "sleep-before-supplements",
    title: "Sleep before supplements",
    excerpt:
      "Why fixing your nights often outperforms any new bottle on your bathroom shelf.",
    date: "2026-02-04",
    readTime: "5 min",
  },
  {
    slug: "midlife-checkups",
    title: "The midlife checkup that matters",
    excerpt:
      "A practical checklist for ages 40–55: heart, hormones, bone, and cancer screening.",
    date: "2026-01-18",
    readTime: "7 min",
  },
] as const;
