(function(root){
const ranges={age:[18,120],spo2:[1,100],rr:[1,80],sbp:[20,300],ph:[6.5,7.8],co2:[5,200],o2:[10,700],fio2:[21,100],hco3:[1,60]};
function evaluate(d){
 const notes=[],missing=[],errors=[];for(const [k,[a,b]] of Object.entries(ranges))if(d[k]!=null&&(!Number.isFinite(d[k])||d[k]<a||d[k]>b))errors.push(`${k} 範圍須為 ${a}–${b}`);
 const target=d.risk==='yes'||d.co2>45?[88,92]:[94,98];const r={code:'pending',title:'完成評估後顯示建議',tone:'neutral',notes,missing,errors,target,pf:null,rox:null};
 
 if(d.fio2&&d.precise==='yes'){if(d.o2)r.pf=d.o2/(d.fio2/100);if(d.device==='hfnc'&&d.spo2&&d.rr)r.rox=d.spo2/(d.fio2/100)/d.rr;}
 if(d.danger==='yes'||(d.sbp!=null&&d.sbp<90)){r.code='urgent';r.title='立即啟動急救與氣道評估';r.tone='red';notes.push('有氣道／呼吸／循環警訊或收縮壓 <90 mmHg。暫停常規推薦，立即由急重症團隊評估插管，不等待 ROX 或補齊血氣。','若已確認 DNI，依意願與治療上限處理；DNR 不等於 DNI。');return r;}
 if(errors.length){r.title='請修正數值或單位';return r;}
 for(const k of ['age','spo2','rr','sbp','danger','risk','cause','work','device','contra','monitor','goal'])if(d[k]==null||d[k]===''||d[k]==='unknown')missing.push(k);
 if(missing.length){r.title='資料不足，暫不選定模式';notes.push('請完成必要臨床評估；未知不視為正常。補資料期間仍須處理低血氧。');return r;}
 if(d.goal==='dni')notes.push('已選不插管：確認 NIV／HFNC 是否符合治療目標，設定限時試用及舒適照護計畫。');
 const distress=d.work!=='mild'||d.rr>24,hypox=d.spo2<target[0],acid=d.ph!=null&&d.ph<=7.35&&d.co2>45;
 if(d.ph!=null&&d.ph<7.35&&(d.co2==null||d.co2<=45))notes.push('酸血症不能直接判為呼吸性酸中毒；評估代謝性或混合性酸中毒及代償。');
 if(d.ph!=null&&d.co2&&d.hco3&&Math.abs(6.1+Math.log10(d.hco3/(.03*d.co2))-d.ph)>.08)notes.push('血氣數據不一致：核對是否同次動脈檢體與單位。');
 if(d.cause==='other'){r.code='special';r.title='特殊／未明病因：專科評估';notes.push('氣喘、神經肌肉疾病、肥胖低通氣、上呼吸道阻塞及拔管後呼吸衰竭不能直接套用 COPD／肺炎流程。');return r;}
 if((d.cause==='copd'||d.risk==='yes'||distress)&&(d.ph==null||d.co2==null)){r.code='bloodgas';r.title='先取得動脈血氣並評估呼吸支持';notes.push('需要 pH 與 PaCO₂ 區分通氣不足與低血氧；給氧與緊急處理不應等候檢驗。');return r;}
 if(d.contra==='yes'){r.code='contra';r.title='面罩 NIV 有限制：專家評估替代方案';r.tone='amber';notes.push('處理嘔吐／吸入風險、無法清痰、面部損傷、未處理氣胸或介面不耐受。氣道保護失敗應改走急救評估。','HFNC 不可自動替代必要通氣支持；合併酸中毒或疲乏應同步評估插管。');return r;}
 if(acid){r.code='niv';r.title='優先評估雙水平 NIV（BiPAP）';r.tone='teal';notes.push(d.cause==='copd'?'COPD 合併 pH ≤7.35、PaCO₂ >45 mmHg，支持雙水平 NIV；標準治療後仍呼吸急促時證據最明確。[1]':'高碳酸血症合併酸血症：評估雙水平 NIV，並確認急慢性、混合性酸中毒及病因。[3]');if(d.ph<7.25){r.tone='amber';notes.push('pH <7.25 為高失敗風險，需急重症監護及即時氣道處置能力；不以單一 pH 決定插管。');}}
 else if(d.cause==='edema'&&(distress||hypox)){r.code='cpap';r.title='考慮 CPAP 或雙水平 NIV';r.tone='teal';notes.push('心因性肺水腫合併呼吸衰竭，兩種正壓支持皆有證據；有通氣不足／呼吸性酸中毒時偏向雙水平 NIV。[1]','同步治療肺水腫病因；休克不適用常規分支。');}
 else if(['hfnc','niv'].includes(d.device)){r.code='review';r.title='已接受進階支持：進入治療後複評';notes.push('不能因血氧達標直接降階。比較支持強度、作功與血氣趨勢。');}
 else if(d.cause==='pneumonia'&&(distress||hypox)&&d.device!=='air'){r.code='hfnc';r.title='評估啟動 HFNC';r.tone='teal';notes.push('肺炎／新發低血氧性呼吸衰竭，一般氧療不足或呼吸負擔增加時，考慮 HFNC。[2,3]','ATS 2026：HFNC 相較一般氧療為強烈推薦，NIV／CPAP 相較一般氧療為有條件推薦；不表示 HFNC 對每位病人優於 NIV。');}
 else if(distress){r.code='special';r.title='呼吸負擔增加：進一步評估';r.tone='amber';notes.push('血氧達標不代表通氣安全；檢查血氣、病因與疲乏。');}
 else {r.code='oxygen';r.title=hypox?'給予／調整一般氧療':'維持目標，評估最低必要氧療';r.tone='teal';notes.push(d.risk==='yes'?'以 Venturi 或低流量鼻導管控制氧濃度，依血氣調整。[4]':'以鼻導管或面罩滴定至目標；無低血氧及特殊適應症者不需常規給氧。[4]');}
 if(d.spo2<85){r.tone='amber';notes.push('SpO₂ <85%：立即床邊評估與高濃度氧急救橋接；不能等待完成此工具。');}
 if(d.monitor==='no'&&['niv','cpap','hfnc','review'].includes(r.code)){r.tone='amber';notes.push('目前缺乏密切監測／迅速升級能力：立即安排適當照護區，不宜在此環境常規啟動高風險支持。');}return r;
}
function roxRisk(v,h){if(![2,6,12].includes(h)||v==null)return '無對應時間門檻，僅觀察趨勢';return v<({2:2.85,6:3.47,12:3.85}[h])?'高失敗風險：立即臨床重評':v>=4.88?'較低插管風險，仍須監測':'不確定區間：密切追蹤';}
root.Resp={evaluate,roxRisk,ranges};if(typeof module!=='undefined')module.exports=root.Resp;
})(typeof window!=='undefined'?window:globalThis);
