(() => {
  const C = SITE_CONFIG, $ = (s, r = document) => r.querySelector(s), esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- Данные -> разметка ---------- */
  const root = document.documentElement.style;
  Object.entries(C.brand.colors).forEach(([k, v]) => root.setProperty("--" + k.replace(/[A-Z]/g, m => "-" + m.toLowerCase()), v));
  document.title = `${C.brand.name} — ${C.brand.tagline}`;
  document.querySelectorAll("[data-brand]").forEach(el => el.textContent = C.brand[el.dataset.brand]);
  $("#about-text").innerHTML = C.brand.about.map(p => `<p>${esc(p)}</p>`).join("");
  $("#services-list").innerHTML = C.services.map(s => `<article class="card"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><p class="price">${esc(s.price)}</p></article>`).join("");
  const ICONS = { chat: "M4 5h16v11H9l-5 4z", check: "M5 12.5l4.5 4.5L19 7.5", heart: "M12 20c-5-3.4-8-6.4-8-10a4.2 4.2 0 0 1 8-1.6A4.2 4.2 0 0 1 20 10c0 3.6-3 6.6-8 10z", spark: "M12 3l2.2 6.3L20.5 12l-6.3 2.7L12 21l-2.2-6.3L3.5 12l6.3-2.7z" };
  $("#advantages-list").innerHTML = C.advantages.map(a => `<li class="adv-card tone-${esc(a.tone)}"><span class="adv-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[a.icon] || ICONS.spark}"/></svg></span><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></li>`).join("");
  $("#gallery-list").innerHTML = C.gallery.map(g => `<figure class="work" style="aspect-ratio:${g.ratio}">${
    g.src ? `<img src="${esc(g.src)}" alt="${esc(g.alt)}" loading="lazy">` : `<span class="work-empty" role="img" aria-label="Место для фото: ${esc(g.kind)}"></span>`}<figcaption>${esc(g.kind)}</figcaption></figure>`).join("");
  $("#reviews-list").innerHTML = C.reviews.map(r => `<blockquote class="card"><div class="stars" role="img" aria-label="Оценка: ${r.rating} из 5">${[1,2,3,4,5].map(i => `<span class="${i <= r.rating ? "on" : ""}" aria-hidden="true">★</span>`).join("")}</div><p>${esc(r.text)}</p><footer>${esc(r.name)}</footer></blockquote>`).join("");
  $("#contacts-list").innerHTML = `
    <div><h3>Адрес</h3><p>${esc(C.contacts.address)}</p></div>
    <div><h3>Телефон</h3><p><a href="tel:${esc(C.contacts.phone.replace(/[^+\d]/g, ""))}">${esc(C.contacts.phone)}</a></p></div>
    <div><h3>Часы работы</h3>${C.contacts.hours.map(h => `<p>${esc(h[0])}: ${esc(h[1])}</p>`).join("")}</div>
    <div><h3>Соцсети</h3><p>${C.contacts.social.map(s => `<a href="${esc(s.url)}">${esc(s.name)}</a>`).join(", ")}</p></div>`;
  const opts = [...C.services, C.comboOption];
  $("#service-options").innerHTML = opts.map(o => `<label class="check"><input type="checkbox" name="service" value="${esc(o.id)}"><span>${esc(o.title)}</span></label>`).join("");
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Мобильное меню ---------- */
  const btn = $(".menu-btn"), nav = $("#nav");
  const setMenu = open => { nav.classList.toggle("open", open); btn.setAttribute("aria-expanded", open); };
  btn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  nav.addEventListener("click", e => e.target.closest("a") && setMenu(false));
  document.addEventListener("keydown", e => e.key === "Escape" && setMenu(false));

  /* ---------- Появление блоков ---------- */
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
    items.forEach(el => io.observe(el));
  } else items.forEach(el => el.classList.add("in"));

  /* ---------- Форма записи ---------- */
  const form = $("#booking-form"), dateEl = form.date, timeEl = form.time;
  const pad = n => String(n).padStart(2, "0"), now = new Date();
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  dateEl.min = today;

  // «Маникюр и педикюр» синхронизирован с двумя основными вариантами
  const box = id => form.querySelector(`input[value="${id}"]`), combo = box("combo"), [m, p] = [box("manicure"), box("pedicure")];
  combo.addEventListener("change", () => { m.checked = p.checked = combo.checked; });
  [m, p].forEach(b => b.addEventListener("change", () => { combo.checked = m.checked && p.checked; }));

  const setErr = (name, msg) => {
    const err = $(`[data-error="${name}"]`), field = name === "service" ? $("#service-options") : form[name];
    err.textContent = msg ? "Ошибка: " + msg : "";
    err.hidden = !msg;
    field.toggleAttribute("aria-invalid", !!msg);
    return !!msg;
  };
  const rules = {
    firstName: v => !v.trim() ? "укажите имя" : "",
    lastName: v => !v.trim() ? "укажите фамилию" : "",
    phone: v => { const d = v.replace(/\D/g, ""); return !v.trim() ? "укажите телефон" : (!/^[+\d][\d\s()\-]*$/.test(v.trim()) || d.length < 10 || d.length > 15) ? "введите номер из 10–15 цифр" : ""; },
    date: v => !v ? "выберите желаемую дату" : v < today ? "дата уже прошла" : "",
    time: v => !v ? "выберите желаемое время" : (dateEl.value === today && v < `${pad(now.getHours())}:${pad(now.getMinutes())}`) ? "это время уже прошло" : ""
  };
  const validate = () => {
    let bad = false, first = null;
    for (const k in rules) if (setErr(k, rules[k](form[k].value))) { bad = true; first ??= form[k]; }
    if (setErr("service", form.querySelector("[name=service]:checked") ? "" : "выберите хотя бы одну услугу")) { bad = true; first ??= m; }
    first?.focus();
    return !bad;
  };
  form.addEventListener("submit", e => {
    e.preventDefault();
    const ok = validate(), msg = $("#form-success");
    msg.hidden = true;
    if (!ok) return;
    /* ВАЖНО: это демо. Данные никуда не отправляются.
       Для реального приёма заявок подключите серверную обработку, хранение данных
       и канал уведомлений (почта, Telegram, CRM). Здесь можно вызвать fetch к вашему API. */
    form.reset();
    msg.hidden = false; // контейнер имеет role="status": сообщение озвучивается скринридерами
    msg.focus();
  });
})();
