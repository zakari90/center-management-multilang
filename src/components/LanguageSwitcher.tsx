"use client";

import { useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";
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

  const buildNextPath = (currentPathname: string, newLanguage: string) => {
    const safe = currentPathname && currentPathname.startsWith("/") ? currentPathname : `/${currentPathname || ""}`;
    const segments = safe.split("/");
    if (["ar", "en", "fr"].includes(segments[1])) {
      segments[1] = newLanguage;
    } else {
      segments.splice(1, 0, newLanguage);
    }
    const nextPath = segments.join("/");
    return nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
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

    const nextPath = buildNextPath(pathname, newLanguage);
    router.push(nextPath);
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
        <DropdownMenuItem onClick={() => changeLanguage("ar")} className="cursor-pointer">
          العربية
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("en")} className="cursor-pointer">
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("fr")} className="cursor-pointer">
          Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
