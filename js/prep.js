'use strict';

(() => {
  const { $, buildElement, store, toast, todayKey, t, pick } = Chaka;
  const DRAFT_KEY = 'prepDraft';
  const DURATIONS = {
    short: t('3 დღემდე', 'Up to 3 days'),
    mid: t('3–14 დღე', '3–14 days'),
    long: t('2 კვირაზე მეტი', 'More than 2 weeks'),
    month: t('თვეზე მეტი', 'More than a month'),
  };

  const GENERAL_QUESTIONS = [
    t('რა შეიძლება იყოს ჩემი სიმპტომების მიზეზი?', 'What could be causing my symptoms?'),
    t('რა გამოკვლევები მჭირდება და რისთვის?', 'Which tests do I need, and why?'),
    t('რა მკურნალობის ვარიანტები არსებობს და რა რისკებს შეიცავს თითოეული?', 'What treatment options are there and what are the risks of each?'),
    t('რა უნდა შევცვალო ყოველდღიურ ცხოვრებაში (კვება, მოძრაობა, ძილი)?', 'What should I change in daily life (food, activity, sleep)?'),
    t('რა ნიშნების დროს უნდა დაგირეკოთ ან მივმართო სასწრაფოს?', 'Which signs mean I should call you or seek emergency care?'),
    t('როდის უნდა მოვიდე განმეორებით?', 'When should I come back for a follow-up?'),
    t('ჩემი მედიკამენტები ერთმანეთს ხომ არ ეწინააღმდეგება?', 'Could any of my medicines interact with each other?'),
  ];

  const SPECIALTY_QUESTIONS = {
    cardio: [t('რა არის ჩემი წნევისა და პულსის სამიზნე მაჩვენებელი?', 'What are my target blood pressure and pulse?'), t('მჭირდება თუ არა ეკგ, ექოკარდიოგრაფია ან ხანგრძლივი მონიტორინგი?', 'Do I need an ECG, an echo or longer monitoring?'), t('რა დატვირთვაა ჩემთვის უსაფრთხო?', 'What level of exercise is safe for me?')],
    neuro: [t('საჭიროა თუ არა MRI ან CT?', 'Do I need an MRI or CT scan?'), t('რა იწვევს ტკივილის შეტევებს (ძილი, სტრესი, ეკრანი)?', 'What triggers my attacks (sleep, stress, screens)?'), t('რა ნიშნები არის საგანგაშო?', 'Which warning signs should worry me?')],
    pulmo: [t('მჭირდება თუ არა სპირომეტრია?', 'Do I need spirometry?'), t('რა იწვევს ხველას ან ქოშინს?', 'What is causing my cough or breathlessness?'), t('სწორად ვიყენებ თუ არა ინჰალატორს?', 'Am I using my inhaler correctly?')],
    peds: [t('რა ტემპერატურაზე უნდა დაგირეკოთ?', 'At what temperature should I call you?'), t('ვაქცინაციის კალენდარი დაცულია?', 'Is the vaccination schedule up to date?'), t('ზრდა-განვითარება ასაკის შესაბამისია?', 'Is growth and development on track for the age?')],
    ortho: [t('საჭიროა თუ არა რენტგენი ან MRI?', 'Do I need an X-ray or MRI?'), t('რა მოძრაობები ავირიდო და როდის შემიძლია ვარჯიში?', 'Which movements should I avoid and when can I exercise?'), t('დამეხმარება თუ არა ფიზიოთერაპია?', 'Would physiotherapy help?')],
    gyn: [t('რა სკრინინგებია ჩემი ასაკისთვის რეკომენდებული?', 'Which screenings are recommended at my age?'), t('ციკლის ცვლილება გამოკვლევას ხომ არ საჭიროებს?', 'Do my cycle changes need investigation?')],
    psych: [t('რა თერაპიული ვარიანტები არსებობს?', 'What therapy options exist?'), t('რა დროში უნდა ველოდო გაუმჯობესებას?', 'How long until I should feel better?'), t('რა გავაკეთო კრიზისულ მომენტში?', 'What should I do in a crisis?')],
    ophth: [t('რა სიხშირით უნდა გავიარო გამოკვლევა?', 'How often should I have my eyes checked?'), t('ეკრანთან მუშაობისას რა ჩვევები დამეხმარება?', 'Which habits help with screen work?')],
    dent: [t('რა მკურნალობა სჭირდება კბილს და რა ეტაპებისგან შედგება?', 'What treatment does the tooth need and in what steps?'), t('როგორ დავიცვა ღრძილები?', 'How can I protect my gums?')],
    nsurg: [t('ოპერაცია აუცილებელია თუ არსებობს ალტერნატივა?', 'Is surgery necessary or is there an alternative?'), t('როგორია გამოჯანმრთელების პერიოდი?', 'What does recovery look like?')],
  };
  SPECIALTY_QUESTIONS.trauma = SPECIALTY_QUESTIONS.ortho;

  let bookings = [];
  let lastCheck = null;
  let diaryEntries = [];
  let savedLabs = [];
  let draft = {};
  let model = null;

  const fmtDate = (iso) => new Date(`${iso}T00:00`).toLocaleDateString(Chaka.locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  const round = (value, digits = 0) => Number(value.toFixed(digits));
  const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

  const upcomingBookings = () => {
    const now = `${todayKey()} ${Chaka.pad(new Date().getHours())}:${Chaka.pad(new Date().getMinutes())}`;
    return bookings.filter((booking) => `${booking.date} ${booking.time}` >= now).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  };
  const currentBooking = () => bookings.find((booking) => booking.code === draft.booking) || null;
  const doctorOf = (booking) => (booking ? Chaka.DOCTORS.find((doctor) => doctor.id === booking.docId) : null);

  const questionSpec = () => {
    const doctor = doctorOf(currentBooking());
    return (doctor && doctor.spec) || (lastCheck && lastCheck.specialists[0]) || null;
  };
  const questionList = () => {
    const spec = questionSpec();
    return [...(SPECIALTY_QUESTIONS[spec] || []), ...GENERAL_QUESTIONS];
  };

  const diaryWindow = () => {
    const days = Number(draft.diaryDays) || 30;
    const from = new Date();
    from.setDate(from.getDate() - days);
    const fromKey = todayKey(from);
    return diaryEntries.filter((entry) => entry.date >= fromKey).sort((a, b) => a.date.localeCompare(b.date));
  };

  const diaryRows = () => {
    const entries = diaryWindow();
    const metrics = [
      { label: t('წონა', 'Weight'), unit: t('კგ', 'kg'), read: (e) => e.weight, digits: 1 },
      { label: t('სისტოლური წნევა', 'Systolic pressure'), unit: t('მმ.ვრც.სვ.', 'mmHg'), read: (e) => e.sys, digits: 0 },
      { label: t('დიასტოლური წნევა', 'Diastolic pressure'), unit: t('მმ.ვრც.სვ.', 'mmHg'), read: (e) => e.dia, digits: 0 },
      { label: t('პულსი', 'Pulse'), unit: t('დ/წთ', 'bpm'), read: (e) => e.pulse, digits: 0 },
    ];
    return metrics.map((metric) => {
      const values = entries.map(metric.read).filter((value) => value !== null && value !== undefined);
      if (!values.length) return null;
      const change = values[values.length - 1] - values[0];
      return {
        label: metric.label,
        latest: `${values[values.length - 1]} ${metric.unit}`,
        average: `${round(average(values), metric.digits)} ${metric.unit}`,
        range: `${Math.min(...values)}–${Math.max(...values)}`,
        count: values.length,
        change: values.length > 1 ? `${change > 0 ? '+' : ''}${round(change, metric.digits)}` : '—',
      };
    }).filter(Boolean);
  };

  const buildModel = () => {
    const booking = currentBooking();
    const doctor = doctorOf(booking);
    const offSymptoms = new Set(draft.symptomsOff || []);
    const offLabs = new Set(draft.labsOff || []);
    const questions = questionList();
    const chosenQuestions = questions.filter((_, index) => (draft.questionsOn || []).includes(index));
    const custom = String(draft.customQuestions || '').split('\n').map((line) => line.trim()).filter(Boolean);
    return {
      date: todayKey(),
      patient: String(draft.name || '').trim(),
      doctor: doctor ? `${doctor.name} · ${Chaka.SPECS[doctor.spec].name}` : '',
      visit: booking ? `${fmtDate(booking.date)}, ${booking.time}` : '',
      complaint: String(draft.complaint || '').trim(),
      duration: DURATIONS[draft.duration] || '',
      symptoms: lastCheck ? lastCheck.symptoms.filter((symptom) => !offSymptoms.has(symptom.id)).map((symptom) => symptom.name) : [],
      diaryDays: Number(draft.diaryDays) || 30,
      measurements: draft.useDiary === false ? [] : diaryRows(),
      labs: savedLabs.filter((entry) => !offLabs.has(entry.labId)).map((entry) => {
        const result = Chaka.evaluateLabEntry(entry);
        return { name: pick(result.lab.name), value: `${round(entry.value, 3)} ${entry.unitLabel}`, status: pick(result.label), date: entry.date };
      }),
      medicines: String(draft.medicines || '').trim(),
      allergies: String(draft.allergies || '').trim(),
      questions: [...chosenQuestions, ...custom],
    };
  };

  const toText = (m) => {
    const lines = [];
    const section = (title, body) => { lines.push('', title.toUpperCase()); lines.push(...body); };
    lines.push(t('ვიზიტისთვის მომზადების ფურცელი', 'Visit preparation sheet'), `${t('თარიღი', 'Date')}: ${fmtDate(m.date)}`);
    if (m.patient) lines.push(`${t('პაციენტი', 'Patient')}: ${m.patient}`);
    if (m.doctor) lines.push(`${t('ექიმი', 'Doctor')}: ${m.doctor}`);
    if (m.visit) lines.push(`${t('ვიზიტი', 'Appointment')}: ${m.visit}`);
    if (m.complaint || m.duration) section(t('ძირითადი საჩივარი', 'Main concern'), [m.complaint, m.duration ? `${t('ხანგრძლივობა', 'Duration')}: ${m.duration}` : ''].filter(Boolean));
    if (m.symptoms.length) section(t('სიმპტომები', 'Symptoms'), m.symptoms.map((s) => `- ${s}`));
    if (m.measurements.length) section(`${t('გაზომვები', 'Measurements')} (${t('ბოლო', 'last')} ${m.diaryDays} ${t('დღე', 'days')})`, m.measurements.map((r) => `- ${r.label}: ${t('ბოლო', 'latest')} ${r.latest}; ${t('საშუალო', 'average')} ${r.average}; ${t('დიაპაზონი', 'range')} ${r.range}; ${t('ცვლილება', 'change')} ${r.change}; n=${r.count}`));
    if (m.labs.length) section(t('ანალიზები', 'Lab results'), m.labs.map((l) => `- ${l.name}: ${l.value} (${l.status}, ${l.date})`));
    if (m.medicines) section(t('მედიკამენტები და დანამატები', 'Medicines and supplements'), [m.medicines]);
    if (m.allergies) section(t('ალერგიები', 'Allergies'), [m.allergies]);
    if (m.questions.length) section(t('შეკითხვები ექიმს', 'Questions for the doctor'), m.questions.map((q) => `[ ] ${q}`));
    lines.push('', t('შეადგინა პაციენტმა ჩაკა MED·PORTAL-ში. ინფორმაცია დიაგნოზს არ წარმოადგენს.', 'Prepared by the patient in Chaka MED·PORTAL. This is not a diagnosis.'));
    return lines.join('\n');
  };

  const sectionEl = (title, ...content) => buildElement('section', { class: 'sheet-section' }, buildElement('h3', { text: title }), ...content);
  const listEl = (items) => buildElement('ul', {}, items.map((item) => buildElement('li', { text: item })));
  const metaRow = (label, value) => (value ? buildElement('div', {}, buildElement('dt', { text: label }), buildElement('dd', { text: value })) : null);

  const renderSheet = () => {
    model = buildModel();
    const m = model;
    const measurementsTable = m.measurements.length
      ? buildElement('table', { class: 'sheet-table' },
        buildElement('thead', {}, buildElement('tr', {}, ...[t('მაჩვენებელი', 'Measure'), t('ბოლო', 'Latest'), t('საშუალო', 'Average'), t('დიაპაზონი', 'Range'), t('ცვლილება', 'Change')].map((h) => buildElement('th', { text: h })))),
        buildElement('tbody', {}, m.measurements.map((r) => buildElement('tr', {}, ...[r.label, r.latest, r.average, r.range, r.change].map((cell) => buildElement('td', { text: cell }))))))
      : null;
    const labsTable = m.labs.length
      ? buildElement('table', { class: 'sheet-table' },
        buildElement('tbody', {}, m.labs.map((l) => buildElement('tr', {}, buildElement('td', { text: l.name }), buildElement('td', { text: l.value }), buildElement('td', { text: l.status }), buildElement('td', { text: l.date })))))
      : null;

    $('#prep-sheet').replaceChildren(...[
      buildElement('header', { class: 'sheet-head' },
        buildElement('div', {}, buildElement('p', { class: 'mono sheet-brand', text: 'ჩაკა MED·PORTAL' }), buildElement('h2', { text: t('ვიზიტისთვის მომზადების ფურცელი', 'Visit preparation sheet') })),
        buildElement('p', { class: 'mono', text: fmtDate(m.date) })),
      buildElement('dl', { class: 'sheet-meta' }, metaRow(t('პაციენტი', 'Patient'), m.patient), metaRow(t('ექიმი', 'Doctor'), m.doctor), metaRow(t('ვიზიტი', 'Appointment'), m.visit)),
      (m.complaint || m.duration) ? sectionEl(t('ძირითადი საჩივარი', 'Main concern'), m.complaint ? buildElement('p', { text: m.complaint }) : null, m.duration ? buildElement('p', { class: 'sheet-muted', text: `${t('ხანგრძლივობა', 'Duration')}: ${m.duration}` }) : null) : null,
      m.symptoms.length ? sectionEl(t('სიმპტომები', 'Symptoms'), listEl(m.symptoms)) : null,
      m.measurements.length ? sectionEl(`${t('გაზომვები', 'Measurements')} · ${t('ბოლო', 'last')} ${m.diaryDays} ${t('დღე', 'days')}`, measurementsTable) : null,
      m.labs.length ? sectionEl(t('ანალიზები', 'Lab results'), labsTable) : null,
      m.medicines ? sectionEl(t('მედიკამენტები და დანამატები', 'Medicines and supplements'), buildElement('p', { text: m.medicines })) : null,
      m.allergies ? sectionEl(t('ალერგიები', 'Allergies'), buildElement('p', { text: m.allergies })) : null,
      m.questions.length ? sectionEl(t('შეკითხვები ექიმს', 'Questions for the doctor'), buildElement('ul', { class: 'sheet-checks' }, m.questions.map((q) => buildElement('li', { text: q })))) : null,
      !m.complaint && !m.symptoms.length && !m.measurements.length && !m.labs.length && !m.questions.length
        ? buildElement('p', { class: 'empty-note', text: t('შეავსეთ ფორმა — ფურცელი აქ ავტომატურად გამოჩნდება.', 'Fill in the form and the sheet will appear here automatically.') }) : null,
      buildElement('p', { class: 'sheet-foot', text: t('შეადგინა პაციენტმა. ინფორმაცია დიაგნოზს არ წარმოადგენს და ექიმის კონსულტაციას არ ცვლის.', 'Prepared by the patient. This is not a diagnosis and does not replace a doctor’s consultation.') }),
    ].filter(Boolean));
  };

  const checkItem = (name, value, label, checked, onChange) => {
    const input = buildElement('input', { type: 'checkbox', name, value, checked: checked ? true : null, onChange });
    return buildElement('label', { class: 'check-item' }, input, buildElement('span', { text: label }));
  };

  const saveDraft = () => { store.set(DRAFT_KEY, draft); renderSheet(); };

  const toggleInList = (key, id, enabled, inverted) => {
    const set = new Set(draft[key] || []);
    if (inverted ? enabled : !enabled) set.delete(id); else set.add(id);
    draft[key] = [...set];
    saveDraft();
  };

  const renderChecklists = () => {
    const symptomBox = $('#prep-symptoms');
    if (lastCheck && lastCheck.symptoms.length) {
      const off = new Set(draft.symptomsOff || []);
      symptomBox.replaceChildren(
        buildElement('p', { class: 'note', text: `${t('სიმპტომების შემოწმებიდან', 'From your symptom check')} · ${fmtDate(lastCheck.date)}` }),
        ...lastCheck.symptoms.map((symptom) => checkItem('sym', symptom.id, symptom.name, !off.has(symptom.id), (e) => toggleInList('symptomsOff', symptom.id, e.target.checked, false))));
    } else {
      symptomBox.replaceChildren(buildElement('p', { class: 'empty-note' }, t('ჯერ სიმპტომები არ გაქვთ არჩეული. ', 'No symptoms selected yet. '), buildElement('a', { href: 'index.html#symptoms', text: t('გახსენი სიმპტომების რუკა →', 'Open the symptom map →') })));
    }

    const labBox = $('#prep-labs');
    if (savedLabs.length) {
      const off = new Set(draft.labsOff || []);
      labBox.replaceChildren(...savedLabs.map((entry) => checkItem('lab', entry.labId, `${pick(Chaka.LABS.find((lab) => lab.id === entry.labId).name)} — ${round(entry.value, 3)} ${entry.unitLabel}`, !off.has(entry.labId), (e) => toggleInList('labsOff', entry.labId, e.target.checked, false))));
    } else {
      labBox.replaceChildren(buildElement('p', { class: 'empty-note' }, t('შენახული ანალიზი ჯერ არ გაქვთ. ', 'No saved lab results yet. '), buildElement('a', { href: 'labs.html', text: t('ანალიზის ახსნა →', 'Explain a lab result →') })));
    }

    const diaryToggle = $('#prep-diary');
    const hasDiary = diaryEntries.length > 0;
    diaryToggle.disabled = !hasDiary;
    diaryToggle.checked = hasDiary && draft.useDiary !== false;
    $('#prep-diary-note').textContent = hasDiary ? '' : t('დღიურში ჩანაწერი ჯერ არ არის.', 'The diary has no entries yet.');

    const chosen = new Set(draft.questionsOn || []);
    $('#prep-questions').replaceChildren(...questionList().map((question, index) => checkItem('q', String(index), question, chosen.has(index), (e) => {
      const set = new Set(draft.questionsOn || []);
      if (e.target.checked) set.add(index); else set.delete(index);
      draft.questionsOn = [...set];
      saveDraft();
    })));
  };

  const renderBookingSelect = () => {
    const select = $('#prep-booking');
    const upcoming = upcomingBookings();
    const options = [buildElement('option', { value: '', text: t('ჯავშნის გარეშე', 'No appointment') }),
      ...upcoming.map((booking) => {
        const doctor = doctorOf(booking);
        return buildElement('option', { value: booking.code, text: `${doctor ? doctor.name : t('ექიმი', 'Doctor')} · ${fmtDate(booking.date)}, ${booking.time}` });
      })];
    select.replaceChildren(...options);
    select.value = upcoming.some((booking) => booking.code === draft.booking) ? draft.booking : '';
    if (!select.value) draft.booking = '';
  };

  const bindField = (id, key, after) => {
    const field = $(id);
    field.value = draft[key] || '';
    field.addEventListener('input', () => { draft[key] = field.value; saveDraft(); if (after) after(); });
  };

  const download = (filename, content) => {
    const url = URL.createObjectURL(new Blob([`\ufeff${content}`], { type: 'text/plain;charset=utf-8' }));
    const link = buildElement('a', { href: url, download: filename });
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const clearAll = () => {
    if (!window.confirm(t('გავასუფთავო ფორმა?', 'Clear the form?'))) return;
    draft = {};
    store.set(DRAFT_KEY, draft);
    init(true);
    toast(t('ფორმა გასუფთავდა', 'Form cleared'));
  };

  const copyText = async () => {
    try { await navigator.clipboard.writeText(toText(model)); toast(t('ტექსტი დაკოპირდა', 'Text copied')); }
    catch { toast(t('კოპირება ვერ მოხერხდა', 'Could not copy'), 'error'); }
  };

  const init = (isReset = false) => {
    if (!$('#prep-form')) return;
    bookings = store.get('bookings', []);
    lastCheck = store.get('lastCheck', null);
    diaryEntries = store.get('diary', []);
    savedLabs = store.get('labs', []);
    draft = isReset ? draft : store.get(DRAFT_KEY, {});

    const requested = new URLSearchParams(location.search).get('booking');
    if (!isReset && requested && bookings.some((booking) => booking.code === requested)) draft.booking = requested;
    if (!draft.questionsOn) draft.questionsOn = [];
    if (!draft.duration && lastCheck) draft.duration = lastCheck.duration;

    renderBookingSelect();
    const booking = currentBooking();
    if (booking && !draft.name) draft.name = booking.patient;

    bindField('#prep-name', 'name');
    bindField('#prep-complaint', 'complaint');
    bindField('#prep-medicines', 'medicines');
    bindField('#prep-allergies', 'allergies');
    bindField('#prep-custom', 'customQuestions');
    $('#prep-duration').value = draft.duration || '';
    $('#prep-days').value = String(draft.diaryDays || 30);
    renderChecklists();
    renderSheet();

    if (isReset) return;
    $('#prep-booking').addEventListener('change', (e) => {
      draft.booking = e.target.value;
      const chosen = currentBooking();
      if (chosen && !draft.name) { draft.name = chosen.patient; $('#prep-name').value = chosen.patient; }
      draft.questionsOn = [];
      renderChecklists(); saveDraft();
    });
    $('#prep-duration').addEventListener('change', (e) => { draft.duration = e.target.value; saveDraft(); });
    $('#prep-days').addEventListener('change', (e) => { draft.diaryDays = Number(e.target.value); saveDraft(); });
    $('#prep-diary').addEventListener('change', (e) => { draft.useDiary = e.target.checked; saveDraft(); });
    $('#prep-print').addEventListener('click', () => window.print());
    $('#prep-download').addEventListener('click', () => download(`vizitis-momzadeba-${todayKey()}.txt`, toText(model)));
    $('#prep-copy').addEventListener('click', copyText);
    $('#prep-clear').addEventListener('click', clearAll);
  };

  Chaka.prep = { init: () => init(false) };
})();
