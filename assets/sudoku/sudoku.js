(()=>{'use strict';
const BANK=window.AXIOM_SUDOKU,LV=['easy','medium','hard','advanced'];
const NEED={easy:'Each move is the only number a square can still take.',
medium:'Needs one more read: the only square left in a row, column or box that can take a number.',
hard:'Needs ruling numbers out before any square is forced.',
advanced:'Goes past those steps. Expect to hold several possibilities at once.'};
const $=id=>document.getElementById(id),board=$('sx-board'),card=$('sx-card'),pad=$('sx-pad');
const ROW=i=>i/9|0,COL=i=>i%9,BOX=i=>(ROW(i)/3|0)*3+(COL(i)/3|0);
const peers=i=>{const o=[];for(let k=0;k<81;k++)if(k!==i&&(ROW(k)===ROW(i)||COL(k)===COL(i)||BOX(k)===BOX(i)))o.push(k);return o};
const PEERS=[...Array(81)].map((_,i)=>peers(i));
let st,sel=-1,notesMode=false,timer=null,wrongShown=false;
const KEY='axiom-sudoku-v1';
function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}
function load(){try{return JSON.parse(localStorage.getItem(KEY))}catch(e){return null}}
function fresh(level,avoid){const list=BANK[level];let n;do{n=Math.floor(Math.random()*list.length)}while(list.length>1&&n===avoid);
const [p,s]=list[n];return{level,n,p,s,v:p.split('').map(Number),notes:[...Array(81)].map(()=>[]),t:0,solved:false}}
function cells(){board.innerHTML='';for(let i=0;i<81;i++){const b=document.createElement('button');b.type='button';b.className='sx-cell';b.setAttribute('role','gridcell');
if(COL(i)%3===2&&COL(i)<8)b.classList.add('c3');if(ROW(i)%3===2&&ROW(i)<8)b.classList.add('r3');
b.addEventListener('click',()=>{sel=i;draw()});board.appendChild(b)}}
function conflict(){ // first broken rule, if any
for(let i=0;i<81;i++){const d=st.v[i];if(!d)continue;
for(const [name,f] of [['ROW',ROW],['COLUMN',COL],['BOX',BOX]]){
const clash=[];for(let k=0;k<81;k++)if(f(k)===f(i)&&st.v[k]===d)clash.push(k);
if(clash.length>1)return{name,idx:f(i)+1,d,clash,unit:f,ui:f(i)}}}return null}
function setCard(lines,red){card.className='sx-card'+(red?' red':'');card.innerHTML=lines.map(([k,v])=>'<span class="k">'+k.padEnd(6)+'</span> '+v).join('\n')}
function draw(){const c=conflict(),els=board.children,given=st.p;
for(let i=0;i<81;i++){const e=els[i],d=st.v[i];e.className='sx-cell'+(COL(i)%3===2&&COL(i)<8?' c3':'')+(ROW(i)%3===2&&ROW(i)<8?' r3':'')+(given[i]!=='0'?' given':(d?' user':''));
if(sel>=0&&i!==sel&&PEERS[sel].includes(i))e.classList.add('peer');
if(sel>=0&&d&&d===st.v[sel])e.classList.add('same');if(i===sel)e.classList.add('sel');
if(c){if(c.unit(i)===c.ui)e.classList.add('ruled');if(c.clash.includes(i))e.classList.add('bad')}
if(wrongShown&&d&&given[i]==='0'&&String(d)!==st.s[i])e.classList.add('wrong');
e.setAttribute('aria-label','Row '+(ROW(i)+1)+' column '+(COL(i)+1)+(d?', '+d:', empty'));
if(d){e.textContent='';const s=document.createElement('span');s.className='d';s.textContent=d;e.appendChild(s)}else if(st.notes[i].length){e.textContent='';const g=document.createElement('span');g.className='sx-notes';
for(let n=1;n<=9;n++){const s=document.createElement('span');s.textContent=st.notes[i].includes(n)?n:'';g.appendChild(s)}e.appendChild(g)}else e.textContent=''}
const counts=Array(10).fill(0);st.v.forEach(d=>counts[d]++);[...pad.children].forEach((b,j)=>{if(j<9)b.classList.toggle('done',counts[j+1]>=9)});
const empty=st.v.filter(d=>!d).length;
if(c)setCard([['STATE','RED · rule broken'],['RULE',c.name+' '+c.idx+' · one '+c.d+' per '+c.name.toLowerCase()],['CLAIM',c.clash.length+' squares claim it'],['FIX','clear one of the red squares']],true);
else if(!empty&&st.v.join('')===st.s){st.solved=true;stop();setCard([['STATE','LANDED · every rule holds'],['LEVEL',st.level],['TIME',fmt(st.t)],['NEXT','new puzzle, or a level up']])}
else setCard([['STATE','CLEAR · no rule broken'],['LEVEL',st.level],['OPEN',empty+' squares left']]);
document.querySelectorAll('.sx-levels button').forEach(b=>b.setAttribute('aria-selected',b.dataset.level===st.level));
$('sx-need').textContent=NEED[st.level];$('sx-id').textContent=st.level.toUpperCase()+' '+String(st.n+1).padStart(2,'0');
$('sx-notes').setAttribute('aria-pressed',notesMode);save()}
function fmt(t){return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')}
function stop(){if(timer){clearInterval(timer);timer=null}}
function start(){stop();if(st.solved)return;timer=setInterval(()=>{if(document.hidden)return;st.t++;$('sx-time').textContent=fmt(st.t);if(st.t%10===0)save()},1000);$('sx-time').textContent=fmt(st.t)}
function put(d){if(sel<0||st.p[sel]!=='0'||st.solved)return;wrongShown=false;
if(notesMode&&d){const n=st.notes[sel];st.v[sel]=0;const j=n.indexOf(d);j<0?n.push(d):n.splice(j,1);n.sort()}
else{st.v[sel]=d;st.notes[sel]=[];if(d)PEERS[sel].forEach(k=>{const j=st.notes[k].indexOf(d);if(j>=0)st.notes[k].splice(j,1)})}draw()}
function newGame(level,avoid){st=fresh(level,avoid);sel=-1;wrongShown=false;draw();start()}
for(let n=1;n<=9;n++){const b=document.createElement('button');b.type='button';b.textContent=n;b.addEventListener('click',()=>put(n));pad.appendChild(b)}
const clr=document.createElement('button');clr.type='button';clr.textContent='×';clr.setAttribute('aria-label','Clear square');clr.addEventListener('click',()=>put(0));pad.appendChild(clr);
document.querySelectorAll('.sx-levels button').forEach(b=>b.addEventListener('click',()=>newGame(b.dataset.level)));
$('sx-new').addEventListener('click',()=>newGame(st.level,st.n));
$('sx-reset').addEventListener('click',()=>{st.v=st.p.split('').map(Number);st.notes=st.notes.map(()=>[]);st.solved=false;st.t=0;wrongShown=false;draw();start()});
$('sx-notes').addEventListener('click',()=>{notesMode=!notesMode;draw()});
$('sx-check').addEventListener('click',()=>{if(conflict()){draw();return}const w=st.v.filter((d,i)=>d&&st.p[i]==='0'&&String(d)!==st.s[i]).length;wrongShown=true;draw();
if(w)setCard([['STATE','RED · '+w+' square'+(w>1?'s':'')+' marked'],['RULE','no clash yet, but the rules reject '+(w>1?'them':'it')+' later'],['FIX','underlined squares']],true);
else setCard([['STATE','CLEAR · nothing wrong so far'],['OPEN',st.v.filter(d=>!d).length+' squares left']])});
document.addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey)return;
if(e.key>='1'&&e.key<='9'){put(+e.key);e.preventDefault()}else if(e.key==='0'||e.key==='Backspace'||e.key==='Delete'){put(0);e.preventDefault()}
else if(e.key==='n'||e.key==='N'){notesMode=!notesMode;draw()}
else{const mv={ArrowUp:-9,ArrowDown:9,ArrowLeft:-1,ArrowRight:1}[e.key];if(mv!==undefined){sel=sel<0?0:(sel+mv+81)%81;draw();board.children[sel].focus();e.preventDefault()}}});
cells();const prev=load();
if(prev&&LV.includes(prev.level)&&BANK[prev.level][prev.n]&&BANK[prev.level][prev.n][0]===prev.p){st=prev;draw();start()}else newGame('easy');
})();
