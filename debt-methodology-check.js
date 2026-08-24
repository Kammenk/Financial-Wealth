/* ============================================================================
   Debt-health conformance check — compares the prototype's debt component
   against the FULL "Методика дългово здраве" / "Отчет дългово здраве" sheets.

   Usage:  node debt-methodology-check.js [path-to-prototype.html]

   Unlike the cash-flow model, the prototype implements only a FREE-TIER SUBSET
   of the debt-health methodology. This script implements the full methodology
   independently and prints, per profile, the methodology score vs the prototype
   score plus a per-component conformance verdict.
   ============================================================================ */
const fs = require('fs');
const target = process.argv[2] || 'prototype-full.html';
const html = fs.readFileSync(target, 'utf8');
const SCRIPT = html.slice(html.indexOf('<script>') + 8, html.indexOf('</script>'));

global.window = global;
global.document = { documentElement:{_a:{},getAttribute(k){return this._a[k]||null;},setAttribute(){}},
  getElementById(id){return id==='app'?{set innerHTML(v){}, get innerHTML(){return '';}}:null;}, activeElement:null };
global.matchMedia = () => ({matches:false});
global.scrollTo = () => {};
global.localStorage = { getItem:()=>null, setItem:()=>{} };
global.setTimeout = () => {}; global.setInterval = () => 0; global.clearInterval = () => {};

