import { saveInquiry } from '@/db';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || new URL(request.url).host;
  if (origin) {
    try {
      if (process.env.APP_ORIGIN ? origin !== new URL(process.env.APP_ORIGIN).origin : new URL(origin).host !== host) return Response.json({error:'Forbidden'}, {status:403});
    } catch { return Response.json({error:'Forbidden'}, {status:403}); }
  }
  try {
    const data = await request.json() as Record<string, unknown>;
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const contact = typeof data.contact === 'string' ? data.contact.trim() : '';
    const message = typeof data.message === 'string' ? data.message.trim() : '';
    if (!name || !contact || !message || name.length > 120 || contact.length > 240 || message.length > 5000) return Response.json({error:'Invalid input'}, {status:400});
    await saveInquiry({name, contact, message});
    return Response.json({ok:true});
  } catch(error) {console.error('Inquiry submission failed', error instanceof Error ? error.message : 'unknown');return Response.json({error:'Unable to save inquiry'}, {status:503});}
}
