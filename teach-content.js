// 教學內容：示範病例、考題、心智圖、文獻。node tests.cjs 會用 engine.js 逐項核對。
(function(root){
const base={danger:'no',risk:'no',contra:'no',monitor:'yes',goal:'full',work:'moderate',device:'mask',precise:'no'};

const SOURCES={
 ATS:{t:'ATS 2026：Noninvasive respiratory support（Goel et al., AJRCCM 212:2135）',u:'https://doi.org/10.1093/ajrccm/aamag302'},
 ERSATS:{t:'ERS/ATS 2017：NIV for acute respiratory failure（Rochwerg et al., ERJ 50:1602426）',u:'https://doi.org/10.1183/13993003.02426-2016'},
 ERSHFNC:{t:'ERS 2022：HFNC in acute respiratory failure（Oczkowski et al., ERJ 59:2101574）',u:'https://doi.org/10.1183/13993003.01574-2021'},
 BTS:{t:'BTS 2017：Oxygen use in adults（O’Driscoll et al., BMJ Open Respir Res）',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5531304/'},
 ROCA:{t:'Roca 2019：ROX validation（AJRCCM 199:1368）',u:'https://doi.org/10.1164/rccm.201803-0589oc'},
 FRAT:{t:'Frat 2015：FLORALI（NEJM 372:2185）',u:'https://doi.org/10.1056/NEJMoa1503326'},
 PERKINS:{t:'Perkins 2022：RECOVERY-RS（JAMA 327:546）',u:'https://doi.org/10.1001/jama.2022.0028'}
};

const CASES=[
{id:'copdNoAcid',title:'COPD：高碳酸但沒有酸血症',tag:'不是每個高 PaCO₂ 都要上 NIV',
 story:'68 歲男性，COPD 急性惡化，痰量增加。支氣管擴張劑與低流量鼻導管後，說話成句、意識清楚，無六項急救警訊。',
 data:{...base,cause:'copd',risk:'yes',age:68,work:'mild',device:'nc',spo2:90,rr:22,sbp:134,ph:7.38,co2:54,hco3:31,o2:62,f_mode:'oxygen',f_time:'1',f_status:'better',f_spo2:90,f_rr:20,f_ph:7.38,f_co2:53},
 expect:{code:'oxygen',target:[88,92]},
 steps:[
  ['先過安全關','六項急救警訊皆無、收縮壓 134 mmHg，可進入模式選擇。'],
  ['讀血氣','PaCO₂ 54 mmHg 偏高，但 pH 7.38 正常、HCO₃⁻ 31 mmol/L。BTS：PCO₂ 高而 pH ≥7.35，或 HCO₃⁻ >28，多半是長期高碳酸血症。'],
  ['這不是 NIV 的適應情境','ERS/ATS 建議 COPD 惡化時，高碳酸但未酸血症者不要使用 NIV（有條件建議，低確定性）；重點是藥物治療與把血氧控制在 88–92%。'],
  ['目標與複查','SpO₂ 90% 已在 88–92%，不必往上追。BTS：30–60 分鐘再抽一次血氣，確認 PCO₂ 沒有上升、pH 沒有下降。']
 ],
 traps:['看到 PaCO₂ >45 mmHg 就直接上 BiPAP。','把 SpO₂ 90% 當成低血氧，加氧到 94–98%。','擔心 CO₂ 而突然停氧：BTS 提醒驟停可能造成危及生命的反彈性低血氧。'],
 refs:['ERSATS','BTS'],teach:'學習重點：pH 正常時不以 NIV 為先；控氧 88–92%，30–60 分鐘複查血氣。'},

{id:'copdSevere',title:'COPD：重度酸血症 pH 7.18',tag:'NIV 試用與失敗訊號',
 story:'74 歲男性，COPD 急性惡化。pH 7.18，但意識清楚、能配合、可咳痰、血壓穩定，尚未出現呼吸肌疲乏，ICU 床邊可立即插管。',
 data:{...base,cause:'copd',risk:'yes',age:74,work:'severe',device:'mask',spo2:88,rr:34,sbp:142,ph:7.18,co2:92,hco3:33,o2:60,f_mode:'niv',f_time:'1',f_status:'same',f_spo2:89,f_rr:36,f_ph:7.16,f_co2:96},
 expect:{code:'niv',tone:'amber',target:[88,92],followHas:['尚未改善','呼吸頻率較初始升高','pH 較初始下降']},
 steps:[
  ['pH 低不等於不能試','ERS/ATS：沒有一個 pH 下限代表不適合試 NIV；但 pH 越低失敗風險越高，必須密切監測並能立即插管。除非病人正在快速惡化，否則也建議先試。'],
  ['確認地點與人力','工具把這個情況標成琥珀色。在沒有監測或升級能力的地方，不應常規開始。'],
  ['1 小時複評','pH 7.18→7.16、PaCO₂ 92→96、RR 34→36。ERS/ATS：有反應的病人幾乎都在 1–4 小時內看到 pH 或 RR 改善，而這位兩者都變差。'],
  ['下一步','先查面罩漏氣、同步性與設定，同時準備插管。出現疲乏、意識變差就把複評改為「惡化」，工具會直接轉急救評估。']
 ],
 traps:['把 pH <7.25 當成 NIV 絕對禁忌。','反過來，因為「指引說沒有下限」就留在普通病房試。','把 1–4 小時當成必須等滿的時間；惡化時不需等待。'],
 refs:['ERSATS','ATS'],teach:'學習重點：重度酸血症可以試 NIV，但要有即時插管能力；1 小時 pH 與 RR 都變差，是升級訊號。'},

{id:'pneumoniaRox',title:'肺炎：HFNC 6 小時 ROX 下滑',tag:'血氧撐住不代表成功',
 story:'61 歲女性，肺炎合併低血氧性呼吸衰竭，無 CO₂ 滯留，已接受 HFNC 6 小時。護理師回報 FiO₂ 一路上調，SpO₂ 仍在 90% 左右。',
 data:{...base,cause:'pneumonia',age:61,device:'hfnc',precise:'yes',fio2:60,spo2:92,rr:32,sbp:118,ph:7.44,co2:34,hco3:23,o2:62,f_mode:'hfnc',f_time:'6',f_status:'same',f_precise:'yes',f_fio2:70,f_spo2:90,f_rr:38},
 expect:{code:'review',target:[94,98],pf:103,rox0:4.79,rox:3.38,roxRisk:'高失敗',followHas:['目前 ROX = 3.38','高失敗風險']},
 steps:[
  ['HFNC 是合理起點','ATS 2026：新發低血氧性呼吸衰竭，HFNC 相較一般氧療為強烈建議（中等確定性）。'],
  ['算 ROX','開始時 (92 ÷ 0.60) ÷ 32 = 4.79；6 小時 (90 ÷ 0.70) ÷ 38 = 3.38。Roca：6 小時 <3.47 預測 HFNC 失敗。'],
  ['不要只看單一數字','6 小時 AUC 僅 0.703，但這位 RR 上升、FiO₂ 增加、血氧未達標，方向全都不對。ATS 2026 也要求觀察持續呼吸急促與疲乏。'],
  ['決定插管時','ATS 2026：HFNC 或面罩 NIV 預氧合都優於一般氧療（強烈建議），兩者之間不做建議；預氧合不可延誤必要的緊急插管。']
 ],
 traps:['SpO₂ 還有 90% 就說 HFNC 有效。','等到 12 小時才重評。ROX 門檻不是可以等待的時間點。','把 ROX 門檻用在 COPD 或其他病因。'],
 refs:['ATS','ROCA'],teach:'學習重點：6 小時 ROX 3.38 <3.47，加上 RR 與 FiO₂ 惡化，立即重評升級並準備預氧合。'},

{id:'edemaHyper',title:'肺水腫：合併高碳酸與酸血症',tag:'CPAP 還是雙水平 NIV',
 story:'79 歲女性，高血壓病史，端坐呼吸、滿肺囉音。儲氣袋面罩下 SpO₂ 86%。心電圖無 ST 段上升、無休克徵象，意識清楚。',
 data:{...base,cause:'edema',age:79,work:'severe',device:'reservoir',spo2:86,rr:36,sbp:176,ph:7.27,co2:56,hco3:25,o2:52,f_mode:'niv',f_time:'1',f_status:'better',f_spo2:94,f_rr:26,f_ph:7.33,f_co2:47},
 expect:{code:'niv',tone:'teal',target:[88,92]},
 steps:[
  ['先排除指引不涵蓋的族群','ERS/ATS 的強烈建議不適用急性冠心症與心因性休克，這些病人多被排除於試驗之外。此處已確認無休克、無 ST 段上升。'],
  ['CPAP 與雙水平 NIV 都有依據','ERS/ATS：兩者皆強烈建議，證據不足以選邊。CPAP 的優點是技術較簡單、較易同步。'],
  ['血氣讓選擇偏向雙水平','BTS：心因性肺水腫標準治療反應不佳時考慮 CPAP，若合併高碳酸與酸中毒則用 NIV。本例 pH 7.27、PaCO₂ 56，工具因此優先雙水平。'],
  ['同步治療病因','呼吸支持不取代肺水腫本身的治療。工具因 PaCO₂ >45 顯示 88–92%，請依血氣與醫囑調整。']
 ],
 traps:['把正壓支持當成唯一治療，延誤處理病因。','休克病人仍走常規肺水腫分支。','把 ATS 2026 高碳酸的建議直接套用：該文件提醒此族群以 COPD 為主，肺水腫需獨立判斷。'],
 refs:['ERSATS','BTS','ATS'],teach:'學習重點：肺水腫 CPAP 與雙水平都有依據；合併高碳酸酸血症時偏向雙水平。先確認無休克與急性冠心症。'},

{id:'copdDni',title:'COPD 末期：已確認不插管',tag:'DNR 不等於 DNI',
 story:'84 歲男性，極重度 COPD、居家用氧，已簽 DNR。急性惡化時家屬問能否戴呼吸器。經討論，本人確認不插管，但願意以面罩 NIV 爭取度過這次住院。',
 data:{...base,cause:'copd',risk:'yes',goal:'dni',age:84,device:'nc',spo2:87,rr:30,sbp:128,ph:7.30,co2:64,hco3:31,o2:56,f_mode:'niv',f_time:'2',f_status:'better',f_spo2:89,f_rr:24,f_ph:7.34,f_co2:57},
 expect:{code:'niv',tone:'teal',target:[88,92],noteHas:'不插管',unknownGoalPending:true},
 steps:[
  ['先問清楚','DNR 不等於 DNI。治療上限選「尚待確認」時，工具不會給出模式，要先確認本人是否接受插管與呼吸支持。'],
  ['分清使用目的','ERS/ATS 引用 SCCM 分類：type 1 無治療限制；type 2 不插管但以存活出院為目標；type 3 只求症狀緩解。本例屬 type 2。'],
  ['證據要講實話','type 2 缺乏隨機試驗，ERS/ATS 未做建議。觀察性研究中，COPD 與心衰竭的 DNI 病人住院存活可達 30–60% 以上。'],
  ['事先訂好停止條件','約定試用時間與評估指標。本例 2 小時 pH 7.30→7.34、RR 30→24，可繼續。若無改善或無法耐受，轉為舒適照護，而不是延長到沒有人記得當初的目標。']
 ],
 traps:['看到 DNR 就直接放棄呼吸支持。','看到 DNR 就以為已包含 DNI，沒有再確認。','沒有事先約定試用終點。'],
 refs:['ERSATS'],teach:'學習重點：DNR 不等於 DNI；確認目標後限時試用 NIV，並事先訂好停止條件。'},

{id:'copdMask',title:'COPD：有適應症但戴不上面罩',tag:'HFNC 的條件未必成立',
 story:'77 歲男性，COPD，跌倒後雙側顴骨與下頷裂傷，鼻腔完好。pH 7.30，有 NIV 適應症，但面罩無法密合、壓迫傷口。意識清楚，能咳痰，無六項急救警訊。',
 data:{...base,cause:'copd',risk:'yes',contra:'yes',age:77,device:'mask',spo2:89,rr:28,sbp:146,ph:7.30,co2:62,hco3:30,o2:58,f_mode:'hfnc',f_time:'1',f_status:'same',f_precise:'yes',f_fio2:35,f_spo2:90,f_rr:28,f_ph:7.29,f_co2:64},
 expect:{code:'contra',tone:'amber',target:[88,92],rox:9.18,followHas:['此病因不套用肺炎 ROX 門檻','pH 較初始下降']},
 steps:[
  ['工具如何反應','有雙水平適應症，但面罩受限，工具轉為專家評估，不會自動改建議 HFNC。'],
  ['HFNC 真的可以替代嗎','ATS 2026 的條件是：輕度酸血症（如 pH >7.25），而且監測與升級至 NIV 都能迅速到位。本例 pH 符合，但「升級到 NIV」這條路被傷口堵住。試驗中約三分之一 HFNC 病人需要升級到 NIV。'],
  ['若仍決定試用','須說清楚失敗時的下一步就是評估插管。ATS 指出高碳酸族群的流量證據有限，30–40 L/min 僅是建議範圍，應依反應調整。'],
  ['1 小時複評','pH 7.30→7.29、PaCO₂ 62→64，沒有改善。此時 ROX 算出來是 9.18，看起來很好，卻不能拿來安心：門檻來自肺炎族群，且 ROX 不含 PaCO₂。應評估插管。']
 ],
 traps:['面罩不行就反射性改 HFNC，卻沒有升級計畫。','ROX 很高就以為 COPD 沒事：ROX 看不到 PaCO₂。','氣道保護出問題時還在調介面：這時應回到急救評估。'],
 refs:['ATS'],teach:'學習重點：HFNC 替代 NIV 有前提；NIV 不可行時，失敗的下一步是評估插管。ROX 不外推到 COPD。'}
];

// a：0=A 1=B 2=C 3=D。check 由 tests.cjs 用引擎核對。
const QUIZ=[
{lv:'基礎',q:'65 歲肺炎，收縮壓 78 mmHg、意識變差、SpO₂ 82%、呼吸逐漸無力。下一步？',o:['先上 HFNC，2 小時後算 ROX','先試雙水平 NIV 30 分鐘','立即啟動急救與氣道評估','補齊動脈血氣、胸部影像與乳酸後再決定'],a:2,x:'危急徵象優先。工具遇到收縮壓 <90 mmHg 或任一警訊就停止常規推薦，也不等血氣或 ROX。',r:['ATS'],check:{data:{...base,age:65,cause:'pneumonia',danger:'yes',sbp:78,spo2:82,rr:38},code:'urgent'}},
{lv:'基礎',q:'已知 COPD、尚未取得血氣的急性惡化病人，初始 SpO₂ 目標是？',o:['88–92%','94–98%','85–88%','96–100%'],a:0,x:'BTS：有高碳酸風險者先以 88–92% 為目標，待血氣再調整。其他急性病人多為 94–98%。',r:['BTS'],check:{data:{...base,age:70,cause:'copd',risk:'yes',spo2:90,rr:24,sbp:130},target:[88,92]}},
{lv:'基礎',q:'COPD 惡化經標準治療後，ERS/ATS 提醒考慮雙水平 NIV 的條件是？',o:['pH ≤7.25、PaCO₂ >60、RR >30','pH ≤7.35，不看 PaCO₂ 與 RR','pH ≤7.30、PaCO₂ >45、RR >30','pH ≤7.35、PaCO₂ >45、RR >20–24'],a:3,x:'實施考量明列 pH ≤7.35、PaCO₂ >45 mmHg、呼吸頻率 >20–24 次／分。',r:['ERSATS']},
{lv:'基礎',q:'pH 7.22、PaCO₂ 25 mmHg、HCO₃⁻ 10 mmol/L、室內空氣 SpO₂ 97%、RR 30。如何判讀？',o:['高碳酸性衰竭，上雙水平 NIV','代謝性酸中毒，找病因治療','低血氧性衰竭，上 HFNC','混合型酸中毒，先上 CPAP'],a:1,x:'PaCO₂ 低，呼吸急促是代償。低 pH 不等於 NIV 適應症，工具也不會因此推薦 NIV。',r:['ERSATS'],check:{data:{...base,age:60,cause:'other',ph:7.22,co2:25,hco3:10,spo2:97,rr:30,sbp:130,device:'air',fio2:21,precise:'yes'},code:'special'}},
{lv:'基礎',q:'HFNC 中 SpO₂ 93%、FiO₂ 60%、RR 32 次／分。ROX 是多少？',o:['1.74','2.91','4.84','6.20'],a:2,x:'ROX =（SpO₂ ÷ FiO₂ 小數）÷ RR =（93 ÷ 0.60）÷ 32 = 4.84。',r:['ROCA'],check:{data:{...base,age:58,cause:'pneumonia',device:'hfnc',fio2:60,precise:'yes',spo2:93,rr:32,sbp:120,ph:7.45,co2:33},rox:4.84}},
{lv:'基礎',q:'PaO₂ 80 mmHg、可靠 FiO₂ 40%。P/F 比值是？',o:['200','320','32','2'],a:0,x:'P/F = PaO₂ ÷ FiO₂ 小數 = 80 ÷ 0.40 = 200。工具的 FiO₂ 欄位輸入百分比（40），不是 0.40。',r:['ERSATS'],check:{data:{...base,age:60,cause:'pneumonia',fio2:40,precise:'yes',o2:80,spo2:92,rr:28,sbp:120,ph:7.45,co2:33},pf:200}},
{lv:'基礎',q:'新發低血氧性呼吸衰竭，與一般氧療相比，ATS 2026 的建議強度是？',o:['三種都是強烈建議','NIV 與 CPAP 強烈，HFNC 有條件','三種都不做建議','HFNC 強烈，NIV 與 CPAP 有條件'],a:3,x:'HFNC 強烈建議（中等確定性）；面罩或頭盔的 NIV、CPAP 為有條件建議（低確定性）。',r:['ATS']},
{lv:'基礎',q:'急性心因性肺水腫合併呼吸衰竭（無休克或急性冠心症），ERS/ATS 建議？',o:['只用 CPAP，NIV 會增加心肌梗塞','CPAP 或雙水平 NIV 皆可','只用雙水平 NIV','證據不足，不做建議'],a:1,x:'兩者皆為強烈建議（中等確定性），現有證據不足以選邊。',r:['ERSATS']},
{lv:'基礎',q:'COPD 惡化：pH 7.38、PaCO₂ 54、HCO₃⁻ 31、RR 22、作功平穩、SpO₂ 90%。最合適的是？',o:['控氧 88–92%，複查血氣','立即上 NIV 預防酸中毒','停止給氧讓 PaCO₂ 下降','加氧到 SpO₂ 94–98%'],a:0,x:'高碳酸但未酸血症，ERS/ATS 建議不用 NIV。突然停氧有反彈性低血氧的風險（BTS）。',r:['ERSATS','BTS'],check:{data:{...base,age:68,cause:'copd',risk:'yes',work:'mild',device:'nc',spo2:90,rr:22,sbp:134,ph:7.38,co2:54,hco3:31},code:'oxygen'}},
{lv:'基礎',q:'84 歲病人已簽 DNR，尚未討論插管。家屬問能否使用 NIV，應如何處理？',o:['DNR 代表不用任何呼吸支持','DNR 代表已同意不插管','先確認插管與呼吸支持意願','依完整治療直接插管'],a:2,x:'DNR 不等於 DNI，要分開確認。治療上限未知時，工具不給模式建議。',r:['ERSATS'],check:{data:{...base,goal:'unknown',age:84,cause:'copd',risk:'yes',spo2:87,rr:30,sbp:128,ph:7.30,co2:64,hco3:31},code:'pending'}},

{lv:'高階',q:'COPD 病人使用 HFNC 2 小時，ROX 2.6。如何解讀？',o:['低於 2.85，已達插管標準','高於 2.5，可視為成功','換算成 6 小時門檻再判讀','門檻不外推，改看血氣與作功'],a:3,x:'Roca 的驗證族群是肺炎合併呼吸衰竭。COPD 應看 pH、PaCO₂、RR 與作功趨勢，工具也不會給門檻判讀。',r:['ROCA']},
{lv:'高階',q:'肺炎 HFNC 6 小時：SpO₂ 90%、FiO₂ 70%、RR 38。最合適的解讀是？',o:['高於 2.85，用到 12 小時再評','ROX 3.38，立即重評準備升級','屬不確定區間，明早再複查','血氧已達 90%，可調降流量'],a:1,x:'(90 ÷ 0.70) ÷ 38 = 3.38，低於 6 小時門檻 3.47。2.85 是 2 小時門檻，不能跨時間套用。',r:['ROCA'],check:{rox6:{spo2:90,fio2:70,rr:38,v:3.38,risk:'高失敗'}}},
{lv:'高階',q:'高碳酸性呼吸衰竭，ATS 2026 何時才建議 HFNC 作為 NIV 的替代？',o:['pH <7.25 且不耐受 NIV','只要單位有 HFNC 就可以','輕度酸血症且能迅速升級 NIV','僅限 PaCO₂ 正常的病人'],a:2,x:'有條件建議、低確定性，例如 pH >7.25，且監測與升級都須到位。試驗中約三分之一需要升級到 NIV。',r:['ATS']},
{lv:'高階',q:'新發低血氧性呼吸衰竭的 HFNC 對 NIV，ERS 2022 與 ATS 2026 的立場是？',o:['ERS 有條件偏 HFNC，ATS 不做建議','兩者都強烈建議 HFNC','兩者都有條件偏向 NIV','ERS 偏向 NIV，ATS 偏向 HFNC'],a:0,x:'ERS 2022 有條件建議 HFNC 優於 NIV。ATS 2026 認為此比較證據有限（死亡 RR 0.84，95% CI 0.69–1.02，極低確定性），不做建議。',r:['ERSHFNC','ATS']},
{lv:'高階',q:'呼吸衰竭病人決定插管，關於預氧合何者符合 ATS 2026？',o:['NIV 一律優於 HFNC，都要換','一般面罩同樣有效','HFNC 已證實降低死亡率','HFNC 或 NIV 皆可，但別延誤插管'],a:3,x:'兩者皆強烈建議優於一般氧療。NIV 對 HFNC 的低血氧 RR 0.73 且多為間接證據，委員會未選邊；對死亡影響很小或沒有。',r:['ATS']},
{lv:'高階',q:'COPD：pH 7.18、PaCO₂ 92，意識清楚、能配合、血壓穩定。最符合 ERS/ATS 的是？',o:['pH <7.25 是禁忌，直接插管','可試 NIV，但須能立即插管','先用一般氧療觀察 4 小時','改用 HFNC 以避免 NIV 失敗'],a:1,x:'沒有 pH 下限代表不適合試 NIV，但越低越易失敗。除非正在快速惡化，否則建議先試。ATS 2026 也認為嚴重酸血症仍以 NIV 為首選。',r:['ERSATS','ATS'],check:{data:{...base,age:74,cause:'copd',risk:'yes',work:'severe',spo2:88,rr:34,sbp:142,ph:7.18,co2:92,hco3:33},code:'niv',tone:'amber'}},
{lv:'高階',q:'72 歲、BMI 33、插管 9 天，計畫性拔管後目前平穩。ATS 2026 較支持？',o:['預防性面罩 NIV，可穿插 HFNC','一般氧療，等惡化再上 NIV','一律 HFNC，避免使用 NIV','預防性支持沒有任何證據'],a:0,x:'屬高風險（≥65 歲、BMI ≥30、插管 ≥7 天），建議面罩 NIV。此建議不適用已發生的拔管後衰竭：ERS/ATS 2017 建議該情況不用 NIV，以免延誤再插管。',r:['ATS','ERSATS']},
{lv:'高階',q:'FLORALI（HFNC／一般氧療／NIV）的結果，哪個解讀正確？',o:['HFNC 顯著降低 28 天插管率','NIV 組的插管率最低','三組 90 天死亡風險沒有差別','主要終點未顯著，死亡差異屬次要'],a:3,x:'插管率 38%／47%／50%（P=0.18）。90 天死亡為次要結果：一般氧療對 HFNC HR 2.01，NIV 對 HFNC HR 2.50。族群為無高碳酸血症者。',r:['FRAT']},
{lv:'高階',q:'肥胖低通氣或神經肌肉疾病合併高碳酸血症，下列何者較合理？',o:['比照 COPD，HFNC 為首選','一律先上 CPAP','機轉難快速逆轉，需專科評估','SpO₂ 目標改回 94–98%'],a:2,x:'ATS 2026：機轉不能快速逆轉時，HFNC 這類策略可能較無效，且這些族群在證據中代表性不足。BTS 目標為 88–92%。工具將此歸為特殊病因。',r:['ATS','BTS'],check:{data:{...base,age:55,cause:'other',risk:'yes',spo2:90,rr:28,sbp:130,ph:7.30,co2:62,hco3:30},code:'special',target:[88,92]}},
{lv:'高階',q:'RECOVERY-RS（COVID-19 低血氧）的結果，哪個解讀正確？',o:['CPAP 與 HFNO 都顯著優於一般氧療','CPAP 終點較佳，但不良事件較多','CPAP 的不良事件比一般氧療少','結果可外推到所有低血氧病人'],a:1,x:'插管或死亡：CPAP 36.3% 對 44.4%（P=.03）；HFNO 44.3% 對 45.1%（P=.83）。不良事件 CPAP 34.2%、HFNO 20.6%、一般氧療 13.9%。試驗提前結束且有交叉，對象限 COVID-19。',r:['PERKINS']}
];

const MAP={
 center:['急性呼吸衰竭','先判斷','再選支持'],
 dx:[
  {t:'第一關：急救警訊',s:'任一陽性，停止常規選擇',l:['呼吸停止、瀕停或喘息樣呼吸','無法保護氣道、嚴重誤吸風險','嚴重或持續惡化的意識障礙','呼吸肌疲乏、呼吸漸弱','適當氧療後仍嚴重低氧','休克、循環不穩、危險心律不整（收縮壓 <90 mmHg）']},
  {t:'血氣分型',s:'pH 要和 PaCO₂ 一起看',l:['pH ≤7.35 + PaCO₂ >45：呼吸性酸中毒','PaCO₂ 高、pH ≥7.35 或 HCO₃⁻ >28：多為慢性','pH 低、PaCO₂ 低：代謝性，不是 NIV 適應症','數值對不上：核對是否同次動脈檢體']},
  {t:'氧合目標與指標',s:'目標先定，再給氧',l:['一般急性病人 94–98%','高碳酸風險 88–92%','有風險但 PaCO₂ 正常：調回 94–98%，除非曾因高碳酸衰竭用過 NIV／插管，或平日 SpO₂ <94%','P/F = PaO₂ ÷ FiO₂ 小數；不能單憑它診斷 ARDS','ROX =（SpO₂ ÷ FiO₂ 小數）÷ RR；限 HFNC 肺炎族群']},
  {t:'病因',s:'不同病因，不同路徑',l:['COPD 惡化','肺炎／新發低血氧','心因性肺水腫（排除休克、急性冠心症）','特殊：氣喘、神經肌肉、肥胖低通氣、上呼吸道阻塞','氣喘：ERS/ATS 2017 未做建議']},
  {t:'環境與治療上限',s:'能不能安全地做',l:['有無密切監測與迅速升級能力','面罩限制：嘔吐、無法清痰、面部損傷、未處理氣胸','DNR 不等於 DNI','DNI：type 2 爭取存活、type 3 緩解症狀']}
 ],
 tx:[
  {t:'一般氧療',s:'無低血氧不常規給氧',l:['無風險：鼻導管 2–6 L/min 或面罩 5–10 L/min','無風險且 SpO₂ <85%：儲氣袋面罩 15 L/min','有風險：24% Venturi 2–3 L/min、28% 4 L/min 或鼻導管 1–2 L/min','有風險者加氧後 30–60 分鐘複查血氣']},
  {t:'HFNC',s:'低血氧首選；高碳酸有條件',l:['新發低血氧：強烈建議優於一般氧療（ATS 2026）','對 NIV：ATS 2026 不做建議；ERS 2022 有條件偏 HFNC','高碳酸：輕度酸血症且能迅速升級 NIV 才考慮','高碳酸流量約 30–40 L/min，證據有限','ROX ≥4.88 風險較低；<2.85／3.47／3.85（2／6／12 小時）預測失敗']},
  {t:'CPAP',s:'肺水腫的明確情境',l:['心因性肺水腫：與雙水平同為強烈建議','技術較簡單、較易同步','新發低血氧：有條件建議（ATS 2026）','COPD 高碳酸：現行少用，ATS 2026 不做建議']},
  {t:'雙水平 NIV',s:'呼吸性酸中毒首選',l:['COPD pH ≤7.35：強烈建議（死亡 RR 0.63、插管 RR 0.41）','高碳酸未酸血症：建議不用','沒有 pH 下限，但越低越易失敗','肺水腫合併高碳酸酸血症時偏向雙水平','主要風險之一是延誤插管']},
  {t:'複評與升級',s:'惡化不等時間',l:['15–30 分鐘：介面、血氧、作功','30–60 分鐘：依病況複查血氣','COPD：1–4 小時內應見 pH 或 RR 改善','未改善：查漏氣、同步、設定，及早評估升級','疲乏或新警訊：立即急救評估']},
  {t:'插管前後',s:'工具未涵蓋的相關情境',l:['預氧合：HFNC 或面罩 NIV 優於一般氧療；不可延誤插管','拔管後高風險：預防性 NIV，可穿插 HFNC','拔管後低風險：HFNC 為可接受選擇','已發生拔管後衰竭：ERS/ATS 2017 建議不用 NIV']}
 ]
};

const TEACH={CASES,QUIZ,MAP,SOURCES};
root.TEACH=TEACH;if(typeof module!=='undefined')module.exports=TEACH;
})(typeof window!=='undefined'?window:globalThis);
