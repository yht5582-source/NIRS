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

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
