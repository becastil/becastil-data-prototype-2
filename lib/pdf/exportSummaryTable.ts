import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ExportSummaryOptions {
  filename?: string
  margin?: number
  scale?: number
}

export async function exportSummaryTable(
  element: HTMLElement,
  options: ExportSummaryOptions = {},
): Promise<void> {
  if (!element) {
    throw new Error('Missing table element for export')
  }

  const {
    filename = `summary-table-${new Date().toISOString().split('T')[0]}.pdf`,
    margin = 36, // half inch in points for tighter fit
    scale = 2,
  } = options

  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const usableWidth = pageWidth - margin * 2
  const usableHeight = pageHeight - margin * 2

  const originalWidth = canvas.width
  const originalHeight = canvas.height

  const widthRatio = usableWidth / originalWidth
  const heightRatio = usableHeight / originalHeight
  const ratio = Math.min(1, widthRatio, heightRatio)

  const renderWidth = originalWidth * ratio
  const renderHeight = originalHeight * ratio

  const xOffset = (pageWidth - renderWidth) / 2
  const yOffset = (pageHeight - renderHeight) / 2

  pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderWidth, renderHeight, undefined, 'FAST')

  pdf.save(filename)
}

export default exportSummaryTable
