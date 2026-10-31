import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import "@/models";
import { SiteSettings } from "@/models/SiteSettings";
import { Teacher } from "@/models/Teacher";
import { Notice } from "@/models/Notice";
import { BlogPost } from "@/models/BlogPost";
import { Event } from "@/models/Event";
import { Batch } from "@/models/Batch";
import { AcademicSession } from "@/models/AcademicSession";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";

/**
 * Public Data Layer: Direct MongoDB queries for Next.js App Router Server Components
 * Enforces published-only visibility so draft/archived content is never exposed prematurely.
 * Includes graceful fallbacks for offline builds and SSR resilience.
 */

const defaultSiteSettings = {
  key: "main",
  institutionName: "শিক্ষণ একাডেমিক কেয়ার",
  shortName: "শিক্ষণ",
  tagline: "চলো সেরা হই...",
  motto: "চলো সেরা হই...",
  logoUrl: "/images/logo.png",
  bannerUrl: "/images/banner.png",
  heroTitle: "সেরা প্রস্তুতিতে গড়ে তুলুন নিশ্চিত ভবিষ্যৎ",
  heroSubtitle:
    "৬ষ্ঠ থেকে দ্বাদশ শ্রেণি ও আলিয়া মাদ্রাসা স্পেশাল কেয়ার। অভিজ্ঞ শিক্ষক ও নিয়মিত মূল্যায়নের মাধ্যমে শিক্ষার্থীর সামগ্রিক মেধা বিকাশ।",
  aboutTitle: "অভিজ্ঞতা ও আধুনিক পাঠদানের অনন্য সমন্বয়",
  aboutText:
    "শিক্ষণ একাডেমিক কেয়ার চট্টগ্রাম হালিশহরে প্রতিষ্ঠিত একটি প্রথম সারির পাঠদান কেন্দ্র। অভিজ্ঞ শিক্ষকমণ্ডলী, নিয়মিত ওএমআর মডেল টেস্ট এবং দুর্বল শিক্ষার্থীদের জন্য বিশেষ তদারকির মাধ্যমে আমরা প্রতিটি শিক্ষার্থীর কাঙ্ক্ষিত ফলাফল নিশ্চিত করি।",
  aboutStoryParagraph2:
    "আমরা বিশ্বাস করি প্রতিটি শিক্ষার্থীর মধ্যেই বিশেষ মেধা রয়েছে। সঠিক দিকনির্দেশনা, বন্ধুত্বপূর্ণ পাঠদান পরিবেশ এবং নিয়মিত অধ্যাবসায়ের চর্চা নিশ্চিত করার মাধ্যমে আমরা গত এক দশকে হাজারো শিক্ষার্থীকে এসএসসি ও এইচএসসি পরীক্ষায় জিপিএ-৫ ও সর্বোচ্চ সাফল্য এনে দিয়েছি।",
  aboutMission:
    "প্রতিটি শিক্ষার্থীর সুপ্ত মেধার সর্বোত্তম বিকাশ ঘটিয়ে সাধারণ ও আলিয়া মাদ্রাসা কারিকুলামে বোর্ড পরীক্ষায় শ্রেষ্ঠত্ব অর্জন করানো। দুর্বলদের বিশেষ যত্ন ও মেধার যথোপযুক্ত মূল্যায়ন আমাদের অগ্রাধিকার।",
  aboutVision:
    "মুখস্থবিদ্যার বদলে ধারণাগত স্পষ্টতা (Conceptual Clarity), নিয়মিত মূল্যায়ন এবং শৃঙ্খলাবদ্ধ জীবন গঠনের মাধ্যমে শিক্ষার্থীদের ভবিষ্যতের জন্য আত্মবিশ্বাসী ও নীতিবান নাগরিক হিসেবে গড়ে তোলা।",
  aboutValues:
    "সততা, সময়ানুবর্তিতা, শিক্ষক-শিক্ষার্থী-অভিভাবকের যৌথ সমন্বয় এবং প্রযুক্তিভিত্তিক ডিজিটাল তদারকি। কোনো অবহেলা বা আপস ছাড়াই শিক্ষার মান অক্ষুণ্ণ রাখা।",
  aboutHighlights: [
    "চট্টগ্রামের শীর্ষস্থানীয় কলেজ ও বিশ্ববিদ্যালয়ের অভিজ্ঞ বিষয়ভিত্তিক শিক্ষক",
    "৬ষ্ঠ থেকে দ্বাদশ শ্রেণি ও আলিয়া মাদ্রাসা স্পেশাল কেয়ার ব্যাচ",
    "প্রতিটি অধ্যায় শেষে মানসম্মত ওএমআর শিটভিত্তিক মূল্যায়ন পরীক্ষা",
    "ডিজিটাল উপস্থিতি খাতা ও অনুপস্থিতিতে অভিভাবকদের সরাসরি নোটিফিকেশন",
    "আধুনিক শীতাতপ নিয়ন্ত্রিত (AC) ও সিসিটিভি ক্যামেরা সমৃদ্ধ ক্লাসরুম",
    "দুর্বল শিক্ষার্থীদের চিহ্নিত করে আলাদা রিমেডিয়াল / এক্সট্রা ক্লাস",
    "নিজস্ব সমৃদ্ধ লেকচার শিট, হ্যান্ডনোট ও বিগত ১০ বছরের প্রশ্নব্যাংক সল্যুশন",
    "নিয়মিত অভিভাবক সমাবেশ (Parents Meeting) ও প্রগ্রেস কার্ড প্রদান",
  ],
  officeHours: "সকাল ৮:০০ - রাত ৮:০০ (প্রতিদিন)",
  contactPhone: "০১৯৮-২৭০৫৬৪৬",
  contactEmail: "info@shikkhon.edu.bd",
  phones: ["০১৯৮-২৭০৫৬৪৬", "০১৮৫৯-৭৮৭৩৯৯"],
  email: "info@shikkhon.edu.bd",
  address: "এস ক্লাব মোড় (এর পশ্চিম পার্শ্বে), রোড-০২, বি-ব্লক, হালিশহর, চট্টগ্রাম",
  whatsappNumber: "+8801859787399",
  whatsAppNumber: "+8801859787399",
  whatsAppPrefillMessage:
    "আসসালামু আলাইকুম, আমি কোচিং এ ভর্তির ব্যাপারে তথ্য জানতে চাচ্ছি।",
  isWhatsAppEnabled: true,
  allowTeacherStudentMessaging: true,
  admissionNotice:
    "২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে দ্বাদশ শ্রেণি এবং আলিয়া মাদ্রাসা স্পেশাল কেয়ারে ভর্তি চলছে।",
  isAdmissionOpen: true,
  metaDescription:
    "জেনারেল ও আলিয়া মাদ্রাসার একটি পূর্ণাঙ্গ একাডেমিক কেয়ার - হালিশহর, চট্টগ্রাম।",
  socialLinks: {
    facebook: "https://facebook.com/shikkhonacademiccare",
    youtube: "",
    instagram: "",
    linkedin: "",
    twitter: "",
  },
  homeStats: [
    { label: "সফল শিক্ষার্থী", value: "৩৫০০+" },
    { label: "অভিজ্ঞ শিক্ষক", value: "২৫+" },
    { label: "সক্রিয় ব্যাচ", value: "১৬+" },
    { label: "বোর্ড জিপিএ-৫ হার", value: "৯৮%" },
  ],
  homeClasses: [
    {
      title: "৬ষ্ঠ থেকে ৮ম শ্রেণি",
      description:
        "বেসিক ফাউন্ডেশন, গণিত ও বিজ্ঞানের নিবিড় যত্ন, ধর্মীয় শিক্ষা ও মাদ্রাসা সিলেবাস সমন্বয়।",
      badge: "জেনারেল ও মাদ্রাসা",
      timing: "সকাল ও বিকাল ব্যাচ",
      href: "/classes#class-6-8",
    },
    {
      title: "৯ম ও ১০ম শ্রেণি (এসএসসি)",
      description:
        "বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা শাখার শতভাগ প্রস্তুতি, অধ্যায়ভিত্তিক পরীক্ষা ও সৃজনশীল প্র্যাকটিস।",
      badge: "এসএসসি স্পেশাল",
      timing: "প্রতিদিন নিয়মিত ক্লাস",
      href: "/classes#class-9-10",
    },
    {
      title: "একাদশ ও দ্বাদশ শ্রেণি (এইচএসসি)",
      description:
        "পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত, জীববিজ্ঞান, আইসিটি ও সাধারণ বিষয়ের বিষয়ভিত্তিক পূর্ণাঙ্গ কেয়ার।",
      badge: "এইচএসসি ব্যাচ",
      timing: "কলেজ সময়ের সাথে সমন্বয়",
      href: "/classes#hsc",
    },
    {
      title: "আলিয়া মাদ্রাসা স্পেশাল কেয়ার",
      description:
        "দাখিল ও আলিম পরীক্ষার্থীদের জন্য বিশেষ পাঠদান, আরবি সাহিত্য, হাদিস ও সাধারণ বিষয়ের সমন্বিত গাইডেন্স।",
      badge: "আলিয়া মাদ্রাসা",
      timing: "বিশেষায়িত শিক্ষক",
      href: "/classes#madrasah",
    },
  ],
  homeFeatures: [
    {
      title: "অভিজ্ঞ শিক্ষকমণ্ডলী",
      description:
        "চট্টগ্রামের স্বনামধন্য কলেজ ও বিশ্ববিদ্যালয়ের অভিজ্ঞ শিক্ষকদের প্রত্যক্ষ তত্ত্বাবধানে মানসম্মত ক্লাস।",
    },
    {
      title: "ডিজিটাল হাজিরা ও সময়ানুবর্তিতা",
      description:
        "প্রতিটি ক্লাসে উপস্থিতি নিশ্চিতকরণ এবং অনুপস্থিত শিক্ষার্থীদের অভিভাবকদের কাছে স্বয়ংক্রিয় তথ্য প্রদান।",
    },
    {
      title: "সাপ্তাহিক ও মাসিক মডেল টেস্ট",
      description:
        "নিয়মিত মূল্যায়ন পরীক্ষা, ওএমআর শিট মূল্যায়ন এবং মেধা তালিকা প্রকাশের মাধ্যমে শিক্ষার্থীর উন্নতি যাচাই।",
    },
    {
      title: "স্বচ্ছ ফি ও ডিজিটাল রসিদ",
      description:
        "মাসিক টিউশন ফি ও পরীক্ষা ফির হিসাব সংরক্ষণ, মোবাইল ব্যাংকিং এবং ডিজিটাল মানি রিসিট প্রদান।",
    },
    {
      title: "অভিভাবকদের সার্বক্ষণিক মনিটরিং",
      description:
        "অভিভাবক মিটিং ও নিয়মিত ফিডব্যাকের মাধ্যমে শিক্ষার্থীর দুর্বলতা চিহ্নিত করে বিশেষ ক্লাসের ব্যবস্থা।",
    },
    {
      title: "প্রিন্টেড লেকচার শিট ও হ্যান্ডনোট",
      description:
        "সহজ ও তথ্যবহুল নিজস্ব লেকচার শিট, হ্যান্ডনোট এবং বোর্ড পরীক্ষার স্ট্যান্ডার্ড প্রশ্নব্যাংক সমাধান।",
    },
  ],
  classroomGallery: [
    {
      id: 1,
      title: "আধুনিক ক্লাসরুম - ১ (মডেল টেস্ট ও লেকচার রুম)",
      badge: "পর্যাপ্ত আলো-বাতাস",
      description:
        "সুপরিসর ক্লাসরুম, বড় হোয়াইটবোর্ড এবং আরামদায়ক রাইটিং-ট্যাবলেট চেয়ার যা দীর্ঘ সময় ক্লাস ও পরীক্ষায় শিক্ষার্থীদের স্বাচ্ছন্দ্য বজায় রাখে।",
      features: ["ব্যক্তিগত চেয়ার-টেবিল", "প্রশস্ত হোয়াইটবোর্ড", "পর্দাযুক্ত জানালা"],
      imageSrc: "/images/classrooms/classroom-1.jpg",
    },
    {
      id: 2,
      title: "একাডেমিক ক্লাসরুম - ২ (নিয়মিত ব্যাচ পাঠদান)",
      badge: "একাগ্র পরিবেশ",
      description:
        "শিক্ষার্থীর মনোযোগ অক্ষুণ্ণ রাখতে সুশৃঙ্খল বিন্যাস এবং প্রতিটি শিক্ষার্থীর দিকে শিক্ষকের সরাসরি নজরদারির উপযুক্ত পাঠদান সুবিধা।",
      features: ["সারিবদ্ধ বসার ব্যবস্থা", "দৃষ্টিগোচর বোর্ড ভিউ", "নিরিবিলি পরিবেশ"],
      imageSrc: "/images/classrooms/classroom-2.jpg",
    },
    {
      id: 3,
      title: "উন্মুক্ত আলোযুক্ত ক্লাসরুম - ৩ (প্রাকৃতিক ভেন্টিলেশন)",
      badge: "স্বাস্থ্যকর পরিবেশ",
      description:
        "বড় জানালা সমৃদ্ধ ক্লাসরুমে পর্যাপ্ত প্রাকৃতিক দিনের আলো ও বাতাস প্রবেশের ব্যবস্থা, যা শিক্ষার্থীদের ক্লান্তিহীন পড়াশোনায় সহায়তা করে।",
      features: ["প্রাকৃতিক পর্যাপ্ত আলো", "প্রশস্ত স্পেস", "গ্রিল ও সুরক্ষা ব্যবস্থা"],
      imageSrc: "/images/classrooms/classroom-3.jpg",
    },
    {
      id: 4,
      title: "স্পেশাল কেয়ার ক্লাসরুম - ৪ (নিবিড় পরিচর্যা ও রিভিশন)",
      badge: "বিশেষ তদারকি",
      description:
        "দুর্বল শিক্ষার্থীদের পৃথকভাবে যত্ন নেওয়া, নিয়মিত সমাধান ক্লাস এবং মডেল টেস্টের মূল্যায়নের জন্য প্রস্তুত সুসজ্জিত কক্ষ।",
      features: ["ছোট গ্রুপ পাঠদান", "আকর্ষণীয় রঙের বিন্যাস", "সুশৃঙ্খল ব্যবস্থাপনা"],
      imageSrc: "/images/classrooms/classroom-4.jpg",
    },
  ],
  homeCtaTitle: "২০২৬ শিক্ষাবর্ষে আসন সংখ্যা সীমিত, আজই ভর্তি নিশ্চিত করুন",
  homeCtaText:
    "শিক্ষার্থীকে সরাসরি কোচিং অফিসে এসে প্রয়োজনীয় কাগজপত্রসহ ভর্তি সম্পন্ন করতে হবে। যে কোনো তথ্যের জন্য আমাদের হেল্পলাইনে সরাসরি কল করুন।",
  classesPageTitle: "পাঠদান বিভাগ ও সক্রিয় ব্যাচসমূহ",
  classesPageSubtitle:
    "৬ষ্ঠ থেকে দ্বাদশ শ্রেণি এবং আলিয়া মাদ্রাসার শিক্ষার্থীদের জন্য বিষয়ভিত্তিক মানসম্মত ব্যাচ এবং সময়সূচী।",
  classPrograms: [
    {
      id: "class-6-8",
      title: "৬ষ্ঠ থেকে ৮ম শ্রেণি (জুনিয়র ফাউন্ডেশন)",
      badge: "জেনারেল ও মাদ্রাসা",
      description:
        "নতুন শিক্ষাক্রমের আলোকে ধারণাগত স্পষ্টতা, গণিত ও বিজ্ঞানের নিয়মিত প্র্যাকটিস, ইংরেজি ব্যাকরণ এবং আলিয়া মাদ্রাসার জন্য আরবি ও ধর্মীয় বিষয়ের বিশেষ কেয়ার।",
      features: [
        "সপ্তাহে ৪ দিন নিয়মিত ক্লাস",
        "প্রতিটি বিষয়ের নিজস্ব লেকচার শিট",
        "সাপ্তাহিক মূল্যায়ন পরীক্ষা",
        "দুর্বলদের জন্য এক্সট্রা রিমেডিয়াল ক্লাস",
      ],
    },
    {
      id: "class-9-10",
      title: "৯ম ও ১০ম শ্রেণি (এসএসসি প্রস্তুতি)",
      badge: "এসএসসি স্পেশাল",
      description:
        "বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা শাখার শিক্ষার্থীদের বোর্ড পরীক্ষায় এ+ (A+) নিশ্চিতকরণে সাজানো পূর্ণাঙ্গ কোর্স। সৃজনশীল প্রশ্নের কাঠামো ও ওএমআর প্র্যাকটিস।",
      features: [
        "পদার্থ, রসায়ন, উচ্চতর গণিত, জীববিজ্ঞানের বিশেষ কেয়ার",
        "অধ্যায়ভিত্তিক মডেল টেস্ট ও বোর্ড প্রশ্ন সমাধান",
        "ওএমআর (OMR) শিটভিত্তিক নৈর্ব্যক্তিক পরীক্ষা",
        "মেধা তালিকা ও প্রগ্রেস রিপোর্ট প্রদান",
      ],
    },
    {
      id: "hsc",
      title: "একাদশ ও দ্বাদশ শ্রেণি (এইচএসসি)",
      badge: "এইচএসসি ব্যাচ",
      description:
        "কলেজের সময়ের সাথে সমন্বয় করে বিজ্ঞান ও বাণিজ্য বিভাগের বিষয়ভিত্তিক গভীর পাঠদান। জটিল বিষয়ের সহজ সমাধান এবং বিশ্ববিদ্যালয় ভর্তি পরীক্ষার পূর্বপ্রস্তুতি।",
      features: [
        "অভিজ্ঞ কলেজ শিক্ষকদের নিবিড় তত্ত্বাবধান",
        "নিয়মিত ল্যাব ও প্র্যাকটিক্যাল ভিত্তিক ধারণা",
        "অধ্যায়ভিত্তিক সৃজনশীল প্রশ্ন সলভিং",
        "টেস্ট ও প্রি-টেস্ট স্পেশাল মডেল টেস্ট সিরিজ",
      ],
    },
    {
      id: "madrasah",
      title: "দাখিল ও আলিম মাদ্রাসা স্পেশাল কেয়ার",
      badge: "আলিয়া মাদ্রাসা",
      description:
        "মাদ্রাসা বোর্ডের শিক্ষার্থীদের সাধারণ বিষয়ের পাশাপাশি আরবি সাহিত্য, কাওয়ায়েদ, হাদিস ও ফিকহ শাস্ত্রে দক্ষ করে গড়ে তুলতে বিশেষায়িত শিক্ষক প্যানেল।",
      features: [
        "আরবি ১ম ও ২য় পত্রের বিশেষ অনুবাদ ও ব্যাকরণ ক্লাস",
        "দাখিল ও আলিম পরীক্ষার পূর্ণাঙ্গ মডেল টেস্ট",
        "সাধারণ গণিত ও বিজ্ঞানের সমন্বিত ক্লাস",
        "পরীক্ষার খাতা পুঙ্খানুপুঙ্খ মূল্যায়ন",
      ],
    },
  ],
  admissionsPageTitle: "সরাসরি ক্যাম্পাসে ভর্তির সম্পূর্ণ নির্দেশিকা",
  admissionsPageSubtitle:
    "প্রতিটি ব্যাচে সীমিত আসন থাকায় গুণগত মান অক্ষুণ্ণ রাখা হয়। শিক্ষার্থীর সঠিক মূল্যায়ন ও ব্যাচ নিশ্চিত করতে সরাসরি অফিসে এসে ভর্তি সম্পন্ন করুন।",
  admissionsNoticeTitle: "ভর্তি সংক্রান্ত প্রাতিষ্ঠানিক নিয়মাবলী (সরাসরি ভর্তি বাধ্যতামূলক)",
  admissionsNoticeText:
    "আমাদের কোচিং সেন্টারে গুণগত মান বজায় রাখা এবং উপযুক্ত ব্যাচ নির্বাচনের স্বার্থে কোনো অনলাইন ভর্তি আবেদন ফরম রাখা হয়নি। শিক্ষার্থী বা সম্মানিত অভিভাবককে সরাসরি আমাদের শাখায় উপস্থিত হয়ে ভর্তি কার্যক্রম সম্পন্ন করতে হবে। কোচিংয়ের প্রধান অ্যাডমিন বা অনুমোদিত কর্মকর্তা সরাসরি সফটওয়্যারে শিক্ষার্থীর তথ্য এন্ট্রি করে ভর্তি সম্পন্ন করবেন।",
  admissionSteps: [
    {
      num: "১",
      title: "ক্যাম্পাসে সরাসরি আগমন ও কাউন্সিলিং",
      desc: "শিক্ষার্থী অথবা অভিভাবককে সরাসরি আমাদের কোচিং সেন্টারে উপস্থিত হতে হবে। অভিজ্ঞ শিক্ষক ও কাউন্সিলর শিক্ষার্থীর পূর্ববর্তী ফলাফল ও শিখন ঘাটতি বিশ্লেষণ করে সঠিক ব্যাচ নির্ধারণ করে দেবেন।",
    },
    {
      num: "২",
      title: "প্রয়োজনীয় কাগজপত্র যাচাই ও জমা",
      desc: "শিক্ষার্থীর ২ কপি পাসপোর্ট ছবি, পূর্ববর্তী শ্রেণির সর্বশেষ পরীক্ষার মার্কশিটের কপি এবং অভিভাবকের পরিচয়পত্রের তথ্য অফিসে সরাসরি জমা দিতে হবে।",
    },
    {
      num: "৩",
      title: "অ্যাডমিন কর্তৃক সফটওয়্যারে রেজিস্ট্রেশন",
      desc: "কোচিংয়ের প্রধান অ্যাডমিন বা অনুমোদিত কর্মকর্তা সরাসরি আমাদের সেন্ট্রাল ম্যানেজমেন্ট সফটওয়্যারে শিক্ষার্থীর যাবতীয় তথ্য এন্ট্রি করে একটি ইউনিক ডিজিটাল স্টুডেন্ট আইডি জেনারেট করবেন।",
    },
    {
      num: "৪",
      title: "ফি প্রদান, আইডি কার্ড ও শিট সংগ্রহ",
      desc: "অফিস কাউন্টারে ভর্তি ফি ও প্রথম মাসের টিউশন ফি পরিশোধ করে ডিজিটাল স্টুডেন্ট আইডি কার্ড, ক্লাস রুটিন এবং প্রথম মাসের লেকচার শিট সংগ্রহ করে ক্লাস শুরু করা যাবে।",
    },
  ],
  admissionRequirements: [
    "শিক্ষার্থীর সাম্প্রতিক ২ কপি রঙিন পাসপোর্ট সাইজ ছবি",
    "পূর্ববর্তী শ্রেণির বার্ষিক বা সমাপনী পরীক্ষার মূল/অনলাইন মার্কশিটের ফটোকপি",
    "শিক্ষার্থীর জন্ম নিবন্ধন সনদ বা জন্ম সনদের ফটোকপি",
    "পিতা/মাতা বা অভিভাবকের জাতীয় পরিচয়পত্রের (NID) ফটোকপি",
    "অভিভাবকের সক্রিয় মোবাইল নম্বর (SMS ও যোগাযোগের জন্য)",
  ],
  contactPageTitle: "আমাদের সাথে যোগাযোগের উপায়",
  contactPageSubtitle:
    "ভর্তি, ব্যাচ তথ্য বা অ্যাকাডেমিক যেকোনো পরামর্শের জন্য সরাসরি আমাদের ক্যাম্পাসে চলে আসুন অথবা ফোনে যোগাযোগ করুন।",
  contactOfficeHours: "সকাল ৮:০০ - রাত ৮:০০ (প্রতিদিন)",
  contactMapEmbedUrl: "",
};

