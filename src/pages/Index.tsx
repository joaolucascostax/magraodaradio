import ApoioHero from '@/components/apoio/ApoioHero';
import Composer from '@/components/feed/Composer';
import FeedStream from '@/components/feed/FeedStream';

export default function Index() {
  return (
    <div className="w-full px-4 pb-10">
      <div className="mx-auto max-w-2xl space-y-4 pt-4">
        <ApoioHero />
        <Composer />
        <FeedStream initialFilter="tudo" />
      </div>
    </div>
  );
}
