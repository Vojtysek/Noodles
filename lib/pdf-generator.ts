import PDFDocument from 'pdfkit'
import path from 'path'
import { fmtCzk, fmtCzkShort } from '@/lib/mock-data'
import type { CompiledData } from '@/app/api/exports/utils/data-compiler'

function czk(value: number): string {
  return fmtCzkShort(value)
}

function czkFull(value: number): string {
  return fmtCzk(value)
}

type DocType = InstanceType<typeof PDFDocument>

// ─── Color palette ────────────────────────────────────────────────────────────
const PRIMARY = '#1a56db'
const DARK = '#111827'
const MID = '#374151'
const MUTED = '#6b7280'
const LIGHT_BG = '#f3f4f6'
const BORDER = '#e5e7eb'
const GREEN = '#059669'

// ─── Font paths ───────────────────────────────────────────────────────────────
const FONT = path.join(process.cwd(), 'node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf')

// ─── Layout constants ─────────────────────────────────────────────────────────
const MARGIN = 50
const PAGE_WIDTH = 595.28 // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawHorizontalRule(doc: DocType) {
  doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).strokeColor(BORDER).lineWidth(0.5).stroke()
}

function heading2(doc: DocType, text: string) {
  doc.moveDown(0.8)
  doc.fontSize(13).fillColor(PRIMARY).font('Geist').text(text, MARGIN, doc.y, { width: CONTENT_WIDTH })
  doc.moveDown(0.25)
  drawHorizontalRule(doc)
  doc.moveDown(0.4)
}

function heading3(doc: DocType, text: string) {
  doc.moveDown(0.4)
  doc.fontSize(10).fillColor(DARK).font('Geist').text(text, MARGIN, doc.y, { width: CONTENT_WIDTH })
  doc.moveDown(0.2)
}

function body(doc: DocType, text: string) {
  doc.fontSize(10).fillColor(MID).font('Geist').text(text, MARGIN, doc.y, { width: CONTENT_WIDTH, lineGap: 2 })
  doc.moveDown(0.3)
}

function muted(doc: DocType, text: string) {
  doc.fontSize(9).fillColor(MUTED).font('Geist').text(text, MARGIN, doc.y, { width: CONTENT_WIDTH })
  doc.moveDown(0.2)
}

function metricRow(doc: DocType, label: string, value: string, highlight = false) {
  const y = doc.y
  doc.fontSize(9).fillColor(MUTED).font('Geist').text(label, MARGIN, y, { width: CONTENT_WIDTH / 2 })
  doc.fontSize(10)
    .fillColor(highlight ? PRIMARY : DARK)
    .font('Geist')
    .text(value, MARGIN + CONTENT_WIDTH / 2, y, { width: CONTENT_WIDTH / 2, align: 'right' })
  doc.y = y + 15
}

function drawMetricBox(
  doc: DocType,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  color = PRIMARY
) {
  doc.roundedRect(x, y, w, h, 5).fillColor(LIGHT_BG).fill()
  doc.fontSize(8).fillColor(MUTED).font('Geist').text(label, x + 10, y + 10, { width: w - 20 })
  doc.fontSize(15).fillColor(color).font('Geist').text(value, x + 10, y + 25, { width: w - 20 })
}

function drawBullet(doc: DocType, text: string, indent = MARGIN + 14, color = PRIMARY) {
  const y = doc.y
  doc.circle(indent - 7, y + 5, 2.5).fillColor(color).fill()
  doc.fontSize(10).fillColor(MID).font('Geist').text(text, indent, y, { width: CONTENT_WIDTH - (indent - MARGIN) })
  doc.moveDown(0.3)
}

