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
  buttonText = 'Download PDF',
}: PdfExporterProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return

    const element = contentRef.current
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
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
      <div ref={contentRef} className="bg-white rounded-md shadow p-4">
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
