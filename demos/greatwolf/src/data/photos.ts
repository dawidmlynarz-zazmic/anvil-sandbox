// Suite photography from greatwolf.com (Colorado Springs suites page), supplied by Dawid. Photos and floor plans are
// in the order the gallery shows them.
import deluxe1 from '~/assets/site/deluxe-queen-1.jpeg'
import deluxe2 from '~/assets/site/deluxe-queen-2.webp'
import deluxe3 from '~/assets/site/deluxe-queen-3.webp'
import kid1 from '~/assets/site/kidcabin-1.webp'
import kid2 from '~/assets/site/kidcabin-2.jpeg'
import kid3 from '~/assets/site/kidcabin-3.webp'
import kidPlan from '~/assets/site/kidcabin-plan.webp'
import roomView from '~/assets/site/lodge-room-view.webp'
import pup1 from '~/assets/site/pup-den-1.jpeg'
import pup2 from '~/assets/site/pup-den-2.webp'
import pup3 from '~/assets/site/pup-den-3.webp'
import pup4 from '~/assets/site/pup-den-4.webp'
import pupPlan from '~/assets/site/pup-den-plan.webp'
import voyagers from '~/assets/site/voyagers-club.png'
import waterpark from '~/assets/site/waterpark-hero.avif'

export interface SuitePhoto {
  src: string
  alt: string
  /** Floor plans sit on white; show them whole. */
  plan?: boolean
}

export const suitePhotos: Record<string, SuitePhoto[]> = {
  'deluxe-queen': [
    { src: deluxe1, alt: 'Two queen beds and a balcony with a mountain view' },
    { src: deluxe2, alt: 'Two queen beds by a wide window' },
    { src: deluxe3, alt: 'Two queen beds and a sofa' },
  ],
  'pup-den-jr': [
    { src: pup1, alt: 'The themed den beside the bed, with the balcony behind' },
    { src: pup2, alt: 'Queen bed next to the den' },
    { src: pup3, alt: 'Bunk beds inside the Northwoods-themed den' },
    { src: pup4, alt: 'The den’s mural of Great Wolf characters' },
    { src: pupPlan, alt: 'Floor plan: queen bed, bunk bed, bath', plan: true },
  ],
  kidcabin: [
    { src: kid1, alt: 'Log-cabin bunk beds' },
    { src: kid2, alt: 'Campfire mural in the kids’ area' },
    { src: kid3, alt: 'Queen bed' },
    { src: kidPlan, alt: 'Floor plan: queen bed, bunk bed, twin bed, sleeper sofa', plan: true },
  ],
}

export const photos = {
  den: pup1,
  bunks: pup3,
  roomView,
  voyagers,
  /** Indoor water park (supplied by Dawid; the photo is of the Niagara lodge). */
  waterpark,
}
