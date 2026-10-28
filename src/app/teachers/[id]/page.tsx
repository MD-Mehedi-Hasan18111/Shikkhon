import { notFound } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  ArrowLeft,
  Mail,
  Phone,
  CheckCircle2,
  Users,
  MapPin,
  Sparkles,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getTeacherById, getSiteSettings } from "@/lib/public-data";
import { toBanglaNumber, formatBanglaDate, formatTo12h } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const teacher = await getTeacherById(id);
  if (!teacher) return { title: "শিক্ষক পাওয়া যায়নি | শিক্ষণ একাডেমিক কেয়ার" };

  return {
    title: `${teacher.fullName} | শিক্ষক প্রোফাইল | শিক্ষণ একাডেমিক কেয়ার`,
    description: `${teacher.fullName}-এর শিক্ষাগত যোগ্যতা, পাঠদানের বিষয় ও বর্তমান ব্যাচের সময়সূচী।`,
  };
}

export default async function TeacherDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [teacher, settings] = await Promise.all([getTeacherById(id), getSiteSettings()]);

  if (!teacher) {
    notFound();
  }

  const dayMap: Record<string, string> = {
    saturday: "শনিবার",
    sunday: "রবিবার",
    monday: "সোমবার",
    tuesday: "মঙ্গলবার",
    wednesday: "বুধবার",
    thursday: "বৃহস্পতিবার",
    friday: "শুক্রবার",
  };

  const classLevelMap: Record<string, string> = {
    class_6: "৬ষ্ঠ শ্রেণি",
    class_7: "৭ম শ্রেণি",
    class_8: "৮ম শ্রেণি",
    class_9: "৯ম শ্রেণি",
    class_10: "১০ম শ্রেণি (এসএসসি)",
    hsc_1st: "একাদশ শ্রেণি (এইচএসসি)",
    hsc_2nd: "দ্বাদশ শ্রেণি (এইচএসসি)",
    admission: "বিশ্ববিদ্যালয় ভর্তি",
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <PublicHeader settings={settings} />

      <main className="flex-1">
        {/* Breadcrumb banner */}
        <section className="bg-brand-banner bg-[#002e33] bg-gradient-to-b from-[#001e22] via-[#002e33] to-[#003e44] text-white py-10 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-teal-200 mb-4">
              <Link href="/" className="hover:underline">
                হোম
              </Link>
              <span>/</span>
              <Link href="/teachers" className="hover:underline">
                শিক্ষকবৃন্দ
              </Link>
              <span>/</span>
              <span className="text-white font-medium">{teacher.fullName}</span>
            </div>

            <Link
              href="/teachers"
              className="inline-flex items-center gap-2 text-sm text-primary-200 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>সকল শিক্ষকদের তালিকায় ফিরুন</span>
            </Link>
          </div>
        </section>

        {/* Teacher Profile Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 -mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Teacher Card */}
            <div className="lg:col-span-1">
              <Card className="bg-white border-slate-200 shadow-sm sticky top-24">
                <CardContent className="p-6 text-center">
                  {teacher.avatarUrl ? (
                    <img
                      src={teacher.avatarUrl}
                      alt={teacher.fullName}
                      className="w-32 h-32 rounded-3xl object-cover mx-auto border-4 border-primary-50 shadow-md mb-4"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-primary-700 to-primary-500 text-white flex items-center justify-center font-bold text-4xl mx-auto shadow-md mb-4">
                      {teacher.fullName.slice(0, 1)}
                    </div>
                  )}

                  <span className="inline-block text-xs font-mono font-medium text-primary-800 bg-primary-100 px-2.5 py-1 rounded-full mb-2">
                    আইডি: {teacher.teacherCode}
                  </span>

                  <h1 className="text-2xl font-bold text-slate-900">
                    {teacher.fullName}
                  </h1>
                  <p className="text-slate-500 text-sm mt-1 mb-4">
                    {teacher.qualifications && teacher.qualifications.length > 0
                      ? teacher.qualifications.join(" • ")
                      : "সম্মানিত শিক্ষক"}
                  </p>

                  <div className="pt-4 border-t border-slate-100 flex flex-col gap-3 text-left">
                    {teacher.email && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                    )}
                    {teacher.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{toBanglaNumber(teacher.phone)}</span>
                      </div>
                    )}
                    {teacher.joiningDate && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>যোগদান: {formatBanglaDate(teacher.joiningDate)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link href="/admissions" className="w-full block">
                      <Button variant="primary" className="w-full">
                        এই শিক্ষকের ব্যাচে ভর্তি হতে আবেদন
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Bio & Assigned Batches */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bio & Subjects */}
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary-600" />
                    <span>পাঠদানের বিষয়সমূহ ও শিক্ষাগত যোগ্যতা</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                      বিষয়সমূহ:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {teacher.subjects?.map((sub: string, idx: number) => (
                        <Badge
                          key={idx}
                          className="bg-primary-50 text-primary-800 border-primary-200 px-3 py-1 text-sm font-medium"
                        >
                          {sub}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {teacher.qualifications && teacher.qualifications.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">
                        ডিগ্রি ও একাডেমি:
                      </h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {teacher.qualifications.map((q: string, idx: number) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {teacher.biography && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">
                        শিক্ষক পরিচিতি ও দর্শন:
                      </h3>
                      <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {teacher.biography}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Batches Section */}
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary-600" />
                        <span>বর্তমান পাঠদানরত ব্যাচসমূহ</span>
                      </CardTitle>
                      <p className="text-slate-500 text-sm mt-1">
                        এই শিক্ষকের তত্ত্বাবধানে পরিচালিত সক্রিয় ব্যাচ ও সময়সূচী
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {toBanglaNumber(teacher.batches?.length || 0)} টি ব্যাচ
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {!teacher.batches || teacher.batches.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <Clock className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600 font-medium">
                        বর্তমানে কোনো সরাসরি ব্যাচ উন্মুক্ত নেই
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        নতুন সেশনের ব্যাচ তালিকা খুব শীঘ্রই এখানে প্রকাশিত হবে।
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teacher.batches.map((batch: any) => (
                        <div
                          key={batch._id}
                          className="p-4 rounded-xl border border-slate-200 hover:border-primary-300 transition-colors bg-white hover:bg-slate-50/50"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-base">
                                  {batch.name}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {batch.code}
                                </Badge>
                              </div>
                              <span className="text-xs text-primary-700 font-medium mt-0.5 inline-block">
                                {classLevelMap[batch.classLevel] || batch.classLevel}
                              </span>
                            </div>

                            <Link href="/admissions">
                              <Button size="sm" variant="outline" className="text-xs">
                                ভর্তি তথ্য
                              </Button>
                            </Link>
                          </div>

                          {/* Subjects */}
                          {batch.subjects && batch.subjects.length > 0 && (
                            <div className="text-xs text-slate-600 mb-2">
                              <span className="font-medium text-slate-700">বিষয়:</span>{" "}
                              {batch.subjects.join(", ")}
                            </div>
                          )}

                          {/* Schedule Grid */}
                          {batch.schedule && batch.schedule.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                              {batch.schedule.map((item: any, sIdx: number) => (
                                <div key={sIdx} className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span>
                                    <strong className="text-slate-700">
                                      {dayMap[item.day] || item.day}:
                                    </strong>{" "}
                                    {formatTo12h(item.startTime)} –{" "}
                                    {formatTo12h(item.endTime)}
                                    {item.roomNo && ` (${item.roomNo})`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter settings={settings} />
    </div>
  );
}