function drawPageHeader(doc: DocType, title: string, subtitle: string, date: string) {
  doc.rect(MARGIN, 40, 4, 58).fillColor(PRIMARY).fill()
  doc.fontSize(20).fillColor(DARK).font('Geist').text(title, MARGIN + 14, 42, { width: CONTENT_WIDTH - 14 })
  doc.fontSize(10).fillColor(MUTED).font('Geist').text(subtitle, MARGIN + 14, 68, { width: CONTENT_WIDTH - 14 })
  doc.fontSize(8).fillColor(MUTED).font('Geist').text(`Vygenerováno: ${date}`, MARGIN + 14, 86, {})
  doc.y = 114
  drawHorizontalRule(doc)
  doc.moveDown(0.8)
}

function drawFooters(doc: DocType) {
  const range = doc.bufferedPageRange()
  const total = range.count
  for (let i = 0; i < total; i++) {
    doc.switchToPage(i)
    const footerY = doc.page.height - 32
    doc.moveTo(MARGIN, footerY).lineTo(PAGE_WIDTH - MARGIN, footerY).strokeColor(BORDER).lineWidth(0.5).stroke()
    doc.fontSize(8).fillColor(MUTED).font('Geist')
      .text('Noodles · Přehled renovací bytového domu', MARGIN, footerY + 8, { width: CONTENT_WIDTH / 2 })
    doc.fontSize(8).fillColor(MUTED).font('Geist')
      .text(`${i + 1} / ${total}`, MARGIN + CONTENT_WIDTH / 2, footerY + 8, { width: CONTENT_WIDTH / 2, align: 'right' })
  }
}

// ─── Layout: overall-brief ────────────────────────────────────────────────────

function layoutOverallBrief(doc: DocType, ctx: CompiledData) {
  drawPageHeader(doc, 'Stručný přehled renovací', `${ctx.scenarioName} — ${ctx.scenarioTagline}`, ctx.generatedDate)

  heading2(doc, 'Klíčová čísla')

  const boxH = 60
  const boxW = (CONTENT_WIDTH - 10) / 3

  const row1Y = doc.y
  drawMetricBox(doc, MARGIN, row1Y, boxW, boxH, 'Celkový rozpočet', czk(ctx.totalBudget), PRIMARY)
  drawMetricBox(doc, MARGIN + boxW + 5, row1Y, boxW, boxH, 'Roční úspory', czk(ctx.totalSavingsPerYear), GREEN)
  drawMetricBox(doc, MARGIN + (boxW + 5) * 2, row1Y, boxW, boxH, 'Projektů v plánu', String(ctx.totalProjects), DARK)
  doc.y = row1Y + boxH + 8

  const row2Y = doc.y
  drawMetricBox(doc, MARGIN, row2Y, boxW, boxH, 'Návratnost', `${ctx.paybackYears} let`, PRIMARY)
  drawMetricBox(doc, MARGIN + boxW + 5, row2Y, boxW, boxH, 'Úspora energie', `${ctx.totalEnergySavingPct} %`, GREEN)
  drawMetricBox(doc, MARGIN + (boxW + 5) * 2, row2Y, boxW, boxH, 'Fond na byt +', czkFull(ctx.totalFundIncreasePerFlat), DARK)
  doc.y = row2Y + boxH + 12

  heading2(doc, 'Projekty v plánu')
  ctx.projects.forEach((p) => {
    heading3(doc, p.name)
    metricRow(doc, 'Rozpočet', czk(p.budget))
    metricRow(doc, 'Roční úspory', czk(p.savingsPerYear), true)
    metricRow(doc, 'Návratnost', `${p.paybackYears} let`)
    metricRow(doc, 'Trvání', `${p.durationMonths} měsíců`)
    doc.moveDown(0.2)
  })

  heading2(doc, 'Klíčové přínosy')
  drawBullet(doc, 'Nižší energetické náklady a vyšší komfort bydlení')
  drawBullet(doc, 'Zvýšení hodnoty nemovitosti a fondu oprav')
  drawBullet(doc, 'Ekologičtější domácnost, nižší uhlíková stopa')
  drawBullet(doc, 'Dlouhodobá investice s garantovanou návratností')
}

// ─── Layout: persona ──────────────────────────────────────────────────────────

