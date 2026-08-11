(function () {
  'use strict';

  var modalId = 'inlineLoginModal';
  var styleId = 'inlineLoginModalStyle';
  var isStandalone = document.body && document.body.dataset.loginPage === 'standalone';

  function addStyle() {
    if (document.getElementById(styleId)) return;
    var style = document.createElement('style');
    style.id = styleId;
    style.textContent = '' +
      '.inline-login-mask{display:none;position:fixed;inset:0;z-index:1000;align-items:center;justify-content:center;padding:20px;background:rgba(18,39,74,.44);backdrop-filter:blur(2px)}' +
      '.inline-login-mask.show{display:flex}' +
      '.inline-login-modal{position:relative;width:min(420px,100%);padding:32px 34px 28px;background:#fff;border-radius:16px;box-shadow:0 18px 48px rgba(19,50,104,.25);color:#1e293b}' +
      '.inline-login-close{position:absolute;top:12px;right:13px;width:32px;height:32px;border:0;border-radius:7px;background:transparent;color:#8ba0be;font-size:23px;cursor:pointer}' +
      '.inline-login-close:hover{background:#f1f6ff;color:#3974df}' +
      '.inline-login-title{margin:0 0 23px;text-align:center;font-size:22px;color:#263954}' +
      '.inline-login-tabs{display:flex;border-bottom:1px solid #e5edf8;margin-bottom:19px}' +
      '.inline-login-tab{flex:1;padding:0 0 11px;border:0;border-bottom:2px solid transparent;background:none;color:#7d8da4;font-size:14px;cursor:pointer}' +
      '.inline-login-tab.active{border-color:#3f77e6;color:#3974df;font-weight:650}' +
      '.inline-login-view{display:none}.inline-login-view.active{display:block}' +
      '.inline-login-field{display:flex;flex-direction:column;gap:6px;margin-bottom:13px}' +
      '.inline-login-field label{font-size:13px;font-weight:600;color:#3b4d68}' +
      '.inline-login-field input{width:100%;height:43px;padding:0 12px;border:1px solid #d8e3f1;border-radius:8px;color:#263954;font-size:14px;outline:none}' +
      '.inline-login-field input:focus{border-color:#5d8ff0;box-shadow:0 0 0 3px #eaf1ff}' +
      '.inline-login-code-row{display:flex;gap:8px}.inline-login-code-row input{flex:1;min-width:0}' +
      '.inline-login-code{min-width:96px;border:1px solid #c8dcff;border-radius:8px;background:#eef5ff;color:#3974df;font-weight:600;cursor:pointer}' +
      '.inline-login-submit{width:100%;height:45px;margin:7px 0 14px;border:0;border-radius:8px;background:#3f77e6;color:#fff;font-size:15px;font-weight:650;cursor:pointer}' +
      '.inline-login-submit:disabled{background:#b5c1d4;cursor:not-allowed}' +
      '.inline-login-actions{display:flex;justify-content:space-between;font-size:13px}.inline-login-actions button,.inline-login-register a{padding:0;border:0;background:none;color:#3974df;font-size:13px;cursor:pointer;text-decoration:none}' +
      '.inline-login-register{margin-top:15px;padding-top:14px;border-top:1px solid #e8eef7;text-align:center;color:#7a8ba2;font-size:12px}' +
      '.inline-login-register a{font-weight:650;margin-left:4px}' +
      '.inline-login-agreement{display:flex;gap:8px;margin-top:18px;color:#657791;font-size:12px;line-height:1.55}' +
      '.inline-login-agreement input{margin-top:2px}.inline-login-agreement a{color:#3974df;text-decoration:none}' +
      '.inline-login-toast{display:none;margin:0 0 13px;padding:9px 11px;border-radius:7px;background:#fff3f2;color:#d1544e;font-size:12px;line-height:1.45}.inline-login-toast.show{display:block}' +
      '@media(max-width:480px){.inline-login-modal{padding:29px 21px 23px}}';
    document.head.appendChild(style);
  }

  function registerLink() {
    return isStandalone ? '<div class="inline-login-register">还没有账号？<a href="register-select.html">注册账号 →</a></div>' : '';
  }

  function modalHtml() {
    return '<div class="inline-login-mask" id="' + modalId + '" role="dialog" aria-modal="true" aria-labelledby="inlineLoginTitle">' +
      '<div class="inline-login-modal"><button class="inline-login-close" type="button" aria-label="关闭">×</button>' +
      '<h2 class="inline-login-title" id="inlineLoginTitle">欢迎登录</h2>' +
      '<div class="inline-login-tabs"><button class="inline-login-tab active" type="button" data-login-tab="password">账号登录</button><button class="inline-login-tab" type="button" data-login-tab="code">手机号登录</button></div>' +
      '<div class="inline-login-view active" data-login-view="password"><div class="inline-login-toast"></div><div class="inline-login-field"><label>手机号</label><input data-login-phone="password" maxlength="11" placeholder="请输入注册手机号" type="tel"></div><div class="inline-login-field"><label>登录密码</label><input data-login-password placeholder="请输入登录密码" type="password"></div><label class="inline-login-agreement"><input data-login-agreement="password" type="checkbox">我已阅读并同意<a href="#" onclick="return false;">《用户协议》</a>与<a href="#" onclick="return false;">《隐私政策》</a></label><button class="inline-login-submit" data-login-submit="password" type="button" disabled>登录</button><div class="inline-login-actions"><button type="button" data-login-switch="code">短信验证码登录</button><button type="button" data-login-forgot>忘记密码</button></div>' + registerLink() + '</div>' +
      '<div class="inline-login-view" data-login-view="code"><div class="inline-login-toast"></div><div class="inline-login-field"><label>手机号</label><input data-login-phone="code" maxlength="11" placeholder="请输入注册手机号" type="tel"></div><div class="inline-login-field"><label>短信验证码</label><div class="inline-login-code-row"><input data-login-code maxlength="6" placeholder="请输入6位验证码" type="text"><button class="inline-login-code" type="button">获取验证码</button></div></div><label class="inline-login-agreement"><input data-login-agreement="code" type="checkbox">我已阅读并同意<a href="#" onclick="return false;">《用户协议》</a>与<a href="#" onclick="return false;">《隐私政策》</a></label><button class="inline-login-submit" data-login-submit="code" type="button" disabled>登录</button><div class="inline-login-actions"><button type="button" data-login-switch="password">账号登录</button></div>' + registerLink() + '</div>' +
      '</div></div>';
  }

  function setupModal() {
    addStyle();
    if (!document.getElementById(modalId)) document.body.insertAdjacentHTML('beforeend', modalHtml());
    var mask = document.getElementById(modalId);
    var closeButton = mask.querySelector('.inline-login-close');

    function showMessage(view, message) {
      var toast = mask.querySelector('[data-login-view="' + view + '"] .inline-login-toast');
      toast.textContent = message;
      toast.classList.add('show');
    }
    function showTab(name) {
      mask.querySelectorAll('[data-login-tab]').forEach(function (item) { item.classList.toggle('active', item.dataset.loginTab === name); });
      mask.querySelectorAll('[data-login-view]').forEach(function (item) { item.classList.toggle('active', item.dataset.loginView === name); });
    }
    function close() {
      if (isStandalone) { location.href = '../index.html'; return; }
      mask.classList.remove('show');
      document.body.style.overflow = '';
    }
    function open() {
      mask.classList.add('show');
      document.body.style.overflow = 'hidden';
      window.setTimeout(function () { mask.querySelector('[data-login-phone="password"]').focus(); }, 60);
    }

    document.querySelectorAll('[data-login-modal]').forEach(function (trigger) { trigger.addEventListener('click', function (event) { event.preventDefault(); open(); }); });
    closeButton.addEventListener('click', close);
    mask.addEventListener('click', function (event) { if (event.target === mask) close(); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && mask.classList.contains('show')) close(); });
    mask.querySelectorAll('[data-login-tab],[data-login-switch]').forEach(function (button) { button.addEventListener('click', function () { showTab(button.dataset.loginTab || button.dataset.loginSwitch); }); });
    mask.querySelectorAll('[data-login-agreement]').forEach(function (checkbox) { checkbox.addEventListener('change', function () { mask.querySelector('[data-login-submit="' + checkbox.dataset.loginAgreement + '"]').disabled = !checkbox.checked; }); });
    mask.querySelector('[data-login-forgot]').addEventListener('click', function () { location.href = 'forgot-password.html'; });
    mask.querySelector('.inline-login-code').addEventListener('click', function (event) {
      var phone = mask.querySelector('[data-login-phone="code"]');
      if (!/^1\d{10}$/.test(phone.value.trim())) { showMessage('code', '请先填写11位注册手机号'); phone.focus(); return; }
      var button = event.currentTarget, seconds = 60; button.disabled = true; button.textContent = seconds + 's后重发';
      var timer = window.setInterval(function () { seconds--; button.textContent = seconds + 's后重发'; if (seconds <= 0) { window.clearInterval(timer); button.disabled = false; button.textContent = '获取验证码'; } }, 1000);
    });
    mask.querySelectorAll('[data-login-submit]').forEach(function (button) {
      button.addEventListener('click', function () {
        var mode = button.dataset.loginSubmit, phone = mask.querySelector('[data-login-phone="' + mode + '"]');
        if (!/^1\d{10}$/.test(phone.value.trim())) { showMessage(mode, '请填写11位手机号'); phone.focus(); return; }
        if (mode === 'password' && !mask.querySelector('[data-login-password]').value.trim()) { showMessage(mode, '请填写登录密码'); return; }
        if (mode === 'code' && !/^\d{6}$/.test(mask.querySelector('[data-login-code]').value.trim())) { showMessage(mode, '请填写6位短信验证码'); return; }
        button.textContent = '登录中…';
        window.setTimeout(function () { location.href = 'index.html?entry=last-identity'; }, 350);
      });
    });
    if (isStandalone) open();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupModal); else setupModal();
})();
