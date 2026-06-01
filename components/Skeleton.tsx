import React from 'react';

/**
 * Skeleton — a reusable shimmer loading primitive.
 *
 * Variants:
 *   circle  — avatar placeholders
 *   text    — single line of text
 *   rect    — rectangular block (cards, images)
 *
 * The shimmer uses the @keyframes shimmer defined in index.css.
 */

interface SkeletonProps {
  variant?: 'circle' | 'text' | 'rect';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

const baseClass = 'bg-gray-100 relative overflow-hidden';
const shimmerOverlay = (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
);

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  className = '',
  count = 1,
}) => {
  const items = Array.from({ length: count });

  const variantClass = {
    circle: 'rounded-full',
    text: 'rounded-full',
    rect: 'rounded-2xl',
  }[variant];

  const defaultSize = {
    circle: { width: width || '48px', height: height || '48px' },
    text: { width: width || '100%', height: height || '14px' },
    rect: { width: width || '100%', height: height || '200px' },
  }[variant];

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={`${baseClass} ${variantClass} ${className}`}
          style={{ width: defaultSize.width, height: defaultSize.height }}
        >
          {shimmerOverlay}
        </div>
      ))}
    </>
  );
};

/**
 * GallerySkeleton — 6 shimmer squares matching the photo gallery grid
 */
export const GallerySkeleton: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="aspect-[3/4] rounded-2xl bg-gray-100 relative overflow-hidden">
        {shimmerOverlay}
      </div>
    ))}
  </div>
);

/**
 * FormSkeleton — shimmer placeholder for forms (OCR processing state)
 */
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 6 }) => (
  <div className="space-y-5 p-6 bg-white rounded-2xl border border-gray-100">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i}>
        <div className="h-3 w-20 bg-gray-100 rounded-full mb-2 relative overflow-hidden">
          {shimmerOverlay}
        </div>
        <div className="h-11 bg-gray-100 rounded-xl relative overflow-hidden">
          <div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
            style={{ animation: `shimmer 1.5s infinite ${i * 0.1}s` }}
          />
        </div>
      </div>
    ))}
    <div className="flex gap-3 pt-4">
      <div className="flex-1 h-12 bg-gray-100 rounded-xl relative overflow-hidden">
        {shimmerOverlay}
      </div>
      <div className="flex-1 h-12 bg-gray-200 rounded-xl relative overflow-hidden">
        {shimmerOverlay}
      </div>
    </div>
  </div>
);

/**
 * ProfileDetailSkeleton — full-page skeleton matching ProfileDetail.tsx layout
 */
export const ProfileDetailSkeleton: React.FC = () => (
  <div className="max-w-5xl mx-auto px-4 py-10">
    {/* Back button placeholder */}
    <div className="h-5 w-32 bg-gray-100 rounded-full mb-6 relative overflow-hidden">
      {shimmerOverlay}
    </div>

    <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Photo Side */}
        <div className="bg-gray-100 p-2">
          <div className="aspect-[3/4] rounded-2xl bg-gray-200 relative overflow-hidden mb-2">
            {shimmerOverlay}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square rounded-lg bg-gray-200 relative overflow-hidden">
                <div
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
                  style={{ animation: `shimmer 1.5s infinite ${i * 0.15}s` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Details Side */}
        <div className="p-8 lg:p-12 space-y-8">
          {/* Name */}
          <div>
            <div className="h-8 w-3/4 bg-gray-100 rounded-full relative overflow-hidden mb-3">
              {shimmerOverlay}
            </div>
            <div className="h-5 w-1/2 bg-gray-100 rounded-full relative overflow-hidden">
              {shimmerOverlay}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <div className="flex-1 h-14 bg-gray-100 rounded-2xl relative overflow-hidden">
              {shimmerOverlay}
            </div>
            <div className="w-14 h-14 bg-gray-100 rounded-2xl relative overflow-hidden">
              {shimmerOverlay}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-3">
            <div className="h-4 w-24 bg-gray-100 rounded-full relative overflow-hidden">{shimmerOverlay}</div>
            <div className="h-4 w-full bg-gray-50 rounded-full relative overflow-hidden">{shimmerOverlay}</div>
            <div className="h-4 w-5/6 bg-gray-50 rounded-full relative overflow-hidden">{shimmerOverlay}</div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i}>
                <div className="h-3 w-20 bg-gray-100 rounded-full mb-2 relative overflow-hidden">{shimmerOverlay}</div>
                <div className="h-5 w-3/4 bg-gray-100 rounded-full relative overflow-hidden">{shimmerOverlay}</div>
              </div>
            ))}
          </div>

          {/* Privacy section */}
          <div className="bg-gray-50 p-6 rounded-2xl">
            <div className="h-4 w-40 bg-gray-100 rounded-full mb-4 relative overflow-hidden">{shimmerOverlay}</div>
            <div className="h-16 bg-gray-100 rounded-xl relative overflow-hidden">{shimmerOverlay}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Skeleton;
