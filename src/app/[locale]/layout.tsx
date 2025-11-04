import PWAPerformanceMonitor from "@/components/pwa-performance-monitor";
import PWATestingSuite from "@/components/pwa-testing-suite";
import PWAUpdateHandler from "@/components/pwa-update-handler";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/authContext";
import { routing } from "@/i18n/routing";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { jsonLdScriptProps } from "react-schemaorg";
import { WebSite } from "schema-dts";
import { Toaster } from "sonner";
import "../globals.css";
import LoadWS from "./loadws";

const DOMAIN = process.env.NEXT_PUBLIC_BASE_URL || "";

// ✅ PWA Viewport Configuration
export const viewport: Viewport = {
  themeColor: '#1e40af',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

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
        {/* ✅ PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* ✅ PWA Apple Specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="إدارة المركز" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/icon-192x192.png" />
        
        {/* ✅ PWA Microsoft Specific */}
        <meta name="msapplication-TileImage" content="/icon-192x192.png" />
        {/* <meta name="msapplication-square70x70logo" content="/icon-72x72.png" /> */}
        <meta name="msapplication-square150x150logo" content="/icon-192x192.png" />
        <meta name="msapplication-wide310x150logo" content="/icon-192x192.png" />
        <meta name="msapplication-square310x310logo" content="/icon512_maskable.png" />
        
        {/* ✅ PWA Additional Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="إدارة المركز" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="address=no" />
        <meta name="format-detection" content="email=no" />
        
        {/* Original Meta Tags */}
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
              {/* <SyncProvider> */}
                  <LoadWS/>

              {children}
              {/* </SyncProvider> */}
                    {/* <PWADebug /> */}
              {/* <ServiceWorkerRegister /> */}
              {/* <InstallPWA /> */}
              <PWAUpdateHandler />
              {/* <PagePrecacheHandler /> */}
              <PWAPerformanceMonitor />
              <PWATestingSuite />
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

const locales = ["ar", "en", "fr"] as const;

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
    
    // ✅ PWA Manifest
    manifest: '/manifest.json',
    
    // ✅ PWA Apple Web App
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'ECMS',
    },
    
    // ✅ Format Detection
    formatDetection: {
      telephone: false,
    },
    
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: DOMAIN,
      siteName: "إدارة المركز، تدبير مراجعتي",
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
    icons: [
      { rel: "icon", url: "/icon-192x192.png" },
      { rel: "apple-touch-icon", url: "/icon-192x192.png" }
    ],
  };
}
