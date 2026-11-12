import type { CardV2 } from './types'

const ask = (text: string): { text: string; onClick: { action: { function: string; parameters: { key: string; value: string }[] } }; type: 'OUTLINED' } => ({
  text,
  type: 'OUTLINED',
  onClick: { action: { function: 'ask', parameters: [{ key: 'question', value: text }] } },
})

export const welcomeCard: CardV2 = {
  cardId: 'welcome',
  card: {
    header: { title: 'HR Mate', subtitle: 'Your HR assistant at Northwind Labs', imageType: 'CIRCLE' },
    sections: [
      { widgets: [{ textParagraph: { text: 'Hi! I answer questions about leave, benefits and onboarding, using Northwind Labs documents. I always show where an answer comes from.' } }] },
      { header: 'Try asking', widgets: [{ buttonList: { buttons: [ask('How many vacation days do I get?'), ask('How do I claim travel expenses?'), ask('What should I do in my first week?')] } }] },
      { header: 'Need a person?', widgets: [{ textParagraph: { text: 'Type <b>/help</b> any time, or reach HR directly.' } }, { buttonList: { buttons: [{ text: 'Contact HR', type: 'FILLED', onClick: { action: { function: 'contactHr' } } }] } }] },
    ],
  },
}

export const adminDmCard: CardV2 = {
  cardId: 'admin-first-dm',
  card: {
    header: { title: 'Finish setting up HR Mate', subtitle: 'Only you can see this message' },
    sections: [
      {
        widgets: [
          { textParagraph: { text: 'You added HR Mate to Google Chat. A few minutes in the admin panel connects your employee directory and adds your first documents.' } },
          { decoratedText: { topLabel: 'Progress', text: '0 of 5 steps done', startIcon: { knownIcon: 'CLOCK' } } },
          { buttonList: { buttons: [{ text: 'Finish setup in the admin panel', type: 'FILLED', onClick: { openLink: { url: 'https://hr-mate.example/setup' } } }] } },
        ],
      },
    ],
  },
}

export const helpCard: CardV2 = {
  cardId: 'help',
  card: {
    header: { title: 'How to use HR Mate' },
    sections: [
      {
        header: 'Commands',
        widgets: [
          { decoratedText: { text: '<b>/help</b>', bottomLabel: 'Show this message' } },
          { decoratedText: { text: '<b>/links</b>', bottomLabel: 'Open quick links, like leave requests' } },
          { decoratedText: { text: '<b>/contact</b>', bottomLabel: 'Reach the HR team' } },
        ],
      },
      { header: 'Example questions', widgets: [{ buttonList: { buttons: [ask('Can I work from another country?'), ask('What if I am sick?')] } }] },
    ],
  },
}

export const answerCard = (answer: string, sources: string[]): CardV2 => ({
  cardId: 'answer',
  card: {
    sections: [
      { widgets: [{ textParagraph: { text: answer } }] },
      { header: 'Sources', widgets: sources.map((s) => ({ decoratedText: { text: s, startIcon: { knownIcon: 'DESCRIPTION' } } })) },
      {
        widgets: [
          { textParagraph: { text: 'Was this helpful?' } },
          {
            buttonList: {
              buttons: [
                { text: 'Yes', type: 'OUTLINED', onClick: { action: { function: 'feedback', parameters: [{ key: 'helpful', value: 'true' }] } } },
                { text: 'No', type: 'OUTLINED', onClick: { action: { function: 'feedback', parameters: [{ key: 'helpful', value: 'false' }] } } },
                { text: 'Ask HR', type: 'FILLED', onClick: { action: { function: 'contactHr' } } },
              ],
            },
          },
        ],
      },
    ],
  },
})

export const escalationCard: CardV2 = {
  cardId: 'contact-hr',
  card: {
    header: { title: 'Contact HR', subtitle: 'A person will reply' },
    sections: [
      {
        widgets: [
          { textParagraph: { text: "I couldn't find that in our documents, so I won't guess. The HR team can help." } },
          { decoratedText: { topLabel: 'Email', text: 'hr@northwind-labs.example', startIcon: { knownIcon: 'EMAIL' } } },
          { decoratedText: { topLabel: 'Usual reply time', text: 'Within one working day', startIcon: { knownIcon: 'CLOCK' } } },
          { buttonList: { buttons: [{ text: 'Email HR', type: 'FILLED', onClick: { openLink: { url: 'mailto:hr@northwind-labs.example' } } }] } },
        ],
      },
    ],
  },
}

export const trialApprovalCard: CardV2 = {
  cardId: 'trial-approval',
  card: {
    header: { title: 'Trial review: Emil Haugen', subtitle: 'Backend engineer · Engineering' },
    sections: [
      {
        widgets: [
          { decoratedText: { topLabel: 'Trial ends', text: '18 Nov 2026', startIcon: { knownIcon: 'INVITE' } } },
          { decoratedText: { topLabel: "Manager's recommendation", text: 'Continue employment', bottomLabel: 'Ingrid Solberg' } },
          { textParagraph: { text: 'Do you approve continuing Emil’s employment after the trial?' } },
          {
            buttonList: {
              buttons: [
                { text: 'Approve', type: 'FILLED', onClick: { action: { function: 'approve', parameters: [{ key: 'id', value: 'ap-1' }] } } },
                { text: 'Request changes', type: 'OUTLINED', onClick: { action: { function: 'requestChanges', parameters: [{ key: 'id', value: 'ap-1' }] } } },
              ],
            },
          },
        ],
      },
    ],
  },
}

export interface Scenario {
  id: string
  label: string
  trigger: string
  audience: string
  card: CardV2
  userMessage?: string
}

export const SCENARIOS: Scenario[] = [
  { id: 'welcome', label: 'Welcome card', trigger: 'Sent when someone adds HR Mate or opens a first chat.', audience: 'Every employee', card: welcomeCard },
  { id: 'admin', label: 'First message for HR admins', trigger: 'Sent to the person who installs HR Mate, instead of the welcome card.', audience: 'HR admins', card: adminDmCard },
  { id: 'help', label: '/help card', trigger: 'Sent when someone types /help.', audience: 'Every employee', card: helpCard, userMessage: '/help' },
  { id: 'answer', label: 'Answer with sources', trigger: 'Sent for every answered question.', audience: 'Every employee', card: answerCard('Full-time employees get 26 days of paid leave a year. Up to 5 unused days carry over until 31 March.', ['Leave policy.pdf', 'Employee handbook.pdf']), userMessage: 'How many vacation days do I get?' },
  { id: 'escalation', label: 'Contact HR', trigger: 'Sent when the assistant cannot answer, or when someone taps Ask HR.', audience: 'Every employee', card: escalationCard, userMessage: 'What is the parental leave policy?' },
  { id: 'approval', label: 'Trial review approval', trigger: 'Sent by the End-of-trial review workflow.', audience: 'HR managers', card: trialApprovalCard },
]
