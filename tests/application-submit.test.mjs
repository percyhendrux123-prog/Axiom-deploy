import test from 'node:test';
import assert from 'node:assert/strict';
import { createApplicationHandler } from '../netlify/functions/application-submit.mjs';

const valid = {
  'form-name':'axiom-two-business-evaluation','owner-name':'Test Owner','business-name':'Test Business',
  'business-location':'Baton Rouge, Louisiana',email:'owner@example.com','decision-authority':'yes',
  'lane-name':'New inquiry disposition','lane-trigger':'A new inquiry arrives.','lane-frequency':'Daily',
  'current-owner':'Owner','current-process':'Read, qualify, assign, record.','repeated-leak':'Follow-up ownership disappears.',
  'measurable-outcome':'Every qualified inquiry has a next owner.','evidence-available':'Timestamped disposition records.',
  'systems-involved':'Shared inbox and CRM.','ten-day-availability':'yes','no-secrets':'yes',
  'evaluation-boundary':'yes','terms-agreement':'yes','typed-signature':'Test Owner','bot-field':''
};

function request(fields=valid,method='POST') {
  return new Request('https://deployaxiom.com/api/two-business-evaluation/apply',{
    method,headers:{'content-type':'application/x-www-form-urlencoded'},
    body:method==='POST'?new URLSearchParams(fields):undefined
  });
}

test('forwards one valid submission before the server deadline',async()=>{
  let forwarded;
  const handler=createApplicationHandler({now:()=>Date.parse('2026-09-14T12:00:00Z'),forward:async body=>{forwarded=body;return new Response('',{status:200})}});
  const response=await handler(request());
  assert.equal(response.status,303);
  assert.equal(response.headers.get('location'),'/success.html');
  assert.equal(forwarded.get('form-name'),'axiom-two-business-evaluation');
});

test('rejects a submission at or after the server deadline',async()=>{
  let calls=0;
  const handler=createApplicationHandler({now:()=>Date.parse('2026-09-15T01:00:00Z'),forward:async()=>{calls++;return new Response('',{status:200})}});
  const response=await handler(request());
  assert.equal(response.status,410);
  assert.equal(calls,0);
});

test('rejects malformed email and missing authority',async()=>{
  const handler=createApplicationHandler({now:()=>Date.parse('2026-09-14T12:00:00Z'),forward:async()=>new Response('',{status:200})});
  assert.equal((await handler(request({...valid,email:'bad'}))).status,400);
  assert.equal((await handler(request({...valid,'decision-authority':''}))).status,400);
});

test('rejects JWT-like credentials in free-text fields',async()=>{
  let calls=0;
  const jwt='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.c2lnbmF0dXJlcGF5bG9hZA';
  const handler=createApplicationHandler({now:()=>Date.parse('2026-09-14T12:00:00Z'),forward:async()=>{calls++;return new Response('',{status:200})}});
  const response=await handler(request({...valid,'current-process':`Current process token ${jwt}`}));
  assert.equal(response.status,400);
  assert.equal(calls,0);
});

test('silently accepts honeypot traffic without forwarding',async()=>{
  let calls=0;
  const handler=createApplicationHandler({now:()=>Date.parse('2026-09-14T12:00:00Z'),forward:async()=>{calls++;return new Response('',{status:200})}});
  const response=await handler(request({...valid,'bot-field':'spam'}));
  assert.equal(response.status,202);
  assert.equal(calls,0);
});

test('rejects non-POST methods',async()=>{
  const handler=createApplicationHandler({now:()=>0,forward:async()=>new Response('',{status:200})});
  assert.equal((await handler(request(valid,'GET'))).status,405);
});
