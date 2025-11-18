'use client'

import { useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'

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

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return

    const element = contentRef.current
    // Get background color from theme
    const bgColor = typeof window !== 'undefined' 
      ? getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#ffffff'
      : '#ffffff'
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: bgColor,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(fileName)
  }

  return (
    <div className="space-y-4">
      <div ref={contentRef} className=" rounded-md shadow p-1">
        {children}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          {buttonText}
        </Button>
      </div>
    </div>
  )
}
