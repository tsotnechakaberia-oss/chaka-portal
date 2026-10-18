'use strict';

(() => {
  const { $, setError, isEmail, isGePhone, formatGePhone, toast } = Vita;

  const initContact = () => {
    const form = $('#contact-form');
    const name = $('#c-name'), mail = $('#c-mail'), phone = $('#c-phone'), topic = $('#c-topic'), msg = $('#c-msg'), ok = $('#c-ok');

    const rules = {
      name:  () => setError(name, name.value.trim().length >= 2 ? '' : 'სახელი მინიმუმ 2 სიმბოლოა'),
      mail:  () => setError(mail, !mail.value.trim() ? 'შეიყვანეთ ელ-ფოსტა' : isEmail(mail.value) ? '' : 'ელ-ფოსტის ფორმატი არასწორია'),
      phone: () => setError(phone, !phone.value.trim() || isGePhone(phone.value) ? '' : 'ტელეფონის ფორმატი არასწორია — მაგ.: 5XX XX XX XX'),
      topic: () => setError(topic, topic.value ? '' : 'აირჩიეთ თემა'),
      msg:   () => setError(msg, msg.value.trim().length >= 10 ? '' : 'შეტყობინება მინიმუმ 10 სიმბოლოა'),
      ok:    () => { const good = ok.checked; document.querySelector('[data-err="c-ok"]').textContent = good ? '' : 'დასტური აუცილებელია'; return good; },
    };

    [['name', name], ['mail', mail], ['phone', phone], ['topic', topic], ['msg', msg]].forEach(([k, input]) => {
      input.addEventListener('blur', rules[k]);
      input.addEventListener('input', () => { if (input.classList.contains('invalid')) rules[k](); });
    });
    phone.addEventListener('input', () => { phone.value = formatGePhone(phone.value); });
    ok.addEventListener('change', rules.ok);
    msg.addEventListener('input', () => { $('#c-count').textContent = `${msg.value.length}/500`; });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const results = Object.values(rules).map((fn) => fn());
      if (results.includes(false)) { toast('გთხოვთ, შეავსოთ ყველა ველი სწორად', 'error'); form.querySelector('.invalid')?.focus(); return; }
      toast(`გმადლობთ, ${name.value.trim()}! შეტყობინება მიღებულია (დემო).`);
      form.reset(); $('#c-count').textContent = '0/500';
      form.querySelectorAll('.input').forEach((i) => i.classList.remove('valid', 'invalid'));
    });
  };

  const initNewsletter = () => {
    const form = $('#news-form'), mail = $('#news-mail');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!setError(mail, isEmail(mail.value) ? '' : 'შეიყვანეთ სწორი ელ-ფოსტა')) return;
      toast('გამოწერა დაემატა (დემო) ✓'); form.reset(); mail.classList.remove('valid');
    });
  };

  const initFaq = () => {
    const search = $('#faq-search'), empty = $('#faq-empty');
    const items = [...document.querySelectorAll('.faq-item')];
    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        items.forEach((other) => { if (other !== item) other.open = false; });
      });
    });
    search.addEventListener('input', Vita.debounce(() => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      items.forEach((item) => {
        const match = !q || item.textContent.toLowerCase().includes(q);
        item.hidden = !match;
        if (match) shown += 1; else item.open = false;
      });
      empty.hidden = shown > 0;
    }, 120));
  };

  Vita.contact = { init() { if ($('#contact-form')) initContact(); if ($('#news-form')) initNewsletter(); if ($('#faq-search')) initFaq(); } };
})();
