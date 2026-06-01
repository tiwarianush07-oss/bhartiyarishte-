import React from 'react';

interface Props {
  count?: number;
  className?: string;
}

/**
 * ProfileCardSkeleton — shimmer loading placeholder for profile grid cards.
 * Drop this in wherever you render <ProfileCard /> grids while data is loading.
 */
export const ProfileCardSkeleton: React.FC<Props> = ({ count = 6, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`rounded-3xl overflow-hidden border border-gray-100 bg-white shadow-sm ${className}`}
        >
          {/* Photo placeholder */}
          <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>

          {/* Info placeholder */}
          <div className="p-5 space-y-3">
            <div className="h-4 bg-gray-100 rounded-full w-3/4 overflow-hidden relative">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite_0.1s] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
            <div className="h-3 bg-gray-100 rounded-full w-1/2 overflow-hidden relative">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite_0.2s] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
            <div className="h-3 bg-gray-100 rounded-full w-2/3 overflow-hidden relative">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite_0.3s] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

/**
 * Dark variant — for the dashboard's dark "Top Picks" grid.
 */
export const DarkProfileCardSkeleton: React.FC<Props> = ({ count = 3, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`rounded-3xl overflow-hidden bg-white/10 border border-white/10 ${className}`}
        >
          <div className="aspect-square bg-white/5 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>
      ))}
    </>
  );
};

export default ProfileCardSkeleton;
