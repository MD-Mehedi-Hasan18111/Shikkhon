import React from "react";

export interface SocialLinksData {
  facebook?: string;
  youtube?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  [key: string]: string | undefined;
}

interface SocialMediaLinksProps {
  socialLinks?: SocialLinksData;
  className?: string;
  variant?: "topbar" | "footer";
  showLabel?: boolean;
}

/**
 * Ensures link opens properly with https:// even if the admin typed 'facebook.com/...'
 */
function formatUrl(url?: string): string {
  if (!url || !url.trim()) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function SocialMediaLinks({
  socialLinks,
  className = "",
  variant = "topbar",
}: SocialMediaLinksProps) {
  if (!socialLinks) return null;

  const links = [
    {
      key: "facebook",
      name: "ফেসবুক",
      url: formatUrl(socialLinks.facebook),
      hoverText: "hover:text-[#1877F2]",
      footerBg: "hover:bg-[#1877F2] hover:text-white",
      icon: (
        <svg className="w-full h-full fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      key: "youtube",
      name: "ইউটিউব",
      url: formatUrl(socialLinks.youtube),
      hoverText: "hover:text-[#FF0000]",
      footerBg: "hover:bg-[#FF0000] hover:text-white",
      icon: (
        <svg className="w-full h-full fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      key: "instagram",
      name: "ইনস্টাগ্রাম",
      url: formatUrl(socialLinks.instagram),
      hoverText: "hover:text-[#E4405F]",
      footerBg:
        "hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white",
      icon: (
        <svg className="w-full h-full fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      key: "linkedin",
      name: "লিঙ্কডইন",
      url: formatUrl(socialLinks.linkedin),
      hoverText: "hover:text-[#0A66C2]",
      footerBg: "hover:bg-[#0A66C2] hover:text-white",
      icon: (
        <svg className="w-full h-full fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
    },
    {
      key: "twitter",
      name: "এক্স (টুইটার)",
      url: formatUrl(socialLinks.twitter),
      hoverText: "hover:text-white",
      footerBg: "hover:bg-black hover:text-white",
      icon: (
        <svg className="w-full h-full fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
  ].filter((item) => Boolean(item.url));

  if (links.length === 0) {
    return null;
  }

  if (variant === "topbar") {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {links.map((link) => (
          <a
            key={link.key}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${link.name} এ আমাদের ফলো করুন (নতুন উইন্ডোতে খুলবে)`}
            aria-label={`${link.name} লিঙ্ক`}
            className={`h-6 w-6 p-1 rounded-md flex items-center justify-center text-slate-300 ${link.hoverText} hover:bg-white/10 transition-all duration-150 transform hover:scale-110 active:scale-95`}
          >
            {link.icon}
          </a>
        ))}
      </div>
    );
  }

  // Footer variant
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {links.map((link) => (
        <a
          key={link.key}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`${link.name} (নতুন উইন্ডোতে খুলবে)`}
          aria-label={`${link.name} লিঙ্ক`}
          className={`h-8 w-8 p-1.5 rounded-lg bg-slate-800 text-slate-400 ${link.footerBg} border border-slate-700/60 shadow-xs flex items-center justify-center transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md active:scale-95`}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
