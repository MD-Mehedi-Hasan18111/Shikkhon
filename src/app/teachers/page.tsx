import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Award,
  ArrowRight,
  Mail,
  Phone,
  UserCheck,
  Search,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getActiveTeachers, getSiteSettings } from "@/lib/public-data";
import { toBanglaNumber } from "@/lib/utils";

export const metadata = {
  title: "সম্মানিত শিক্ষকবৃন্দ | শিক্ষণ একাডেমিক কেয়ার",
  description:
    "ঢাকা বিশ্ববিদ্যালয়, বুয়েট ও মেডিকেল কলেজের অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষক মণ্ডলীর পরিচিতি ও বিষয়ভিত্তিক তালিকা।",
};

export const revalidate = 60;

interface Teacher {
  _id: string;
  teacherCode: string;
  fullName: string;
  phone?: string;
  email?: string;
  qualifications: string[];
  subjects: string[];
  biography?: string;
  avatarUrl?: string;
}

export default async function TeachersPage() {
  const [teachers, settings] = await Promise.all([
    getActiveTeachers(),
    getSiteSettings(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <PublicHeader settings={settings} />

      <main className="flex-1">
        {/* Banner Section */}
        <section className="bg-brand-banner bg-[#002e33] bg-gradient-to-b from-[#001e22] via-[#002e33] to-[#003e44] text-white py-14 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-teal-200 mb-4">
              <Link href="/" className="hover:underline">
                হোম
              </Link>
              <span>/</span>
              <span className="text-white font-medium">শিক্ষকবৃন্দ</span>
            </div>

            <div className="max-w-3xl">
              <Badge
                variant="outline"
                className="text-teal-200 border-teal-400 bg-white/10 mb-3"
              >
                অভিজ্ঞ মেন্টর প্যানেল
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white">
                আমাদের নিবেদিতপ্রাণ শিক্ষক ও মেন্টরবৃন্দ
              </h1>
              <p className="text-base sm:text-lg text-teal-100 leading-relaxed">
                {settings.institutionName || "শিক্ষণ একাডেমিক কেয়ার"}-এ পাঠদান করেন দেশের
                শীর্ষস্থানীয় বিশ্ববিদ্যালয় (ঢাকা বিশ্ববিদ্যালয়, বুয়েট, মেডিকেল ও কুয়েট)
                থেকে পাসকৃত একঝাঁক অভিজ্ঞ ও তরুণ শিক্ষক।
              </p>
            </div>
          </div>
        </section>

        {/* Teachers Listing Grid */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  শিক্ষক তালিকা ({toBanglaNumber(teachers.length)} জন)
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  প্রতিটি বিষয়ে বিশেষায়িত শিক্ষক দ্বারা মানসম্মত পাঠদান পরিচালিত হয়
                </p>
              </div>
            </div>

            {teachers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <GraduationCap className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  বর্তমানে কোনো শিক্ষকের তথ্য প্রকাশিত হয়নি
                </h3>
                <p className="text-slate-600 max-w-md mx-auto mb-6">
                  খুব শীঘ্রই আমাদের সম্মানিত শিক্ষকদের তালিকা হালনাগাদ করা হবে। সরাসরি
                  জানতে আমাদের অফিসে যোগাযোগ করুন।
                </p>
                <Link href="/contact">
                  <Button variant="primary">যোগাযোগ করুন</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {teachers.map((teacher: Teacher) => (
                  <Card
                    key={teacher._id}
                    className="flex flex-col h-full bg-white hover:shadow-lg transition-shadow duration-300 border-slate-200"
                  >
                    <CardHeader className="flex flex-row items-start gap-4 pb-4">
                      {teacher.avatarUrl ? (
                        <img
                          src={teacher.avatarUrl}
                          alt={teacher.fullName}
                          className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-primary-100 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-primary-700 to-primary-500 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
                          {teacher.fullName.slice(0, 1)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-mono font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                          {teacher.teacherCode}
                        </span>
                        <CardTitle className="text-lg font-bold text-slate-900 mt-1 line-clamp-1">
                          {teacher.fullName}
                        </CardTitle>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {teacher.qualifications && teacher.qualifications.length > 0
                            ? teacher.qualifications.join(" • ")
                            : "বিষয়ভিত্তিক শিক্ষক"}
                        </p>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 justify-between gap-4 pt-0">
                      <div>
                        <div className="mb-3">
                          <span className="text-xs font-medium text-slate-500 block mb-1.5">
                            পাঠদানের বিষয়সমূহ:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {teacher.subjects.map((sub: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-slate-100 text-slate-800 text-xs font-normal"
                              >
                                {sub}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {teacher.biography && (
                          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                            {teacher.biography}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 mt-auto">
                        <Link href={`/teachers/${teacher._id}`} className="w-full block">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full flex items-center justify-center gap-2 group hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300"
                          >
                            <span>বিস্তারিত প্রোফাইল ও ব্যাচসূচী</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Join as Teacher CTA */}
        <section className="py-12 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              আপনি কি শিক্ষক হিসেবে আমাদের সাথে যুক্ত হতে চান?
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              মেধাবী ও আন্তরিক শিক্ষকদের শিক্ষণ একাডেমিক কেয়ার পরিবারে সর্বদা স্বাগত
              জানাই। আপনার সিভি পাঠিয়ে আমাদের সাথে সরাসরি যোগাযোগ করুন।
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact">
                <Button variant="primary">যোগাযোগ করুন</Button>
              </Link>
              {settings.contactEmail && (
                <a href={`mailto:${settings.contactEmail}`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>সিভি ইমেইল করুন</span>
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter settings={settings} />
    </div>
  );
}
