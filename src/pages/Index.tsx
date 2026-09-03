import ApoioHero from '@/components/apoio/ApoioHero';
import Composer from '@/components/feed/Composer';
import FeedStream from '@/components/feed/FeedStream';
import magraoHero from '@/assets/magrao-hero.svg.asset.json';

export default function Index() {
  return (
    <div className="w-full px-4 pb-10">
      <div className="mx-auto max-w-2xl space-y-4 pt-4">
        <ApoioHero />
        <img
          src={magraoHero.url}
          alt="Magrão no Ar"
          className="w-full rounded-2xl object-cover shadow-card"
        />
        <Composer />
        <FeedStream initialFilter="tudo" />
      </div>
    </div>
  );
}
