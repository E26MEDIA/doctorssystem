export const clinic = {
  name: "Honnani GI Surgery",
  doctor: "Dr. S S Honnani",
  credentials: "MBBS, MS, Fellowship in Gastrointestinal Surgery (RGUHS)",
  tagline: "Advanced laparoscopic & gastrointestinal surgery with clear, confident care.",
  phone: "+91 824 220 4668",
  email: "care@drhonnani.com",
  address: {
    line1: "Yenepoya Specialty Hospital",
    line2: "Kodialbail, Mangaluru, Karnataka 575003",
  },
  hours: [
    { day: "Monday – Saturday", time: "10:00 AM – 5:00 PM" },
    { day: "Sunday", time: "By appointment" },
  ],
  social: {
    instagram: "https://www.instagram.com/dr.honnani/",
    linkedin: "https://www.yenepoyahospital.com/dr-s-s-honnani/",
    youtube: "https://www.youtube.com/@surgeonhonnani",
  },
  whatsapp: {
    number: "916366918181",
    display: "63669 18181",
    message:
      "Hello Dr. S S Honnani, I would like to enquire about a consultation. Please let me know a convenient time to connect.",
  },
} as const;

export function whatsappHref() {
  return `https://wa.me/${clinic.whatsapp.number}?text=${encodeURIComponent(clinic.whatsapp.message)}`;
}

export const doctorProfile = {
  shortName: "Dr. S S Honnani",
  role: "Consultant Surgical Gastroenterologist",
  specialty: "Advanced Laparoscopic & Bariatric surgeon",
  intro: [
    "MBBS, MS, Fellowship in Gastrointestinal Surgery (RGUHS)",
    "Consultant Surgical Gastroenterologist",
    "Advanced Laparoscopic & Bariatric surgeon",
  ],
  hospital: "Yenepoya Specialty Hospital",
  portrait: "/images/gallery-4.jpg",
  bio: [
    "Dr. S S Honnani is a Surgical Gastroenterologist experienced in advanced laparoscopic colorectal, bariatric, and hepato-pancreato-biliary surgery.",
    "He worked with KMC Manipal for six years in Gastrointestinal and General Surgery, later joined BGS Gleneagles Global Hospitals, Bengaluru, and has been associated with Yenepoya Specialty Hospital since June 2019.",
  ],
  education: [
    { title: "MBBS", detail: "Bachelor of Medicine & Bachelor of Surgery" },
    { title: "MS (General Surgery)", detail: "Postgraduate surgical training" },
    {
      title: "Fellowship in Gastrointestinal Surgery (RGUHS)",
      detail: "Advanced GI surgical fellowship, Rajiv Gandhi University of Health Sciences",
    },
  ],
  experience: [
    {
      place: "KMC Manipal",
      detail: "6 years in Gastrointestinal and General Surgery",
    },
    {
      place: "BGS Gleneagles Global Hospitals, Bengaluru",
      detail: "Surgical Gastroenterology practice",
    },
    {
      place: "Yenepoya Specialty Hospital",
      detail: "Visiting Consultant since June 2019",
    },
  ],
  expertise: [
    "Advanced laparoscopic & minimally invasive surgery",
    "Bariatric surgery",
    "Liver resections",
    "Pancreatic surgeries",
    "Advanced laparoscopic colorectal surgery",
    "Complicated hernias & abdominal wall reconstruction",
    "Cadaveric and live-donor liver transplantation",
    "Pancreatic transplantation",
  ],
} as const;

