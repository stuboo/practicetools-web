// Client-side screen for the "Payer not listed?" box. It mirrors the API's
// PHI screen (runs of digits, dates, phone numbers) so an MA gets told before
// the text ever leaves the browser; the server still checks on its own.

export const REQUEST_MAX_LENGTH = 60

export const REQUEST_PLACEHOLDER = 'Plan or PBM name only. No patient information.'

export const REQUEST_CONFIRMATION =
  'Requested. Dr. Stewart reviews requests; results usually appear within a day.'

export const REQUESTS_CLOSED = "Requests aren't open yet."

/** What to do while a payer is not on the card. */
export const DEFAULT_STEPS: string[] = [
  "Look up the drug on the payer's formulary, or call the pharmacy benefit number on the insurance card.",
  'If a prior authorization or step therapy is required, run .OABPAEVIDENCE to document prior trials.',
  'For a beta-3 agonist, add the letter of medical necessity: .OABLMNMIRABEGRON or .OABLMNVIBEGRON.',
  "Submit through the payer portal and attach the payer's own criteria if it lists them.",
]

const DIGIT_RUN = /\d{6,}/
const DATE = /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b|\b\d{4}[/.-]\d{1,2}[/.-]\d{1,2}\b/
const PHONE = /\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/

/** Returns an error message, or null when the name can be sent. */
export function validateRequestName(raw: string): string | null {
  const name = raw.trim()
  if (!name) return 'Enter a plan or PBM name.'
  if (name.length > REQUEST_MAX_LENGTH) return `Keep it to ${REQUEST_MAX_LENGTH} characters.`
  if (DIGIT_RUN.test(name) || DATE.test(name) || PHONE.test(name)) {
    return 'Plan or PBM name only. Remove numbers that look like an ID, date, or phone number.'
  }
  return null
}
