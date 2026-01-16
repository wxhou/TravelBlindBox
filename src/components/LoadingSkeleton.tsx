import { MapPin } from 'lucide-react'

interface SkeletonProps {
  className?: string
}

export function CardSkeleton({ className = '' }: SkeletonProps): React.ReactElement {
  return (
    <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 ${className}`}>
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
        <div className="h-20 bg-white/10 rounded" />
        <div className="flex gap-2">
          <div className="h-6 bg-white/10 rounded w-16" />
          <div className="h-6 bg-white/10 rounded w-16" />
        </div>
      </div>
    </div>
  )
}

export function RouteCardSkeleton(): React.ReactElement {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
      {/* Image placeholder */}
      <div className="h-48 bg-white/10 animate-pulse" />

      <div className="p-4 space-y-4">
        {/* Title and theme */}
        <div className="space-y-2">
          <div className="h-5 bg-white/10 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse" />
        </div>

        {/* Cost and duration */}
        <div className="flex gap-4">
          <div className="h-6 bg-white/10 rounded w-24 animate-pulse" />
          <div className="h-6 bg-white/10 rounded w-20 animate-pulse" />
        </div>

        {/* Highlights */}
        <div className="flex gap-2 flex-wrap">
          <div className="h-6 bg-white/10 rounded w-20 animate-pulse" />
          <div className="h-6 bg-white/10 rounded w-16 animate-pulse" />
          <div className="h-6 bg-white/10 rounded w-24 animate-pulse" />
        </div>

        {/* Button */}
        <div className="h-10 bg-white/10 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}

export function LoadingSpinner({ className = '' }: SkeletonProps): React.ReactElement {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 border-3 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  )
}

export function StepSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-gradient-to-r from-cyan-400 to-pink-400 animate-pulse" />
      </div>

      {/* Title */}
      <div className="h-8 bg-white/10 rounded w-1/2 mx-auto animate-pulse" />

      {/* Form elements */}
      <div className="space-y-4">
        <div className="h-12 bg-white/10 rounded-xl animate-pulse" />
        <div className="h-12 bg-white/10 rounded-xl animate-pulse" />
        <div className="h-24 bg-white/10 rounded-xl animate-pulse" />
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-center gap-4 pt-4">
        <div className="h-10 w-24 bg-white/10 rounded-xl animate-pulse" />
        <div className="h-10 w-32 bg-white/10 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}

export function ItineraryDaySkeleton(): React.ReactElement {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 space-y-4">
      {/* Day header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse" />
        <div className="h-5 bg-white/10 rounded w-24 animate-pulse" />
      </div>

      {/* Activities */}
      <div className="space-y-2 pl-10">
        <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
        <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse" />
        <div className="h-4 bg-white/10 rounded w-4/5 animate-pulse" />
      </div>

      {/* Meals */}
      <div className="flex gap-2 pl-10">
        <div className="h-6 bg-white/10 rounded w-16 animate-pulse" />
        <div className="h-6 bg-white/10 rounded w-16 animate-pulse" />
        <div className="h-6 bg-white/10 rounded w-16 animate-pulse" />
      </div>
    </div>
  )
}

export function StatsSkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-white/10 rounded animate-pulse" />
            <div className="h-4 bg-white/10 rounded w-16 animate-pulse" />
          </div>
          <div className="h-6 bg-white/10 rounded w-24 animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export function MapSkeleton(): React.ReactElement {
  return (
    <div className="h-64 bg-white/10 rounded-xl animate-pulse flex items-center justify-center">
      <MapPin className="w-8 h-8 text-slate-500" />
    </div>
  )
}

export default {
  Card: CardSkeleton,
  RouteCard: RouteCardSkeleton,
  Spinner: LoadingSpinner,
  Step: StepSkeleton,
  ItineraryDay: ItineraryDaySkeleton,
  Stats: StatsSkeleton,
  Map: MapSkeleton
}
