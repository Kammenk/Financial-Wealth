/* ============================================================================
   Cash-flow conformance check — verifies that the prototype's cash-flow engine
   reproduces the "Методика паричен поток" / "Отчет паричен поток" sheets.

   Usage:  node cashflow-methodology-check.js [path-to-prototype.html]
   Default target: prototype-full.html (same engine in all three prototypes).

   It re-implements the methodology INDEPENDENTLY from the sheet's rules and
   compares, field-by-field, against the prototype's own mapAnswers()+compute().
   Exit code 0 = all profiles match, 1 = at least one mismatch.
   ============================================================================ */
const fs = require('fs');
const target = process.argv[2] || 'prototype-full.html';
const html = fs.readFileSync(target, 'utf8');
const SCRIPT = html.slice(html.indexOf('<script>') + 8, html.indexOf('</script>'));

// --- minimal browser stubs so the prototype script loads headlessly ---
global.window = global;
global.document = { documentElement:{_a:{},getAttribute(k){return this._a[k]||null;},setAttribute(){}},
  getElementById(id){return id==='app'?{set innerHTML(v){}, get innerHTML(){return '';}}:null;}, activeElement:null };
global.matchMedia = () => ({matches:false});
global.scrollTo = () => {};
global.localStorage = { getItem:()=>null, setItem:()=>{} };
global.setTimeout = () => {}; global.setInterval = () => 0; global.clearInterval = () => {};

