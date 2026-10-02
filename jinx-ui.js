/* Super JinX dashboard add-on
   1) Sidebar shows only: Dashboard, Users, API Keys, Templates, Bulk Actions, Settings, Support
      (+ Admins for the owner only, to create resellers).
   2) The "API Keys" page gets a small built-in section to get the 5-minute owner key
      (no new menu items, no extra buttons in the sidebar). */
(function () {
  "use strict";
  function norm(t) { return String(t || "").replace(/[\u200c\s]+/g, " ").trim().toLowerCase(); }

  /* ---------- 1) sidebar filter ---------- */
  var HIDE = [
    "نودها", "نود", "Nodes", "Node",
    "هاست‌ها", "هاست ها", "هاستها", "میزبان‌ها", "Hosts", "Host Settings",
    "هسته‌ها", "هسته", "پیکربندی هسته", "تنظیمات هسته", "Cores", "Core", "Core Settings", "Core Config",
    "گروه‌ها", "گروه ها", "گروهها", "Groups",
    "نقش‌ها", "نقش ها", "Roles", "Admin Roles",
    "آمار", "Statistics", "Stats"
  ].map(norm);
  /* "Admins" is only for the owner (to create resellers); resellers never see it */
  var ADMINS = ["مدیران", "ادمین‌ها", "ادمین ها", "Admins", "Admin"].map(norm);
  var OWNER = null, askedFor = null, busy = false;
  function whoAmI() {                      /* asks once per login token, never spams the API */
    var t = findToken();
    if (!t) { OWNER = null; askedFor = null; return; }
    if (t === askedFor || busy) return;
    busy = true;
    fetch("/api/admin", { headers: { Authorization: "Bearer " + t } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (me) {
        busy = false; askedFor = t;
        OWNER = me ? !!(me.role && me.role.is_owner) : null;   /* expired token: unknown, not "reseller" */
        schedule();
      })
      .catch(function () { busy = false; setTimeout(schedule, 30000); });
  }
  function hidden(txt) { return HIDE.indexOf(txt) > -1 || (ADMINS.indexOf(txt) > -1 && OWNER !== true); }
  function sweep() {
    whoAmI();
    var nodes = document.querySelectorAll('aside a, aside button, nav a, nav button, [data-sidebar="menu-button"], [data-sidebar="menu-sub-button"]');
    for (var i = 0; i < nodes.length; i++) {
      var item = nodes[i].closest('[data-sidebar="menu-sub-item"], [data-sidebar="menu-item"], li') || nodes[i];
      var want = hidden(norm(nodes[i].textContent)) ? "none" : "";
      if (item.dataset.jx === "1" || want) { if (item.style.display !== want) item.style.display = want; item.dataset.jx = "1"; }
    }
  }

  /* ---------- 2) owner key inside "API Keys" ---------- */
  var TITLES = ["کلیدهای api", "کلید های api", "api keys", "api key"].map(norm);
  function apiKeysHeading() {
    if (!/api[-_]?key/i.test(location.pathname + location.hash)) {
      var hs = document.querySelectorAll("main h1, main h2, h1, h2");
      for (var i = 0; i < hs.length; i++) if (TITLES.indexOf(norm(hs[i].textContent)) > -1) return hs[i];
      return null;
    }
    return document.querySelector("main h1, main h2, h1, h2") || document.querySelector("main") || null;
  }
  function findToken() {
    var jwt = /(eyJ[\w-]+\.[\w-]+\.[\w-]+)/, stores = [];
    try { stores.push(localStorage); } catch (e) {}
    try { stores.push(sessionStorage); } catch (e) {}
    for (var s = 0; s < stores.length; s++) {
      for (var i = 0; i < stores[s].length; i++) {
        var m = jwt.exec(String(stores[s].getItem(stores[s].key(i)) || ""));
        if (m) return m[1];
      }
    }
    var c = jwt.exec(document.cookie || ""); return c ? c[1] : null;
  }
  var CSS = ".jx-ok{margin:0 0 16px;padding:14px 16px;border:1px solid rgba(127,127,127,.28);border-radius:12px;background:rgba(127,127,127,.06);font:inherit;color:inherit}" +
    ".jx-ok .r{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.jx-ok .t{flex:1;min-width:180px}.jx-ok b{display:block;font-size:15px}" +
    ".jx-ok small{display:block;opacity:.7;font-size:13px;margin-top:2px;line-height:1.7}" +
    ".jx-ok a.g{cursor:pointer;font-weight:700;font-size:14px;text-decoration:underline;text-underline-offset:4px;color:inherit;white-space:nowrap}" +
    ".jx-ok code{display:inline-block;margin-top:10px;padding:6px 10px;border-radius:8px;background:rgba(127,127,127,.14);font-weight:800;letter-spacing:.03em;direction:ltr;user-select:all;cursor:pointer}" +
    ".jx-ok .f{display:none;gap:8px;margin-top:10px;flex-wrap:wrap}.jx-ok .f input{flex:1;min-width:120px;height:38px;padding:0 10px;border-radius:8px;border:1px solid rgba(127,127,127,.35);background:transparent;color:inherit;font:inherit;direction:ltr}" +
    ".jx-ok .e{color:#e5484d;font-size:13px;margin-top:8px;display:none}";
  function fa(n) { return String(n).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; }); }
  function mount() {
    var old = document.getElementById("jx-owner-key");
    if (OWNER === false) { if (old) old.remove(); return; }   /* resellers don't see the owner key */
    if (old) return;
    var h = apiKeysHeading(); if (!h) return;
    if (!document.getElementById("jx-ok-css")) { var st = document.createElement("style"); st.id = "jx-ok-css"; st.textContent = CSS; document.head.appendChild(st); }
    var box = document.createElement("section"); box.id = "jx-owner-key"; box.className = "jx-ok"; box.dir = "rtl";
    box.innerHTML = '<div class="r"><div class="t"><b>کلید ۵ دقیقه‌ای مالک</b><small>برای تغییر رمز: کلید بگیر، در صفحه‌ی ورود «دسترسی مالک» رو بزن و رمز جدید بذار.</small></div><a class="g" role="button" tabindex="0">دریافت کلید</a></div>' +
      '<div class="f"><input placeholder="username" autocomplete="off"><input type="password" placeholder="password"><a class="g" role="button" tabindex="0">تأیید</a></div>' +
      '<div class="e"></div><div class="k"></div>';
    var anchor = h.closest("header") || h.parentElement || h;
    if (anchor.parentNode) anchor.parentNode.insertBefore(box, anchor.nextSibling); else return;
    var get = box.querySelector(".r .g"), form = box.querySelector(".f"), ins = form.querySelectorAll("input"),
        ok = form.querySelector(".g"), err = box.querySelector(".e"), out = box.querySelector(".k"), timer;
    function fail(t) { err.textContent = t; err.style.display = "block"; }
    function request(body, token) {
      err.style.display = "none"; get.textContent = "…";
      var hd = { "Content-Type": "application/json" }; if (token) hd.Authorization = "Bearer " + token;
      return fetch("/jinx/key", { method: "POST", headers: hd, body: JSON.stringify(body || {}), credentials: "same-origin" })
        .then(function (r) { return r.json().then(function (j) { return [r.status, j]; }); })
        .then(function (x) {
          get.textContent = "دریافت کلید";
          if (x[0] === 200) return show(x[1]);
          if (x[0] === 401 && !body) { form.style.display = "flex"; ins[0].focus(); return; }
          fail(x[1].detail || "خطا");
        })
        .catch(function () { get.textContent = "دریافت کلید"; fail("ارتباط با سرور برقرار نشد"); });
    }
    function show(j) {
      form.style.display = "none";
      out.innerHTML = '<code title="کپی"></code> <small class="l"></small>';
      var c = out.querySelector("code"), l = out.querySelector(".l"), end = Date.now() + (j.ttl || 300) * 1000;
      c.textContent = j.key;
      c.onclick = function () { try { navigator.clipboard.writeText(j.key); l.textContent = "کپی شد"; } catch (e) {} };
      clearInterval(timer);
      timer = setInterval(function () {
        var s = Math.max(0, Math.round((end - Date.now()) / 1000));
        l.textContent = s ? "اعتبار " + fa(Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2)) : "منقضی شد، دوباره بگیر";
        if (!s) clearInterval(timer);
      }, 500);
    }
    function go() { request(null, findToken()); }
    function confirm() { request({ username: ins[0].value.trim(), password: ins[1].value }); }
    get.onclick = go; get.onkeydown = function (e) { if (e.key === "Enter") go(); };
    ok.onclick = confirm; ins[1].onkeydown = function (e) { if (e.key === "Enter") confirm(); };
  }

  /* ---------- run + keep up with page changes ---------- */
  var queued = false;
  function tick() { try { sweep(); mount(); } catch (e) { /* never break the panel */ } }
  function schedule() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; tick(); }); }
  function start() { tick(); new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
