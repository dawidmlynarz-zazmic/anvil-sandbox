import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { suiteById, type RateKey } from '~/data/fixtures'
import { SuiteCard } from './SuiteCard'

const meta: Meta<typeof SuiteCard> = {
  title: 'Local/SuiteCard',
  component: SuiteCard,
  parameters: { layout: 'padded' },
}
export default meta

function Live({ desktop, signedIn, tag }: { desktop: boolean; signedIn: boolean; tag?: string }) {
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<RateKey | null>(null)
  return (
    <div style={{ width: desktop ? 1100 : 358 }}>
      <SuiteCard
        suite={suiteById('pup-den-jr')}
        desktop={desktop}
        signedIn={signedIn}
        tag={tag}
        highlighted={Boolean(tag)}
        expanded={expanded}
        selected={selected}
        onToggleRates={() => setExpanded((v) => !v)}
        onSelectRate={setSelected}
      />
    </div>
  )
}

export const Mobile: StoryObj = { render: () => <Live desktop={false} signedIn={false} /> }
export const MobileFavorite: StoryObj = { render: () => <Live desktop={false} signedIn tag="Your favorite" /> }
export const Desktop: StoryObj = { render: () => <Live desktop signedIn={false} /> }
export const DesktopMember: StoryObj = { render: () => <Live desktop signedIn tag="Your favorite" /> }