export async function getSiteSettings() {
  try {
    await connectToDatabase();
    let settings = await SiteSettings.findOne({ key: "main" }).lean();
    if (!settings) {
      settings = await SiteSettings.create({ key: "main" });
    }
    const clean = JSON.parse(JSON.stringify(settings));
    return {
      ...defaultSiteSettings,
      ...clean,
      socialLinks: { ...defaultSiteSettings.socialLinks, ...(clean.socialLinks || {}) },
      homeStats: clean.homeStats?.length ? clean.homeStats : defaultSiteSettings.homeStats,
      homeClasses: clean.homeClasses?.length ? clean.homeClasses : defaultSiteSettings.homeClasses,
      homeFeatures: clean.homeFeatures?.length ? clean.homeFeatures : defaultSiteSettings.homeFeatures,
      classroomGallery: clean.classroomGallery?.length ? clean.classroomGallery : defaultSiteSettings.classroomGallery,
      classPrograms: clean.classPrograms?.length ? clean.classPrograms : defaultSiteSettings.classPrograms,
      admissionSteps: clean.admissionSteps?.length ? clean.admissionSteps : defaultSiteSettings.admissionSteps,
      admissionRequirements: clean.admissionRequirements?.length ? clean.admissionRequirements : defaultSiteSettings.admissionRequirements,
      aboutHighlights: clean.aboutHighlights?.length ? clean.aboutHighlights : defaultSiteSettings.aboutHighlights,
    };
  } catch (error) {
    return defaultSiteSettings;
  }
}

