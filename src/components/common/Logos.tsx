import React, { useState } from 'react';

export const EXNESS_LOGO_URL = '/assets/exness_logo.jpg';
export const METAQUOTES_LOGO_URL = '/assets/metaquotes_logo.jpg';

export const ExnessLogo: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`${className} shrink-0 select-none relative flex items-center justify-center rounded-[10px] overflow-hidden bg-[#ffd200]`}
      style={{ aspectRatio: '1 / 1' }}
      title="Exness"
    >
      {!imgError ? (
        <img
          src={EXNESS_LOGO_URL}
          alt="Exness"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-black font-black text-base tracking-tighter">ex</span>
      )}
    </div>
  );
};

export const MetaQuotesLogo: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`${className} shrink-0 select-none relative flex items-center justify-center rounded-full overflow-hidden bg-transparent`}
      style={{ aspectRatio: '1 / 1' }}
      title="MetaQuotes MT5"
    >
      {!imgError ? (
        <img
          src="/icon.png"
          alt="MetaQuotes MT5"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-[#3897f0] font-black text-sm">MT5</span>
      )}
    </div>
  );
};

export const MT5AppLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => {
  return (
    <div
      className={`${className} shrink-0 select-none relative flex items-center justify-center rounded-full overflow-hidden`}
      style={{ aspectRatio: '1 / 1' }}
      title="MetaTrader 5"
    >
      <img
        src="/icon.png"
        alt="MetaTrader 5"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
      />
    </div>
  );
};
