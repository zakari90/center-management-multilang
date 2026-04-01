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

    try {
      const element = contentRef.current

      // html2canvas doesn't support modern CSS color functions (lab, oklch)
      // Use a safe fallback for the export background
      const bgColor = '#ffffff'

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: bgColor,
        logging: false,
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

