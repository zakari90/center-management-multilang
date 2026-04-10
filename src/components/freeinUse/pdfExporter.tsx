"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PdfExporterProps {
  children: React.ReactNode;
  fileName?: string;
  buttonText?: string;
}

export default function PdfExporter({
  children,
  fileName = "document.pdf",
  buttonText = "",
}: PdfExporterProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsExporting(true);

    // html2canvas cannot parse modern oklch()/lab() color functions.
    // We temporarily inject a style block that overrides all theme CSS
    // variables with hex equivalents on the capture target.
    const hexOverrides = document.createElement("style");
    hexOverrides.textContent = `
      [data-pdf-export] {
        --background: #f5f7fa !important;
        --foreground: #2d3555 !important;
        --card: #ffffff !important;
        --card-foreground: #2d3555 !important;
        --primary: #2bb673 !important;
        --primary-foreground: #ffffff !important;
        --secondary: #e8ecf4 !important;
        --secondary-foreground: #53596e !important;
        --muted: #f0f1f4 !important;
        --muted-foreground: #6e7385 !important;
        --accent: #d6f5e4 !important;
        --accent-foreground: #2d3555 !important;
        --destructive: #e5484d !important;
        --border: #e2e4ea !important;
        --input: #e2e4ea !important;
        --ring: #2bb673 !important;
        color: #2d3555 !important;
      }
    `;
    document.head.appendChild(hexOverrides);
    contentRef.current.setAttribute("data-pdf-export", "");

    try {
      const element = contentRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      // Clean up overrides
      document.head.removeChild(hexOverrides);
      contentRef.current?.removeAttribute("data-pdf-export");
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div ref={contentRef} className=" rounded-md shadow p-1">
        {children}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {buttonText}
        </Button>
      </div>
    </div>
  );
}
