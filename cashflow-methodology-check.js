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
  const essential = G(a,'EXP-01')+G(a,'EXP-02')+G(a,'EXP-03')/12+G(a,'EXP-04')+G(a,'EXP-05')+G(a,'EXP-06')
                  + G(a,'EXP-07')+G(a,'EXP-08')+G(a,'EXP-09')+G(a,'EXP-10')+G(a,'EXP-11')+G(a,'EXP-12')+G(a,'EXP-15')/12;
  const nonessential = G(a,'EXP-14');
  const savings = G(a,'SAV-04')+G(a,'EXP-13');
  const debtpay = G(a,'EXP-02')+G(a,'EXP-11');
  const inc = Math.max(1,income);
  const essPct=essential/inc, nonPct=nonessential/inc, savePct=savings/inc, dsr=debtpay/inc;
  const lin=(x,x0,y0,x1,y1)=>y0+(y1-y0)*(x-x0)/(x1-x0);
  const eS = essPct<=.40?100:essPct<=.50?lin(essPct,.40,100,.50,85):essPct<=.60?lin(essPct,.50,85,.60,55):essPct<=.70?lin(essPct,.60,55,.70,25):Math.max(0,lin(essPct,.70,25,1,0));
  const nS = nonPct<=.20?100:nonPct<=.30?lin(nonPct,.20,100,.30,80):nonPct<=.40?lin(nonPct,.30,80,.40,40):Math.max(0,lin(nonPct,.40,40,1,0));
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
 ['P2 Good/mid',           P({'INC-01':'2500','EXP-06':'700','EXP-04':'250','EXP-07':'250','EXP-02':'175','EXP-14':'750','SAV-04':'300'})],
 ['P3 Deficit/Risky',      P({'INC-01':'2000','DEM-04':'mortgage','EXP-06':'400','EXP-04':'300','EXP-02':'500','EXP-11':'300','EXP-14':'900','SAV-04':'0'})],
 ['P4 Debt-critical',      P({'INC-01':'3000','DEM-04':'mortgage','EXP-02':'1000','EXP-11':'700','EXP-06':'500','EXP-14':'300','SAV-04':'400'})],
 ['P5 Annual fields /12',  P({'INC-01':'3000','EXP-06':'800','EXP-03':'1200','EXP-15':'3600','EXP-14':'450','SAV-04':'450'})],
 ['P6 Multi-income',       P({'INC-01':'2000','G-INC':['bonus','rent'],'INC-02':'400','INC-05':'600','EXP-06':'900','EXP-04':'300','EXP-14':'600','SAV-04':'600','EXP-13':'120'})]
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
