import React, { useMemo, useState } from 'react';
import { Award } from 'lucide-react';
import clsx from 'clsx';
import { getBadgeImage } from '../../utils/badgeAssets';

const BadgeArtwork = ({
  badgeId,
  label,
  frameClassName = '',
  imageClassName = '',
  iconClassName = '',
  iconSize = 18,
  locked = false,
  title,
  noFrame = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const badgeSrc = useMemo(() => getBadgeImage(badgeId), [badgeId]);

  return (
    <div
      className={clsx(
        // core layout + explicitly avoid adding an extra border by default
        'relative flex items-center justify-center overflow-hidden bg-transparent border-0',
        // allow callers to opt-out of the default rounding (keeps backwards compatibility)
        !noFrame && 'rounded-[1.15rem]',
        frameClassName
      )}
      title={title || label || badgeId}
    >
      {!imgFailed && badgeSrc ? (
        <img
          src={badgeSrc}
          alt={label || badgeId || 'Badge'}
          className={clsx(
            // make image fill the frame and remove inline-gap artifacts
            'block h-full w-full object-cover transition-transform duration-500',
            locked ? 'scale-[1.02] blur-[3px] grayscale saturate-50 brightness-[0.62]' : 'drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]',
            imageClassName
          )}
          onError={() => setImgFailed(true)}
          loading="lazy"
        />
      ) : (
        <Award size={iconSize} className={clsx('text-accent', iconClassName)} />
      )}
      {locked && <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-black/18" />}
    </div>
  );
};

export default BadgeArtwork;
