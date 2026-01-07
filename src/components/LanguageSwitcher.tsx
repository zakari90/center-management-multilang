"use client";

import { useEffect, useState } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const LanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentLanguage, setCurrentLanguage] = useState("ar");
  const [isMounted, setIsMounted] = useState(false);

  const normalizePathname = (value: string) => {
    const safe = value.startsWith("/") ? value : `/${value}`;
    const segments = safe.split("/");
    if (["ar", "en", "fr"].includes(segments[1])) {
      const rest = segments.slice(2).join("/");
      return rest ? `/${rest}` : "/";
    }
    return safe;
  };

  useEffect(() => {
    setIsMounted(true);
    const savedLanguage =
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("NEXT_LOCALE="))
        ?.split("=")[1] || "ar";
    setCurrentLanguage(savedLanguage);

    const safePathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
    const urlLanguage = safePathname.split("/")[1];
    if (["ar", "en", "fr"].includes(urlLanguage)) {
      setCurrentLanguage(urlLanguage);
    }
  }, [pathname]);

  const changeLanguage = (newLanguage: string) => {
    setCurrentLanguage(newLanguage);
    document.cookie = `NEXT_LOCALE=${newLanguage}; path=/;`;

    const basePath = normalizePathname(pathname);
    router.push(basePath, { locale: newLanguage });
    router.refresh();
  };

  const languageLabels = {
    ar: "العربية",
    en: "English",
    fr: "Français",

  };

  // Prevent hydration mismatch by only rendering after mount
  if (!isMounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        {languageLabels["ar"]}
      </Button>
    );
  }

  return (
    <DropdownMenu dir={currentLanguage === "ar" ? "rtl" : "ltr"}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {languageLabels[currentLanguage as keyof typeof languageLabels]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage("ar")}>
          العربية
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("en")}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("fr")}>
          Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
