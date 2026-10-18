"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Settings,
  Building,
  Phone,
  Globe,
  Save,
  CheckCircle2,
  RefreshCw,
  Share2,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useAppDispatch } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";

interface SiteSettingsData {
  institutionName: string;
  shortName: string;
  motto: string;
  bannerUrl: string;
  phones: string[];
  email: string;
  address: string;
  whatsAppNumber: string;
  whatsAppPrefillMessage?: string;
  isWhatsAppEnabled?: boolean;
  allowTeacherStudentMessaging?: boolean;
  admissionNotice: string;
  isAdmissionOpen: boolean;
  metaDescription: string;
  heroTitle?: string;
  heroSubtitle?: string;
  aboutTitle?: string;
  aboutText?: string;
  socialLinks: {
    facebook?: string;
    youtube?: string;
    instagram?: string;
  };
}

export default function SiteSettingsManagementPage() {
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SiteSettingsData>({
    institutionName: "শিক্ষণ একাডেমিক কেয়ার",
    shortName: "শিক্ষণ",
    motto: "চলো সেরা হই...",
    bannerUrl: "/images/banner.png",
    phones: ["০১৯৮-২৭০৫৬৪৬", "০১৮৫৯-৭৮৭৩৯৯"],
    email: "info@shikkhon.edu.bd",
    address: "এস ক্লাব মোড় (এর পশ্চিম পার্শ্বে), রোড-০২, বি-ব্লক, হালিশহর, চট্টগ্রাম",
    whatsAppNumber: "+880 1866-098078",
    whatsAppPrefillMessage:
      "আসসালামু আলাইকুম, আমি কোচিং এ ভর্তির ব্যাপারে তথ্য জানতে চাচ্ছি।",
    isWhatsAppEnabled: true,
    allowTeacherStudentMessaging: true,
    admissionNotice:
      "২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে দ্বাদশ শ্রেণি এবং আলিয়া মাদ্রাসা স্পেশাল কেয়ারে ভর্তি চলছে।",
    isAdmissionOpen: true,
    metaDescription:
      "জেনারেল ও আলিয়া মাদ্রাসার একটি পূর্ণাঙ্গ একাডেমিক কেয়ার - হালিশহর, চট্টগ্রাম।",
    heroTitle: "সেরা প্রস্তুতিতে গড়ে তুলুন নিশ্চিত ভবিষ্যৎ",
    heroSubtitle:
      "৬ষ্ঠ থেকে দ্বাদশ শ্রেণি ও আলিয়া মাদ্রাসা স্পেশাল কেয়ার। অভিজ্ঞ শিক্ষক ও নিয়মিত মূল্যায়নের মাধ্যমে শিক্ষার্থীর সামগ্রিক মেধা বিকাশ।",
    aboutTitle: "অভিজ্ঞতা ও আধুনিক পাঠদানের অনন্য সমন্বয়",
    aboutText:
      "শিক্ষণ একাডেমিক কেয়ারে আমরা শিক্ষার্থীদের মুখস্থ বিদ্যার পরিবর্তে বিষয়ের মৌলিক ধারণা স্পষ্ট করার ওপর জোর দিই। অভিজ্ঞ শিক্ষক মণ্ডলীর প্রত্যক্ষ তত্ত্বাবধান, মানসম্মত লেকচার শিট, নিয়মিত ওএমআর পরীক্ষা এবং অভিভাবক সমন্বয়ের মাধ্যমে প্রতিটি শিক্ষার্থীর মেধা বিকাশ নিশ্চিত করা হয়।",
    socialLinks: {
      facebook: "https://facebook.com/shikkhonacademiccare",
      youtube: "",
      instagram: "",
    },
  });

  const [phoneInput, setPhoneInput] = useState("");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/site-settings", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "সেটিংস লোড করা সম্ভব হয়নি।");
      }
      if (json.data) {
        setFormData({
          institutionName: json.data.institutionName || "",
          shortName: json.data.shortName || "",
          motto: json.data.motto || "",
          bannerUrl: json.data.bannerUrl || "/images/banner.png",
          phones: json.data.phones || [],
          email: json.data.email || "",
          address: json.data.address || "",
          whatsAppNumber: json.data.whatsAppNumber || "",
          whatsAppPrefillMessage:
            json.data.whatsAppPrefillMessage ||
            "আসসালামু আলাইকুম, আমি কোচিং এ ভর্তির ব্যাপারে তথ্য জানতে চাচ্ছি।",
          isWhatsAppEnabled: json.data.isWhatsAppEnabled ?? true,
          allowTeacherStudentMessaging: json.data.allowTeacherStudentMessaging ?? true,
          admissionNotice: json.data.admissionNotice || "",
          isAdmissionOpen: json.data.isAdmissionOpen ?? true,
          metaDescription: json.data.metaDescription || "",
          heroTitle: json.data.heroTitle || "",
          heroSubtitle: json.data.heroSubtitle || "",
          aboutTitle: json.data.aboutTitle || "",
          aboutText: json.data.aboutText || "",
          socialLinks: json.data.socialLinks || {},
        });
        setPhoneInput((json.data.phones || []).join(", "));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ডাটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = async () => {
    setSaving(true);
    const phonesArray = phoneInput
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      phones: phonesArray,
    };

    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "সংরক্ষণ করতে সমস্যা হয়েছে।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সংরক্ষণ সফল",
          message: "ওয়েবসাইট ও প্রতিষ্ঠানের কনফিগারেশন সফলভাবে আপডেট হয়েছে।",
        })
      );
    } catch (err: unknown) {
      dispatch(
        addNotification({
          type: "error",
          title: "সংরক্ষণ ব্যর্থ",
          message: err instanceof Error ? err.message : "সমস্যা হয়েছে।",
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="প্রতিষ্ঠান ও ওয়েবসাইট সেটিংস (Site Settings)"
        subtitle="প্রতিষ্ঠানের নাম, যোগাযোগের হেল্পলাইন, ভর্তি নোটিশ ও পাবলিক ওয়েবসাইট কনফিগারেশন"
        breadcrumbs={[{ label: "ড্যাশবোর্ড", href: "/admin" }, { label: "সেটিংস" }]}
        actions={
          <Button
            onClick={handleSaveSettings}
            disabled={saving || loading}
            className="flex items-center gap-1.5 bg-[#00636b] hover:bg-[#004f55] text-white"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}</span>
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" title="ত্রুটি">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Institution Basic Info */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Building className="h-4 w-4 text-[#00636b]" />
                <span>প্রাতিষ্ঠানিক পরিচয় ও ব্র্যান্ডিং</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    প্রতিষ্ঠানের পূর্ণ নাম
                  </label>
                  <Input
                    value={formData.institutionName}
                    onChange={(e) =>
                      setFormData({ ...formData, institutionName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    সংক্ষিপ্ত নাম
                  </label>
                  <Input
                    value={formData.shortName}
                    onChange={(e) =>
                      setFormData({ ...formData, shortName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    মূল স্লোগান (Motto)
                  </label>
                  <Input
                    value={formData.motto}
                    onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ক্যাম্পাস ঠিকানা
                  </label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 1.5: Homepage Banner Image */}
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#00636b]" />
                  <span>হোমপেজ ব্যানার ইমেজ (Full Width Hero Banner)</span>
                </CardTitle>
                {formData.bannerUrl !== "/images/banner.png" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData({ ...formData, bannerUrl: "/images/banner.png" })
                    }
                    className="text-xs h-7 text-slate-600 border-slate-200 hover:bg-slate-50"
                  >
                    ডিফল্ট ব্যানারে ফিরুন
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <ImageUpload
                value={formData.bannerUrl}
                onChange={(url) =>
                  setFormData({ ...formData, bannerUrl: url || "/images/banner.png" })
                }
                folder="banners"
                aspectRatio="banner"
                label="মূল হোমপেজ ব্যানার"
                description="হোমপেজের শীর্ষে পূর্ণ-প্রস্থে (Full Width) এই ব্যানারটি প্রদর্শিত হবে। নতুন ছবি আপলোড করলে ওয়েবসাইট তাৎক্ষণিকভাবে নতুন ব্যানার প্রদর্শন করবে।"
              />
            </CardContent>
          </Card>

          {/* Section 2: Contact Numbers & WhatsApp */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#c27a29]" />
                <span>হেল্পলাইন ও যোগাযোগের নম্বরসমূহ</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    যোগাযোগের ফোন নম্বর (কমা দিয়ে লিখুন)
                  </label>
                  <Input
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="০১৯৮-২৭০৫৬৪৬, ০১৮৫৯-৭৮৭৩৯৯"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    হোয়াটসঅ্যাপ নম্বর
                  </label>
                  <Input
                    value={formData.whatsAppNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsAppNumber: e.target.value })
                    }
                    placeholder="+880 1866-098078"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    অফিসিয়াল ইমেইল
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@shikkhon.edu.bd"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  হোয়াটসঅ্যাপ প্রাক-নির্ধারিত মেসেজ (Prefilled Chat Message)
                </label>
                <Input
                  value={formData.whatsAppPrefillMessage || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsAppPrefillMessage: e.target.value })
                  }
                  placeholder="আসসালামু আলাইকুম, আমি কোচিং এ ভর্তির ব্যাপারে তথ্য জানতে চাচ্ছি।"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  ওয়েবসাইটের ফ্লোটিং বাটন বা লিংকে ক্লিক করলে স্বয়ংক্রিয়ভাবে এই মেসেজটি
                  ব্যবহারকারীর হোয়াটসঅ্যাপে টাইপ হয়ে থাকবে।
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition">
                  <input
                    type="checkbox"
                    checked={formData.isWhatsAppEnabled ?? true}
                    onChange={(e) =>
                      setFormData({ ...formData, isWhatsAppEnabled: e.target.checked })
                    }
                    className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      ওয়েবসাইটে ফ্লোটিং হোয়াটসঅ্যাপ বাটন প্রদর্শন করুন
                    </span>
                    <span className="text-[11px] text-slate-500">
                      সক্রিয় থাকলে পাবলিক পোর্টালের সব পেজে সবুজ চ্যাট বাটনটি ভেসে থাকবে।
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition">
                  <input
                    type="checkbox"
                    checked={formData.allowTeacherStudentMessaging ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allowTeacherStudentMessaging: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      শিক্ষক-শিক্ষার্থী সরাসরি ইন-অ্যাপ চ্যাট অনুমতি
                    </span>
                    <span className="text-[11px] text-slate-500">
                      নিষ্ক্রিয় থাকলে শিক্ষক ও শিক্ষার্থী কেবল প্রশাসনের সাথে মেসেজ করতে
                      পারবে।
                    </span>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Admissions Notice & Status */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#65a30d]" />
                <span>ভর্তি বিজ্ঞপ্তি ও ওয়েবসাইট মেসেজ</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ভর্তি চলার কেন্দ্রীয় ব্যানার বার্তা
                </label>
                <textarea
                  rows={2}
                  value={formData.admissionNotice}
                  onChange={(e) =>
                    setFormData({ ...formData, admissionNotice: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#00636b] focus:ring-1 focus:ring-[#00636b]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="admissionStatusCheck"
                  checked={formData.isAdmissionOpen}
                  onChange={(e) =>
                    setFormData({ ...formData, isAdmissionOpen: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-[#00636b] focus:ring-[#00636b]"
                />
                <label
                  htmlFor="admissionStatusCheck"
                  className="text-xs font-medium text-slate-800"
                >
                  ওয়েবসাইটে{" "}
                  <span className="text-emerald-600 font-bold">
                    &quot;ভর্তি চলছে&quot;
                  </span>{" "}
                  স্ট্যাটাস সক্রিয় রাখুন
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  সার্চ ইঞ্জিন মেটা বিবরণ (SEO Meta Description)
                </label>
                <Input
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, metaDescription: e.target.value })
                  }
                  placeholder="গুগল সার্চে প্রদর্শিত সংক্ষিপ্ত প্রাতিষ্ঠানিক বিবরণ..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Public Website Hero & About Content */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary-700" />
                <span>
                  পাবলিক ওয়েবসাইটের প্রধান ব্যানার ও পরিচিতি কনটেন্ট (Hero & About CMS)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  হিরো সেকশন প্রধান শিরোনাম (Hero Title)
                </label>
                <Input
                  value={formData.heroTitle || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, heroTitle: e.target.value })
                  }
                  placeholder="যেমন: সেরা প্রস্তুতিতে গড়ে তুলুন নিশ্চিত ভবিষ্যৎ"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  হিরো সেকশন বিস্তারিত বিবরণী (Hero Subtitle)
                </label>
                <textarea
                  rows={2}
                  value={formData.heroSubtitle || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, heroSubtitle: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#00636b] focus:ring-1 focus:ring-[#00636b]"
                  placeholder="হিরো সেকশনে প্রধান শিরোনামের নিচে প্রদর্শিত বিবরণী..."
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  পরিচিতি সেকশনের শিরোনাম (About Title)
                </label>
                <Input
                  value={formData.aboutTitle || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, aboutTitle: e.target.value })
                  }
                  placeholder="যেমন: অভিজ্ঞতা ও আধুনিক পাঠদানের অনন্য সমন্বয়"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  পরিচিতি সেকশনের বিস্তারিত বিবরণ (About Text)
                </label>
                <textarea
                  rows={4}
                  value={formData.aboutText || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, aboutText: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#00636b] focus:ring-1 focus:ring-[#00636b]"
                  placeholder="প্রতিষ্ঠান সম্পর্কে বিশদ পরিচিতি ও দর্শন..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Social Media Links */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Share2 className="h-4 w-4 text-blue-600" />
                <span>সোশ্যাল মিডিয়া পেজের লিংকসমূহ</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ফেসবুক পেজ লিংক
                  </label>
                  <Input
                    value={formData.socialLinks.facebook || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialLinks: {
                          ...formData.socialLinks,
                          facebook: e.target.value,
                        },
                      })
                    }
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ইউটিউব চ্যানেল
                  </label>
                  <Input
                    value={formData.socialLinks.youtube || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, youtube: e.target.value },
                      })
                    }
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ইনস্টাগ্রাম
                  </label>
                  <Input
                    value={formData.socialLinks.instagram || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialLinks: {
                          ...formData.socialLinks,
                          instagram: e.target.value,
                        },
                      })
                    }
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