export const services = [
  {
    slug: "clinic-consultation",
    title: "Clinic Consultation",
    summary:
      "In-person visit at the hospital clinic for assessment, second opinion, and surgical planning.",
    duration: "30–45 min",
    details:
      "Face-to-face consultation with review of history, reports, and next-step guidance. Ideal for new complaints, pre-operative discussion, and follow-up after surgery.",
  },
  {
    slug: "virtual-consultation",
    title: "Virtual Consultation",
    summary:
      "Secure video visit from home. After booking you complete a secure checkout, then receive your Google Meet link and receipt by email.",
    duration: "20–30 min",
    details:
      "Best for report review, second opinions, post-op check-ins, and questions that do not need a physical exam. Join from your phone or laptop at the booked time.",
  },
  {
    slug: "laparoscopic-surgery",
    title: "Advanced Laparoscopic Surgery",
    summary:
      "Minimally invasive procedures focused on faster recovery and precise care.",
    duration: "Procedure",
    details:
      "Includes advanced laparoscopic colorectal work and other minimally invasive GI procedures tailored after clinical evaluation.",
  },
  {
    slug: "bariatric-surgery",
    title: "Bariatric Surgery",
    summary:
      "Surgical weight-management pathways with careful counselling and follow-through.",
    duration: "Procedure",
    details:
      "Evaluation, procedure planning, and long-term metabolic follow-up for eligible patients seeking structured bariatric care.",
  },
  {
    slug: "hpb-surgery",
    title: "Liver & Pancreas Surgery",
    summary:
      "Hepato-pancreato-biliary surgery including complex resections when indicated.",
    duration: "Procedure",
    details:
      "Specialist assessment for liver resections, pancreatic surgeries, and related GI oncology pathways.",
  },
  {
    slug: "hernia-reconstruction",
    title: "Hernia & Abdominal Wall Repair",
    summary:
      "Care for complicated hernias and abdominal wall reconstruction.",
    duration: "Procedure",
    details:
      "From complex hernia repair to reconstruction planning after prior surgeries, with clear risk discussion and recovery guidance.",
  },
] as const;

export const timeSlots = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
] as const;

export const testimonials = [
  {
    quote:
      "Dr. Honnani explained my laparoscopic options in plain language. I felt prepared before surgery and supported after.",
    name: "Ramesh K.",
    detail: "Clinic consultation patient",
  },
  {
    quote:
      "The virtual consult saved a long trip. Reports were reviewed carefully and the Meet link worked on time.",
    name: "Aisha P.",
    detail: "Virtual consultation patient",
  },
  {
    quote:
      "Clear plan for a complicated hernia repair. Professional, calm, and thorough from first visit to recovery.",
    name: "Suresh M.",
    detail: "Surgical patient",
  },
] as const;

export const articles = [
  {
    slug: "when-to-see-a-gi-surgeon",
    title: "When to see a surgical gastroenterologist",
    category: "Guidance",
    excerpt:
      "Gallbladder pain, hernias, unexplained weight loss, and other signs that deserve specialist review.",
    publishedAt: "2026-05-10",
    readTime: "5 min",
    imageUrl: "/images/gallery-3.jpg",
    blocks: [
      {
        type: "paragraph" as const,
        text: "Persistent upper abdominal pain after meals, a noticeable hernia bulge, unexplained weight loss, or jaundice should not be ignored. These can point to gallbladder disease, colorectal issues, or hepato-pancreato-biliary conditions that benefit from specialist review.",
      },
      {
        type: "image" as const,
        src: "/images/clinic.jpg",
        caption: "A calm clinic setting for a careful first assessment",
      },
      {
        type: "paragraph" as const,
        text: "A surgical gastroenterologist evaluates whether medical management is enough or whether laparoscopic or open surgery is the safer path. Bring prior reports, imaging CDs, and a medication list to your first visit — clinic or virtual.",
      },
      {
        type: "image" as const,
        src: "/images/doctor.jpg",
        caption: "Dr. S S Honnani reviews history, reports, and next steps with patients",
      },
      {
        type: "paragraph" as const,
        text: "If symptoms are sudden and severe — intense pain, vomiting blood, high fever, or inability to pass stool or gas — seek emergency care first, then arrange follow-up with the surgical team.",
      },
    ],
  },
  {
    slug: "laparoscopic-recovery",
    title: "Recovering after laparoscopic surgery",
    category: "Recovery",
    excerpt:
      "What the first two weeks usually look like — walking, diet, wound care, and when to call.",
    publishedAt: "2026-04-02",
    readTime: "6 min",
    imageUrl: "/images/gallery-1.jpg",
    blocks: [
      {
        type: "paragraph" as const,
        text: "Most patients walk the same day or next morning after laparoscopic GI surgery. Short walks reduce clotting risk and help the gut wake up. Rest when tired, but avoid long bed rest.",
      },
      {
        type: "image" as const,
        src: "/images/gallery-5.jpg",
        caption: "Gentle walking is usually encouraged early after laparoscopic surgery",
      },
      {
        type: "paragraph" as const,
        text: "Diet usually starts light — clear fluids, then soft foods — as advised for your specific procedure. Wound sites should stay clean and dry; mild bruising around ports is common and usually settles over a few days.",
      },
      {
        type: "image" as const,
        src: "/images/gallery-6.jpg",
        caption: "Clean, dry wound care helps port sites heal smoothly",
      },
      {
        type: "paragraph" as const,
        text: "Call the clinic if you develop fever, increasing redness or discharge at a port site, severe pain not eased by prescribed medicine, persistent vomiting, or shortness of breath.",
      },
    ],
  },
  {
    slug: "virtual-vs-clinic",
    title: "Virtual visit or clinic visit?",
    category: "Consultations",
    excerpt:
      "A simple guide to choosing the right consultation type for your reports and symptoms.",
    publishedAt: "2026-03-18",
    readTime: "4 min",
    imageUrl: "/images/virtual.jpg",
    blocks: [
      {
        type: "paragraph" as const,
        text: "Choose a virtual consultation when you need report review, a second opinion, post-op check-in, or counselling that does not require a physical exam. After you reserve a slot, complete checkout to receive your Google Meet link and payment receipt by email.",
      },
      {
        type: "image" as const,
        src: "/images/gallery-4.jpg",
        caption: "Virtual visits work well for report review and follow-up counselling",
      },
      {
        type: "paragraph" as const,
        text: "Choose a clinic consultation for new abdominal findings, hernia assessment, pre-operative planning that needs examination, or when dressing changes and in-person counselling matter.",
      },
      {
        type: "image" as const,
        src: "/images/gallery-3.jpg",
        caption: "In-person visits help when examination or surgical planning is needed",
      },
      {
        type: "paragraph" as const,
        text: "Either way, pick an open slot from the doctor’s date-based schedule. Available times confirm instantly — no waiting for a second approval step.",
      },
    ],
  },
] as const;