function layoutPersona(doc: DocType, ctx: CompiledData) {
  const name = ctx.personaName || 'Rezident'
  drawPageHeader(
    doc,
    `Personalizovaný přehled pro ${name}`,
    `${ctx.scenarioName} — ${ctx.scenarioTagline}`,
    ctx.generatedDate
  )

  heading2(doc, 'Profil rezidenta')
  if (ctx.personaRole) metricRow(doc, 'Role', ctx.personaRole)

  if (ctx.personaSentiment) {
    const sentimentMap: Record<string, string> = {
      podporuje: 'Podporuje rekonstrukci',
      vaha: 'Váhá — rozhoduje se',
      proti: 'Proti rekonstrukci',
    }
    metricRow(doc, 'Postoj', sentimentMap[ctx.personaSentiment] ?? ctx.personaSentiment)
  }

  if (ctx.personaBrief) {
    doc.moveDown(0.3)
    body(doc, ctx.personaBrief)
  }

  if (ctx.personaMotivations && ctx.personaMotivations.length > 0) {
    heading3(doc, 'Motivace')
    ctx.personaMotivations.forEach((m) => drawBullet(doc, m, MARGIN + 14, GREEN))
  }

  if (ctx.personaObjections && ctx.personaObjections.length > 0) {
    heading3(doc, 'Hlavní námitky')
    ctx.personaObjections.forEach((o) => drawBullet(doc, o, MARGIN + 14, '#dc2626'))
  }

  // OpenAI-generated arguments and counterpoints
  const args = (ctx as CompiledData & { personaArguments?: string[] }).personaArguments
  const counterpoints = (ctx as CompiledData & { counterpoints?: string[] }).counterpoints

  if (args && args.length > 0) {
    heading2(doc, '3 argumenty proč souhlasit s rekonstrukcí')
    args.forEach((arg, i) => {
      heading3(doc, `Argument ${i + 1}`)
      body(doc, arg)
    })
  }

  if (counterpoints && counterpoints.length > 0) {
    heading2(doc, 'Odpovědi na hlavní námitky')
    counterpoints.forEach((cp, i) => {
      heading3(doc, `Odpověď na námitku ${i + 1}`)
      body(doc, cp)
    })
  }

  heading2(doc, 'Finanční přehled scénáře')
  metricRow(doc, 'Celkový rozpočet', czk(ctx.totalBudget))
  metricRow(doc, 'Roční úspory', czk(ctx.totalSavingsPerYear), true)
  metricRow(doc, 'Návratnost', `${ctx.paybackYears} let`)
  metricRow(doc, 'Úspora energie', `${ctx.totalEnergySavingPct} %`)
  metricRow(doc, 'Zvýšení fondu na byt', `+${czkFull(ctx.totalFundIncreasePerFlat)}`)
}

// ─── Layout: overall-detail ───────────────────────────────────────────────────

