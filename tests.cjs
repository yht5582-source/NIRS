// node tests.cjs — clinical triage and calculation checks for engine.js
const R = require('./engine.js');
let pass = 0, fail = 0;
function t(name, cond) { if (cond) pass++; else { fail++; console.log('FAIL', name); } }
const base = { age: 70, danger: 'no', risk: 'no', contra: 'no', monitor: 'yes', goal: 'full', work: 'moderate', device: 'mask', precise: 'no', spo2: 90, rr: 30, sbp: 130 };
const ev = o => R.evaluate({ ...base, ...o });

// blank input / missing
t('blank → pending', R.evaluate({}).code === 'pending');
t('blank lists missing', R.evaluate({}).missing.includes('cause'));
t('unknown counts as missing', ev({ cause: 'pneumonia', contra: 'unknown' }).missing.includes('contra'));

// danger first
t('danger → urgent', ev({ cause: 'pneumonia', danger: 'yes' }).code === 'urgent');
t('SBP <90 → urgent', ev({ cause: 'pneumonia', sbp: 80 }).code === 'urgent');
t('danger overrides missing data', R.evaluate({ danger: 'yes' }).code === 'urgent');
t('out-of-range SBP is an error, not urgent', ev({ cause: 'pneumonia', sbp: 5 }).code === 'pending');

// range errors use readable names
const e = ev({ cause: 'pneumonia', spo2: 150 });
t('range error blocks', e.title === '請修正數值或單位');
t('range error Chinese label', e.errors[0].startsWith('SpO₂'));
t('FiO2 fraction rejected', ev({ cause: 'pneumonia', fio2: 0.4 }).errors.length === 1);

// respiratory vs metabolic acidosis
t('COPD acidosis → NIV', ev({ cause: 'copd', risk: 'yes', ph: 7.28, co2: 68, hco3: 31 }).code === 'niv');
t('pH <7.25 → amber', ev({ cause: 'copd', risk: 'yes', ph: 7.2, co2: 80, hco3: 30 }).tone === 'amber');
t('pH 7.35 boundary counts', ev({ cause: 'copd', risk: 'yes', ph: 7.35, co2: 50 }).code === 'niv');
const met = ev({ cause: 'simple', ph: 7.22, co2: 25, hco3: 10, work: 'mild', rr: 22, spo2: 97 });
t('metabolic acidosis not NIV', met.code !== 'niv');
t('metabolic acidosis note', met.notes.some(n => n.includes('代謝性')));
t('other cause → special', ev({ cause: 'other', ph: 7.22, co2: 25 }).code === 'special');
t('inconsistent ABG flagged', ev({ cause: 'copd', risk: 'yes', ph: 7.40, co2: 68, hco3: 20 }).notes.some(n => n.includes('不一致')));

// missing blood gas
t('COPD no ABG → bloodgas', ev({ cause: 'copd', risk: 'yes' }).code === 'bloodgas');
t('simple + distress no ABG → bloodgas', ev({ cause: 'simple' }).code === 'bloodgas');
const pn = ev({ cause: 'pneumonia', spo2: 88 });
t('pneumonia no ABG still → HFNC', pn.code === 'hfnc');
t('pneumonia no ABG asks for ABG', pn.notes.some(n => n.includes('尚無動脈血氣')));
t('edema no ABG → CPAP', ev({ cause: 'edema' }).code === 'cpap');
t('pneumonia + CO2 risk no ABG → bloodgas', ev({ cause: 'pneumonia', risk: 'yes' }).code === 'bloodgas');

// contraindications only block mask NIV/CPAP
t('COPD acidosis + contra → contra', ev({ cause: 'copd', risk: 'yes', ph: 7.28, co2: 68, contra: 'yes' }).code === 'contra');
t('edema + contra → contra', ev({ cause: 'edema', ph: 7.43, co2: 36, contra: 'yes' }).code === 'contra');
const pc = ev({ cause: 'pneumonia', ph: 7.46, co2: 32, contra: 'yes' });
t('pneumonia + contra still HFNC', pc.code === 'hfnc');
t('pneumonia + contra warns about escalation', pc.notes.some(n => n.includes('面罩 NIV 有禁忌')));
t('contra keeps ABG-consistency note', ev({ cause: 'copd', risk: 'yes', ph: 7.40, co2: 68, hco3: 20, contra: 'yes' }).notes.some(n => n.includes('不一致')));
t('oxygen path ignores contra', ev({ cause: 'simple', work: 'mild', rr: 20, spo2: 92, ph: 7.42, co2: 38, contra: 'yes' }).code === 'oxygen');

