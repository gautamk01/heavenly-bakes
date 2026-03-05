// Schema.org JSON-LD structured data for Heavenly Bakes

const SITE_URL = "https://heavenlybakesbydivya.com";
const INSTAGRAM_URL = "https://www.instagram.com/heavenlybakes.by.divya/";
const OG_IMAGE =
  "https://res.cloudinary.com/dqkgzlmqm/image/upload/Cake%20images/p27/heavenlybakes.by.divya_1653890429_2849361901436936913_5465995859.jpg";

export const bakerySchema = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: "Heavenly Bakes by Divya",
  description:
    "Handcrafted custom cakes, pastries and artisan bakes made with organic ingredients. Baking since 2019.",
  url: SITE_URL,
  image: OG_IMAGE,
  sameAs: [INSTAGRAM_URL],
  priceRange: "$$",
  servesCuisine: "Bakery",
  foundingDate: "2019",
  address: {
    "@type": "PostalAddress",
    addressCountry: "MY",
  },
  areaServed: {
    "@type": "Country",
    name: "Malaysia",
  },
  currenciesAccepted: "MYR",
  paymentAccepted: "Cash, Online Transfer",
  founder: {
    "@type": "Person",
    name: "Divya",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Custom Cakes & Baked Goods",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Product", name: "Custom Birthday Cakes" } },
      { "@type": "Offer", itemOffered: { "@type": "Product", name: "Wedding Cakes" } },
      { "@type": "Offer", itemOffered: { "@type": "Product", name: "Pastries & Macarons" } },
      { "@type": "Offer", itemOffered: { "@type": "Product", name: "Artisan Bread & Croissants" } },
    ],
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "8",
    bestRating: "5",
    worstRating: "1",
  },
};

export const portfolioPageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Portfolio – Heavenly Bakes by Divya",
  description: "Gallery of custom cakes and artisan bakes crafted by Heavenly Bakes.",
  url: `${SITE_URL}/portfolio`,
  isPartOf: { "@type": "WebSite", url: SITE_URL, name: "Heavenly Bakes by Divya" },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Portfolio", item: `${SITE_URL}/portfolio` },
    ],
  },
};
