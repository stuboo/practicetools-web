// Teaching card shown the first time the bladder diary opens (spec §6.2, §7.3).
// Generic patient education only; clinic-specific supplies are TODO-REVIEW.

export type DiaryTeachingCard = {
  id: 'collection-hat' | 'what-counts-as-leak' | 'bed-and-wake'
  title: string
  paragraphs: string[]
  steps?: string[]
}

export const DIARY_TEACHING_TITLE = 'How to keep your bladder diary'

export const DIARY_TEACHING_INTRO =
  'For 3 days, write down when you pee, leak, and drink. This shows us how your bladder works in daily life. There are no right or wrong answers. Do your best, and do not change your normal habits.'

export const DIARY_TEACHING_CARDS: DiaryTeachingCard[] = [
  {
    id: 'collection-hat',
    title: 'Measuring your pee with a collection hat',
    paragraphs: [
      'A collection hat is a small plastic bowl that sits under the toilet seat. It catches your pee so you can read how much there is.',
      'Measuring is helpful, but it is okay if you cannot measure every time. If you cannot, tap "Didn\'t measure" and still log the pee.',
      'TODO-REVIEW: Tell Ryan whether the clinic gives patients a collection hat, and where to get one if not.',
    ],
    steps: [
      'Put the hat under the toilet seat before you pee.',
      'Pee as you normally would.',
      'Read the number on the side of the hat while it is level. Wash it after each use.',
      'Enter the amount in the app. You can pick mL or oz.',
    ],
  },
  {
    id: 'what-counts-as-leak',
    title: 'What counts as a leak',
    paragraphs: [
      'A leak is any pee that comes out when you did not mean to let it out. Even a few drops count.',
      'Log a leak if you feel wet, or if you have to change your underwear or pad because of it.',
      'Peeing on purpose in the toilet is not a leak. Log it with "Peed".',
      'Please also tell us what you were doing when it happened, such as coughing, exercising, or rushing to the bathroom.',
    ],
  },
  {
    id: 'bed-and-wake',
    title: 'Record when you go to bed and get up',
    paragraphs: [
      'Tap "Bed" when you go to bed planning to sleep. Tap "Up" when you get out of bed for the day.',
      'We use these times to count how often you get up at night to pee. We also use them to tell your daytime pee from your nighttime pee.',
      'Trips to the bathroom after you tap "Bed" and before you tap "Up" count as night trips.',
      'If you forget to tap, you can add the time later. Use the edit button to change the time of any entry.',
    ],
  },
]
