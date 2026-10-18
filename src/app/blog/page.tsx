import Link from "next/link";
import {
  BookOpen,
  Calendar,
  User,
  Eye,
  Tag,
  Search,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getAllPublishedBlogPosts, getSiteSettings } from "@/lib/public-data";
import { formatBanglaDate, toBanglaNumber } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ q?: string; tag?: string }>;
}

export const revalidate = 60;

export const metadata = {
  title: "শিক্ষামূলক ব্লগ ও গাইডলাইন | শিক্ষণ একাডেমিক কেয়ার",
  description:
    "পড়াশোনার কৌশল, বোর্ড পরীক্ষার প্রস্তুতি, গণিত ও বিজ্ঞানের সহজ সমাধান এবং ক্যারিয়ার গাইডলাইন বিষয়ক শিক্ষামূলক ব্লগ।",
};

export default async function BlogPage({ searchParams }: PageProps) {
  const { q, tag } = await searchParams;
  const [posts, settings] = await Promise.all([
    getAllPublishedBlogPosts(tag, q),
    getSiteSettings(),
  ]);

  // Common tags for educational blogs
  const popularTags = [
    "এসএসসি প্রস্তুতি",
    "এইচএসসি প্রস্তুতি",
    "পড়ার কৌশল",
    "গণিত সমাধান",
    "বিজ্ঞান চর্চা",
    "মডেল টেস্ট",
  ];

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
              <span className="text-white font-medium">ব্লগ ও গাইডলাইন</span>
            </div>

            <div className="max-w-3xl">
              <Badge
                variant="outline"
                className="text-teal-200 border-teal-400 bg-white/10 mb-3"
              >
                জ্ঞান ও দিকনির্দেশনা
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white">
                শিক্ষামূলক ব্লগ ও পরামর্শ
              </h1>
              <p className="text-base sm:text-lg text-teal-100 leading-relaxed">
                পড়াশোনায় ধারাবাহিক মনোযোগ, কার্যকর রিভিশন টেকনিক এবং পরীক্ষায় সর্বোচ্চ
                ফলাফলের জন্য আমাদের অভিজ্ঞ মেন্টরদের রচিত বিশেষ প্রবন্ধসমূহ।
              </p>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="border-b border-slate-200 bg-white py-4 shadow-xs sticky top-16 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto py-1">
                <Link href="/blog">
                  <Badge
                    variant={!tag ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap ${
                      !tag
                        ? "bg-primary-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    সকল পোস্ট
                  </Badge>
                </Link>
                {popularTags.map((tName) => (
                  <Link key={tName} href={`/blog?tag=${encodeURIComponent(tName)}`}>
                    <Badge
                      variant={tag === tName ? "default" : "outline"}
                      className={`cursor-pointer px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap ${
                        tag === tName
                          ? "bg-primary-900 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {tName}
                    </Badge>
                  </Link>
                ))}
              </div>

              {/* Search Form */}
              <form method="GET" action="/blog" className="flex items-center gap-2">
                {tag && <input type="hidden" name="tag" value={tag} />}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="q"
                    defaultValue={q || ""}
                    placeholder="ব্লগ খুঁজুন..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" className="h-9 px-3">
                  খুঁজুন
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Blog Listing Grid */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-900">
                প্রকাশিত পোস্ট ({toBanglaNumber(posts.length)} টি)
              </h2>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  কোনো ব্লগ পোস্ট পাওয়া যায়নি
                </h3>
                <p className="text-slate-600 max-w-md mx-auto mb-6">
                  {q || tag
                    ? "আপনার খোঁজের সাথে মেলে এমন কোনো নিবন্ধ নেই। অন্য বিষয় দিয়ে খুঁজে দেখতে পারেন।"
                    : "খুব শীঘ্রই আমাদের শিক্ষকদের রচিত বিভিন্ন শিক্ষামূলক প্রবন্ধ এখানে প্রকাশিত হবে।"}
                </p>
                {(q || tag) && (
                  <Link href="/blog">
                    <Button variant="outline">সকল ব্লগ দেখুন</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {posts.map((post: any) => (
                  <Card
                    key={post._id}
                    className="flex flex-col h-full bg-white hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden group"
                  >
                    {/* Cover image or gradient header */}
                    <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                      {post.coverImage ? (
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 flex items-center justify-center p-6 text-white text-center">
                          <BookOpen className="h-12 w-12 text-primary-200/50" />
                        </div>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-primary-950 font-medium text-xs px-2.5 py-1 rounded-md shadow-xs">
                          {post.tags[0]}
                        </span>
                      )}
                    </div>

                    <CardContent className="flex flex-col flex-1 p-5 sm:p-6 justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-2.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatBanglaDate(post.publishedAt || post.createdAt)}
                          </span>
                          {post.viewCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5 text-slate-400" />
                              {toBanglaNumber(post.viewCount)} বার পঠিত
                            </span>
                          )}
                        </div>

                        <Link href={`/blog/${post.slug}`} className="block">
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors line-clamp-2 mb-2 leading-snug">
                            {post.title}
                          </h3>
                        </Link>

                        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                          {post.summary}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center text-xs font-bold">
                            {post.author?.fullName
                              ? post.author.fullName.slice(0, 1)
                              : "শিক্ষক"}
                          </div>
                          <span className="text-xs text-slate-700 font-medium truncate max-w-[120px]">
                            {post.author?.fullName || "শিক্ষক মণ্ডলী"}
                          </span>
                        </div>

                        <Link
                          href={`/blog/${post.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800"
                        >
                          <span>সম্পূর্ণ পড়ুন</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter settings={settings} />
    </div>
  );
}
