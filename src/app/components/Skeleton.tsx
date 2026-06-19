interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`bg-[#F0F0F0] relative overflow-hidden ${className}`}
      style={style}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
          animation: 'ippoo-shimmer 1.4s ease-in-out infinite',
        }}
      />
      <style>{`@keyframes ippoo-shimmer { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} }`}</style>
    </div>
  );
}

export function ArticleRowSkeleton() {
  return (
    <div className="flex gap-3 p-2.5 border border-[#F0F0F0]">
      <Skeleton className="w-20 h-20 flex-shrink-0"/>
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-3 w-16"/>
        <Skeleton className="h-3.5 w-full"/>
        <Skeleton className="h-3.5 w-4/5"/>
        <Skeleton className="h-2.5 w-1/3"/>
      </div>
    </div>
  );
}

export function FeaturedCardSkeleton() {
  return (
    <div className="aspect-[4/5] bg-[#F0F0F0] relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', animation: 'ippoo-shimmer 1.4s ease-in-out infinite' }}/>
    </div>
  );
}
