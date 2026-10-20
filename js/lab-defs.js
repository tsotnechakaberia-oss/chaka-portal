'use strict';

window.Chaka = window.Chaka || {};

(() => {
  const text = (ka, en) => ({ ka, en });
  const linearUnit = (unit, factor) => ({ unit, fromUnit: (v) => v * factor, toUnit: (canon) => canon / factor });
  const canonicalUnit = (unit) => ({ unit, fromUnit: (v) => v, toUnit: (canon) => canon });

  Chaka.LAB_STATUS = {
    low: { tone: 'info', label: text('დაბალია', 'Low') },
    normal: { tone: 'ok', label: text('ნორმის ფარგლებშია', 'Within the typical range') },
    borderline: { tone: 'warn', label: text('ზღვრულია', 'Borderline') },
    high: { tone: 'bad', label: text('მომატებულია', 'High') },
    veryhigh: { tone: 'bad', label: text('მნიშვნელოვნად მომატებულია', 'Markedly high') },
  };

  Chaka.LAB_GROUPS = [
    ['blood', text('სისხლის საერთო ანალიზი', 'Complete blood count')],
    ['sugar', text('შაქარი', 'Blood sugar')],
    ['lipids', text('ლიპიდები (ქოლესტერინი)', 'Lipids (cholesterol)')],
    ['organs', text('თირკმელი, ღვიძლი, ფარისებრი ჯირკვალი', 'Kidney, liver, thyroid')],
    ['other', text('რკინა, ვიტამინი, ანთება', 'Iron, vitamin, inflammation')],
  ];

  Chaka.LABS = [
    {
      id: 'hgb', group: 'blood', abbr: 'HGB', sexSpecific: true, decimals: 1, scale: [6, 20], plausible: [2, 25], critical: [7, 20],
      name: text('ჰემოგლობინი', 'Hemoglobin'),
      units: [linearUnit('g/L', 0.1), canonicalUnit('g/dL')],
      bands: (sex) => (sex === 'f'
        ? [{ to: 12, key: 'low' }, { to: 15.5, key: 'normal' }, { to: Infinity, key: 'high' }]
        : [{ to: 13.5, key: 'low' }, { to: 17.5, key: 'normal' }, { to: Infinity, key: 'high' }]),
      about: text('ჰემოგლობინი ერითროციტებში იმყოფება და ჟანგბადს ატარებს ორგანიზმში.', 'Hemoglobin sits inside red blood cells and carries oxygen around the body.'),
      lowText: text('დაბალი ჰემოგლობინი ხშირად ანემიაზე მიუთითებს. მიზეზი შეიძლება იყოს რკინის ან B12-ის დეფიციტი, სისხლდენა, ქრონიკული დაავადება. ხშირი სიმპტომებია სისუსტე, გაფითრება, ქოშინი.', 'Low hemoglobin often points to anemia. Causes include iron or B12 deficiency, blood loss or chronic illness. Common signs are fatigue, pallor and breathlessness.'),
      highText: text('მომატებული ჰემოგლობინი შეიძლება დაკავშირებული იყოს გაუწყლოებასთან, მოწევასთან, მაღალმთიან ადგილას ცხოვრებასთან ან სისხლის დაავადებასთან.', 'High hemoglobin can be linked to dehydration, smoking, living at altitude or a blood disorder.'),
      tip: text('ანემიის მიზეზს ექიმი დამატებითი ანალიზებით (ფერიტინი, B12) განსაზღვრავს.', 'A doctor finds the cause of anemia with extra tests such as ferritin and B12.'),
    },
    {
      id: 'wbc', group: 'blood', abbr: 'WBC', decimals: 1, scale: [1, 20], plausible: [0.1, 300], critical: [2, 30],
      name: text('ლეიკოციტები', 'White blood cells'),
      units: [canonicalUnit('×10⁹/L')],
      bands: () => [{ to: 4.5, key: 'low' }, { to: 11, key: 'normal' }, { to: Infinity, key: 'high' }],
      about: text('ლეიკოციტები იმუნური სისტემის უჯრედებია და ინფექციისგან გვიცავს.', 'White blood cells are immune cells that defend the body against infection.'),
      lowText: text('დაბალი ლეიკოციტები შეიძლება გამოიწვიოს ვირუსულმა ინფექციამ, ზოგიერთმა მედიკამენტმა ან ძვლის ტვინის დაავადებამ.', 'Low counts can follow a viral infection, some medicines or a bone marrow problem.'),
      highText: text('მომატებული ლეიკოციტები ხშირად ბაქტერიულ ინფექციაზე, ანთებაზე ან სტრესზე მიუთითებს. მოწევაც ზრდის მაჩვენებელს.', 'High counts often point to a bacterial infection, inflammation or stress. Smoking can also raise the number.'),
      tip: text('ერთჯერადი გადახრა ხშირად დროებითია. ექიმი ლეიკოციტურ ფორმულასაც შეაფასებს.', 'A single deviation is often temporary. A doctor will also look at the differential count.'),
    },
    {
      id: 'plt', group: 'blood', abbr: 'PLT', decimals: 0, scale: [50, 600], plausible: [1, 2000], critical: [20, 1000],
      name: text('თრომბოციტები', 'Platelets'),
      units: [canonicalUnit('×10⁹/L')],
      bands: () => [{ to: 150, key: 'low' }, { to: 450, key: 'normal' }, { to: Infinity, key: 'high' }],
      about: text('თრომბოციტები სისხლის შედედებაში მონაწილეობს და სისხლდენის შეჩერებას უწყობს ხელს.', 'Platelets help blood clot and stop bleeding.'),
      lowText: text('დაბალი თრომბოციტები ზრდის სისხლდენისა და დაჟეჟილობის რისკს. მიზეზი შეიძლება იყოს ინფექცია, მედიკამენტი ან იმუნური პროცესი.', 'Low platelets raise the chance of bleeding and bruising. Causes include infection, medicines or an immune process.'),
      highText: text('მომატებული თრომბოციტები ხშირად ანთებისა ან რკინის დეფიციტის ფონზე ჩნდება; იშვიათად — სისხლის დაავადების გამო.', 'High platelets often appear alongside inflammation or iron deficiency, and rarely because of a blood disorder.'),
      tip: text('თუ ხშირად გიჩნდებათ დაჟეჟილობა ან სისხლდენა, ექიმს დროულად მიმართეთ.', 'If you bruise or bleed easily, see a doctor promptly.'),
    },
    {
      id: 'glu', group: 'sugar', abbr: 'GLU', decimals: 1, scale: [50, 200], plausible: [10, 1500], critical: [54, 400],
      name: text('გლუკოზა (უზმოდ)', 'Fasting glucose'),
      units: [linearUnit('mmol/L', 18.016), canonicalUnit('mg/dL')],
      bands: () => [
        { to: 70, key: 'low' },
        { to: 100, key: 'normal' },
        { to: 126, key: 'borderline', label: text('ზღვრულია (პრედიაბეტის დიაპაზონი)', 'Borderline (prediabetes range)') },
        { to: Infinity, key: 'high', label: text('მომატებულია (დიაბეტის დიაპაზონი)', 'High (diabetes range)') },
      ],
      about: text('უზმოდ გლუკოზა (მინიმუმ 8 საათი არჩევითი საკვების გარეშე) სისხლში შაქრის დონეს აჩვენებს.', 'Fasting glucose (at least 8 hours without food) shows your blood sugar level.'),
      lowText: text('დაბალი გლუკოზა იწვევს ოფლიანობას, ხელების კანკალს, შიმშილს, თავბრუსხვევას. დიაბეტის მედიკამენტების მიღებისას ეს განსაკუთრებით მნიშვნელოვანია.', 'Low glucose can cause sweating, shaky hands, hunger and dizziness. It matters most for people taking diabetes medicines.'),
      highText: text('მომატებული უზმო გლუკოზა პრედიაბეტზე ან დიაბეტზე შეიძლება მიუთითებდეს. დიაგნოზისთვის გადახრა ჩვეულებრივ განმეორებით შემოწმებას და HbA1c-ს საჭიროებს.', 'Raised fasting glucose may point to prediabetes or diabetes. A diagnosis usually needs a repeat test and HbA1c.'),
      tip: text('თუ ანალიზი უზმოდ არ იყო აღებული, შედეგის შეფასება არასწორი იქნება.', 'If the sample was not taken fasting, this assessment will not be valid.'),
    },
    {
      id: 'hba1c', group: 'sugar', abbr: 'HbA1c', decimals: 1, scale: [4, 10], plausible: [3, 20],
      name: text('გლიკირებული ჰემოგლობინი (HbA1c)', 'Glycated hemoglobin (HbA1c)'),
      units: [canonicalUnit('%'), { unit: 'mmol/mol', fromUnit: (v) => v / 10.929 + 2.15, toUnit: (canon) => (canon - 2.15) * 10.929 }],
      bands: () => [
        { to: 5.7, key: 'normal' },
        { to: 6.5, key: 'borderline', label: text('ზღვრულია (პრედიაბეტის დიაპაზონი)', 'Borderline (prediabetes range)') },
        { to: Infinity, key: 'high', label: text('მომატებულია (დიაბეტის დიაპაზონი)', 'High (diabetes range)') },
      ],
      about: text('HbA1c ბოლო 2–3 თვის საშუალო შაქრის დონეს ასახავს და უზმოდ აღება არ სჭირდება.', 'HbA1c reflects your average blood sugar over the last 2–3 months and does not need fasting.'),
      lowText: text('', ''),
      highText: text('მაღალი HbA1c მიუთითებს, რომ შაქარი ბოლო თვეებში ხშირად იყო მომატებული. დიაბეტის მქონე ადამიანებში მიზნობრივ მაჩვენებელს ექიმი ინდივიდუალურად განსაზღვრავს.', 'A high HbA1c means sugar has often been raised in recent months. For people with diabetes the target is set individually by the doctor.'),
      tip: text('ანემია და სისხლის დაკარგვა შედეგს ცვლის, ამიტომ ექიმს აცნობეთ.', 'Anemia and blood loss can change the result, so tell your doctor.'),
    },
    {
      id: 'tc', group: 'lipids', abbr: 'TC', decimals: 1, scale: [100, 300], plausible: [50, 800],
      name: text('საერთო ქოლესტერინი', 'Total cholesterol'),
      units: [linearUnit('mmol/L', 38.67), canonicalUnit('mg/dL')],
      bands: () => [
        { to: 200, key: 'normal', label: text('სასურველია', 'Desirable') },
        { to: 240, key: 'borderline', label: text('ზღვრულად მომატებულია', 'Borderline high') },
        { to: Infinity, key: 'high' },
      ],
      about: text('საერთო ქოლესტერინი ქოლესტერინის ყველა ფრაქციის ჯამია. გულ-სისხლძარღვთა რისკის შესაფასებლად LDL და HDL-საც უყურებენ.', 'Total cholesterol is the sum of all cholesterol fractions. Doctors also look at LDL and HDL to judge heart risk.'),
      lowText: text('', ''),
      highText: text('მომატებული ქოლესტერინი ზრდის გულ-სისხლძარღვთა დაავადების რისკს, განსაკუთრებით არტერიული წნევის, მოწევისა და დიაბეტის ფონზე.', 'High cholesterol raises cardiovascular risk, especially together with high blood pressure, smoking or diabetes.'),
      tip: text('კვება, მოძრაობა და წონის კონტროლი შედეგს აუმჯობესებს; მკურნალობის საჭიროებას ექიმი საერთო რისკით განსაზღვრავს.', 'Diet, activity and weight control help; the doctor decides on treatment based on overall risk.'),
    },
    {
      id: 'ldl', group: 'lipids', abbr: 'LDL', decimals: 1, scale: [40, 220], plausible: [10, 600],
      name: text('LDL ქოლესტერინი („ცუდი“)', 'LDL cholesterol (“bad”)'),
      units: [linearUnit('mmol/L', 38.67), canonicalUnit('mg/dL')],
      bands: () => [
        { to: 100, key: 'normal', label: text('ოპტიმალურია', 'Optimal') },
        { to: 160, key: 'borderline', label: text('ოპტიმალურზე მაღალია', 'Above optimal') },
        { to: Infinity, key: 'high' },
      ],
      about: text('LDL სისხლძარღვის კედელზე ლაქების წარმოქმნას უწყობს ხელს, ამიტომ მას „ცუდ“ ქოლესტერინს უწოდებენ.', 'LDL contributes to plaque in artery walls, which is why it is called “bad” cholesterol.'),
      lowText: text('', ''),
      highText: text('მომატებული LDL გულ-სისხლძარღვთა რისკს ზრდის. ვისაც გულის დაავადება ან დიაბეტი აქვს, მისთვის მიზნობრივი მაჩვენებელი უფრო დაბალია.', 'Raised LDL increases cardiovascular risk. People with heart disease or diabetes usually have a lower target.'),
      tip: text('მიზნობრივ მაჩვენებელს ექიმი თქვენი ინდივიდუალური რისკის მიხედვით განსაზღვრავს.', 'Your doctor sets your target based on your personal risk.'),
    },
    {
      id: 'hdl', group: 'lipids', abbr: 'HDL', sexSpecific: true, decimals: 1, scale: [20, 100], plausible: [5, 200],
      name: text('HDL ქოლესტერინი („კარგი“)', 'HDL cholesterol (“good”)'),
      units: [linearUnit('mmol/L', 38.67), canonicalUnit('mg/dL')],
      bands: (sex) => [{ to: sex === 'f' ? 50 : 40, key: 'low', tone: 'warn' }, { to: Infinity, key: 'normal' }],
      about: text('HDL ქოლესტერინს სისხლძარღვებიდან ღვიძლში გადააქვს, ამიტომ მაღალი HDL უფრო ხელსაყრელია.', 'HDL carries cholesterol from blood vessels back to the liver, so a higher HDL is more favorable.'),
      lowText: text('დაბალი HDL დაკავშირებულია გულ-სისხლძარღვთა რისკის მატებასთან. მას ხშირად აუარესებს მოუძრაობლობა, მოწევა, ჭარბი წონა.', 'Low HDL is linked to higher cardiovascular risk. Inactivity, smoking and excess weight often lower it.'),
      highText: text('', ''),
      tip: text('რეგულარული აქტივობა და მოწევის შეწყვეტა HDL-ს ზრდის.', 'Regular activity and quitting smoking tend to raise HDL.'),
    },
    {
      id: 'tg', group: 'lipids', abbr: 'TG', decimals: 1, scale: [30, 400], plausible: [20, 5000], critical: [0, 1000],
      name: text('ტრიგლიცერიდები', 'Triglycerides'),
      units: [linearUnit('mmol/L', 88.57), canonicalUnit('mg/dL')],
      bands: () => [
        { to: 150, key: 'normal' },
        { to: 200, key: 'borderline', label: text('ზღვრულად მომატებულია', 'Borderline high') },
        { to: 500, key: 'high' },
        { to: Infinity, key: 'veryhigh' },
      ],
      about: text('ტრიგლიცერიდები სისხლში ცხიმის ძირითადი სახეობაა; დონე კვებაზე, ალკოჰოლსა და შაქარზეა დამოკიდებული.', 'Triglycerides are the main fat in blood; levels depend on diet, alcohol and sugar intake.'),
      lowText: text('', ''),
      highText: text('მომატებული ტრიგლიცერიდები დაკავშირებულია ჭარბ წონასთან, დიაბეტთან და ალკოჰოლთან. ძალიან მაღალი მაჩვენებელი (≥ 500 მგ/დლ ანუ ≈ 5.6 მმოლ/ლ) პანკრეატიტის რისკს ზრდის.', 'High triglycerides are linked to excess weight, diabetes and alcohol. A very high level (≥ 500 mg/dL, about 5.6 mmol/L) raises the risk of pancreatitis.'),
      tip: text('ანალიზი უზმოდ (8–12 საათი) უნდა იყოს აღებული; წინა დღეს ალკოჰოლი შედეგს აუარესებს.', 'The test should be fasting (8–12 hours); alcohol the day before worsens the result.'),
    },
    {
      id: 'crea', group: 'organs', abbr: 'CREA', sexSpecific: true, decimals: 2, scale: [0.3, 2.5], plausible: [0.1, 20],
      name: text('კრეატინინი', 'Creatinine'),
      units: [linearUnit('µmol/L', 1 / 88.4), canonicalUnit('mg/dL')],
      bands: (sex) => (sex === 'f'
        ? [{ to: 0.6, key: 'low' }, { to: 1.1, key: 'normal' }, { to: Infinity, key: 'high' }]
        : [{ to: 0.7, key: 'low' }, { to: 1.3, key: 'normal' }, { to: Infinity, key: 'high' }]),
      about: text('კრეატინინი კუნთების ცვლის პროდუქტია, რომელსაც თირკმელები გამოყოფენ; თირკმელების ფუნქციის შეფასებისთვის გამოიყენება.', 'Creatinine is a muscle waste product cleared by the kidneys and is used to estimate kidney function.'),
      lowText: text('დაბალი კრეატინინი ხშირად მცირე კუნთოვანი მასის გამო ჩნდება და უმეტესად საგანგაშო არ არის.', 'Low creatinine usually reflects low muscle mass and is rarely a concern.'),
      highText: text('მომატებული კრეატინინი შეიძლება თირკმელების დაქვეითებულ ფუნქციაზე, გაუწყლოებაზე ან ინტენსიურ ვარჯიშზე მიუთითებდეს. ზუსტი შეფასებისთვის გამოთვალეთ eGFR.', 'High creatinine may suggest reduced kidney function, dehydration or intense exercise. Calculate eGFR for a better estimate.'),
      tip: text('eGFR კალკულატორი კალკულატორების გვერდზეა.', 'The eGFR calculator is on the calculators page.'),
    },
    {
      id: 'alt', group: 'organs', abbr: 'ALT', sexSpecific: true, decimals: 0, scale: [5, 150], plausible: [1, 5000],
      name: text('ALT (ალანინ-ამინოტრანსფერაზა)', 'ALT (alanine aminotransferase)'),
      units: [canonicalUnit('U/L')],
      bands: (sex) => {
        const limit = sex === 'f' ? 35 : 40;
        return [
          { to: limit, key: 'normal' },
          { to: limit * 3, key: 'borderline', label: text('ოდნავ მომატებულია', 'Mildly raised') },
          { to: Infinity, key: 'high' },
        ];
      },
      about: text('ALT ღვიძლის უჯრედებში გვხვდება; უჯრედების დაზიანებისას სისხლში მატულობს.', 'ALT is found in liver cells and rises in the blood when they are irritated or damaged.'),
      lowText: text('', ''),
      highText: text('ALT-ის მომატება შეიძლება დაკავშირებული იყოს ცხიმოვან ღვიძლთან, ალკოჰოლთან, ვირუსულ ჰეპატიტთან, მედიკამენტებთან ან მძიმე ფიზიკურ დატვირთვასთან.', 'Raised ALT can be linked to fatty liver, alcohol, viral hepatitis, medicines or heavy exercise.'),
      tip: text('ლაბორატორიებს შორის ზედა ზღვარი ოდნავ განსხვავდება; შეადარეთ ბლანკზე მითითებულ ნორმას.', 'The upper limit varies a little between labs; compare it with the range printed on your report.'),
    },
    {
      id: 'tsh', group: 'organs', abbr: 'TSH', decimals: 2, scale: [0.1, 12], plausible: [0.001, 200],
      name: text('TSH (ფარისებრი ჯირკვლის მასტიმულირებელი ჰორმონი)', 'TSH (thyroid-stimulating hormone)'),
      units: [canonicalUnit('mIU/L')],
      bands: () => [
        { to: 0.4, key: 'low' },
        { to: 4, key: 'normal' },
        { to: 10, key: 'borderline', label: text('ოდნავ მომატებულია', 'Mildly raised') },
        { to: Infinity, key: 'high' },
      ],
      about: text('TSH ჰიპოფიზიდან გამოიყოფა და ფარისებრი ჯირკვლის მუშაობას არეგულირებს.', 'TSH is released by the pituitary gland and controls how active the thyroid is.'),
      lowText: text('დაბალი TSH შეიძლება ფარისებრი ჯირკვლის გადაჭარბებულ აქტივობაზე (ჰიპერთირეოზზე) მიუთითებდეს. სიმპტომებია გულისცემის აჩქარება, წონის კლება, ნერვიულობა.', 'Low TSH may point to an overactive thyroid (hyperthyroidism): fast heartbeat, weight loss, nervousness.'),
      highText: text('მომატებული TSH ხშირად ფარისებრი ჯირკვლის დაქვეითებულ აქტივობაზე (ჰიპოთირეოზზე) მიუთითებს: დაღლილობა, სიცივის მიმართ მგრძნობელობა, წონის მატება.', 'High TSH often points to an underactive thyroid (hypothyroidism): tiredness, feeling cold, weight gain.'),
      tip: text('ორსულობისას და ხანდაზმულ ასაკში ნორმის საზღვრები განსხვავდება; ექიმი T4-საც შეამოწმებს.', 'Reference limits differ in pregnancy and older age; a doctor will usually check T4 as well.'),
    },
    {
      id: 'ferritin', group: 'other', abbr: 'FER', sexSpecific: true, decimals: 0, scale: [0, 400], plausible: [1, 10000],
      name: text('ფერიტინი', 'Ferritin'),
      units: [canonicalUnit('ng/mL')],
      bands: (sex) => [
        { to: 15, key: 'low' },
        { to: 30, key: 'borderline', label: text('რკინის მარაგი დაბალია', 'Iron stores on the low side') },
        { to: sex === 'f' ? 200 : 300, key: 'normal' },
        { to: Infinity, key: 'high' },
      ],
      about: text('ფერიტინი ორგანიზმში რკინის მარაგს ასახავს.', 'Ferritin reflects how much iron the body has in store.'),
      lowText: text('დაბალი ფერიტინი რკინის მარაგის ამოწურვაზე მიუთითებს და ხშირად ანემიამდე წინ უსწრებს. სიმპტომია დაღლილობა, თმის ცვენა.', 'Low ferritin means depleted iron stores and often comes before anemia. Signs include fatigue and hair loss.'),
      highText: text('მომატებული ფერიტინი ანთების, ღვიძლის დაავადების ან რკინის მეტობის დროსაც ჩნდება; ინტერპრეტაცია ექიმს სჭირდება.', 'Raised ferritin can also appear with inflammation, liver disease or iron overload and needs a doctor to interpret.'),
      tip: text('რკინის პრეპარატების დაწყებამდე მიზეზი ექიმთან გაარკვიეთ.', 'Find the cause with your doctor before starting iron supplements.'),
    },
    {
      id: 'vitd', group: 'other', abbr: '25-OH D', decimals: 1, scale: [0, 80], plausible: [1, 300],
      name: text('ვიტამინი D (25-OH)', 'Vitamin D (25-OH)'),
      units: [canonicalUnit('ng/mL'), linearUnit('nmol/L', 0.4006)],
      bands: () => [
        { to: 20, key: 'low', tone: 'warn', label: text('დეფიციტია', 'Deficient') },
        { to: 30, key: 'borderline', label: text('არასაკმარისია', 'Insufficient') },
        { to: 100, key: 'normal', label: text('საკმარისია', 'Sufficient') },
        { to: Infinity, key: 'high' },
      ],
      about: text('ვიტამინი D ძვლების ჯანმრთელობისთვის და იმუნიტეტისთვის მნიშვნელოვანია; ორგანიზმი მას მზის სხივებისგან იღებს.', 'Vitamin D matters for bone health and immunity; the body makes it from sunlight.'),
      lowText: text('დეფიციტი ზამთარში ძალიან გავრცელებულია. შეიძლება გამოიწვიოს ძვლების ტკივილი, კუნთების სისუსტე.', 'Deficiency is very common in winter and can cause bone pain and muscle weakness.'),
      highText: text('ძალიან მაღალი დონე ძირითადად დანამატების ჭარბი დოზით ჩნდება და კალციუმის მატებას იწვევს.', 'Very high levels usually come from excessive supplements and can raise calcium.'),
      tip: text('დოზას ექიმი განსაზღვრავს; დამოუკიდებლად დიდი დოზით მიღება არ არის რეკომენდებული.', 'The doctor sets the dose; taking large doses on your own is not advised.'),
    },
    {
      id: 'crp', group: 'other', abbr: 'CRP', decimals: 1, scale: [0, 40], plausible: [0, 500], critical: [-1, 100],
      name: text('C-რეაქტიული ცილა (CRP)', 'C-reactive protein (CRP)'),
      units: [canonicalUnit('mg/L'), linearUnit('mg/dL', 10)],
      bands: () => [
        { to: 5, key: 'normal' },
        { to: 10, key: 'borderline', label: text('ოდნავ მომატებულია', 'Mildly raised') },
        { to: Infinity, key: 'high' },
      ],
      about: text('CRP ანთების არასპეციფიკური მარკერია: ინფექციის ან ანთების დროს ღვიძლი მას სწრაფად ზრდის.', 'CRP is a non-specific marker of inflammation; the liver raises it quickly during infection or inflammation.'),
      lowText: text('', ''),
      highText: text('მომატებული CRP ანთებაზე ან ინფექციაზე მიუთითებს, მაგრამ არ გვეუბნება ზუსტ მიზეზს. ძალიან მაღალი მაჩვენებელი ხშირად ბაქტერიულ ინფექციასთანაა დაკავშირებული.', 'High CRP signals inflammation or infection but not the exact cause. Very high values are often tied to bacterial infection.'),
      tip: text('ეს ჩვეულებრივი CRP-ს ნორმებია; მაღალი მგრძნობელობის hs-CRP სხვა შკალით ფასდება.', 'These are ranges for standard CRP; high-sensitivity hs-CRP is read on a different scale.'),
    },
  ];
  Chaka.evaluateLabEntry = (entry) => {
    const lab = Chaka.LABS.find((candidate) => candidate.id === entry.labId);
    const bands = lab.bands(entry.sex);
    const band = bands.find((candidate) => entry.canon < candidate.to);
    const base = Chaka.LAB_STATUS[band.key];
    return { lab, tone: band.tone || base.tone, label: band.label || base.label };
  };
})();
