import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/authContext";
import { routing } from "@/i18n/routing";
import { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { jsonLdScriptProps } from "react-schemaorg";
import { WebSite } from "schema-dts";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../globals.css";

const DOMAIN = process.env.NEXT_PUBLIC_BASE_URL || ""

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  if (!params) {
    notFound();
  }

  const { locale } = await params;
  if (!locale || !hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const isArabic = locale === "ar";
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return (
    <html lang={locale} dir={isArabic ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#000000" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <script
          {...jsonLdScriptProps<WebSite>({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: t("title"),
            description: t("description"),
            url: DOMAIN,
            inLanguage: locale,
          })}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
                <Analytics />
        <SpeedInsights />

      </body>
    </html>
  );
}

const locales = ["ar", "fr", "en"] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: DOMAIN,
      siteName: "center management, تدبير مراجعتي",
      images: [
        {
          url: `${DOMAIN}/og-image.png`,
          width: 1200,
          height: 630,
          alt: t("title"),
        },
      ],
      locale: locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [`${DOMAIN}/og-image.png`],
      creator: "@s0ver5",
    },
    alternates: {
      canonical: DOMAIN,
      languages: {
        en: `${DOMAIN}/en`,
        ar: `${DOMAIN}/ar`,
        fr: `${DOMAIN}/fr`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    authors: [{ name: "zakaria zinedine" }],
    icons: [{ rel: "icon", url: "/icon.png" }],
  };
}