/* ============================================================================
   Cash-flow REPORT golden check — drives the prototype's cashflowResult()
   against the spec's acceptance tests (Бизнес §9 / Техническа §15).
   Usage:  node cashflow-report-check.js [path-to-prototype.html]
   Exit 0 = all pass.
   ============================================================================ */
const fs=require('fs');
const target=process.argv[2]||'prototype-full.html';
const html=fs.readFileSync(target,'utf8');
const SCRIPT=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));
global.window=global;
global.document={documentElement:{_a:{},getAttribute(k){return this._a[k]||null;},setAttribute(){}},
  getElementById(id){return id==='app'?{set innerHTML(v){},get innerHTML(){return '';}}:null;},activeElement:null};
global.matchMedia=()=>({matches:false});global.scrollTo=()=>{};
global.localStorage={getItem:()=>null,setItem:()=>{}};
global.setTimeout=()=>{};global.setInterval=()=>0;global.clearInterval=()=>{};

const TEST=`
const base={'DEM-01':'35–44','DEM-03':'employed','DEM-04':'rent','INC-08':'mostly'};
const P=o=>Object.assign({},base,o);
function run(ans){ S.answers=P(ans); return cashflowResult(); }
let fails=0;
function check(name, ans, asserts){
  const r=run(ans); const errs=[];
  for(const [k,exp] of Object.entries(asserts)){
    let got;
    if(k==='projected') got = r.proj?r.proj.projected:null;
    else if(k==='delta') got = r.proj?Math.round(r.proj.delta):null;
    else if(k==='warn') got = !!r.warn;
    else got = r[k];
    const ok = (typeof exp==='number' && typeof got==='number') ? Math.abs(got-exp)<0.5 : got===exp;
    if(!ok) errs.push(k+': expected '+exp+' got '+got);
  }
  if(errs.length) fails++;
  console.log((errs.length?'FAIL':'ok  ')+'  '+name+(errs.length?'   ['+errs.join('; ')+']':'   score='+(r.score!=null?r.score:r.status)));
  return r;
}

check('T01 Perfect',        {'INC-01':'5000','EXP-06':'2000','EXP-14':'1000','SAV-04':'1500'},
      {status:'COMPLETE',score:100,category:'EXCELLENT',type:'SURPLUS',rec:'STRONG_ACCUMULATION'});
check('T02 50/30/20',       {'INC-01':'5000','EXP-06':'2500','EXP-14':'1500','SAV-04':'1000'},
      {status:'COMPLETE',score:82,category:'VERY_GOOD',rec:'BALANCED'});
check('T03 Needs improve',  {'INC-01':'5000','EXP-06':'3000','EXP-14':'1500','SAV-04':'500'},
      {status:'COMPLETE',score:54,category:'NEEDS_IMPROVEMENT',rec:'ESSENTIAL_AND_SAVING',projected:66,delta:500});
check('T04 (see note)',     {'INC-01':'2000','EXP-06':'1200','EXP-14':'400','SAV-04':'200'},
      {status:'COMPLETE',score:58,rec:'ESSENTIAL_AND_SAVING',projected:70,delta:200});
check('T05 Deficit',        {'INC-01':'2000','EXP-06':'1200','EXP-14':'1000','SAV-04':'0'},
      {status:'COMPLETE',score:26,type:'DEFICIT',rec:'DEFICIT',projected:null,deficit:200});
check('T06 Zero income',    {'INC-01':'0'}, {status:'BLOCKED_ZERO_INCOME'});
check('T07 Inconsistent',   {'INC-01':'3000','EXP-06':'2500','SAV-04':'800'}, {status:'BLOCKED_INCONSISTENT_CASH_FLOW'});
check('T11 Gambling >5%',   {'INC-01':'2000','EXP-06':'900','EXP-14':'400','GAM-01':'yes','GAM-02':'120','SAV-04':'300'},
      {status:'COMPLETE',warn:true,non:520});

console.log('\\nNOTE T04: the spec\\'s worked example (§8.4 / T04) expects the SAVING projection -> 74, but the');
console.log('OUT priority table routes essential 60% & saving 10% to ESSENTIAL_AND_SAVING (priority 4 > 6) -> 70.');
console.log('Engine follows the deterministic rule table; the 74 example is internally inconsistent. Needs client ruling.');
console.log('\\n================ '+(fails===0?'ALL REPORT CHECKS PASS':fails+' FAIL(ES)')+' ================');
process.exit(fails===0?0:1);
`;
eval(SCRIPT+'\n'+TEST);
