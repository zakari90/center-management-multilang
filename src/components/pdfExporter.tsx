'use client'

import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PdfExporterProps {
  children: React.ReactNode
  fileName?: string
  buttonText?: string
}

export default function PdfExporter({
  children,
  fileName = 'document.pdf',
  buttonText = '',
}: PdfExporterProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return
    setIsExporting(true)

    // html2canvas cannot parse modern oklch()/lab() color functions or color-mix().
    // We temporarily inject a style block that overrides all theme CSS
    // variables with hex equivalents for the entire export subtree.
    const hexOverrides = document.createElement('style')
    hexOverrides.textContent = `
      [data-pdf-export], [data-pdf-export] * {
        --background: #ffffff !important;
        --foreground: #1a1a1a !important;
        --card: #ffffff !important;
        --card-foreground: #1a1a1a !important;
        --primary: #2563eb !important;
        --primary-foreground: #ffffff !important;
        --secondary: #f3f4f6 !important;
        --secondary-foreground: #1f2937 !important;
        --muted: #f9fafb !important;
        --muted-foreground: #6b7280 !important;
        --accent: #eff6ff !important;
        --accent-foreground: #1e40af !important;
        --destructive: #dc2626 !important;
        --destructive-foreground: #ffffff !important;
        --border: #e5e7eb !important;
        --input: #e5e7eb !important;
        --ring: #2563eb !important;
        --success: #16a34a !important;
        --warning: #ca8a04 !important;
        --info: #0284c7 !important;
        --student: #0ea5e9 !important;
        --teacher: #f59e0b !important;
        --payment: #8b5cf6 !important;
        
        /* Fallback for any direct usage of modern colors */
        outline-color: #2563eb !important;
        border-color: #e5e7eb !important;
      }
      
      /* Target specifically problematic components like avatars or badges */
      [data-pdf-export] .bg-primary { background-color: #2563eb !important; }
      [data-pdf-export] .text-primary { color: #2563eb !important; }
      [data-pdf-export] .bg-secondary { background-color: #f3f4f6 !important; }
      [data-pdf-export] .text-secondary { color: #1f2937 !important; }
    `
    document.head.appendChild(hexOverrides)
    contentRef.current.setAttribute('data-pdf-export', '')
 
    try {
      const element = contentRef.current
 
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // Additional sanitization on the cloned document
          const clonedElement = clonedDoc.querySelector("[data-pdf-export]");
          if (clonedElement) {
            // Remove any elements that might cause issues but aren't needed for the PDF
            const scripts = clonedDoc.getElementsByTagName("script");
            for (let i = scripts.length - 1; i >= 0; i--) {
              scripts[i].parentNode?.removeChild(scripts[i]);
            }
          }
        },
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`)
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to export PDF. Please try again.')
    } finally {
      // Clean up overrides
      document.head.removeChild(hexOverrides)
      contentRef.current?.removeAttribute('data-pdf-export')
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div ref={contentRef} className=" rounded-md shadow p-1">
        {children}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleDownloadPDF} disabled={isExporting} className="flex items-center gap-2">
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {buttonText}
        </Button>
      </div>
    </div>
  )
}