/** Practice photos + Instagram reels from @dr.honnani / @dr_honnani */
export const galleryPhotos = [
  {
    src: "/images/gallery-4.jpg",
    alt: "Dr. S S Honnani",
    caption: "Dr. S S Honnani",
  },
  {
    src: "/images/gallery-2.jpg",
    alt: "Surgical team in theatre",
    caption: "Surgical team",
  },
  {
    src: "/images/gallery-1.jpg",
    alt: "Surgical care environment",
    caption: "Surgical care",
  },
  {
    src: "/images/gallery-3.jpg",
    alt: "Advanced operating theatre",
    caption: "Operating theatre",
  },
  {
    src: "/images/clinic.jpg",
    alt: "Hospital operating theatre",
    caption: "Hospital theatre",
  },
  {
    src: "/images/hero.jpg",
    alt: "Surgical suite",
    caption: "Surgical suite",
  },
] as const;

export const youtubeChannel = {
  handle: "@surgeonhonnani",
  url: "https://www.youtube.com/@surgeonhonnani",
  channelId: "UCZeVrLegMV-8decAMKX_hKQ",
  featured: [
    {
      id: "cDjB8pkSU6Y",
      title: "Fissure in Ano | Dr. S S Honnani",
    },
    {
      id: "Iei8ewDFIGg",
      title: "Pilonidal Sinus: Causes, Symptoms, and Treatment Options",
    },
  ],
} as const;

/**
 * Local reel videos for the Kalki-style coverflow carousel.
 * Add more files under /public/videos/reels/ as reel-06.mp4, etc.
 */
export const localReels: ReadonlyArray<{
  id: string;
  src: string;
  title: string;
  caption: string;
}> = [
  {
    id: "reel-01",
    src: "/videos/reels/reel-01.mp4",
    title: "Clinical reel 1",
    caption: "From Dr. S S Honnani — surgical gastroenterology insights.",
  },
  {
    id: "reel-02",
    src: "/videos/reels/reel-02.mp4",
    title: "Clinical reel 2",
    caption: "Patient education and procedure highlights — tap the speaker for sound.",
  },
];

/** @deprecated Prefer localReels — kept for Instagram fallback links */
export const instagramReels: ReadonlyArray<{
  id: string;
  url: string;
  title: string;
  caption: string;
  poster?: string;
}> = [];

export const instagramProfile = "https://www.instagram.com/dr.honnani/" as const;
