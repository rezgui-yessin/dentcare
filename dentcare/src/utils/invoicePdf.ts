import type { Invoice, Patient, Settings } from '../types'

/** Builds the invoice PDF with jsPDF (loaded lazily so it does not weigh on the first page load). */
async function buildPdf(invoice: Invoice, patient: Patient | undefined, settings: Settings) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const cur = settings.cabinet.currency
  const money = (n: number) => `${n.toFixed(2)} ${cur}`
  const W = 210
  let y = 20

  doc.setFillColor(22, 128, 122)
  doc.rect(0, 0, W, 34, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(settings.cabinet.name, 15, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(settings.cabinet.address, 15, 23)
  doc.text(`${settings.cabinet.phone}  |  ${settings.cabinet.email}`, 15, 28)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', W - 15, 18, { align: 'right' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.number, W - 15, 25, { align: 'right' })

  y = 46
  doc.setTextColor(40, 50, 60)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Billed to', 15, y)
  doc.text('Invoice date', 120, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(patient ? `${patient.firstName} ${patient.lastName}` : '-', 15, y + 6)
  doc.text(invoice.date, 120, y + 6)
  doc.setFontSize(9)
  if (patient) {
    doc.text(patient.phone, 15, y + 12)
    if (patient.insurance) doc.text(`Insurance: ${patient.insurance.provider} (${patient.insurance.policyNumber})`, 15, y + 17)
  }

  y = 78
  doc.setFillColor(238, 246, 245)
  doc.rect(15, y - 5, W - 30, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.text('Description', 18, y)
  doc.text('Qty', 118, y, { align: 'right' })
  doc.text('Unit price', 150, y, { align: 'right' })
  doc.text('Amount', W - 18, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  y += 9
  invoice.items.forEach((it) => {
    doc.text(it.description, 18, y)
    doc.text(String(it.quantity), 118, y, { align: 'right' })
    doc.text(money(it.unitPrice), 150, y, { align: 'right' })
    doc.text(money(it.quantity * it.unitPrice), W - 18, y, { align: 'right' })
    doc.setDrawColor(225, 232, 232)
    doc.line(15, y + 3, W - 15, y + 3)
    y += 9
  })

  y += 4
  const row = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(label, 130, y)
    doc.text(value, W - 18, y, { align: 'right' })
    y += 7
  }
  row('Subtotal', money(invoice.subtotal))
  if (invoice.discount) row('Discount', `- ${money(invoice.discount)}`)
  doc.setFontSize(11)
  row('Total', money(invoice.total), true)
  doc.setFontSize(9)
  row('Paid', money(invoice.amountPaid))
  row('Balance due', money(Math.max(0, invoice.total - invoice.amountPaid)), true)

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text(`Payment status: ${invoice.paymentStatus}${invoice.paymentMethod ? ` (${invoice.paymentMethod})` : ''}`, 15, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 130, 140)
  doc.text('Thank you for your trust.', 15, 285)
  return doc
}

export async function downloadInvoicePdf(invoice: Invoice, patient: Patient | undefined, settings: Settings) {
  const doc = await buildPdf(invoice, patient, settings)
  doc.save(`${invoice.number}.pdf`)
}

export async function printInvoicePdf(invoice: Invoice, patient: Patient | undefined, settings: Settings) {
  const doc = await buildPdf(invoice, patient, settings)
  doc.autoPrint()
  window.open(String(doc.output('bloburl')), '_blank')
}