function layoutOverallDetail(doc: DocType, ctx: CompiledData) {
  drawPageHeader(doc, 'Detailní report', `${ctx.scenarioName} — ${ctx.scenarioTagline}`, ctx.generatedDate)

  heading2(doc, 'Shrnutí')
  metricRow(doc, 'Celkový rozpočet', czk(ctx.totalBudget))
  metricRow(doc, 'Roční úspory energií', czk(ctx.totalSavingsPerYear), true)
  metricRow(doc, 'Průměrná návratnost', `${ctx.paybackYears} let`)
  metricRow(doc, 'Celková úspora energie', `${ctx.totalEnergySavingPct} %`)
  metricRow(doc, 'Zvýšení fondu na byt', `+${czkFull(ctx.totalFundIncreasePerFlat)}`)
  metricRow(doc, 'Projektů celkem', String(ctx.totalProjects))

  ctx.projects.forEach((p, idx) => {
    if (idx > 0) {
      doc.addPage()
      doc.y = MARGIN
    }

    heading2(doc, p.name)
    metricRow(doc, 'Celkový rozpočet', czk(p.budget))
    metricRow(doc, 'Roční úspory', czk(p.savingsPerYear), true)
    metricRow(doc, 'Návratnost', `${p.paybackYears} let`)
    metricRow(doc, 'Úspora energie', `${p.energySavingPct} %`)
    metricRow(doc, 'Trvání realizace', `${p.durationMonths} měsíců`)
    metricRow(doc, 'Zvýšení fondu na byt', `+${czkFull(p.fundIncreasePerFlat)}`)

    if (p.costItems && p.costItems.length > 0) {
      heading3(doc, 'Rozpis nákladů')

      const col1X = MARGIN
      const col2X = MARGIN + CONTENT_WIDTH * 0.45
      const col3X = MARGIN + CONTENT_WIDTH * 0.72
      const col4X = MARGIN + CONTENT_WIDTH * 0.88
      const rowH = 15

      // Table header row
      let tableY = doc.y
      doc.rect(col1X, tableY, CONTENT_WIDTH, rowH).fillColor(LIGHT_BG).fill()
      doc.fontSize(8).fillColor(MUTED).font('Geist')
        .text('Položka', col1X + 4, tableY + 4, { width: col2X - col1X - 8 })
        .text('Dodavatel', col2X + 4, tableY + 4, { width: col3X - col2X - 8 })
        .text('Částka', col3X + 4, tableY + 4, { width: col4X - col3X - 8 })
        .text('Podíl', col4X + 4, tableY + 4, { width: MARGIN + CONTENT_WIDTH - col4X - 4, align: 'right' })
      tableY += rowH

      p.costItems.forEach((item, rowIdx) => {
        if (rowIdx % 2 === 0) {
          doc.rect(col1X, tableY, CONTENT_WIDTH, rowH).fillColor('#fafafa').fill()
        }
        doc.fontSize(8).fillColor(MID).font('Geist')
          .text(item.item, col1X + 4, tableY + 4, { width: col2X - col1X - 8, lineBreak: false })
          .text(item.supplier, col2X + 4, tableY + 4, { width: col3X - col2X - 8, lineBreak: false })
          .text(czk(item.amount), col3X + 4, tableY + 4, { width: col4X - col3X - 8, lineBreak: false })
          .text(`${item.share} %`, col4X + 4, tableY + 4, {
            width: MARGIN + CONTENT_WIDTH - col4X - 4,
            align: 'right',
            lineBreak: false,
          })
        tableY += rowH
      })
      doc.y = tableY + 10
    }
  })
}

// ─── Layout: presentation ─────────────────────────────────────────────────────

