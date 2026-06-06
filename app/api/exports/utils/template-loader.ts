import { readFile } from 'fs/promises'
import { join } from 'path'

export type ExportType = 'overall-brief' | 'persona' | 'overall-detail' | 'presentation'

/**
 * Load HTML template from /templates/ folder based on export type
 * @param exportType - Type of export: 'overall-brief', 'persona', 'overall-detail', or 'presentation'
 * @returns Promise<string> - HTML template content
 * @throws Error if template not found or cannot be read
 */
export async function loadTemplate(exportType: string): Promise<string> {
  // Validate export type
  const validTypes: ExportType[] = ['overall-brief', 'persona', 'overall-detail', 'presentation']
  if (!validTypes.includes(exportType as ExportType)) {
    throw new Error(`Invalid export type: ${exportType}. Must be one of: ${validTypes.join(', ')}`)
  }

  try {
    // Build template path - templates are in project root /templates folder
    const templatePath = join(process.cwd(), 'templates', `${exportType}.html`)

    // Read template file
    const content = await readFile(templatePath, 'utf-8')

    if (!content) {
      throw new Error(`Template file is empty: ${exportType}.html`)
    }

    return content
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw new Error(`Template not found: ${exportType}.html`)
    }
    throw error
  }
}

/**
 * Replace placeholders in template with data
 * @param template - HTML template with {{placeholder}} syntax
 * @param data - Object with placeholder names as keys
 * @returns HTML with placeholders replaced
 */
export function renderTemplate(template: string, data: Record<string, any>): string {
  let html = template

  // Replace all placeholders {{key}} with corresponding data values
  Object.entries(data).forEach(([key, value]) => {
    // Handle different value types
    let replacementValue = ''

    if (Array.isArray(value)) {
      // For arrays, join them or convert to string representation
      replacementValue = value.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ')
    } else if (typeof value === 'object' && value !== null) {
      // For objects, convert to JSON or formatted string
      replacementValue = JSON.stringify(value, null, 2)
    } else if (value === null || value === undefined) {
      replacementValue = ''
    } else {
      replacementValue = String(value)
    }

    // Replace all occurrences of {{key}}
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    html = html.replace(regex, replacementValue)
  })

  return html
}