// branches
t('pneumonia on room air + distress → special, not HFNC', ev({ cause: 'pneumonia', device: 'air', ph: 7.45, co2: 33 }).code === 'special');
t('already on HFNC → review', ev({ cause: 'pneumonia', device: 'hfnc', ph: 7.45, co2: 33 }).code === 'review');
t('stable simple hypoxemia → oxygen', ev({ cause: 'simple', work: 'mild', rr: 20, spo2: 90, ph: 7.42, co2: 38 }).title === '給予／調整一般氧療');
t('hypercapnic risk target 88–92', ev({ cause: 'copd', risk: 'yes' }).target.join() === '88,92');
const riskNormal = ev({ cause: 'copd', risk: 'yes', ph: 7.40, co2: 40, hco3: 24, work: 'mild', rr: 20, spo2: 95 });
t('risk + normal PaCO2 → 94–98', riskNormal.target.join() === '94,98');
t('risk + normal PaCO2 states exceptions', riskNormal.notes.some(n => n.includes('平日 SpO₂ 就低於 94%') && n.includes('用過 NIV 或插管')));
t('risk + normal PaCO2 not Venturi advice', !riskNormal.notes.some(n => n.includes('Venturi')));
t('risk + PaCO2 45 boundary → 94–98', ev({ cause: 'copd', risk: 'yes', ph: 7.40, co2: 45, hco3: 27 }).target.join() === '94,98');
t('risk + PaCO2 46 → 88–92', ev({ cause: 'copd', risk: 'yes', ph: 7.40, co2: 46, hco3: 28 }).target.join() === '88,92');
t('no-risk + high PaCO2 → 88–92, no exception note', (r => r.target.join() === '88,92' && !r.notes.some(n => n.includes('調回'))) (ev({ cause: 'simple', ph: 7.40, co2: 50, hco3: 30, work: 'mild', rr: 20, spo2: 92 })));
t('default target 94–98', ev({ cause: 'pneumonia' }).target.join() === '94,98');
t('SpO2 <85 → amber', ev({ cause: 'pneumonia', spo2: 82, ph: 7.45, co2: 33 }).tone === 'amber');
t('no monitoring → amber', ev({ cause: 'pneumonia', monitor: 'no', ph: 7.45, co2: 33 }).notes.some(n => n.includes('缺乏密切監測')));
t('DNI note', ev({ cause: 'pneumonia', goal: 'dni', ph: 7.45, co2: 33 }).notes.some(n => n.includes('不插管')));

// P/F, ROX, FiO2 units
const close = (a, b) => Math.abs(a - b) < 0.01;
t('P/F with known FiO2', close(ev({ cause: 'pneumonia', fio2: 40, precise: 'yes', o2: 80 }).pf, 200));
t('no P/F when FiO2 unreliable', ev({ cause: 'pneumonia', fio2: 40, precise: 'no', o2: 80 }).pf === null);
t('room air auto FiO2 21', close(ev({ cause: 'simple', device: 'air', precise: '', o2: 63 }).pf, 300));
t('ROX on HFNC', close(ev({ cause: 'pneumonia', device: 'hfnc', fio2: 60, precise: 'yes', spo2: 93, rr: 32 }).rox, 4.84375));
t('no ROX off HFNC', ev({ cause: 'pneumonia', fio2: 60, precise: 'yes' }).rox === null);
t('ROX 2h high risk', R.roxRisk(2.5, 2).startsWith('高失敗'));
t('ROX 6h threshold 3.47', R.roxRisk(3.4, 6).startsWith('高失敗') && R.roxRisk(3.5, 6).startsWith('不確定'));
t('ROX 12h threshold 3.85', R.roxRisk(3.8, 12).startsWith('高失敗'));
t('ROX ≥4.88 lower risk', R.roxRisk(4.88, 2).startsWith('較低'));
t('ROX no threshold at 1 h', R.roxRisk(3, 1).startsWith('無對應'));

