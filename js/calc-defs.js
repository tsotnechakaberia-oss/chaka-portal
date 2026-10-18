'use strict';

window.Vita = window.Vita || {};

(() => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const r2 = (n) => Math.round(n * 100) / 100;
  const sexOpts = [['m', 'მამრობითი'], ['f', 'მდედრობითი']];
  const rng = (v, min, max, name) => (Number.isFinite(v) && v >= min && v <= max ? null : `${name}: შეიყვანეთ მნიშვნელობა ${min}–${max} შუალედში`);
  const first = (...errs) => errs.find(Boolean);
  const pad = (n) => String(n).padStart(2, '0');
  const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const fmtDate = (d) => d.toLocaleDateString(Vita.locale(), { day: 'numeric', month: 'long', year: 'numeric' });

  const CALCS = [

    { id: 'bmi', group: 'body', title: 'სხეულის მასის ინდექსი (BMI)', icon: 'body',
      desc: 'წონისა და სიმაღლის თანაფარდობა — ზოგადი სკრინინგული ორიენტირი მოზრდილებისთვის.',
      fields: [
        { id: 'h', label: 'სიმაღლე', unit: 'სმ', type: 'number', min: 100, max: 230, value: 170 },
        { id: 'w', label: 'წონა', unit: 'კგ', type: 'number', min: 20, max: 300, step: 0.1, value: 70 },
        { id: 'age', label: 'ასაკი', unit: 'წ', type: 'number', min: 2, max: 120, value: 30 },
      ],
      formula: 'BMI = წონა (კგ) ÷ სიმაღლე² (მ²)', source: 'WHO — BMI კლასიფიკაცია მოზრდილებისთვის',
      compute({ h, w, age }) {
        const e = first(rng(h, 100, 230, 'სიმაღლე'), rng(w, 20, 300, 'წონა'), rng(age, 2, 120, 'ასაკი'));
        if (e) return { error: e };
        const m = h / 100, v = w / (m * m);
        const bands = [[16, 'მძიმე ნაკლებობა', 'bad'], [18.5, 'წონის ნაკლებობა', 'warn'], [25, 'ნორმა', 'ok'], [30, 'ჭარბი წონა', 'warn'], [35, 'სიმსუქნე I ხარისხი', 'bad'], [40, 'სიმსუქნე II ხარისხი', 'bad'], [Infinity, 'სიმსუქნე III ხარისხი', 'bad']];
        const [, label, tone] = bands.find(([lim]) => v < lim);
        return {
          value: r1(v).toFixed(1), unit: 'კგ/მ²', label, tone,
          scale: { min: 12, max: 42, pos: v, bands: [[18.5, 'var(--sky)'], [25, 'var(--mint)'], [30, 'var(--amber)'], [42, 'var(--coral)']] },
          lines: [['ნორმალური წონა თქვენი სიმაღლისთვის', `${r1(18.5 * m * m)}–${r1(24.9 * m * m)} კგ`]],
          note: age < 18 ? '⚠ 18 წლამდე ასაკში BMI ფასდება ასაკისა და სქესის პერცენტილებით — მოზრდილთა კატეგორიები არ გამოდგება. მიმართეთ პედიატრს.' : 'BMI არ ითვალისწინებს კუნთოვან მასას, ასაკს და ცხიმის განაწილებას.',
        };
      } },

    { id: 'bmr', group: 'energy', title: 'კალორიები და ძირითადი ცვლა (BMR)', icon: 'flame',
      desc: 'დღიური ენერგიის საჭიროება ასაკის, სქესის და აქტივობის მიხედვით.',
      fields: [
        { id: 'sex', label: 'სქესი', type: 'select', options: sexOpts, value: 'f' },
        { id: 'age', label: 'ასაკი', unit: 'წ', type: 'number', min: 15, max: 100, value: 30 },
        { id: 'h', label: 'სიმაღლე', unit: 'სმ', type: 'number', min: 120, max: 230, value: 170 },
        { id: 'w', label: 'წონა', unit: 'კგ', type: 'number', min: 30, max: 300, step: 0.1, value: 70 },
        { id: 'act', label: 'აქტივობა', type: 'select', value: '1.375', options: [['1.2', 'მჯდომარე (ოფისი, ვარჯიში თითქმის არა)'], ['1.375', 'მსუბუქი (ვარჯიში 1–3 დღე/კვ.)'], ['1.55', 'ზომიერი (3–5 დღე/კვ.)'], ['1.725', 'მაღალი (6–7 დღე/კვ.)'], ['1.9', 'ძალიან მაღალი (მძიმე ფიზ. შრომა/2 ვარჯიში)']] },
      ],
      formula: 'BMR = 10·წონა + 6.25·სიმაღლე − 5·ასაკი + (5 მამაკაცი | −161 ქალი); დღიური ნორმა = BMR × აქტივობის კოეფიციენტი', source: 'Mifflin–St Jeor (1990), Am J Clin Nutr',
      compute({ sex, age, h, w, act }) {
        const e = first(rng(age, 15, 100, 'ასაკი'), rng(h, 120, 230, 'სიმაღლე'), rng(w, 30, 300, 'წონა'));
        if (e) return { error: e };
        const bmr = 10 * w + 6.25 * h - 5 * age + (sex === 'm' ? 5 : -161), tdee = bmr * Number(act);
        return {
          value: Math.round(tdee).toLocaleString('en-US'), unit: 'კკალ/დღე', label: 'წონის შესანარჩუნებლად', tone: 'info',
          lines: [['ძირითადი ცვლა (BMR)', `${Math.round(bmr)} კკალ`], ['წონის შემცირება (~−15%)', `${Math.max(Math.round(tdee * 0.85), 0)} კკალ`], ['წონის მომატება (~+10%)', `${Math.round(tdee * 1.1)} კკალ`]],
          note: 'შედეგი მიახლოებითია (±10%). ძალიან დაბალკალორიული დიეტა ექიმის კონტროლს საჭიროებს.',
        };
      } },

    { id: 'ibw', group: 'body', title: 'ჯანსაღი წონის დიაპაზონი', icon: 'body',
      desc: 'ჯანსაღი წონა სიმაღლის მიხედვით (BMI-ზე დაფუძნებული) და Devine-ის ფორმულა.',
      fields: [
        { id: 'sex', label: 'სქესი', type: 'select', options: sexOpts, value: 'f' },
        { id: 'h', label: 'სიმაღლე', unit: 'სმ', type: 'number', min: 140, max: 230, value: 170 },
      ],
      formula: 'დიაპაზონი = 18.5…24.9 × სიმაღლე²; Devine: 50 (ქ: 45.5) + 2.3 × (დუიმი 60-ზე ზემოთ)', source: 'WHO BMI ზღვრები; Devine (1974)',
      compute({ sex, h }) {
        const e = rng(h, 140, 230, 'სიმაღლე'); if (e) return { error: e };
        const m = h / 100, inch = h / 2.54, dev = (sex === 'm' ? 50 : 45.5) + 2.3 * (inch - 60);
        return { value: `${r1(18.5 * m * m)}–${r1(24.9 * m * m)}`, unit: 'კგ', label: 'ჯანსაღი დიაპაზონი', tone: 'ok', lines: [['Devine-ის ფორმულა', `${r1(dev)} კგ`]], note: 'ეს ორიენტირია და არა მიზანი — კუნთოვანი მასა, ასაკი და აგებულება განსხვავებულ შედეგს ამართლებს.' };
      } },

    { id: 'whtr', group: 'body', title: 'ტალიის ინდექსები (WHtR / WHR)', icon: 'body',
      desc: 'მუცლისმიერი ცხიმის რისკის შეფასება — ხშირად BMI-ზე ინფორმატიულია.',
      fields: [
        { id: 'sex', label: 'სქესი', type: 'select', options: sexOpts, value: 'f' },
        { id: 'h', label: 'სიმაღლე', unit: 'სმ', type: 'number', min: 100, max: 230, value: 170 },
        { id: 'waist', label: 'ტალიის გარშემოწერილობა', unit: 'სმ', type: 'number', min: 40, max: 250, step: 0.5, value: 80 },
        { id: 'hip', label: 'თეძოს გარშემოწერილობა (არასავალდებულო)', unit: 'სმ', type: 'number', min: 0, max: 250, step: 0.5, value: 0, optional: true },
      ],
      formula: 'WHtR = ტალია ÷ სიმაღლე; WHR = ტალია ÷ თეძო', source: 'NICE (WHtR: 0.5 ზღვარი); WHO 2008 (WHR: >0.90 მამაკაცი, >0.85 ქალი)',
      compute({ sex, h, waist, hip }) {
        const e = first(rng(h, 100, 230, 'სიმაღლე'), rng(waist, 40, 250, 'ტალია')); if (e) return { error: e };
        const v = waist / h, [label, tone] = v < 0.4 ? ['ძალიან დაბალი', 'info'] : v < 0.5 ? ['ჯანსაღი', 'ok'] : v < 0.6 ? ['გაზრდილი რისკი', 'warn'] : ['მაღალი რისკი', 'bad'];
        const lines = [];
        if (hip > 0) { const whr = waist / hip, lim = sex === 'm' ? 0.9 : 0.85; lines.push(['WHR', `${r2(whr)} — ${whr > lim ? 'ზღვარს აღემატება' : 'ნორმის ფარგლებში'} (ზღვარი ${lim})`]); }
        return { value: r2(v).toFixed(2), unit: 'WHtR', label, tone, scale: { min: 0.3, max: 0.7, pos: v, bands: [[0.4, 'var(--sky)'], [0.5, 'var(--mint)'], [0.6, 'var(--amber)'], [0.7, 'var(--coral)']] }, lines, note: 'მიზანი: ტალია სიმაღლის ნახევარზე ნაკლები (WHtR < 0.5).' };
      } },

    { id: 'bodyfat', group: 'body', title: 'სხეულის ცხიმი (US Navy)', icon: 'body',
      desc: 'ცხიმის მიახლოებითი პროცენტი სამი-ოთხი გაზომვიდან.',
      fields: [
        { id: 'sex', label: 'სქესი', type: 'select', options: sexOpts, value: 'f' },
        { id: 'h', label: 'სიმაღლე', unit: 'სმ', type: 'number', min: 120, max: 230, value: 170 },
        { id: 'neck', label: 'კისრის გარშემოწერილობა', unit: 'სმ', type: 'number', min: 20, max: 70, step: 0.5, value: 33 },
        { id: 'waist', label: 'ტალია (ჭიპის დონეზე)', unit: 'სმ', type: 'number', min: 40, max: 200, step: 0.5, value: 80 },
        { id: 'hip', label: 'თეძო (მხოლოდ ქალებისთვის)', unit: 'სმ', type: 'number', min: 50, max: 220, step: 0.5, value: 98 },
      ],
      formula: 'მამაკაცი: 495 / (1.0324 − 0.19077·log₁₀(ტალია−კისერი) + 0.15456·log₁₀(სიმაღლე)) − 450; ქალი: 495 / (1.29579 − 0.35004·log₁₀(ტალია+თეძო−კისერი) + 0.22100·log₁₀(სიმაღლე)) − 450', source: 'Hodgdon & Beckett (US Navy, 1984)',
      compute({ sex, h, neck, waist, hip }) {
        const e = first(rng(h, 120, 230, 'სიმაღლე'), rng(neck, 20, 70, 'კისერი'), rng(waist, 40, 200, 'ტალია'), sex === 'f' ? rng(hip, 50, 220, 'თეძო') : null);
        if (e) return { error: e };
        const d = sex === 'm' ? waist - neck : waist + hip - neck;
        if (d <= 0) return { error: 'ტალია უნდა აღემატებოდეს კისრის გარშემოწერილობას' };
        const bf = sex === 'm' ? 495 / (1.0324 - 0.19077 * Math.log10(d) + 0.15456 * Math.log10(h)) - 450 : 495 / (1.29579 - 0.35004 * Math.log10(d) + 0.221 * Math.log10(h)) - 450;
        if (!Number.isFinite(bf) || bf < 2 || bf > 60) return { error: 'გაზომვები არარეალურ შედეგს იძლევა — გადაამოწმეთ' };
        const t = sex === 'm' ? [[6, 'აუცილებელი ცხიმი'], [14, 'სპორტსმენი'], [18, 'ფიტნესი'], [25, 'საშუალო'], [Infinity, 'მომატებული']] : [[14, 'აუცილებელი ცხიმი'], [21, 'სპორტსმენი'], [25, 'ფიტნესი'], [32, 'საშუალო'], [Infinity, 'მომატებული']];
        const label = t.find(([lim]) => bf < lim)[1];
        return { value: r1(bf).toFixed(1), unit: '%', label, tone: label === 'მომატებული' ? 'warn' : 'ok', lines: [], note: 'ზუსტობა ±3–4%. DEXA-ს ან ბიოიმპედანსს ვერ ჩაანაცვლებს.' };
      } },

    { id: 'bsa', group: 'body', title: 'სხეულის ზედაპირის ფართობი (BSA)', icon: 'body',
      desc: 'კლინიკურ პრაქტიკაში გამოიყენება დოზირებისთვის (მაგ. ონკოლოგიაში).',
      fields: [
        { id: 'h', label: 'სიმაღლე', unit: 'სმ', type: 'number', min: 50, max: 230, value: 170 },
        { id: 'w', label: 'წონა', unit: 'კგ', type: 'number', min: 3, max: 300, step: 0.1, value: 70 },
      ],
      formula: 'BSA = √(სიმაღლე (სმ) × წონა (კგ) ÷ 3600)', source: 'Mosteller (1987), N Engl J Med',
      compute({ h, w }) {
        const e = first(rng(h, 50, 230, 'სიმაღლე'), rng(w, 3, 300, 'წონა')); if (e) return { error: e };
        return { value: r2(Math.sqrt((h * w) / 3600)).toFixed(2), unit: 'მ²', label: 'Mosteller', tone: 'info', lines: [], note: 'პრეპარატების დოზას მხოლოდ ექიმი ითვლის.' };
      } },

    { id: 'water', group: 'energy', title: 'წყლის დღიური ორიენტირი', icon: 'drop',
      desc: 'მიახლოებითი სითხის საჭიროება წონის, ვარჯიშისა და ამინდის მიხედვით.',
      fields: [
        { id: 'w', label: 'წონა', unit: 'კგ', type: 'number', min: 25, max: 250, step: 0.5, value: 70 },
        { id: 'min', label: 'ფიზიკური აქტივობა', unit: 'წთ/დღე', type: 'number', min: 0, max: 360, step: 5, value: 30 },
        { id: 'hot', label: 'ამინდი', type: 'select', value: '0', options: [['0', 'ჩვეულებრივი'], ['1', 'ცხელი']] },
      ],
      formula: 'სითხე ≈ 30 მლ × წონა + 350 მლ ყოველ 30 წთ აქტივობაზე (+500 მლ სიცხეში)', source: 'ზოგადი რეკომენდაცია (EFSA ≈ 2.0–2.5 ლ სითხე/დღე, მათ შორის საკვებიდან)',
      compute({ w, min, hot }) {
        const e = first(rng(w, 25, 250, 'წონა'), rng(min, 0, 360, 'აქტივობა')); if (e) return { error: e };
        const ml = w * 30 + (min / 30) * 350 + (hot === '1' ? 500 : 0);
        return { value: r1(ml / 1000).toFixed(1), unit: 'ლ', label: `≈ ${Math.round(ml / 250)} ჭიქა (250 მლ)`, tone: 'info', lines: [], note: 'გულის, თირკმლის დაავადებისას ან ექიმის მიერ სითხის შეზღუდვისას მიჰყევით ექიმის რეკომენდაციას.' };
      } },

    { id: 'hr', group: 'heart', title: 'პულსის ზონები', icon: 'heart',
      desc: 'მაქსიმალური პულსი და ვარჯიშის ინტენსივობის ზონები.',
      fields: [{ id: 'age', label: 'ასაკი', unit: 'წ', type: 'number', min: 10, max: 100, value: 30 }],
      formula: 'კლასიკური: 220 − ასაკი; Tanaka: 208 − 0.7 × ასაკი', source: 'Fox & Haskell (1970); Tanaka et al. (2001), JACC',
      compute({ age }) {
        const e = rng(age, 10, 100, 'ასაკი'); if (e) return { error: e };
        const mx = 220 - age, tk = 208 - 0.7 * age;
        const z = [['მსუბუქი', 0.5, 0.6], ['ცხიმის წვის', 0.6, 0.7], ['აერობული', 0.7, 0.8], ['ანაერობული', 0.8, 0.9], ['მაქსიმუმი', 0.9, 1]];
        return { value: String(mx), unit: 'დ/წთ', label: 'მაქსიმალური პულსი', tone: 'info', lines: [['Tanaka-ს ფორმულა', `${Math.round(tk)} დ/წთ`], ...z.map(([n, a, b]) => [n, `${Math.round(mx * a)}–${Math.round(mx * b)}`])], note: 'ინდივიდუალური მაქსიმუმი შეიძლება ±10–12 დ/წთ-ით განსხვავდებოდეს. გულის დაავადებისას ვარჯიშის ზონა ექიმთან შეათანხმეთ.' };
      } },

    { id: 'bp', group: 'heart', title: 'არტერიული წნევის კატეგორია', icon: 'heart',
      desc: 'გაზომილი წნევის კლასიფიკაცია (მოზრდილებისთვის).',
      fields: [
        { id: 'sys', label: 'სისტოლური (ზედა)', unit: 'მმ ვწყ.სვ.', type: 'number', min: 60, max: 260, value: 120 },
        { id: 'dia', label: 'დიასტოლური (ქვედა)', unit: 'მმ ვწყ.სვ.', type: 'number', min: 30, max: 160, value: 80 },
      ],
      formula: 'კატეგორია განისაზღვრება უფრო მაღალი მაჩვენებლით: ნორმა <120/<80; მომატებული 120–129/<80; I ხარისხი 130–139 ან 80–89; II ხარისხი ≥140 ან ≥90; კრიზისი >180 და/ან >120', source: 'ACC/AHA 2017 Hypertension Guideline',
      compute({ sys, dia }) {
        const e = first(rng(sys, 60, 260, 'სისტოლური'), rng(dia, 30, 160, 'დიასტოლური')); if (e) return { error: e };
        if (dia >= sys) return { error: 'სისტოლური წნევა დიასტოლურზე მაღალი უნდა იყოს' };
        let label, tone, note = 'ერთჯერადი გაზომვა დიაგნოზს არ სვამს: გაზომეთ მოსვენებულ მდგომარეობაში, განმეორებით, ორივე ხელზე.';
        if (sys > 180 || dia > 120) { label = 'ჰიპერტონიული კრიზისი'; tone = 'bad'; note = '⚠ თუ გაქვთ მკერდის ტკივილი, ქოშინი, სისუსტე, მეტყველების დარღვევა — დარეკეთ 112-ზე. სხვა შემთხვევაში განმეორებით გაზომეთ 5 წუთში და სასწრაფოდ მიმართეთ ექიმს.'; }
        else if (sys >= 140 || dia >= 90) { label = 'ჰიპერტენზია — II ხარისხი'; tone = 'bad'; }
        else if (sys >= 130 || dia >= 80) { label = 'ჰიპერტენზია — I ხარისხი'; tone = 'warn'; }
        else if (sys >= 120) { label = 'მომატებული'; tone = 'warn'; }
        else if (sys < 90 || dia < 60) { label = 'დაბალი წნევა'; tone = 'info'; note = 'დაბალი წნევა ყოველთვის პრობლემა არაა, მაგრამ თავბრუსხვევის/გონების დაკარგვისას მიმართეთ ექიმს.'; }
        else { label = 'ნორმა'; tone = 'ok'; }
        return { value: `${sys}/${dia}`, unit: 'მმ ვწყ.სვ.', label, tone, lines: [], note };
      } },

    { id: 'sleep', group: 'energy', title: 'ძილის ციკლების კალკულატორი', icon: 'brain',
      desc: 'როდის დაიძინო ან გაიღვიძო, რომ ციკლის შუაში არ გამოგაღვიძონ.',
      fields: [
        { id: 'mode', label: 'რეჟიმი', type: 'select', value: 'wake', options: [['wake', 'ვიცი გაღვიძების დრო → როდის დავწვე'], ['bed', 'ვიცი დაძინების დრო → როდის გავიღვიძო']] },
        { id: 'time', label: 'დრო', type: 'time', value: '07:00' },
      ],
      formula: 'ციკლი ≈ 90 წთ; ჩაძინება ≈ 15 წთ; ვარიანტები 4–6 ციკლი (6–9 სთ)', source: 'ძილის ციკლის საშუალო ხანგრძლივობა (≈90 წთ)',
      compute({ mode, time }) {
        if (!/^\d{2}:\d{2}$/.test(time || '')) return { error: 'მიუთითეთ დრო' };
        const [hh, mm] = time.split(':').map(Number), base = new Date(2000, 0, 1, hh, mm);
        const opts = [6, 5, 4].map((c) => ({ c, t: new Date(base.getTime() + (mode === 'wake' ? -1 : 1) * (c * 90 + 15) * 60000) }));
        return { value: hhmm(opts[1].t), unit: '', label: mode === 'wake' ? 'ოპტიმალური დაძინების დრო (5 ციკლი)' : 'ოპტიმალური გაღვიძების დრო (5 ციკლი)', tone: 'ok', lines: opts.map(({ c, t }) => [`${c} ციკლი (${c * 1.5} სთ)`, hhmm(t)]), note: 'მოზრდილებისთვის რეკომენდებულია 7–9 სთ ძილი.' };
      } },

    { id: 'edd', group: 'pregnancy', title: 'მშობიარობის სავარაუდო თარიღი', icon: 'gyn',
      desc: 'ბოლო მენსტრუაციის პირველი დღიდან — ორსულობის კვირა და ტრიმესტრი.',
      fields: [
        { id: 'lmp', label: 'ბოლო მენსტრუაციის პირველი დღე', type: 'date', value: '' },
        { id: 'cycle', label: 'ციკლის ხანგრძლივობა', unit: 'დღე', type: 'number', min: 21, max: 40, value: 28 },
      ],
      formula: 'EDD = LMP + 280 დღე + (ციკლი − 28)', source: 'Naegele-ს წესი; ACOG',
      compute({ lmp, cycle }, now = new Date()) {
        if (!lmp) return { error: 'აირჩიეთ ბოლო მენსტრუაციის თარიღი', hint: true };
        const e = rng(cycle, 21, 40, 'ციკლი'); if (e) return { error: e };
        const d0 = new Date(lmp + 'T00:00'), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const days = Math.round((today - d0) / 86400000);
        if (days < 0) return { error: 'თარიღი მომავალშია' };
        if (days > 300) return { error: 'თარიღი 300 დღეზე მეტით ადრეა' };
        const edd = new Date(d0.getTime() + (280 + (cycle - 28)) * 86400000);
        const wk = Math.floor(days / 7), tri = wk < 13 ? 'I ტრიმესტრი' : wk < 27 ? 'II ტრიმესტრი' : 'III ტრიმესტრი';
        return { value: fmtDate(edd), unit: '', label: `ახლა: ${wk} კვირა და ${days % 7} დღე · ${tri}`, tone: 'info', lines: [['დარჩენილი დღეები', `${Math.max(0, Math.round((edd - today) / 86400000))}`]], note: 'სავარაუდო თარიღია — ბავშვების მხოლოდ ~5% იბადება ზუსტად ამ დღეს. თარიღს ექიმი ექოსკოპიით აზუსტებს.' };
      } },

    { id: 'egfr', group: 'heart', title: 'თირკმლის ფილტრაცია (eGFR)', icon: 'drop',
      desc: 'კრეატინინის მიხედვით — თირკმლის ფუნქციის ორიენტირი მოზრდილებისთვის.',
      fields: [
        { id: 'sex', label: 'სქესი', type: 'select', options: sexOpts, value: 'f' },
        { id: 'age', label: 'ასაკი', unit: 'წ', type: 'number', min: 18, max: 110, value: 40 },
        { id: 'cr', label: 'შრატის კრეატინინი', unit: 'მგ/დლ', type: 'number', min: 0.2, max: 15, step: 0.01, value: 0.9 },
        { id: 'unit', label: 'ერთეული', type: 'select', value: 'mg', options: [['mg', 'მგ/დლ'], ['umol', 'მკმოლ/ლ']] },
      ],
      formula: 'eGFR = 142 × min(Scr/κ,1)^α × max(Scr/κ,1)^−1.200 × 0.9938^ასაკი × (1.012 ქალი); κ = 0.7 (ქ) | 0.9 (მ); α = −0.241 (ქ) | −0.302 (მ)', source: 'CKD-EPI 2021 (race-free), NEJM 2021',
      compute({ sex, age, cr, unit }) {
        let scr = unit === 'umol' ? cr / 88.4 : cr;
        const e = first(rng(age, 18, 110, 'ასაკი'), rng(scr, 0.2, 15, 'კრეატინინი')); if (e) return { error: e };
        const k = sex === 'f' ? 0.7 : 0.9, a = sex === 'f' ? -0.241 : -0.302;
        const v = 142 * Math.pow(Math.min(scr / k, 1), a) * Math.pow(Math.max(scr / k, 1), -1.2) * Math.pow(0.9938, age) * (sex === 'f' ? 1.012 : 1);
        const st = v >= 90 ? ['G1', 'ნორმალური ან მაღალი', 'ok'] : v >= 60 ? ['G2', 'მსუბუქად დაქვეითებული', 'ok'] : v >= 45 ? ['G3a', 'მსუბუქად-ზომიერად დაქვეითებული', 'warn'] : v >= 30 ? ['G3b', 'ზომიერად-მძიმედ დაქვეითებული', 'warn'] : v >= 15 ? ['G4', 'მძიმედ დაქვეითებული', 'bad'] : ['G5', 'თირკმლის უკმარისობა', 'bad'];
        return { value: String(Math.round(v)), unit: 'მლ/წთ/1.73მ²', label: `${st[0]} · ${st[1]}`, tone: st[2], scale: { min: 0, max: 120, pos: v, bands: [[15, 'var(--coral)'], [30, 'var(--coral)'], [60, 'var(--amber)'], [90, 'var(--mint)'], [120, 'var(--sky)']] }, lines: [], note: 'ეს არ არის დიაგნოზი: G1–G2 სტადია დაავადებად ითვლება მხოლოდ თირკმლის დაზიანების სხვა ნიშნებთან ერთად. ანალიზები ექიმთან განიხილეთ.' };
      } },
  ];

  Vita.CALCS = CALCS;
  Vita.CALC_GROUPS = [['all', 'ყველა'], ['body', 'სხეული'], ['energy', 'ენერგია და ცხოვრების წესი'], ['heart', 'გული და თირკმელი'], ['pregnancy', 'ორსულობა']];
  if (typeof module !== 'undefined') module.exports = CALCS;
})();
