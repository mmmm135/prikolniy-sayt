import { env } from 'cloudflare:workers';
export async function POST(request: Request) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return Response.json({error:'Forbidden'}, {status:403});
  try {
    const data = await request.json() as Record<string, unknown>;
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const contact = typeof data.contact === 'string' ? data.contact.trim() : '';
    const message = typeof data.message === 'string' ? data.message.trim() : '';
    if (!name || !contact || !message || name.length > 120 || contact.length > 240 || message.length > 5000) return Response.json({error:'Invalid input'}, {status:400});
    if (!env.DB) throw new Error('Inquiry storage unavailable');
    await env.DB.prepare('INSERT INTO inquiries (id, name, contact, message, created_at) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(),name,contact,message,new Date().toISOString()).run();
    return Response.json({ok:true});
  } catch(error) {console.error('Inquiry submission failed', error instanceof Error ? error.message : 'unknown');return Response.json({error:'Unable to save inquiry'}, {status:503});}
}
