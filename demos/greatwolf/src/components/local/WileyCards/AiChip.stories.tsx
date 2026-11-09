import type { Meta, StoryObj } from '@storybook/react-vite'
import { AiChip, AnswerChip } from './WileyCards'

const meta: Meta = { title: 'Local/AiChip' }
export default meta

export const PromptAndAnswer: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 340 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <AiChip onClick={() => undefined}>Add birthday party package</AiChip>
        <AiChip onClick={() => undefined}>Not now</AiChip>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <AnswerChip onClick={() => undefined}>Mar 5 – 7</AnswerChip>
        <AnswerChip onClick={() => undefined} pressed>
          Mar 12 – 14
        </AnswerChip>
      </div>
    </div>
  ),
}
