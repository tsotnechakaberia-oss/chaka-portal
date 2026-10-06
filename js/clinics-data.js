'use strict';
/* ==========================================================
   clinics-data.js — საქართველოს სამედიცინო დაწესებულებების სასტარტო სია.
   ⚠ კოორდინატები მიახლოებითია (უბნის/ქალაქის დონე), სია სრული არ არის.
   რეგიონული რეფერალური ჰოსპიტალების სახელები: gepha.com/en/referral-hospitals;
   ამერიკული სამედიცინო ცენტრები, CITO, Inter Clinic, MediClub: gov.uk (British Embassy list).
   ახალი კლინიკის დასამატებლად — უბრალოდ ჩაამატეთ ობიექტი ამ მასივში.
   type: public | private | university | municipal
   ========================================================== */
window.Vita = window.Vita || {};

Vita.CLINIC_TYPES = {
  public:     { name: 'სახელმწიფო',   color: 'var(--sky)' },
  private:    { name: 'კერძო',        color: 'var(--violet)' },
  university: { name: 'საუნივერსიტეტო', color: 'var(--mint)' },
  municipal:  { name: 'რეგიონული / რეფერალური', color: 'var(--amber)' },
};

Vita.CLINICS = [
  /* ---------- თბილისი ---------- */
  { id: 'amc-tbilisi', name: 'ამერიკული სამედიცინო ცენტრები — თბილისი', nameEn: 'American Medical Centers Tbilisi', type: 'private', city: 'თბილისი', region: 'თბილისი', address: 'დ. არაყიშვილის ქ. 11', lat: 41.7185, lon: 44.7700, profiles: ['მრავალპროფილური', 'დიაგნოსტიკა', 'ბავშვთა'] },
  { id: 'cito', name: 'CITO სამედიცინო ცენტრი', nameEn: 'CITO Medical Center', type: 'private', city: 'თბილისი', region: 'თბილისი', address: 'ზ. ფალიაშვილის ქ. 40', lat: 41.7105, lon: 44.7830, profiles: ['თერაპია', 'დიაგნოსტიკა'] },
  { id: 'inter-clinic', name: 'ინტერ კლინიკა', nameEn: 'Inter Clinic', type: 'private', city: 'თბილისი', region: 'თბილისი', address: 'ბაზალეთის ქ. 7', lat: 41.7085, lon: 44.7765, profiles: ['თერაპია', 'დიაგნოსტიკა'] },
  { id: 'mediclub', name: 'მედიკლუბ ჯორჯია', nameEn: 'MediClub Georgia', type: 'private', city: 'თბილისი', region: 'თბილისი', address: 'ტაშკენტის ქ. 22ა', lat: 41.7230, lon: 44.7590, profiles: ['მრავალპროფილური'] },
  { id: 'caucasus-mc', name: 'კავკასიის სამედიცინო ცენტრი', nameEn: 'Caucasus Medical Centre', type: 'private', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7265, lon: 44.7510, profiles: ['მრავალპროფილური'] },
  { id: 'tbilisi-referral', name: 'თბილისის რეფერალური ჰოსპიტალი', nameEn: 'Tbilisi Referral Hospital', type: 'municipal', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7300, lon: 44.7650, profiles: ['მრავალპროფილური'] },
  { id: 'iashvili', name: 'იაშვილის სახ. ბავშვთა ცენტრალური საავადმყოფო', nameEn: 'Iashvili Paediatric Tertiary Referral Hospital', type: 'municipal', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7340, lon: 44.7440, profiles: ['ბავშვთა'] },
  { id: 'new-children', name: 'ბავშვთა ახალი რეფერალური საავადმყოფო', nameEn: "Children's New Referral Hospital", type: 'municipal', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7380, lon: 44.8010, profiles: ['ბავშვთა'] },
  { id: 'caraps', name: 'კარაპსის სპეციალიზებული რეფერალური ჰოსპიტალი', nameEn: 'Caraps Specialty Referral Hospital', type: 'municipal', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7010, lon: 44.8100, profiles: ['მრავალპროფილური'] },
  { id: 'ghudushauri', name: 'აკად. ო. ღუდუშაურის სახ. ეროვნული სამედიცინო ცენტრი', nameEn: 'Ghudushauri National Medical Center', type: 'private', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7470, lon: 44.7230, profiles: ['მრავალპროფილური'] },
  { id: 'mardaleishvili', name: 'მარდალეიშვილის სამედიცინო ცენტრი', nameEn: 'Mardaleishvili Medical Center', type: 'private', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7210, lon: 44.8000, profiles: ['მრავალპროფილური'] },
  { id: 'kipshidze', name: 'კიფშიძის სახ. ცენტრალური საუნივერსიტეტო კლინიკა', nameEn: 'Kipshidze Central University Clinic', type: 'university', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7190, lon: 44.7890, profiles: ['მრავალპროფილური'] },
  { id: 'tsmu-first', name: 'თსსუ პირველი საუნივერსიტეტო კლინიკა', nameEn: 'TSMU First University Clinic', type: 'university', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7110, lon: 44.7540, profiles: ['მრავალპროფილური'] },
  { id: 'aversi', name: 'ავერსის კლინიკა', nameEn: 'Aversi Clinic', type: 'private', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7160, lon: 44.7620, profiles: ['თერაპია', 'დიაგნოსტიკა', 'ლაბორატორია'] },
  { id: 'new-hospitals', name: 'ახალი საავადმყოფო', nameEn: 'New Hospitals', type: 'private', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7250, lon: 44.7440, profiles: ['მრავალპროფილური'] },
  { id: 'ncdc', name: 'ლ. საყვარელიძის სახ. ეროვნული ცენტრი სნეულებათა კონტროლისა და საზოგადოებრივი ჯანმრთელობისათვის', nameEn: 'NCDC', type: 'public', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7255, lon: 44.7700, profiles: ['ინფექციური', 'ლაბორატორია'] },
  { id: 'infectious-center', name: 'ინფექციური პათოლოგიის, შიდსისა და კლინიკური იმუნოლოგიის სამეცნიერო-პრაქტიკული ცენტრი', nameEn: 'Infectious Diseases, AIDS & Clinical Immunology Research Center', type: 'public', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7060, lon: 44.7850, profiles: ['ინფექციური'] },
  { id: 'asatiani', name: 'ასათიანის სახ. ფსიქიატრიული საავადმყოფო', nameEn: 'Asatiani Psychiatric Hospital', type: 'public', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7000, lon: 44.8250, profiles: ['ფსიქიატრია'] },
  { id: 'oncology-center', name: 'ონკოლოგიის ეროვნული ცენტრი', nameEn: 'National Oncology Center', type: 'public', city: 'თბილისი', region: 'თბილისი', address: '', lat: 41.7450, lon: 44.8020, profiles: ['ონკოლოგია'] },

  /* ---------- აჭარა ---------- */
  { id: 'amc-batumi', name: 'ამერიკული სამედიცინო ცენტრები — ბათუმი', nameEn: 'American Medical Centers Batumi', type: 'private', city: 'ბათუმი', region: 'აჭარა', address: 'ზ. გორგილაძის ქ. 114', lat: 41.6450, lon: 41.6360, profiles: ['მრავალპროფილური', 'დიაგნოსტიკა'] },
  { id: 'batumi-regional', name: 'ბათუმის რეგიონული რეფერალური ჰოსპიტალი', nameEn: 'Batumi Regional Referral Hospital', type: 'municipal', city: 'ბათუმი', region: 'აჭარა', address: '', lat: 41.6400, lon: 41.6300, profiles: ['მრავალპროფილური', 'სასწრაფო'] },
  { id: 'batumi-children', name: 'ბათუმის ბავშვთა რეგიონული რეფერალური ჰოსპიტალი', nameEn: 'Batumi Paediatric Regional Referral Hospital', type: 'municipal', city: 'ბათუმი', region: 'აჭარა', address: '', lat: 41.6480, lon: 41.6420, profiles: ['ბავშვთა'] },
  { id: 'kobuleti', name: 'ქობულეთის რეფერალური ჰოსპიტალი', nameEn: 'Kobuleti Referral Hospital', type: 'municipal', city: 'ქობულეთი', region: 'აჭარა', address: '', lat: 41.8210, lon: 41.7770, profiles: ['მრავალპროფილური'] },

  /* ---------- იმერეთი ---------- */
  { id: 'kutaisi-regional', name: 'ქუთაისის რეგიონული რეფერალური ჰოსპიტალი', nameEn: 'Kutaisi Regional Referral Hospital', type: 'municipal', city: 'ქუთაისი', region: 'იმერეთი', address: '', lat: 42.2680, lon: 42.7060, profiles: ['მრავალპროფილური'] },
  { id: 'kutaisi-emergency', name: 'ქუთაისის გადაუდებელი დახმარების რეფერალური ჰოსპიტალი', nameEn: 'Kutaisi Emergency Referral Hospital', type: 'municipal', city: 'ქუთაისი', region: 'იმერეთი', address: '', lat: 42.2720, lon: 42.6980, profiles: ['სასწრაფო', 'ტრავმატოლოგია'] },

  /* ---------- სამეგრელო ---------- */
  { id: 'zugdidi', name: 'ზუგდიდის რეგიონული რეფერალური ჰოსპიტალი', nameEn: 'Zugdidi Regional Referral Hospital', type: 'municipal', city: 'ზუგდიდი', region: 'სამეგრელო-ზემო სვანეთი', address: '', lat: 42.5090, lon: 41.8690, profiles: ['მრავალპროფილური'] },
  { id: 'poti', name: 'ფოთის რეფერალური ჰოსპიტალი', nameEn: 'Poti Referral Hospital', type: 'municipal', city: 'ფოთი', region: 'სამეგრელო-ზემო სვანეთი', address: '', lat: 42.1460, lon: 41.6710, profiles: ['მრავალპროფილური'] },

  /* ---------- კახეთი ---------- */
  { id: 'telavi', name: 'თელავის რეფერალური ჰოსპიტალი', nameEn: 'Telavi Referral Hospital', type: 'municipal', city: 'თელავი', region: 'კახეთი', address: '', lat: 41.9190, lon: 45.4730, profiles: ['მრავალპროფილური'] },

  /* ---------- სამცხე-ჯავახეთი ---------- */
  { id: 'akhaltsikhe', name: 'ახალციხის რეფერალური ჰოსპიტალი', nameEn: 'Akhaltsikhe Referral Hospital', type: 'municipal', city: 'ახალციხე', region: 'სამცხე-ჯავახეთი', address: '', lat: 41.6390, lon: 42.9820, profiles: ['მრავალპროფილური'] },
  { id: 'akhalkalaki', name: 'ახალქალაქის რეფერალური ჰოსპიტალი', nameEn: 'Akhalkalaki Referral Hospital', type: 'municipal', city: 'ახალქალაქი', region: 'სამცხე-ჯავახეთი', address: '', lat: 41.4050, lon: 43.4870, profiles: ['მრავალპროფილური'] },

  /* ---------- შიდა ქართლი ---------- */
  { id: 'khashuri', name: 'ხაშურის რეფერალური ჰოსპიტალი', nameEn: 'Khashuri Referral Hospital', type: 'municipal', city: 'ხაშური', region: 'შიდა ქართლი', address: '', lat: 41.9940, lon: 43.5990, profiles: ['მრავალპროფილური'] },
];
