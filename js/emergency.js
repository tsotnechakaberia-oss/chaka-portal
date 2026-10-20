'use strict';

(() => {
  const { $, store, t, debounce } = Chaka;
  const CARD_KEY = 'emergencyCard';
  const CARD_FIELDS = { name: '#ec-name', blood: '#ec-blood', conditions: '#ec-conditions', contactName: '#ec-contact-name', contactPhone: '#ec-contact-phone' };

  const dialableNumber = (raw) => {
    const trimmed = String(raw || '').trim();
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 7) return '';
    return (trimmed.startsWith('+') ? '+' : '') + digits;
  };

  const renderCallButton = (card) => {
    const link = $('#ec-call');
    const number = dialableNumber(card.contactPhone);
    link.hidden = !number;
    if (!number) return;
    link.href = `tel:${number}`;
    link.textContent = `📞 ${card.contactName || t('დარეკვა', 'Call')} · ${card.contactPhone}`;
  };

  const initCard = () => {
    const card = store.get(CARD_KEY, {});
    Object.entries(CARD_FIELDS).forEach(([key, selector]) => {
      const field = $(selector);
      field.value = card[key] || '';
      field.addEventListener('input', debounce(() => {
        card[key] = field.value.trim();
        store.set(CARD_KEY, card);
        renderCallButton(card);
      }, 250));
    });
    renderCallButton(card);
    $('#ec-clear').addEventListener('click', () => {
      if (!window.confirm(t('წავშალო ბარათის მონაცემები?', 'Delete the card data?'))) return;
      store.set(CARD_KEY, {});
      Object.values(CARD_FIELDS).forEach((selector) => { $(selector).value = ''; });
      Object.keys(card).forEach((key) => delete card[key]);
      renderCallButton(card);
    });
  };

  const renderStatus = async () => {
    const pill = $('#offline-status');
    const state = await Chaka.pwa.status();
    let tone = 'warn';
    let message = t('ოფლაინ რეჟიმი ამ ბრაუზერში მიუწვდომელია', 'Offline mode is not available in this browser');
    if (state.ready) {
      tone = 'ok';
      message = t(`ოფლაინ მზადაა · ${state.files} ფაილი შენახულია`, `Offline ready · ${state.files} files saved`);
    } else if (state.supported) {
      message = t('ოფლაინ რეჟიმი მზადდება… გვერდი დატოვეთ ღია რამდენიმე წამით', 'Preparing offline mode… keep this page open for a few seconds');
    }
    if (!navigator.onLine) message = `📴 ${t('ინტერნეტი არ გაქვთ — ყველაფერი მუშაობს', 'You are offline — everything here still works')}`;
    pill.className = `status-pill tone-${tone}`;
    pill.textContent = message;
  };

  const renderInstall = () => {
    const button = $('#install-btn');
    const hint = $('#install-hint');
    const pwa = Chaka.pwa;
    if (pwa.isStandalone()) {
      button.hidden = true;
      hint.textContent = t('აპლიკაცია უკვე დაინსტალირებულია ✓', 'The app is already installed ✓');
    } else if (pwa.canInstall()) {
      button.hidden = false;
      hint.textContent = t('დაამატე მთავარ ეკრანზე და გახსენი ერთი შეხებით.', 'Add it to your home screen and open it with one tap.');
    } else if (pwa.isIos()) {
      button.hidden = true;
      hint.textContent = t('iPhone-ზე: დააჭირე „გაზიარებას“ და აირჩიე „Add to Home Screen“.', 'On iPhone: tap Share and choose “Add to Home Screen”.');
    } else {
      button.hidden = true;
      hint.textContent = t('ბრაუზერის მენიუში აირჩიე „დაინსტალირება“ ან „მთავარ ეკრანზე დამატება“.', 'Use the browser menu: “Install app” or “Add to Home screen”.');
    }
  };

  const init = () => {
    if (!$('#ec-form')) return;
    initCard();
    $('#install-btn').addEventListener('click', () => Chaka.pwa.promptInstall());
    Chaka.pwa.onChange(() => { renderStatus(); renderInstall(); });
    renderStatus();
    renderInstall();
    setTimeout(renderStatus, 2500);
  };

  Chaka.emergency = { init };
})();
