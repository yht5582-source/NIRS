// 分頁、示範病例、考題、心智圖。需在 engine.js、app.js、teach-content.js 之後載入。
(function(){
const {CASES,QUIZ,MAP,SOURCES}=TEACH;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const refList=keys=>keys.map(k=>`<a href="${SOURCES[k].u}" target="_blank" rel="noopener">${esc(SOURCES[k].t)}</a>`).join('；');

/* 分頁 */
const PANES=['tool','cases','quiz','map'];
function showPane(id,push){
 PANES.forEach(p=>{q('#'+p).hidden=p!==id;const b=q('#tab-'+p);b.setAttribute('aria-selected',p===id);b.tabIndex=p===id?0:-1;});
 if(push)history.replaceState(null,'','#'+id);
 if(id==='map')drawMap();
}
qa('.toptabs button').forEach(b=>b.addEventListener('click',()=>showPane(b.dataset.pane,true)));
q('.toptabs').addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
 const i=PANES.findIndex(p=>!q('#'+p).hidden),n=PANES[(i+(e.key==='ArrowRight'?1:PANES.length-1))%PANES.length];
 showPane(n,true);q('#tab-'+n).focus();
});
addEventListener('hashchange',()=>{const t=location.hash.slice(1);if(PANES.includes(t))showPane(t);});

/* 把六個病例也放進工具頁的下拉選單 */
const sel=document.getElementById('case'),grp=document.createElement('optgroup');grp.label='進階示範病例';
CASES.forEach((c,i)=>{cases[c.id]={...c.data,story:c.story,teach:c.teach};const o=document.createElement('option');o.value=c.id;o.textContent=`${i+1}. ${c.title}`;grp.append(o);});
sel.append(grp);

