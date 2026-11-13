import { env } from 'cloudflare:workers';
import { accessFor, requireTab } from '../../../../lib/admin-auth.ts';
import { bookingResponse, readBody } from '../../../../lib/booking-http.ts';
import { getMarketingContent, setSiteLock, siteStatus } from '../../../../lib/marketing-content.ts';
import { adminRateLimit } from '../../../../lib/admin-rate-limit.ts';

// Site lock banner shown on every admin tab. Any valid key may read the status;
// only keys with the Website-Inhalte tab may lock or release the site.
export async function GET(request: Request) {
  return bookingResponse(async () => {
    const { tabs } = await accessFor(request);
    const { content } = await getMarketingContent(env.DB);
    return { ...siteStatus(content), canEdit: tabs.includes('content') };
  });
}

export async function PATCH(request: Request) {
  return bookingResponse(async () => {
    await requireTab(request, 'content');
    if (!env.DB) throw new Error('Missing DB');
    await adminRateLimit(env.DB, request, 'publish');
    const body = await readBody(request, 200);
    return setSiteLock(env.DB, body?.enabled);
  });
}
