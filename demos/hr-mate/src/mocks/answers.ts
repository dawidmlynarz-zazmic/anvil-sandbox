// The prototype's stand-in for the model. An answer is only given if the files it cites exist in the workspace,
// so the "Test the assistant" step stays honest about what knowledge has been added.
export interface BankAnswer {
  question: string
  keywords: string[]
  answer: string
  sources: string[]
}

export const ANSWER_BANK: BankAnswer[] = [
  {
    question: 'How many vacation days do I get?',
    keywords: ['vacation', 'holiday', 'annual leave', 'days off', 'time off'],
    answer: 'Full-time employees get 26 days of paid leave a year. Up to 5 unused days carry over until 31 March.',
    sources: ['Leave policy.pdf'],
  },
  {
    question: 'Can I work from another country?',
    keywords: ['remote', 'abroad', 'another country', 'work from'],
    answer: "You can work from another country for up to 20 working days a year with your manager's approval. Tell HR before you travel so tax and insurance are covered.",
    sources: ['Remote work policy.docx'],
  },
  {
    question: 'How do I claim travel expenses?',
    keywords: ['expense', 'travel', 'receipt', 'reimburse'],
    answer: 'Submit receipts in the expense form within 30 days of the trip. Your manager approves it, and finance pays it out with the next salary.',
    sources: ['Expense policy.pdf'],
  },
  {
    question: 'What if I am sick?',
    keywords: ['sick', 'doctor'],
    answer: 'Tell your manager before 10:00 and mark the day as sick leave. A doctor’s note is needed after 3 days.',
    sources: ['Leave policy.pdf'],
  },
  {
    question: 'How do I set up my laptop?',
    keywords: ['laptop', 'set up my', 'computer', 'it setup'],
    answer: 'Follow the IT setup guide: sign in with your work account, install the device manager, then turn on disk encryption.',
    sources: ['IT setup guide.pdf'],
  },
  {
    question: 'What should I do in my first week?',
    keywords: ['first week', 'start', 'new hire', 'onboarding'],
    answer: 'Meet your manager on day one, finish the IT setup, and work through the first-week checklist. HR checks in with you on Friday.',
    sources: ['First week checklist.docx'],
  },
  {
    question: 'What are the company values?',
    keywords: ['values', 'culture', 'handbook', 'conduct'],
    answer: 'Northwind Labs works on four values: curiosity, ownership, kindness and clear communication. The handbook explains each with examples.',
    sources: ['Employee handbook.pdf'],
  },
]

export const SUGGESTED_QUESTIONS = ANSWER_BANK.slice(0, 4).map((a) => a.question)

export interface TestResult {
  question: string
  status: 'answered' | 'unanswered'
  answer?: string
  sources?: string[]
  missing?: string[]
}

export function askAssistant(question: string, availableFiles: string[]): TestResult {
  const q = question.toLowerCase()
  const hit =
    ANSWER_BANK.find((a) => a.question.toLowerCase() === q) ??
    ANSWER_BANK.find((a) => a.keywords.some((k) => q.includes(k)))
  if (!hit) return { question, status: 'unanswered' }
  const have = hit.sources.filter((s) => availableFiles.includes(s))
  if (!have.length) return { question, status: 'unanswered', missing: hit.sources }
  return { question, status: 'answered', answer: hit.answer, sources: have }
}