export async function getActiveTeachers() {
  try {
    await connectToDatabase();
    const teachers = await Teacher.find({ isActive: true }).sort({ createdAt: 1 }).lean();
    return JSON.parse(JSON.stringify(teachers));
  } catch (error) {
    return [];
  }
}

export async function getTeacherById(id: string) {
  try {
    await connectToDatabase();
    const teacher = await Teacher.findOne({ _id: id, isActive: true }).lean();
    if (!teacher) return null;

    // Also query batches assigned to this teacher
    const batches = await Batch.find({
      assignedTeachers: id,
      status: "active",
    })
      .select("name code classLevel subjects schedule roomOrOnlineDetails")
      .lean();

    return JSON.parse(JSON.stringify({ ...teacher, batches }));
  } catch (error) {
    return null;
  }
}

export async function getLatestNotices(limit = 6) {
  try {
    await connectToDatabase();
    const notices = await Notice.find({
      status: "published",
      visibility: { $in: ["all", "public"] },
    })
      .sort({ isPinned: -1, publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    return JSON.parse(JSON.stringify(notices));
  } catch (error) {
    return [];
  }
}

export async function getAllPublishedNotices(search?: string, priority?: string) {
  try {
    await connectToDatabase();
    const query: Record<string, unknown> = {
      status: "published",
      visibility: { $in: ["all", "public"] },
    };

    if (priority) {
      query.priority = priority;
    }

    if (search?.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { content: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const notices = await Notice.find(query)
      .sort({ isPinned: -1, publishedAt: -1, createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(notices));
  } catch (error) {
    return [];
  }
}

export async function getNoticeById(idOrSlug: string) {
  try {
    await connectToDatabase();
    if (!idOrSlug) return null;

    let decoded = idOrSlug;
    try {
      decoded = decodeURIComponent(idOrSlug);
    } catch {
      decoded = idOrSlug;
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    let notice = null;

    if (isObjectId) {
      notice = await Notice.findOne({
        _id: idOrSlug,
        status: { $ne: "archived" },
      })
        .populate("author", "fullName role")
        .lean();
    }

    if (!notice) {
      notice = await Notice.findOne({
        slug: { $in: [decoded, idOrSlug] },
        status: { $ne: "archived" },
      })
        .populate("author", "fullName role")
        .lean();
    }

    // Direct ID fallback without status filter
    if (!notice && isObjectId) {
      notice = await Notice.findById(idOrSlug)
        .populate("author", "fullName role")
        .lean();
    }

    return notice ? JSON.parse(JSON.stringify(notice)) : null;
  } catch (error) {
    console.error("Error in getNoticeById:", error);
    return null;
  }
}

export const getNoticeBySlug = getNoticeById;

export async function getRecentBlogPosts(limit = 6) {
  try {
    await connectToDatabase();
    const posts = await BlogPost.find({ status: "published" })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .populate("author", "fullName")
      .lean();
    return JSON.parse(JSON.stringify(posts));
  } catch (error) {
    return [];
  }
}

export async function getAllPublishedBlogPosts(tag?: string, search?: string) {
  try {
    await connectToDatabase();
    const query: Record<string, unknown> = { status: "published" };

    if (tag) {
      query.tags = tag;
    }

    if (search?.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { summary: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const posts = await BlogPost.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .populate("author", "fullName")
      .lean();
    return JSON.parse(JSON.stringify(posts));
  } catch (error) {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    await connectToDatabase();
    const post = await BlogPost.findOne({ slug, status: "published" })
      .populate("author", "fullName role")
      .lean();
    if (!post) return null;

    // Increment view count asynchronously
    BlogPost.updateOne({ _id: post._id }, { $inc: { viewCount: 1 } }).exec();

    // Also fetch 3 recent posts as related
    const relatedPosts = await BlogPost.find({
      _id: { $ne: post._id },
      status: "published",
    })
      .sort({ publishedAt: -1 })
      .limit(3)
      .select("title slug coverImage images publishedAt")
      .lean();

    return JSON.parse(JSON.stringify({ post, relatedPosts }));
  } catch (error) {
    return null;
  }
}

export async function getUpcomingEvents(limit = 6) {
  try {
    await connectToDatabase();
    const events = await Event.find({ status: "published" })
      .sort({ startDate: 1 })
      .limit(limit)
      .lean();
    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    return [];
  }
}

export async function getAllPublishedEvents() {
  try {
    await connectToDatabase();
    const events = await Event.find({ status: { $in: ["published", "completed"] } })
      .sort({ startDate: 1 })
      .lean();
    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    return [];
  }
}

export async function getEventById(idOrSlug: string) {
  try {
    await connectToDatabase();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const query: Record<string, unknown> = {
      status: { $in: ["published", "completed"] },
    };
    if (isObjectId) {
      query._id = idOrSlug;
    } else {
      query.slug = idOrSlug;
    }
    const event = await Event.findOne(query).lean();
    return event ? JSON.parse(JSON.stringify(event)) : null;
  } catch (error) {
    return null;
  }
}

const classLevelOrder: Record<string, number> = {
  class_6: 6,
  class_7: 7,
  class_8: 8,
  class_9: 9,
  class_10: 10,
  hsc_1st: 11,
  hsc_2nd: 12,
  alim_1st: 13,
  alim_2nd: 14,
  admission: 15,
};

export async function getActiveBatchesWithDetails() {
  try {
    await connectToDatabase();

    // Prevent bundler tree-shaking of referenced models
    void AcademicSession;
    void Teacher;
    void Enrollment;
    void Batch;

    let batches: any[] = [];
    const batchFilter: Record<string, any> = {
      $or: [
        { status: { $in: ["active", "upcoming"] } },
        { status: { $exists: false } },
        { status: null },
      ],
    };

    try {
      batches = await Batch.find(batchFilter)
        .populate("academicSession", "name isCurrent")
        .populate("assignedTeachers", "fullName qualifications subjects")
        .lean();
    } catch (popErr) {
      console.warn("⚠️ [PublicData] Batch populate warning, falling back to unpopulated query:", popErr);
      batches = await Batch.find(batchFilter).lean();
    }

    if (!batches || batches.length === 0) {
      return [];
    }

    const batchIds = batches.map((b) => b._id);
    let countsMap = new Map<string, number>();

    try {
      const enrollmentCounts = await Enrollment.aggregate([
        { $match: { batch: { $in: batchIds }, status: "active" } },
        { $group: { _id: "$batch", count: { $sum: 1 } } },
      ]);
      countsMap = new Map<string, number>(
        enrollmentCounts.map((e) => [String(e._id), e.count])
      );
    } catch (aggErr) {
      console.warn("⚠️ [PublicData] Enrollment aggregate warning:", aggErr);
    }

    const result = batches.map((b) => {
      const enrolledCount = countsMap.get(String(b._id)) || 0;
      const capacity = Number(b.capacity) || 40;
      const availableSeats = Math.max(0, capacity - enrolledCount);
      const isFull = enrolledCount >= capacity;
      return {
        ...JSON.parse(JSON.stringify(b)),
        capacity,
        enrolledCount,
        availableSeats,
        isFull,
      };
    });

    // Sort by class progression (Class 6 -> 10 -> HSC -> Alim -> Admission) and then by batch name
    result.sort((a: any, b: any) => {
      const orderA = classLevelOrder[a.classLevel] || 99;
      const orderB = classLevelOrder[b.classLevel] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || "").localeCompare(b.name || "", "bn");
    });

    return result;
  } catch (error) {
    console.error("❌ [PublicData] getActiveBatchesWithDetails error:", error);
    return [];
  }
}