// teaching content: cases, quiz, map
const T = require('./teach-content.js');
const same = (a, b) => a.join() === b.join();
const roxOf = (s, f, r) => s / (f / 100) / r;
t('6 cases', T.CASES.length === 6);
t('case ids unique', new Set(T.CASES.map(c => c.id)).size === 6);
for (const c of T.CASES) {
  const r = R.evaluate(c.data), x = c.expect, n = c.id + ': ';
  t(n + 'no errors or missing', !r.errors.length && !r.missing.length);
  t(n + 'code ' + x.code, r.code === x.code);
  if (x.tone) t(n + 'tone', r.tone === x.tone);
  t(n + 'target', same(r.target, x.target));
  t(n + 'ABG consistent', !r.notes.some(s => s.includes('不一致')));
  if (x.pf) t(n + 'P/F', Math.round(r.pf) === x.pf);
  if (x.rox0) t(n + 'start ROX', close(+r.rox.toFixed(2), x.rox0));
  if (x.rox) { const v = roxOf(c.data.f_spo2, c.data.f_fio2, c.data.f_rr); t(n + 'follow ROX', close(+v.toFixed(2), x.rox)); t(n + 'ROX in steps', c.steps.some(s => s[1].includes(x.rox.toFixed(2)))); if (x.roxRisk) t(n + 'ROX risk', R.roxRisk(v, +c.data.f_time).startsWith(x.roxRisk)); }
  if (x.noteHas) t(n + 'note', r.notes.some(s => s.includes(x.noteHas)));
  if (x.unknownGoalPending) t(n + 'unknown goal pending', R.evaluate({ ...c.data, goal: 'unknown' }).code === 'pending');
  t(n + 'not worse (app would force urgent)', c.data.f_status !== 'worse');
  t(n + 'has steps, traps, refs', c.steps.length >= 3 && c.traps.length >= 2 && c.refs.every(k => T.SOURCES[k]));
  for (const k of ['ph', 'co2', 'spo2', 'rr', 'sbp']) t(n + k + ' in range', c.data[k] >= R.ranges[k][0] && c.data[k] <= R.ranges[k][1]);
}
t('20 questions', T.QUIZ.length === 20);
t('10 basic + 10 advanced', T.QUIZ.filter(q => q.lv === '基礎').length === 10 && T.QUIZ.filter(q => q.lv === '高階').length === 10);
t('answers spread A–D 5 each', [0, 1, 2, 3].every(a => T.QUIZ.filter(q => q.a === a).length === 5));
const longest = T.QUIZ.filter(q => q.o.every((o, i) => i === q.a || o.length < q.o[q.a].length)).length;
t('correct option is seldom the longest (' + longest + ')', longest <= 5);
T.QUIZ.forEach((q, i) => {
  const n = 'Q' + (i + 1) + ': ';
  t(n + '4 options', q.o.length === 4 && new Set(q.o).size === 4);
  t(n + 'explained with source', q.x.length > 0 && q.r.length > 0 && q.r.every(k => T.SOURCES[k]));
  const k = q.check; if (!k) return;
  if (k.rox6) { const v = roxOf(k.rox6.spo2, k.rox6.fio2, k.rox6.rr); t(n + 'ROX', close(+v.toFixed(2), k.rox6.v) && R.roxRisk(v, 6).startsWith(k.rox6.risk)); return; }
  const r = R.evaluate(k.data);
  if (k.code) t(n + 'code ' + k.code, r.code === k.code);
  if (k.tone) t(n + 'tone', r.tone === k.tone);
  if (k.target) t(n + 'target', same(r.target, k.target));
  if (k.rox) t(n + 'ROX', close(+r.rox.toFixed(2), k.rox));
  if (k.pf) t(n + 'P/F', close(r.pf, k.pf));
});
t('mind map both sides', T.MAP.dx.length >= 4 && T.MAP.tx.length >= 4 && [...T.MAP.dx, ...T.MAP.tx].every(b => b.t && b.l.length));

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
