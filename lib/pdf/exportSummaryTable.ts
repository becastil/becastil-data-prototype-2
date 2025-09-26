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
    margin = 54, // 0.75 inch in points
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
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const usableWidth = pageWidth - margin * 2
  const usableHeight = pageHeight - margin * 2

  const imgWidth = usableWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = margin

  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST')
  heightLeft -= usableHeight

  while (heightLeft > 0) {
    pdf.addPage()
    position = margin - (imgHeight - heightLeft)
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST')
    heightLeft -= usableHeight
  }

  pdf.save(filename)
}

export default exportSummaryTable
