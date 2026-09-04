import holySeptember11 from '../../../../public/holy-2026/11-sep.jpeg';
import holySeptember12 from '../../../../public/holy-2026/12-sep.jpeg';
import holySeptember13 from '../../../../public/holy-2026/13-sep.jpeg';
import holySeptemberSubscription from '../../../../public/holy-2026/abb-sep.jpeg';

const holyImages = {
  '11-sep.jpeg': holySeptember11,
  '12-sep.jpeg': holySeptember12,
  '13-sep.jpeg': holySeptember13,
  'abb-sep.jpeg': holySeptemberSubscription,
};

export async function GET(request, { params }) {
  const { image } = await params;
  const asset = holyImages[image];

  if (!asset) {
    return new Response('Not found', { status: 404 });
  }

  const assetUrl = new URL(asset.src, 'http://localhost');
  return new Response(null, {
    status: 307,
    headers: {
      Location: `${assetUrl.pathname}${assetUrl.search}`,
    },
  });
}