const TEST = `
const g=(a,id)=>{const v=parseFloat(a[id]);return isNaN(v)?0:v;};
const arr=(a,id)=>Array.isArray(a[id])?a[id]:[];
const nv=x=>parseFloat(x)||0;
function pwv(x,pts){ if(x<=pts[0][0])return pts[0][1]; for(let i=1;i<pts.length;i++){ if(x<=pts[i][0]){const[x0,y0]=pts[i-1],[x1,y1]=pts[i];return y0+(y1-y0)*(x-x0)/(x1-x0);}} return pts[pts.length-1][1]; }

// ---- BNB benchmarks (methodology 6.2, June 2026) ----
const BNB={housing:2.41,consumer:8.76,other:4.64,overdraft:13.20,cards:21.16};
const LOANBM={consumer:'consumer',auto:'consumer',business:'other',student:'other',other:'other'};
const PAY=[[0,100],[0.20,90],[0.30,75],[0.35,60],[0.45,40],[0.50,20],[0.60,0]];
const COST=[[0,100],[0.75,100],[1.00,75],[1.25,60],[1.50,40],[2.00,20],[2.50,0]];
const UTIL=[[0,100],[0.10,90],[0.25,75],[0.40,60],[0.60,40],[0.90,20],[1.00,1]];
const ODDEPTH=[[0,100],[0.05,90],[0.10,75],[0.20,60],[0.30,40],[0.50,20],[0.75,0]];
const BEHAV={always:100,usually:80,above_min:55,min:20};
const ODUSE={none:100,rare:90,some:70,most:35,always:0};

function methodology(a){
  const income=g(a,'INC-01')+g(a,'INC-02')+g(a,'INC-03')+g(a,'INC-04')+g(a,'INC-05')+g(a,'INC-06')+g(a,'INC-07');
  const inc=Math.max(1,income);
  const morts=arr(a,'DEB-MORT'), loans=arr(a,'DEB-LOAN'), cards=arr(a,'DEB-CARD');
  const odBal=g(a,'DEB-16'), odRate=g(a,'DEB-17');
  // 1) payments / income  (DEB-03 + DEB-09 + DEB-15)
  const pay=morts.reduce((t,e)=>t+nv(e.pay),0)+loans.reduce((t,e)=>t+nv(e.pay),0)+cards.reduce((t,e)=>t+nv(e.minpay),0);
  const payPct=pay/inc, payPts=Math.max(0,pwv(payPct,PAY));
  // 2) debt / assets
  const debt=morts.reduce((t,e)=>t+nv(e.bal),0)+loans.reduce((t,e)=>t+nv(e.bal),0)+cards.reduce((t,e)=>t+nv(e.bal),0)+odBal;
  let assets=g(a,'SAV-01')+g(a,'SAV-02'); for(let i=1;i<=13;i++) assets+=g(a,'AST-'+String(i).padStart(2,'0'));
  const daPct=assets>0?debt/assets:(debt>0?Infinity:0);
  const daPts=(debt>0&&assets<=0)?0:Math.max(0,100-daPct*100);
  // 3) cost of debt (per contract, weighted by balance*rate)
  const contracts=[];
  morts.forEach(e=>{if(nv(e.bal)>0&&nv(e.rate)>0)contracts.push({bal:nv(e.bal),rate:nv(e.rate),bm:BNB.housing});});
  loans.forEach(e=>{if(nv(e.bal)>0&&nv(e.rate)>0)contracts.push({bal:nv(e.bal),rate:nv(e.rate),bm:BNB[LOANBM[e.ltype]||'other']});});
  cards.forEach(e=>{if(nv(e.bal)>0&&nv(e.rate)>0)contracts.push({bal:nv(e.bal),rate:nv(e.rate),bm:BNB.cards});});
  if(odBal>0&&odRate>0)contracts.push({bal:odBal,rate:odRate,bm:BNB.overdraft});
  let costPts=100, wsum=0, psum=0;
  contracts.forEach(c=>{const idx=c.rate/c.bm; const p=pwv(idx,COST); const w=c.bal*c.rate; wsum+=w; psum+=p*w;});
  if(wsum>0) costPts=psum/wsum;
  // 4) cards & overdraft
  const hasCard=cards.length>0, hasOD=(a['G-OVER']==='yes')||odBal>0||!!a['DEB-21'];
  let cardScore=null, odScore=null;
  if(hasCard){
    const tBal=cards.reduce((t,e)=>t+nv(e.bal),0), tLim=cards.reduce((t,e)=>t+nv(e.limit),0);
    const util=tLim>0?tBal/tLim:(tBal>0?1.5:0);
    const utilPts=util>1?0:Math.max(0,pwv(util,UTIL));
    const behPts=BEHAV[cards[0].behavior]!==undefined?BEHAV[cards[0].behavior]:55;
    cardScore=0.5*utilPts+0.5*behPts;
  }
  if(hasOD){
    const depth=odBal/inc; const depthPts=depth>=0.75?0:Math.max(0,pwv(depth,ODDEPTH));
    const usePts=ODUSE[a['DEB-21']]!==undefined?ODUSE[a['DEB-21']]:100;
    odScore=0.4*depthPts+0.6*usePts;
  }
  let cardsod;
  if(cardScore!==null&&odScore!==null) cardsod=0.5*cardScore+0.5*odScore;
  else if(cardScore!==null) cardsod=cardScore;
  else if(odScore!==null) cardsod=odScore;
  else cardsod=100;
  if((cardScore!==null&&cardScore<20)||(odScore!==null&&odScore<20)) cardsod=Math.min(cardsod,39);
  // 5) discipline + ЦКР
  const d18=a['DEB-18']||'none', d19=a['DEB-19']||'no';
  let disc, discStatus, preliminary=false;
  if(d18==='none'&&d19==='no'){disc=100;discStatus='Запазена дисциплина';}
  else if(d18==='none'&&(d19==='unsure'||d19==='unchecked')){disc=100;preliminary=true;discStatus='Предварителна (ЦКР непроверен)';}
  else {disc=0;discStatus='Нарушена дисциплина';}
  // overall (before caps)
  const noDebt = debt===0 && pay===0 && !hasCard && !hasOD;
  let overall = noDebt && disc===100 ? 100 : 0.35*payPts+0.15*daPts+0.15*costPts+0.10*cardsod+0.25*disc;
  // cap ladder (section 9)
  const caps=[];
  const d22=a['DEB-22'];
  if(d18==='current'){ if(d22==='d30')caps.push(['current ≤30d',39]); else caps.push(['current >30d/unknown',19]); }
  else if(d18==='resolved'){ if(d19==='yes'||(d22&&d22!=='d30'&&d22!=='idk'))caps.push(['resolved/historical >30d',59]); else caps.push(['resolved ≤30d',74]); }
  else if(d19==='yes'){ caps.push(['historical >30d (ЦКР)',59]); }
  if(payPct>0.60)caps.push(['payments >60%',19]); else if(payPct>0.50)caps.push(['payments >50%',39]);
  if(debt>0&&assets>0&&daPct>=1.0)caps.push(['debt ≥ assets',39]); else if(debt>0&&assets<=0)caps.push(['debt, no assets',39]);
  if(hasCard){const tBal=cards.reduce((t,e)=>t+nv(e.bal),0),tLim=cards.reduce((t,e)=>t+nv(e.limit),0); if(tLim>0&&tBal/tLim>1)caps.push(['card util >100%',59]);}
  const cap=caps.length?Math.min(...caps.map(c=>c[1])):100;
  const final=Math.min(overall,cap);
  const level=x=>x>=90?'Отлично':x>=75?'Много добро':x>=60?'Добро':x>=40?'Нужда от подобрение':x>=20?'Рисково':'Критично';
  return {income,pay,payPct,payPts,debt,assets,daPct,daPts,costPts,cardsod,cardScore,odScore,disc,discStatus,preliminary,
    overall,caps,cap,final,level:level(final),contracts:contracts.length};
}

// prototype's actual debt component
function prototypeDebt(a){
  S.answers=a; const m=mapAnswers(); const inc=Math.max(1,m.income);
  const dsr=m.debtpay/inc, dPay=pw(dsr,T_DSR);
  const assets=m.reserve+m.invest, debt=m.debt;
  const dAssets=(debt>0&&assets<=0)?0:clamp(100-(debt/Math.max(1,assets))*100);
  const disc=m.discipline==='none'?100:0;
  const cDebt=clamp((0.35*dPay+0.15*dAssets+0.25*disc)/0.75);
  const compScore=compute().comps.find(c=>c.key==='debt').score;
  return {dsr,dPay,assets,debt,dAssets,disc,cDebt,compScore,debtpaySource:'EXP-02+EXP-11',debtBalSource:'cards+loans+overdraft (NO mortgage)',assetsSource:'SAV-01+02 + AST-04..10 only'};
}

const base={'DEM-01':'35–44','DEM-03':'employed','DEM-04':'own','INC-08':'mostly','INC-01':''};
const P=o=>Object.assign({},base,o);
const profiles=[
 ['D1 Clean / low debt', P({'INC-01':'3000','DEB-LOAN':[{ltype:'consumer',bal:'5000',rate:'8',pay:'150'}],'EXP-11':'150',
    'SAV-01':'1000','SAV-02':'5000','AST-12':'10000','AST-13':'8000','DEB-18':'none','DEB-19':'no'})],
 ['D2 Big mortgage', P({'INC-01':'4000','DEM-04':'mortgage','DEB-MORT':[{bal:'200000',rate:'2.5',pay:'900',rtype:'fixed',term:'25'}],
    'EXP-02':'900','AST-01':'300000','SAV-02':'10000','DEB-18':'none','DEB-19':'no'})],
 ['D3 Expensive card, debt>assets', P({'INC-01':'2500','G-CARDS':'yes','DEB-CARD':[{bal:'4000',limit:'5000',rate:'24',minpay:'200',behavior:'min'}],
    'EXP-11':'200','SAV-02':'3000','DEB-18':'none','DEB-19':'no'})],
 ['D4 Current arrears >30d', P({'INC-01':'3000','DEB-LOAN':[{ltype:'consumer',bal:'3000',rate:'8',pay:'100'}],'EXP-11':'100',
    'SAV-02':'20000','DEB-18':'current','DEB-19':'yes','DEB-22':'d90'})],
 ['D5 Overdraft dependence', P({'INC-01':'2000','G-OVER':'yes','DEB-16':'800','DEB-17':'13','DEB-21':'most','EXP-11':'0',
    'SAV-02':'4000','DEB-18':'none','DEB-19':'no'})]
];
const pct=x=>isFinite(x)?(x*100).toFixed(1)+'%':'∞', r1=x=>Math.round(x*10)/10;
for(const [name,ans] of profiles){
  const M=methodology(ans), A=prototypeDebt(ans);
  console.log('\\n===== '+name+' =====');
  console.log('  METHODOLOGY (full 5-component + caps):');
  console.log('    payments/income   '+pct(M.payPct)+'  -> '+r1(M.payPts)+' pts   (w35%)');
  console.log('    debt/assets       '+pct(M.daPct)+'  -> '+r1(M.daPts)+' pts   (w15%)  [debt €'+M.debt+' / assets €'+M.assets+']');
  console.log('    cost of debt      '+M.contracts+' contract(s) vs BNB  -> '+r1(M.costPts)+' pts   (w15%)');
  console.log('    cards & overdraft -> '+r1(M.cardsod)+' pts   (w10%)  [card='+(M.cardScore===null?'n/a':r1(M.cardScore))+' od='+(M.odScore===null?'n/a':r1(M.odScore))+']');
  console.log('    discipline+ЦКР    -> '+M.disc+' pts   (w25%)  ['+M.discStatus+']');
  console.log('    weighted overall  '+r1(M.overall)+(M.caps.length?'  | caps: '+M.caps.map(c=>c[0]+'→'+c[1]).join(', ')+'  => cap '+M.cap:'')+ '  => FINAL '+r1(M.final)+' — '+M.level);
  console.log('  PROTOTYPE (free-tier subset, debt component):');
  console.log('    payments/income   '+pct(A.dsr)+'  -> '+r1(A.dPay)+' pts   (same T_DSR curve)');
  console.log('    debt/assets       -> '+r1(A.dAssets)+' pts   [debt €'+A.debt+' ('+A.debtBalSource+') / assets €'+A.assets+' ('+A.assetsSource+')]');
  console.log('    cost of debt      -> NOT COMPUTED');
  console.log('    cards & overdraft -> NOT COMPUTED');
  console.log('    discipline        -> '+A.disc+' pts   (DEB-18 only; ignores DEB-19/ЦКР)');
  console.log('    debt COMPONENT    '+r1(A.compScore)+'  (=(0.35·pay+0.15·debtAssets+0.25·disc)/0.75, cost & cards dropped)');
  console.log('    verdict: methodology FINAL '+r1(M.final)+'  vs  prototype '+r1(A.compScore)+'  =>  '+(Math.abs(M.final-A.compScore)<0.5?'MATCH':'DIVERGES by '+r1(A.compScore-M.final)+' pts'));
}
console.log('\\n================ CONFORMANCE SUMMARY ================');
console.log(' payments/income (35%) : curve MATCHES methodology (T_DSR = the sheet control points).');
console.log('                         BUT prototype reads EXP-02+EXP-11 (aggregate) — methodology reads DEB-03+09+15 (per contract).');
console.log(' debt/assets (15%)     : formula MATCHES (100−ratio) but INPUTS differ:');
console.log('                         prototype debt EXCLUDES the mortgage balance; assets EXCLUDE property/pension/business/personal.');
console.log(' cost of debt (15%)    : NOT IMPLEMENTED (no BNB benchmarking).');
console.log(' cards/overdraft (10%) : NOT IMPLEMENTED (no utilization / repayment / overdraft usage).');
console.log(' discipline+ЦКР (25%)  : partial — DEB-18 binary only; ignores DEB-19 (ЦКР history).');
console.log(' cap ladder            : partial — only resolved→74 / current→39, applied to the OVERALL 8-component score,');
console.log('                         not the debt-health score; missing >30d→19, historical→59, payments>50/60, debt≥assets, util>100.');
console.log(' overall               : prototype renormalizes 35/15/25 by /0.75 (dropping the 15%+10% it omits).');
console.log(' => The debt-health does NOT fully conform: it is the documented FREE-TIER SUBSET. The full engine is paid-tier P2.');
`;
eval(SCRIPT + '\n' + TEST);
