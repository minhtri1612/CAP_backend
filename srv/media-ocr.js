const fs = require('fs')
const fsp = require('fs').promises
const path = require('path')
const cds = require('@sap/cds')

function uploadsDir() {
  return path.join(cds.root, 'uploads')
}

function pdfPathFor(shipmentId) {
  return path.join(uploadsDir(), `${shipmentId}.pdf`)
}

async function toBuffer(data) {
  if (data == null) return null
  if (Buffer.isBuffer(data)) return data
  if (typeof data === 'string') return Buffer.from(data)
  if (typeof data.pipe === 'function' || typeof data[Symbol.asyncIterator] === 'function') {
    const chunks = []
    for await (const chunk of data) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }
  return Buffer.from(data)
}

/**
 * Mock BTP DMS / Object Store — local filesystem only.
 * Production needs Document Management Service binding.
 */
async function saveInvoicePdf(shipmentId, data) {
  const buf = await toBuffer(data)
  if (!buf || !buf.length) return null
  await fsp.mkdir(uploadsDir(), { recursive: true })
  const filePath = pdfPathFor(shipmentId)
  await fsp.writeFile(filePath, buf)
  return { filePath, buf }
}

function mockOcrExtract(filePath) {
  const slug = path.basename(filePath, '.pdf').replace(/-/g, '').slice(0, 8).toUpperCase()
  return {
    trackingNumber: `TRK-${slug}`,
    batchId: `BATCH-${slug}`,
  }
}

function hasLocalInvoice(shipmentId) {
  return fs.existsSync(pdfPathFor(shipmentId))
}

module.exports = { saveInvoicePdf, mockOcrExtract, hasLocalInvoice, pdfPathFor, toBuffer }