function layoutPresentation(doc: DocType, ctx: CompiledData) {
  drawPageHeader(doc, 'Prezentace pro schůzi SVJ', ctx.generatedDate, ctx.generatedDate)

  // Slide 1: Key metrics
  heading2(doc, 'Klíčové metriky')
  const boxH = 60
  const boxW = (CONTENT_WIDTH - 10) / 2

  const row1Y = doc.y
  drawMetricBox(doc, MARGIN, row1Y, boxW, boxH, 'Celkový investiční plán', czk(ctx.totalBudget), PRIMARY)
  drawMetricBox(doc, MARGIN + boxW + 10, row1Y, boxW, boxH, 'Roční úspory po rekonstrukci', czk(ctx.totalSavingsPerYear), GREEN)
  doc.y = row1Y + boxH + 8

  const row2Y = doc.y
  drawMetricBox(doc, MARGIN, row2Y, boxW, boxH, 'Průměrná návratnost', `${ctx.paybackYears} let`, PRIMARY)
  drawMetricBox(doc, MARGIN + boxW + 10, row2Y, boxW, boxH, 'Celková úspora energie', `${ctx.totalEnergySavingPct} %`, GREEN)
  doc.y = row2Y + boxH + 10

  metricRow(doc, 'Zvýšení fondu oprav na byt', `+${czkFull(ctx.totalFundIncreasePerFlat)}`)

  // Slide 2: Projects list
  doc.addPage()
  doc.y = MARGIN
  heading2(doc, 'Přehled projektů')
  muted(doc, 'Pořadí projektů dle dopadu a priorit SVJ')
  doc.moveDown(0.3)

  ctx.projects.forEach((p, i) => {
    const rowY = doc.y
    // Numbered circle
    doc.circle(MARGIN + 12, rowY + 10, 11).fillColor(PRIMARY).fill()
    doc.fontSize(9).fillColor('#fff').font('Geist')
      .text(String(i + 1), MARGIN + 5, rowY + 5, { width: 14, align: 'center' })
    // Project details
    doc.fontSize(11).fillColor(DARK).font('Geist')
      .text(p.name, MARGIN + 28, rowY + 2, { width: CONTENT_WIDTH - 28 })
    doc.fontSize(9).fillColor(MUTED).font('Geist').text(
      `Rozpočet: ${czk(p.budget)}  ·  Úspory/rok: ${czk(p.savingsPerYear)}  ·  Návratnost: ${p.paybackYears} let`,
      MARGIN + 28,
      rowY + 17,
      { width: CONTENT_WIDTH - 28 }
    )
    doc.y = rowY + 38
    if (doc.y > doc.page.height - 80) {
      doc.addPage()
      doc.y = MARGIN
    }
  })

  // Slide 3: Talking points
  doc.addPage()
  doc.y = MARGIN
  heading2(doc, 'Hlavní argumenty pro schůzi')
  drawBullet(doc, `Celková investice ${czk(ctx.totalBudget)} se vrátí za ${ctx.paybackYears} let prostřednictvím úspor energie.`)
  drawBullet(doc, `Každý rok ušetříme ${czk(ctx.totalSavingsPerYear)} na energiích — peníze zůstávají v domě.`)
  drawBullet(doc, `Fond oprav se zvýší průměrně o ${czkFull(ctx.totalFundIncreasePerFlat)} na byt — přiměřený krok.`)
  drawBullet(doc, `Celková úspora energií ${ctx.totalEnergySavingPct} % zlepší energetický štítek budovy.`)
  drawBullet(doc, 'Bez rekonstrukce porostou náklady na opravy každý rok — čekání je dražší než akce.')

  heading2(doc, 'Příprava na časté dotazy')
  heading3(doc, 'Proč zrovna teď?')
  body(doc, 'Aktuální ceny materiálů a dostupné dotace (NZÚ) jsou výhodné. Každý rok odkladu zvyšuje náklady na nutné opravy.')
  heading3(doc, 'Jak bude probíhat realizace?')
  body(doc, 'Projekty probíhají postupně — každá fáze trvá 2–9 měsíců s minimálním dopadem na každodenní život.')
  heading3(doc, 'Co když hlasování neprojde?')
  body(doc, 'Stav budovy se zhoršuje, havárie stojí více než plánovaná rekonstrukce. Zákon umožňuje rozhodnutí nadpoloviční většinou.')
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Generate a PDF for the given export type.
 * Uses PDFKit — no headless browser.
 *
 * @param exportType - 'overall-brief' | 'persona' | 'overall-detail' | 'presentation'
 * @param context    - CompiledData (may include .arguments and .counterpoints for persona)
 * @returns Promise<Buffer>
 */
export async function generatePDF(exportType: string, context: CompiledData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: MARGIN,
        bufferPages: true,
        info: {
          Title: context.documentTitle,
          Author: 'Noodles',
          Subject: 'Přehled renovací bytového domu',
        },
      })

      doc.registerFont('Geist', FONT)

      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', (err: Error) => reject(err))

      switch (exportType) {
        case 'overall-brief':
          layoutOverallBrief(doc, context)
          break
        case 'persona':
          layoutPersona(doc, context)
          break
        case 'overall-detail':
          layoutOverallDetail(doc, context)
          break
        case 'presentation':
          layoutPresentation(doc, context)
          break
        default:
          layoutOverallBrief(doc, context)
      }

      drawFooters(doc)
      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
