// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#offer-carousel-free-scroll
import { Children, useId, useMemo, type ReactNode } from 'react'
import WheelGesturesPlugin from 'embla-carousel-wheel-gestures'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@anvil/components/ui/carousel'
import { Card } from '@anvil/components/ui/card'
import { cn } from '@anvil/lib/utils'

export interface ShowCarouselProps {
  title: ReactNode
  /** "6 shows · all-in prices" */
  count?: ReactNode
  /** Offer Cards (vertical). Each becomes a slide. */
  children: ReactNode
  className?: string
}

/**
 * Anvil's Offer Carousel, with free scrolling. The Anvil one fixes Embla's options (`align: 'start'`, snapping) and
 * takes no plugins, so a trackpad or mouse wheel can't scroll it sideways and a swipe always snaps to a card. Here
 * the same header, cards and arrows sit on Anvil's `Carousel` with `dragFree` (a swipe or drag carries on with its
 * momentum and stops where it lands) and Embla's wheel-gestures plugin (a sideways trackpad swipe scrolls it).
 * Keyboard arrows and the Previous / Next buttons still step card by card.
 */
export function ShowCarousel({ title, count, children, className }: ShowCarouselProps) {
  const titleId = useId()
  const plugins = useMemo(() => [WheelGesturesPlugin()], [])
  return (
    <Card asChild className={cn('w-full max-w-160 min-w-0 gap-3 rounded-xl border-border bg-background shadow-sm', className)}>
      <section data-slot="show-carousel">
        <Carousel
          aria-labelledby={titleId}
          opts={{ align: 'start', dragFree: true, containScroll: 'trimSnaps' }}
          plugins={plugins}
          className="flex flex-col gap-3 px-(--card-padding)"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-baseline gap-2">
              <h3 id={titleId} className="type-text-base-semibold text-foreground">
                {title}
              </h3>
              {count && <span className="type-text-xs-normal whitespace-nowrap text-muted-foreground">{count}</span>}
            </div>
            <div className="flex gap-1">
              <CarouselPrevious shape="default" className="static translate-y-0" />
              <CarouselNext shape="default" className="static translate-y-0" />
            </div>
          </div>
          <CarouselContent>
            {Children.map(children, (child) => (
              <CarouselItem className="basis-52">{child}</CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>
    </Card>
  )
}
