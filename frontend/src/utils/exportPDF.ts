import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportCotizacionPDF(htmlContent: string, filename: string) {
  const container = document.createElement('div')
  container.style.cssText = [
    'position:fixed',
    'left:-9999px',
    'top:0',
    'width:794px',
    'min-height:100px',
    'background:#ffffff',
    'padding:40px 48px',
    'font-family:Arial,sans-serif',
    'color:#111111',
    'font-size:13px',
    'line-height:1.5',
    'box-sizing:border-box',
  ].join(';')
  container.innerHTML = htmlContent
  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = pdf.internal.pageSize.getHeight()
    const imgH = (canvas.height * pdfW) / canvas.width

    let remaining = imgH
    let yOffset = 0
    let page = 0

    while (remaining > 0) {
      if (page > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfW, imgH)
      yOffset += pdfH
      remaining -= pdfH
      page++
    }

    pdf.save(filename)
  } finally {
    document.body.removeChild(container)
  }
}