/* 示範病例 */
let caseId=CASES[0].id;
q('#c-pick').innerHTML=CASES.map((c,i)=>`<button type="button" data-id="${c.id}"><b>${i+1}. ${esc(c.title)}</b><small>${esc(c.tag)}</small></button>`).join('');
function tiles(d){
 const t=[['pH',d.ph.toFixed(2)],['PaCO₂',d.co2],['HCO₃⁻',d.hco3],['PaO₂',d.o2],['SpO₂',d.spo2+'%'],['RR',d.rr],['收縮壓',d.sbp]];
 if(d.fio2)t.push(['FiO₂',d.fio2+'%']);
 return t.map(([k,v])=>`<div class="metric">${k}<b>${v}</b></div>`).join('');
}
function renderCase(){
 const i=CASES.findIndex(c=>c.id===caseId),c=CASES[i],r=Resp.evaluate(c.data);
 qa('#c-pick button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===caseId));
 q('#c-body').innerHTML=`<div class="casehead"><h2>病例 ${i+1}：${esc(c.title)}</h2><span class="pill">${esc(c.tag)}</span></div>
 <p>${esc(c.story)}</p><div class="tiles">${tiles(c.data)}</div>
 <h3 class="sub">逐步判斷</h3><ol class="csteps">${c.steps.map(s=>`<li><b>${esc(s[0])}</b><span>${esc(s[1])}</span></li>`).join('')}</ol>
 <h3 class="sub">工具輸出</h3><div class="result ${r.tone} caseresult"><b>${esc(r.title)}</b><p class="small">參考目標 SpO₂ ${r.target.join('–')}%${r.pf==null?'':'；P/F '+r.pf.toFixed(0)}${r.rox==null?'':'；開始時 ROX '+r.rox.toFixed(2)}。此處由引擎即時計算。</p></div>
 <h3 class="sub">常見陷阱</h3><ul class="traps">${c.traps.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
 <p class="small">依據：${refList(c.refs)}</p>
 <button type="button" id="c-load">帶入決策工具，連同複評資料</button>`;
 q('#c-load').addEventListener('click',()=>{sel.value=c.id;sel.onchange();showPane('tool',true);q('.toolbar').scrollIntoView();});
}
q('#c-pick').addEventListener('click',e=>{const b=e.target.closest('button');if(b){caseId=b.dataset.id;renderCase();}});
renderCase();

/* 考題：不打亂順序，不儲存作答 */
const X={lv:'全部',a:{}};
function renderExam(){
 qa('#x-set button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lv===X.lv));
 const by=lv=>{const s=QUIZ.map((x,i)=>({...x,i})).filter(x=>x.lv===lv&&X.a[x.i]!=null);return `${s.filter(x=>X.a[x.i]===x.a).length}／${s.length}`;};
 const it=QUIZ.map((x,i)=>({...x,i})).filter(x=>X.lv==='全部'||x.lv===X.lv),done=it.filter(x=>X.a[x.i]!=null);
 q('#x-score').innerHTML=`已答 <b>${done.length}／${it.length}</b>，答對 <b>${done.filter(x=>X.a[x.i]===x.a).length}</b><span class="small">　基礎 ${by('基礎')}　高階 ${by('高階')}</span>`;
 q('#x-list').innerHTML=it.map(x=>{const a=X.a[x.i],ans=a!=null;return `<article class="qcard"><div class="qmeta"><b>第 ${x.i+1} 題</b><span class="pill${x.lv==='高階'?' adv':''}">${x.lv}</span></div><p class="qstem">${esc(x.q)}</p>
 <div class="opts">${x.o.map((o,j)=>`<button type="button" data-q="${x.i}" data-o="${j}" ${ans?'disabled':''} class="${ans?(j===x.a?'right':j===a?'wrong':''):''}">${'ABCD'[j]}. ${esc(o)}</button>`).join('')}</div>
 ${ans?`<div class="hint ${a===x.a?'':'urgent'}" role="status"><b>${a===x.a?'正確':'答案是 '+'ABCD'[x.a]}</b>　${esc(x.x)}<br><span class="small">依據：${refList(x.r)}</span></div>`:''}</article>`;}).join('');
}
q('#x-set').addEventListener('click',e=>{const b=e.target.closest('button');if(b){X.lv=b.dataset.lv;renderExam();}});
q('#x-list').addEventListener('click',e=>{const b=e.target.closest('button[data-q]');if(b){X.a[b.dataset.q]=+b.dataset.o;renderExam();}});
q('#x-reset').addEventListener('click',()=>{X.a={};renderExam();});
renderExam();

/* 心智圖 */
const side=(list,cls)=>list.map((b,i)=>`<div class="mm-branch ${cls}"><button type="button" class="mm-head" aria-expanded="false" aria-controls="mm-${cls}-${i}"><span class="mm-t">${esc(b.t)}</span><span class="mm-s">${esc(b.s)}</span></button><ul class="mm-leaves" id="mm-${cls}-${i}" hidden>${b.l.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`).join('');
q('#mm-dx').innerHTML='<div class="mm-col dx">判斷</div>'+side(MAP.dx,'dx');
q('#mm-tx').innerHTML='<div class="mm-col tx">支持與複評</div>'+side(MAP.tx,'tx');
q('#mm-center').innerHTML=MAP.center.map(esc).join('<br>');
function drawMap(){
 const w=q('#mm'),svg=q('#mm-links');
 if(!w||w.offsetParent===null||getComputedStyle(svg).display==='none')return;
 const W=w.getBoundingClientRect(),C=q('#mm-center').getBoundingClientRect();
 svg.setAttribute('viewBox',`0 0 ${W.width} ${W.height}`);
 svg.innerHTML=qa('#mm .mm-branch').map(b=>{
  const dx=b.classList.contains('dx'),r=b.querySelector('.mm-head').getBoundingClientRect();
  const x1=(dx?C.left:C.right)-W.left,y1=C.top+C.height/2-W.top,x2=(dx?r.right:r.left)-W.left,y2=r.top+r.height/2-W.top,mx=(x1+x2)/2;
  return `<path class="${dx?'dx':'tx'}" d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}"/>`;
 }).join('');
}
const mmSet=(h,o)=>{h.setAttribute('aria-expanded',o);q('#'+h.getAttribute('aria-controls')).hidden=!o;};
q('#mm').addEventListener('click',e=>{const h=e.target.closest('.mm-head');if(h){mmSet(h,h.getAttribute('aria-expanded')!=='true');drawMap();}});
q('#mm-open').addEventListener('click',()=>{qa('#mm .mm-head').forEach(h=>mmSet(h,true));drawMap();});
q('#mm-close').addEventListener('click',()=>{qa('#mm .mm-head').forEach(h=>mmSet(h,false));drawMap();});
if(window.ResizeObserver)new ResizeObserver(drawMap).observe(q('#mm'));else addEventListener('resize',drawMap);

/* 文獻 */
q('#t-refs').innerHTML=Object.values(SOURCES).map(s=>`<li><a href="${s.u}" target="_blank" rel="noopener">${esc(s.t)}</a></li>`).join('');

const start=location.hash.slice(1);showPane(PANES.includes(start)?start:'tool');
})();
