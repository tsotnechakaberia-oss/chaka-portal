# ჩაკა — სამედიცინო პორტალი (CHAKA Med·Portal)

მრავალპროფილური, ინტერაქტიული სამედიცინო ვებ-პორტალი — საფინალო პროექტი.
აშენებულია **მხოლოდ HTML5, CSS3 და ვანილა JavaScript-ზე (ES6+)** — ფრეიმვორკებისა და ბიბლიოთეკების გარეშე.

> ⚠ სასწავლო პროექტია. ექიმები, პარტნიორი ბრენდები და სტატისტიკა დემოა; კლინიკების მარკერები — მიახლოებითი.
> პორტალი **არ სვამს დიაგნოზს** და არ ცვლის ექიმის კონსულტაციას. გადაუდებელ შემთხვევაში: **112**.

## გვერდები

| ფაილი | აღწერა |
|---|---|
| `index.html` | მთავარი: hero, სიმპტომების რუკა, ექიმები + ჯავშანი, ხელსაწყოები, პირველადი დახმარება, ბიბლიოთეკა, კონტაქტი |
| `clinics.html` | საქართველოს ინტერაქტიული რუკა — კლინიკები (zoom/pan, კლასტერები, ფილტრები) |
| `calculators.html` | 12 ონლაინ სამედიცინო კალკულატორი ფორმულებითა და წყაროებით |

## გაშვება

ბილდი არ სჭირდება. გახსენით `index.html` ბრაუზერში (ან `python3 -m http.server` და `http://localhost:8000`).
GitHub Pages-ზე: *Settings → Pages → Deploy from branch → main / root*.

## ფუნქციონალი

- **სიმპტომების რუკა** (SVG): ზონა → სიმპტომები → გადაუდებლობა + რეკომენდებული სპეციალისტი
- **ექიმები**: ფილტრი, ძებნა, დალაგება; ჯავშანი ფორმის ვალიდაციით, `localStorage`
- **კლინიკების რუკა**: საზღვარი Natural Earth-იდან (public domain), საკუთარი zoom/pan და კლასტერიზაცია
- **კალკულატორები**: BMI, BMR/კალორიები, ჯანსაღი წონა, WHtR/WHR, სხეულის ცხიმი (US Navy), BSA, წყალი, პულსის ზონები, წნევა (ACC/AHA), ძილის ციკლები, მშობიარობის თარიღი (Naegele), eGFR (CKD-EPI 2021)
- **პირველადი დახმარება**: CPR მეტრონომით, FAST, გაჩხირვა, სისხლდენა, დამწვრობა
- **ბიბლიოთეკა** + „მითი თუ ფაქტი“, ბნელი/ნათელი თემა, ანიმირებული SVG ლოგოები, canvas (DNA + ნაწილაკები), reduced-motion მხარდაჭერა

## სტრუქტურა

```
css/   base · layout · components · animations · pages · responsive
js/    utils · data · logos · effects · map · georgia-geo · clinics-data
       symptoms · doctors · tools · firstaid · library · contact
       calc-defs (წმინდა ფორმულები) · calculators · page-clinics · main · page
docs/  დავალება-1-პროექტის-იდეა.docx
```

## მონაცემების რედაქტირება

- ექიმები, სპეციალობები, სიმპტომები, სტატიები → `js/data.js`
  (`spec: 'team'` — პროექტის გუნდის წევრები; სპეციალობის დაზუსტებისას შეცვალეთ `spec` და დაამატეთ `bio`)
- კლინიკები → `js/clinics-data.js` (lat/lon, ტიპი, პროფილები)
- კალკულატორები → `js/calc-defs.js`

## Git workflow

`main` ← Pull Request-ები feature-branch-ებიდან (`feature/html-structure`, `feature/styles`, `feature/core-js`, `feature/clinics-map`, `feature/calculators`). Commit-ები საშინაარსოა.

## წყაროები

WHO (BMI, WHR), ACC/AHA 2017 (წნევა), CKD-EPI 2021, Mifflin–St Jeor 1990, Mosteller 1987, US Navy ცხიმის ფორმულა, Naegele-ს წესი.
რუკა: Natural Earth. რეფერალური ჰოსპიტალების სია: GePhA; ზოგი მისამართი — UK Embassy Georgia medical facilities list.
