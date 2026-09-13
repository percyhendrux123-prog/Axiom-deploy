const DEADLINE = Date.parse('2026-09-15T01:00:00Z');
const FORM_NAME = 'axiom-two-business-evaluation';
const REQUIRED = [
  'owner-name','business-name','business-location','email','decision-authority','lane-name','lane-trigger',
  'lane-frequency','current-owner','current-process','repeated-leak','measurable-outcome','evidence-available',
  'systems-involved','ten-day-availability','no-secrets','evaluation-boundary','terms-agreement','typed-signature'
];
const ALLOWED = new Set(['form-name','bot-field','case-study-consent',...REQUIRED]);
const MAX_BODY = 64 * 1024;
const SECRET_PATTERN = /(?:api[_ -]?key|password|secret|bearer)\s*[:=]\s*\S+|\bsk-[A-Za-z0-9_-]{16,}/i;

const reply=(status,text,headers={})=>new Response(text,{status,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}});

function cleanBody(raw) {
  const source=new URLSearchParams(raw);
  const body=new URLSearchParams();
  for (const [key,value] of source) if (ALLOWED.has(key)) body.set(key,String(value).trim());
  return body;
}

export function createApplicationHandler({now=Date.now,forward}={}) {
  const send=forward ?? (async (body,request)=>fetch(new URL('/',request.url),{
    method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:body.toString(),redirect:'manual'
  }));
  return async request => {
    if (request.method !== 'POST') return reply(405,'Method not allowed.');
    if (now() >= DEADLINE) return reply(410,'Applications closed Monday, September 14, 2026 at 8:00 p.m. CDT.');
    const declared=Number(request.headers.get('content-length') || 0);
    if (declared > MAX_BODY) return reply(413,'Submission too large.');
    if (!(request.headers.get('content-type') || '').startsWith('application/x-www-form-urlencoded')) return reply(415,'Unsupported form format.');
    const raw=await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY) return reply(413,'Submission too large.');
    const body=cleanBody(raw);
    if (body.get('bot-field')) return reply(202,'Received.');
    if (body.get('form-name') !== FORM_NAME) return reply(400,'Invalid campaign form.');
    if (REQUIRED.some(key=>!body.get(key))) return reply(400,'Complete every required field.');
    if ([...body.values()].some(value=>value.length > 4000)) return reply(413,'A field is too long.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.get('email')) || body.get('email').length > 254) return reply(400,'Enter a valid email.');
    if (!['yes','shared'].includes(body.get('decision-authority'))) return reply(422,'An authorized operating lead is required.');
    for (const key of ['ten-day-availability','no-secrets','evaluation-boundary','terms-agreement']) if (body.get(key)!=='yes') return reply(400,'Required acknowledgement missing.');
    if ([...body.entries()].some(([key,value])=>key!=='email' && SECRET_PATTERN.test(value))) return reply(400,'Remove credentials or secret values before submitting.');
    const forwarded=await send(body,request);
    if (!forwarded.ok && ![301,302,303].includes(forwarded.status)) return reply(502,'Application service unavailable.');
    return reply(303,'Application received.',{'location':'/success.html'});
  };
}

export default createApplicationHandler();
export const config={path:'/api/two-business-evaluation/apply'};
