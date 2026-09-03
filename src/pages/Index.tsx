import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ApoioHero from '@/components/apoio/ApoioHero';
import Composer from '@/components/feed/Composer';
import FeedStream from '@/components/feed/FeedStream';

const BANNER_CLOSED_KEY = 'magrao-banner-closed';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function Index() {
  const [bannerOpen, setBannerOpen] = useState(true);

  useEffect(() => {
    const closedAt = localStorage.getItem(BANNER_CLOSED_KEY);
    if (closedAt && Date.now() - Number(closedAt) < ONE_DAY_MS) {
      setBannerOpen(false);
    }
  }, []);

  function closeBanner() {
    localStorage.setItem(BANNER_CLOSED_KEY, String(Date.now()));
    setBannerOpen(false);
  }

  return (
    <div className="w-full px-4 pb-10">
      <div className="mx-auto max-w-2xl space-y-4 pt-4">
        <ApoioHero />
        {bannerOpen && (
          <div className="hero-banner-cycle relative">
            <button
              type="button"
              onClick={closeBanner}
              aria-label="Fechar banner por um dia"
              className="absolute right-2 top-2 z-10 rounded-full bg-black/20 p-1.5 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/30 hover:text-white"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <img
              src="/magrao-hero.svg"
              alt="Magrão no Ar"
              className="hero-banner-slide w-full rounded-2xl object-cover shadow-card"
            />
          </div>
        )}
        <Composer />
        <FeedStream initialFilter="tudo" />
      </div>
    </div>
  );
}
