/* 发票抬头维护管理（共享）
 * 用途：在“充值开票 / 消费开票”页的「发票抬头」区注入
 *   1) 常用抬头选择器（下拉一键带出）
 *   2) 管理抬头弹窗（新增 / 编辑 / 删除 / 设为默认）
 * 加载方式：在页面 </body> 前 <script src="../invoice-header.js"></script>
 * 仅当页面存在「发票抬头」表单区块时生效，其它页面不受影响。
 * 说明：原型态数据存于内存，刷新后复位。
 */
(function () {
  'use strict';

  // —— 原型示例数据（常用发票抬头） ——
  var HEADERS = [
    { title: '北京科技有限公司', taxId: '91110108MA01XXXX20', bank: '中国工商银行北京分行', acct: '6222021234567890123', addr: '北京市朝阳区xxx', phone: '010-12345678', def: true },
    { title: '北京智采信息技术有限公司', taxId: '91110108MA02YYYY31', bank: '招商银行北京中关村支行', acct: '6225880212345678', addr: '北京市海淀区xxx', phone: '010-87654321', def: false }
  ];

  var fields = {};      // title/taxId/bank/acct/addr/phone -> input 元素
  var picker = null;    // 常用抬头 <select>
  var editIdx = -1;     // 正在编辑的抬头下标；-1 表示新增

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var section = findHeaderSection();
    if (!section) return;                 // 非开票页，静默退出
    mapFields(section);
    injectPicker(section);
    injectModal();
    renderPicker();
  }

  // 找到 h3 文本为「发票抬头」的 form-section
  function findHeaderSection() {
    var secs = document.querySelectorAll('.form-section');
    for (var i = 0; i < secs.length; i++) {
      var h = secs[i].querySelector('.form-section-title, h3');
      if (h && h.textContent.replace(/\s/g, '') === '发票抬头') return secs[i];
    }
    return null;
  }

  // 依据 label 文案把 6 个输入框归位（不依赖顺序）
  function mapFields(section) {
    var items = section.querySelectorAll('.form-item');
    items.forEach(function (it) {
      var label = it.querySelector('.form-label');
      var input = it.querySelector('input, .input');
      if (!label || !input) return;
      var t = label.textContent;
      if (t.indexOf('抬头') > -1) fields.title = input;
      else if (t.indexOf('识别号') > -1) fields.taxId = input;
      else if (t.indexOf('开户银行') > -1) fields.bank = input;
      else if (t.indexOf('银行账号') > -1) fields.acct = input;
      else if (t.indexOf('地址') > -1) fields.addr = input;
      else if (t.indexOf('电话') > -1) fields.phone = input;
    });
  }

  // 在「发票抬头」标题下方插入选择器 + 管理按钮
  function injectPicker(section) {
    var row = document.createElement('div');
    row.className = 'form-item full-width';
    row.style.marginBottom = 'var(--spacing-lg)';
    row.innerHTML =
      '<label class="form-label">常用抬头</label>' +
      '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">' +
        '<select class="input" id="ihPicker" style="flex:1;min-width:220px;"></select>' +
        '<button type="button" class="btn btn-outline btn-sm" id="ihManageBtn">管理抬头</button>' +
      '</div>' +
      '<span class="form-hint">选择常用抬头可一键填入下方开票信息；点「管理抬头」可新增 / 编辑 / 删除。</span>';
    var title = section.querySelector('.form-section-title, h3');
    if (title && title.nextSibling) section.insertBefore(row, title.nextSibling);
    else section.insertBefore(row, section.firstChild);

    picker = row.querySelector('#ihPicker');
    picker.addEventListener('change', function () {
      if (this.value !== '') applyHeader(parseInt(this.value, 10));
    });
    row.querySelector('#ihManageBtn').addEventListener('click', openMgr);
  }

  // 选择器选项
  function renderPicker() {
    if (!picker) return;
    var html = '<option value="">— 选择常用抬头快速填入 —</option>';
    HEADERS.forEach(function (h, i) {
      html += '<option value="' + i + '">' + esc(h.title) + (h.def ? '（默认）' : '') + '</option>';
    });
    picker.innerHTML = html;
  }

  // 把某个抬头填入下方表单
  function applyHeader(i) {
    var h = HEADERS[i];
    if (!h) return;
    if (fields.title) fields.title.value = h.title;
    if (fields.taxId) fields.taxId.value = h.taxId;
    if (fields.bank) fields.bank.value = h.bank;
    if (fields.acct) fields.acct.value = h.acct;
    if (fields.addr) fields.addr.value = h.addr;
    if (fields.phone) fields.phone.value = h.phone;
    // 同步纳税人识别号位数提示
    var hint = document.getElementById('taxIdHint');
    if (hint) {
      if ((h.taxId || '').length === 18) { hint.textContent = '✓ 位数正确（18位）'; hint.style.color = 'var(--success-color)'; }
      else { hint.textContent = '统一社会信用代码为18位'; hint.style.color = ''; }
    }
  }

  // —— 管理弹窗 ——
  function injectModal() {
    var m = document.createElement('div');
    m.className = 'modal-overlay';
    m.id = 'ihModal';
    m.addEventListener('click', function (e) { if (e.target === m) closeMgr(); });
    m.innerHTML =
      '<div class="modal" style="max-width:560px;">' +
        '<div class="modal-header">' +
          '<span class="modal-title">发票抬头管理</span>' +
          '<button class="modal-close" type="button" id="ihClose">×</button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div style="display:flex;justify-content:flex-end;margin-bottom:12px;">' +
            '<button type="button" class="btn btn-sm btn-primary" id="ihAddBtn">+ 新增抬头</button>' +
          '</div>' +
          '<div id="ihList"></div>' +
          '<div id="ihForm" style="display:none;border-top:1px solid var(--border-light);margin-top:12px;padding-top:12px;"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button type="button" class="btn btn-outline" id="ihCloseFooter">关闭</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(m);
    document.getElementById('ihClose').addEventListener('click', closeMgr);
    document.getElementById('ihCloseFooter').addEventListener('click', closeMgr);
    document.getElementById('ihAddBtn').addEventListener('click', function () { showForm(-1); });
  }

  function openMgr() { renderList(); hideForm(); document.getElementById('ihModal').classList.add('active'); }
  function closeMgr() { document.getElementById('ihModal').classList.remove('active'); }

  function renderList() {
    var box = document.getElementById('ihList');
    if (!HEADERS.length) { box.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">暂无常用抬头，点右上角「新增抬头」添加。</p>'; return; }
    var html = '';
    HEADERS.forEach(function (h, i) {
      html +=
        '<div style="border:1px solid var(--border-light);border-radius:8px;padding:12px 14px;margin-bottom:10px;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
            '<strong style="font-size:14px;">' + esc(h.title) + '</strong>' +
            (h.def ? '<span class="badge badge-success">默认</span>' : '') +
          '</div>' +
          '<div style="font-size:12px;color:var(--text-muted);line-height:1.6;">税号 ' + esc(h.taxId) + '　·　' + esc(h.bank || '—') + '</div>' +
          '<div style="margin-top:8px;font-size:13px;display:flex;gap:14px;">' +
            (h.def ? '' : '<a href="javascript:void(0)" data-act="def" data-i="' + i + '">设为默认</a>') +
            '<a href="javascript:void(0)" data-act="edit" data-i="' + i + '">编辑</a>' +
            (HEADERS.length > 1 ? '<a href="javascript:void(0)" data-act="del" data-i="' + i + '" style="color:var(--danger-color);">删除</a>' : '') +
          '</div>' +
        '</div>';
    });
    box.innerHTML = html;
    box.querySelectorAll('a[data-act]').forEach(function (a) {
      a.addEventListener('click', function () {
        var i = parseInt(a.getAttribute('data-i'), 10);
        var act = a.getAttribute('data-act');
        if (act === 'def') setDefault(i);
        else if (act === 'edit') showForm(i);
        else if (act === 'del') del(i);
      });
    });
  }

  function setDefault(i) { HEADERS.forEach(function (h, j) { h.def = (j === i); }); renderList(); renderPicker(); }

  function del(i) {
    var wasDef = HEADERS[i].def;
    HEADERS.splice(i, 1);
    if (wasDef && HEADERS.length) HEADERS[0].def = true;
    renderList(); renderPicker(); hideForm();
  }

  function showForm(i) {
    editIdx = i;
    var h = (i > -1) ? HEADERS[i] : { title: '', taxId: '', bank: '', acct: '', addr: '', phone: '' };
    var box = document.getElementById('ihForm');
    box.innerHTML =
      '<div style="font-weight:600;font-size:14px;margin-bottom:10px;">' + (i > -1 ? '编辑抬头' : '新增抬头') + '</div>' +
      field('ihfTitle', '抬头名称', h.title, true) +
      field('ihfTax', '纳税人识别号', h.taxId, true) +
      field('ihfBank', '开户银行', h.bank, false) +
      field('ihfAcct', '银行账号', h.acct, false) +
      field('ihfAddr', '注册地址', h.addr, false) +
      field('ihfPhone', '注册电话', h.phone, false) +
      '<div id="ihfErr" style="color:var(--danger-color);font-size:12px;min-height:16px;"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px;">' +
        '<button type="button" class="btn btn-sm btn-outline" id="ihfCancel">取消</button>' +
        '<button type="button" class="btn btn-sm btn-primary" id="ihfSave">保存</button>' +
      '</div>';
    box.style.display = 'block';
    document.getElementById('ihfCancel').addEventListener('click', hideForm);
    document.getElementById('ihfSave').addEventListener('click', saveForm);
  }

  function field(id, label, val, req) {
    return '<div class="form-item" style="margin-bottom:10px;">' +
      '<label class="form-label" style="font-size:13px;">' + label + (req ? ' <span style="color:red;">*</span>' : '') + '</label>' +
      '<input class="input" id="' + id + '" type="text" value="' + esc(val || '') + '"/></div>';
  }

  function hideForm() { var f = document.getElementById('ihForm'); if (f) { f.style.display = 'none'; f.innerHTML = ''; } editIdx = -1; }

  function saveForm() {
    var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    var rec = { title: v('ihfTitle'), taxId: v('ihfTax'), bank: v('ihfBank'), acct: v('ihfAcct'), addr: v('ihfAddr'), phone: v('ihfPhone') };
    var err = document.getElementById('ihfErr');
    if (!rec.title) { err.textContent = '请填写抬头名称'; return; }
    if (!rec.taxId) { err.textContent = '请填写纳税人识别号'; return; }
    if (rec.taxId.length !== 18) { err.textContent = '统一社会信用代码应为 18 位，当前 ' + rec.taxId.length + ' 位'; return; }
    if (editIdx > -1) { rec.def = HEADERS[editIdx].def; HEADERS[editIdx] = rec; }
    else { rec.def = HEADERS.length === 0; HEADERS.push(rec); }
    hideForm(); renderList(); renderPicker();
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
})();
