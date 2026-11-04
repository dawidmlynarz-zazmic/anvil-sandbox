import { Navigate, useParams } from 'react-router-dom'
import { MediaGallery } from '@anvil/components/agent/media-gallery'
import { Button } from '@anvil/components/ui/button'
import { DESTINATIONS, destinationPhotos } from '~/mocks/hotels'
import { useStore } from '~/state/store'
import { PageHeading } from '../hotels/PageHeading'

export function PhotosPage() {
  const { destination } = useParams()
  const { send, session } = useStore()
  const dest = DESTINATIONS.find((d) => d.id === destination)
  if (!dest) return <Navigate to="/" replace />
  return (
    <div className="flex flex-col gap-5">
      <PageHeading crumbs={[{ label: 'Home', to: '/' }, { label: `${dest.name} photos` }]} title={dest.name} subtitle={`${dest.region}. ${dest.blurb} Illustrations stand in for photography in this demo.`} />
      <MediaGallery layout="grid" title={dest.name} items={destinationPhotos(dest)} />
      <div>
        <Button variant="outline" intent="neutral" onClick={() => void send(session.trip.destination === dest.id ? 'Show me the hotels' : `Hotels in ${dest.name}`, { silent: true })}>
          See hotels in {dest.name}
        </Button>
      </div>
    </div>
  )
}