// The test body runs in the SAME lexical scope as the prototype script (single
// eval), so it can read S / mapAnswers / compute / pw / T_ESS / clamp directly.
const TEST = `
const G = (a,id) => { const v=parseFloat(a[id]); return isNaN(v)?0:v; };
function methodology(a){
  const income = G(a,'INC-01')+G(a,'INC-02')+G(a,'INC-03')+G(a,'INC-04')+G(a,'INC-05')+G(a,'INC-06')+G(a,'INC-07');
  // Debt payments DERIVED from per-obligation records (no aggregate EXP-02/EXP-11).
  const arr=id=>Array.isArray(a[id])?a[id]:[];
  const sumF=(id,f)=>arr(id).reduce((t,e)=>t+(parseFloat(e[f])||0),0);
  const cardPay=arr('DEB-CARD').reduce((t,e)=>t+(e.behavior==='always'?0:(parseFloat(e.minpay)||0)),0);
  const odOut=a['G-OVER']==='yes'?G(a,'DEB-OD-FEES')+G(a,'DEB-OD-PRIN'):0;
  const debtpay = sumF('DEB-MORT','pay')+sumF('DEB-LOAN','pay')+cardPay+odOut;
  const essExcl = G(a,'EXP-01')+G(a,'EXP-03')+G(a,'EXP-04')+G(a,'EXP-05')+G(a,'EXP-06')
                + G(a,'EXP-07')+G(a,'EXP-08')+G(a,'EXP-09')+G(a,'EXP-10')+G(a,'EXP-12');
  const essential = essExcl+debtpay;                       // essential includes debt service
  const nonessential = G(a,'EXP-14')+G(a,'GAM-02');
  const savings = G(a,'SAV-04')+G(a,'SAV-05')+G(a,'EXP-13');
  const inc = Math.max(1,income);
  const essPct=essential/inc, nonPct=nonessential/inc, savePct=savings/inc, dsr=debtpay/inc;
  const lin=(x,x0,y0,x1,y1)=>y0+(y1-y0)*(x-x0)/(x1-x0);
  // Tails complete the analyst's underspecified "0–25" / "0–40" ranges per the
  // Technical Specification: essential reaches 0 at 80%, non-essential at 60%.
  const eS = essPct<=.40?100:essPct<=.50?lin(essPct,.40,100,.50,85):essPct<=.60?lin(essPct,.50,85,.60,55):essPct<=.70?lin(essPct,.60,55,.70,25):essPct<.80?lin(essPct,.70,25,.80,0):0;
  const nS = nonPct<=.20?100:nonPct<=.30?lin(nonPct,.20,100,.30,80):nonPct<=.40?lin(nonPct,.30,80,.40,40):nonPct<.60?lin(nonPct,.40,40,.60,0):0;
  const sS = savePct<=0?0:savePct<.10?lin(savePct,0,0,.10,40):savePct<.20?lin(savePct,.10,40,.20,80):savePct<.30?lin(savePct,.20,80,.30,100):100;
  const overall = 0.4*eS+0.2*nS+0.4*sS;
  const essLvl = essPct<=.40?'Отлично':essPct<=.45?'Много добро':essPct<=.55?'Добро':essPct<=.65?'Нужда от подобрение':'Рисково';
  const nonLvl = nonPct<=.20?'Отлично':nonPct<=.25?'Много добро':nonPct<=.30?'Добро':nonPct<=.40?'Нужда от подобрение':'Рисково';
  const saveLvl= savePct<=0?'Рисково/0':savePct<=.05?'Рисково':savePct<=.15?'Нужда от подобрение':savePct<=.20?'Добро':savePct<=.30?'Много добро':'Отлично';
  const dsrLvl = dsr<=.20?'Отлично':dsr<=.30?'Много добро':dsr<=.35?'Добро':dsr<=.45?'Нужда от подобрение':dsr<=.50?'Рисково':'Критично';
  return {income,essential,nonessential,savings,debtpay,essPct,nonPct,savePct,dsr,eS,nS,sS,overall,
    remainder:income-essential-nonessential-savings,essLvl,nonLvl,saveLvl,dsrLvl};
}
function prototypeCashflow(a){
  S.answers=a; const m=mapAnswers(); const inc=Math.max(1,m.income);
  const essTotal=m.essential+m.debtpay;
  const cf={essPct:essTotal/inc,nonPct:m.nonessential/inc,savePct:m.savings/inc,dsr:m.debtpay/inc};
  cf.cfEss=pw(cf.essPct,T_ESS); cf.cfNon=pw(cf.nonPct,T_NON); cf.cfSave=pw(cf.savePct,T_SAVE);
  cf.cCash=clamp(0.4*cf.cfEss+0.2*cf.cfNon+0.4*cf.cfSave);
  cf.compScore=compute().comps.find(c=>c.key==='cashflow').score;
  cf.income=m.income; cf.essential=essTotal; cf.nonessential=m.nonessential; cf.savings=m.savings; cf.debtpay=m.debtpay;
  return cf;
}
const base={'DEM-01':'35–44','DEM-03':'employed','DEM-04':'rent','INC-08':'mostly'};
const P=o=>Object.assign({},base,o);
const profiles=[
 ['P1 Balanced/Excellent', P({'INC-01':'3000','EXP-04':'300','EXP-06':'600','EXP-07':'300','EXP-14':'600','SAV-04':'900'})],
 ['P2 Mortgage record',    P({'INC-01':'2500','DEM-04':'mortgage','DEB-MORT':[{pay:'175'}],'EXP-03':'20','EXP-05':'100','EXP-06':'700','EXP-04':'250','EXP-07':'250','EXP-14':'750','SAV-04':'300'})],
 ['P3 Deficit/Risky',      P({'INC-01':'2000','DEM-04':'mortgage','DEB-MORT':[{pay:'500'}],'G-LOANS':'yes','DEB-LOAN':[{pay:'300'}],'EXP-06':'400','EXP-04':'300','EXP-14':'900','SAV-04':'0'})],
 ['P4 Debt-critical',      P({'INC-01':'3000','DEM-04':'mortgage','DEB-MORT':[{pay:'1000'}],'G-LOANS':'yes','DEB-LOAN':[{pay:'700'}],'EXP-06':'500','EXP-14':'300','SAV-04':'400'})],
 ['P5 Card+overdraft',     P({'INC-01':'3000','G-CARDS':'yes','DEB-CARD':[{bal:'2000',limit:'5000',minpay:'150',behavior:'min'}],'G-OVER':'yes','DEB-16':'800','DEB-17':'13','DEB-OD-FEES':'40','DEB-OD-PRIN':'100','EXP-06':'800','EXP-14':'450','SAV-04':'300','SAV-05':'200'})],
 ['P6 Invest+gambling',    P({'INC-01':'2000','EXP-06':'900','EXP-04':'300','EXP-14':'600','GAM-01':'yes','GAM-02':'100','SAV-04':'300','SAV-05':'150','EXP-13':'120'})],
 ['P7 Card paid-in-full',  P({'INC-01':'2000','G-CARDS':'yes','DEB-CARD':[{bal:'700',limit:'3000',minpay:'200',behavior:'always'}],'EXP-06':'600','EXP-14':'400','SAV-04':'300'})],
 // Boundary profiles locking the new tail endpoints (essential→0 at 80%, non-ess→0 at 60%).
 ['B1 Essential 85% (>80 tail)', P({'INC-01':'2000','EXP-06':'1700'})],       // essPct .85 -> eS 0
 ['B2 Non-ess 50% (mid tail)',   P({'INC-01':'2000','EXP-14':'1000'})],       // nonPct .50 -> nS 20
 ['B3 Non-ess 55% (mid tail)',   P({'INC-01':'2000','EXP-14':'1100'})]        // nonPct .55 -> nS 10
];
const pct=x=>(x*100).toFixed(1)+'%', r1=x=>Math.round(x*10)/10, eq=(x,y)=>Math.abs(x-y)<0.5;
let fails=0;
for(const [name,ans] of profiles){
  const MM=methodology(ans), A=prototypeCashflow(ans);
  const checks=[['income',MM.income,A.income],['essential',r1(MM.essential),r1(A.essential)],
    ['non-ess',MM.nonessential,A.nonessential],['savings',MM.savings,A.savings],['debt',MM.debtpay,A.debtpay],
    ['essential pts',r1(MM.eS),r1(A.cfEss)],['non-ess pts',r1(MM.nS),r1(A.cfNon)],['savings pts',r1(MM.sS),r1(A.cfSave)],
    ['overall',r1(MM.overall),r1(A.cCash)],['comp score',r1(MM.overall),r1(A.compScore)]];
  const ok=checks.every(c=>eq(c[1],c[2])); if(!ok) fails++;
  console.log('\\n===== '+name+(ok?'  MATCH':'  MISMATCH')+' =====');
  console.log('  essential '+pct(MM.essPct)+' | non-ess '+pct(MM.nonPct)+' | savings '+pct(MM.savePct)+' | debt-load '+pct(MM.dsr));
  console.log('  overview EUR: income '+MM.income+' | essential '+r1(MM.essential)+' | non-ess '+MM.nonessential+' | savings '+MM.savings+' | remainder '+r1(MM.remainder));
  console.log('  points [methodology->prototype]: ess '+r1(MM.eS)+'->'+r1(A.cfEss)+' | non '+r1(MM.nS)+'->'+r1(A.cfNon)+' | save '+r1(MM.sS)+'->'+r1(A.cfSave));
  console.log('  OVERALL cash-flow: '+r1(MM.overall)+' -> '+r1(A.compScore));
  console.log('  levels: ess='+MM.essLvl+' | non='+MM.nonLvl+' | save='+MM.saveLvl+' | debt='+MM.dsrLvl);
  checks.filter(c=>!eq(c[1],c[2])).forEach(c=>console.log('     ! '+c[0]+': '+c[1]+' vs '+c[2]));
}
console.log('\\n================ '+(fails===0?'ALL '+profiles.length+' PROFILES MATCH':fails+' MISMATCH(ES)')+' ================');
process.exit(fails===0?0:1);
`;

eval(SCRIPT + '\n' + TEST);
