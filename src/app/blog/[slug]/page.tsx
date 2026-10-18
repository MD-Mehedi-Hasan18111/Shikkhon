import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  User,
  Eye,
  Tag,
  ArrowLeft,
  ArrowRight,
  Share2,
  Clock,
  Sparkles,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getBlogPostBySlug, getSiteSettings } from "@/lib/public-data";
import { formatBanglaDate, toBanglaNumber } from "@/lib/utils";
import { ImageGalleryViewer } from "@/components/public/ImageGalleryViewer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const data = await getBlogPostBySlug(slug);
  if (!data?.post) return { title: "ব্লগ পোস্ট পাওয়া যায়নি | শিক্ষণ একাডেমিক কেয়ার" };

  return {
    title: `${data.post.title} | শিক্ষামূলক ব্লগ | শিক্ষণ একাডেমিক কেয়ার`,
    description: data.post.summary,
    openGraph: {
      title: data.post.title,
      description: data.post.summary,
      images: data.post.coverImage ? [data.post.coverImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const [data, settings] = await Promise.all([
    getBlogPostBySlug(slug),
    getSiteSettings(),
  ]);

  if (!data?.post) {
    notFound();
  }

  const { post, relatedPosts } = data;

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
              <Link href="/blog" className="hover:underline">
                ব্লগ
              </Link>
              <span>/</span>
              <span className="text-white font-medium line-clamp-1">{post.title}</span>
            </div>

            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-primary-200 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>সকল ব্লগে ফিরুন</span>
            </Link>
          </div>
        </section>

        {/* Blog Post Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 -mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Article */}
            <article className="lg:col-span-2">
              <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <ImageGalleryViewer
                  coverImage={post.coverImage}
                  images={post.images}
                  title={post.title}
                  coverAspect="wide"
                >
                  <CardContent className="p-6 sm:p-10">
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((t: string, idx: number) => (
                          <Link key={idx} href={`/blog?tag=${encodeURIComponent(t)}`}>
                            <Badge
                              variant="secondary"
                              className="bg-primary-50 text-primary-800 hover:bg-primary-100 text-xs font-normal"
                            >
                              #{t}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-4">
                      {post.title}
                    </h1>

                    {/* Author & Date metadata bar */}
                    <div className="flex flex-wrap items-center gap-4 py-3 border-y border-slate-100 text-xs sm:text-sm text-slate-500 mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xs">
                          {post.author?.fullName ? post.author.fullName.slice(0, 1) : "লে"}
                        </div>
                        <span className="font-medium text-slate-800">
                          {post.author?.fullName || "শিক্ষক মণ্ডলী"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{formatBanglaDate(post.publishedAt || post.createdAt)}</span>
                      </div>

                      {post.viewCount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4 text-slate-400" />
                          <span>{toBanglaNumber(post.viewCount)} বার পড়া হয়েছে</span>
                        </div>
                      )}
                    </div>

                    {/* Summary / Lead */}
                    {post.summary && (
                      <div className="bg-primary-50/60 border-l-4 border-primary-600 p-4 rounded-r-lg mb-8 text-base text-primary-950 font-medium leading-relaxed">
                        {post.summary}
                      </div>
                    )}

                    {/* Full Text Content */}
                    {/<[a-z][\s\S]*>/i.test(post.content) ? (
                      <div
                        className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base space-y-4"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                    ) : (
                      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base whitespace-pre-line space-y-4">
                        {post.content}
                      </div>
                    )}

                    {/* Author Footer Card */}
                    <div className="mt-12 p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary-800 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                        {post.author?.fullName ? post.author.fullName.slice(0, 1) : "শি"}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          {post.author?.fullName || "শিক্ষক মণ্ডলী"}
                        </h4>
                        <p className="text-xs text-primary-700 font-medium mb-1">
                          লেখক ও মেন্টর, {settings.institutionName || "শিক্ষণ একাডেমি"}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          শিক্ষার্থীদের নিয়মিত পড়াশোনার অভ্যাস গঠন ও বোর্ড পরীক্ষায়
                          কাঙ্ক্ষিত ফলাফল অর্জনে দিকনির্দেশনামূলক পরামর্শ দিয়ে থাকেন।
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </ImageGalleryViewer>
              </Card>
            </article>

            {/* Sidebar: Related Posts & CTA */}
            <aside className="space-y-6">
              {/* Related Posts */}
              {relatedPosts && relatedPosts.length > 0 && (
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary-600" />
                      <span>সম্পর্কিত আরও ব্লগ</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {relatedPosts.map((rel: any) => (
                      <Link
                        key={rel._id}
                        href={`/blog/${rel.slug}`}
                        className="group flex gap-3 items-start p-2 rounded-lg hover:bg-slate-50 transition"
                      >
                        {rel.coverImage || (rel.images && rel.images[0]) ? (
                          <img
                            src={rel.coverImage || rel.images[0]}
                            alt={rel.title}
                            className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-100"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                            <BookOpen className="h-6 w-6 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] text-slate-400 block mb-0.5">
                            {formatBanglaDate(rel.publishedAt || rel.createdAt)}
                          </span>
                          <h5 className="text-sm font-semibold text-slate-800 group-hover:text-primary-700 transition line-clamp-2 leading-snug">
                            {rel.title}
                          </h5>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Admission CTA Box */}
              <div className="bg-brand-card-dark bg-[#002e33] bg-gradient-to-br from-[#002e33] to-[#001e22] text-white p-6 rounded-2xl border border-teal-800 shadow-md">
                <Sparkles className="h-8 w-8 text-amber-400 mb-3" />
                <h3 className="font-bold text-lg mb-2 text-white">
                  নতুন ব্যাচে ভর্তি চলছে!
                </h3>
                <p className="text-xs text-teal-100 leading-relaxed mb-4">
                  ৬ষ্ঠ থেকে দ্বাদশ শ্রেণি এবং আলিয়া মাদ্রাসা স্পেশাল কেয়ারে সীমিত আসনে
                  ভর্তি চলছে।
                </p>
                <Link href="/admissions" className="block">
                  <Button variant="secondary" className="w-full text-xs font-semibold">
                    ভর্তি ফর্ম পূরণ করুন
                  </Button>
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <PublicFooter settings={settings} />
    </div>
  );
}
