import { useEffect } from "react";
import { bakerySchema, portfolioPageSchema } from "@/lib/seo";

const PAGE_META = {
  home: {
    title: "Heavenly Bakes – Custom Cakes & Artisan Bakes by Divya",
    schema: bakerySchema,
  },
  portfolio: {
    title: "Portfolio – Heavenly Bakes by Divya",
    schema: portfolioPageSchema,
  },
} as const;

interface SEOHeadProps {
  page: keyof typeof PAGE_META;
}

/**
 * Injects page-specific JSON-LD structured data and updates the document title.
 * Place as the first child inside each page component.
 */
export default function SEOHead({ page }: SEOHeadProps) {
  const { title, schema } = PAGE_META[page];

  useEffect(() => {
    document.title = title;

    const scriptId = `ld-json-${page}`;
    let el = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!el) {
      el = document.createElement("script");
      el.id = scriptId;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }

    el.textContent = JSON.stringify(schema);

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) document.head.removeChild(existing);
    };
  }, [page, title, schema]);

  return null;
}
