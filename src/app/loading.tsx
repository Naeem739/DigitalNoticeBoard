import { BellLoader } from '@/components/ui/loader'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <BellLoader size="lg" />
    </div>
  )
}
