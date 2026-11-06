(()=>{
const root=document.getElementById('neuron'); if(!root) return;
const $=id=>root.querySelector('#'+id), NS='http://www.w3.org/2000/svg';
const LR=0.5, TARGET=1, W=130, H=48;
let P, V={}, G={}, phase=0, history=[];
const f=v=>(Math.abs(v)<5e-5?0:v).toFixed(3);
function reset(){P={x1:2,w1:-3,x2:0,w2:1,b:6.8814};phase=0;history=[];V={};G={};render();}
function forward(){V={...P};V.m1=P.x1*P.w1;V.m2=P.x2*P.w2;V.s=V.m1+V.m2;V.n=V.s+P.b;V.o=Math.tanh(V.n);G={};}
function loss(){V.L=(V.o-TARGET)**2;}
function backward(){G.L=1;G.o=2*(V.o-TARGET);G.n=G.o*(1-V.o**2);G.s=G.n;G.b=G.n;G.m1=G.s;G.m2=G.s;
  G.x1=G.m1*P.w1;G.w1=G.m1*P.x1;G.x2=G.m2*P.w2;G.w2=G.m2*P.x2;}
function nudge(){for(const k of ['w1','w2','b']) P[k]-=LR*G[k]; history.push(V.L); forward(); loss(); G={};}
const N={x1:[10,10,'input x1'],w1:[10,72,'weight w1'],x2:[10,160,'input x2'],w2:[10,222,'weight w2'],b:[10,300,'bias b'],
 m1:[175,41,'x1 × w1'],m2:[175,191,'x2 × w2'],s:[330,116,'sum'],n:[480,200,'sum + b'],o:[630,120,'output'],L:[630,262,'miss (loss)']};
const E=[['x1','m1'],['w1','m1'],['x2','m2'],['w2','m2'],['m1','s'],['m2','s'],['s','n'],['b','n'],['n','o'],['o','L']];
const PARAM=['x1','w1','x2','w2','b'];
function el(tag,attrs,text){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(text!==undefined)e.textContent=text;return e;}
const T={
 0:['Nothing has run yet. The inputs and starting weights are set. Press Forward.','Day one. The program is written, and nothing has been measured yet.'],
 1:()=>[`Forward: the numbers flow left to right. 2 × −3 = −6, plus 0, plus the bias gives ${f(V.n)}. The output squashes that to ${f(V.o)}.`,'The athlete runs the week. You get a result.'],
 2:()=>[`Miss: the target was 1 and the output is ${f(V.o)}. Loss = (output − 1)² = ${f(V.L)}. Lower is better.`,'Check-in: how far the week landed from where it needed to be.'],
 3:()=>[`Backward: from the miss, each box gets a pull number, its gradient: how much the miss would rise if that box went up. Bias ${f(G.b)}, w1 ${f(G.w1)}, w2 ${f(G.w2)}. w2 is 0 because its input is 0, so changing it can't affect anything.`,'Trace the miss back to its causes. A lever nobody pulled gets no blame.'],
 4:()=>[`Nudge: each weight moves a little against its pull (step size ${LR}). New output ${f(V.o)}, new miss ${f(V.L)}. Backward, then Nudge, again and again. That loop is the learning.`,'Adjust in proportion to what each lever actually did, then run another week.']};
function render(){
  const g=$('nn-g'); while(g.firstChild) g.removeChild(g.firstChild);
  for(const [a,b] of E){const [ax,ay]=N[a],[bx,by]=N[b];const cls='edge'+(phase>=3?' back':'');
    if(a==='o'){g.appendChild(el('path',{class:cls,d:`M${ax+W/2},${ay+H+14} L${bx+W/2},${by}`}));continue;}
    const x1=ax+W,y1=ay+H/2,x2=bx,y2=by+H/2,mx=(x1+x2)/2;
    g.appendChild(el('path',{class:cls,d:`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}));}
  for(const k in N){const [x,y,l]=N[k];const isP=PARAM.includes(k);const show=isP||(k==='L'?phase>=2:phase>=1);
    const val=isP?P[k]:V[k];const hot=phase>=3&&G[k]!==undefined&&['w1','w2','b'].includes(k);
    g.appendChild(el('rect',{class:'box'+(hot?' hot':''),x,y,width:W,height:H+14,rx:0}));
    g.appendChild(el('text',{class:'lbl',x:x+9,y:y+15},l));
    g.appendChild(el('text',{class:'val',x:x+9,y:y+35},show&&val!==undefined?f(val):'·'));
    if(phase>=3&&G[k]!==undefined) g.appendChild(el('text',{class:'grd',x:x+9,y:y+54},'pull '+f(G[k])));}
  g.appendChild(el('text',{class:'lbl',x:630,y:352},'target = 1'));
  const t=typeof T[phase]==='function'?T[phase]():T[phase];
  $('nn-say').textContent=t[0]; $('nn-coach').textContent='In prep: '+t[1];
  $('nn-hist').textContent=history.length?`Miss by round: ${[...history,V.L].map(f).join(' → ')}`:'';
  $('bF').disabled=phase!==0;$('bL').disabled=phase!==1;$('bB').disabled=!(phase===2||phase===4);$('bN').disabled=phase!==3;$('bA').disabled=phase<2;
}
$('bF').onclick=()=>{forward();phase=1;render()};$('bL').onclick=()=>{loss();phase=2;render()};
$('bB').onclick=()=>{backward();phase=3;render()};$('bN').onclick=()=>{nudge();phase=4;render()};
$('bA').onclick=()=>{for(let i=0;i<20;i++){backward();nudge();}phase=4;render()};$('bR').onclick=reset;
root.querySelector('.nn-js').hidden=false; reset();
})();
