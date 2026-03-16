"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  /** Generic items array: [{ label, href? }, ...]. Last item is current page (no link). */
  items?: BreadcrumbItem[];
  /** Legacy — district page: single level below Home */
  district?: string;
  slug?: string;
}

export default function Breadcrumb({ items, district, slug }: Props) {
  const t = useTranslations("common");
  // Normalise to items array
  const crumbs: BreadcrumbItem[] =
    items ??
    (district && slug
      ? [{ label: district, href: `/distrito/${slug}` }]
      : []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("home"),
        item: "https://madridhome.tech",
      },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.label,
        ...(c.href ? { item: `https://madridhome.tech${c.href}` } : {}),
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-6">
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li>
            <Link href="/" className="hover:text-slate-300 transition-colors">
              {t("home")}
            </Link>
          </li>
          {crumbs.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span aria-hidden="true">/</span>
              {c.href ? (
                <Link href={c.href} className="hover:text-slate-300 transition-colors">
                  {c.label}
                </Link>
              ) : (
                <span className="text-slate-300">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
