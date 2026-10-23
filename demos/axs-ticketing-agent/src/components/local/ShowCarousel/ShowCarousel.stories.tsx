import type { Meta, StoryObj } from '@storybook/react-vite'
import { OfferCard } from '@anvil/components/agent/offer-card'
import { SHOWS } from '~/mocks/shows'
import { gbp } from '~/lib/format'
import { ShowCarousel } from './ShowCarousel'

const meta = {
  title: 'Local/ShowCarousel',
  component: ShowCarousel,
  args: { title: `${SHOWS.length} shows`, count: '2 tickets · all-in prices', children: null },
  decorators: [(Story) => <div className="w-97.5"><Story /></div>],
} satisfies Meta<typeof ShowCarousel>
export default meta
type Story = StoryObj<typeof meta>

const cards = (n: number) =>
  SHOWS.slice(0, n).map((s) => (
    <OfferCard
      key={s.id}
      media={<img src={s.cover} alt={s.coverAlt} className="size-full object-cover" />}
      title={s.title}
      subtitle={`${s.venue}, ${s.city}`}
      meta={s.dates[0].date}
      price={`From ${gbp(40)}`}
      ctaLabel="View dates"
      onCta={() => {}}
    />
  ))

/** Drag or swipe: it carries on with its momentum. On a trackpad, swipe sideways. */
export const Default: Story = { render: (args) => <ShowCarousel {...args}>{cards(SHOWS.length)}</ShowCarousel> }
export const TwoCards: Story = { render: (args) => <ShowCarousel {...args}>{cards(2)}</ShowCarousel> }
