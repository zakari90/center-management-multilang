import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

  const locales = ["ar", "fr" , "en"] as const;

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "never",
      priority: 1,
    },
    ...locales.map((locale) => ({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      priority: 0.8,
    })),
  ];
}

