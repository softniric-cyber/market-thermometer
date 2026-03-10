import Link from "next/link";

interface Props {
  district: string;
  slug: string;
}

export default function Breadcrumb({ district, slug }: Props) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://madridhome.tech",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: district,
        item: `https://madridhome.tech/distrito/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-6">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-slate-300 transition-colors">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-300">{district}</li>
        </ol>
      </nav>
    </>
  );
}
