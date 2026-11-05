/*
 * 智能体分类字段（2026-11-04 智能体首页等交互调整）
 * 专区（多选）/ 适用群体（多选）/ 采购阶段（多选）/ 功能类型（多选），
 * 以及「应用类型 → 来源标识」规则。开发者端、运营端、用户端共用同一份选项。
 *
 * 用法：
 *   <div data-cy-taxonomy="edit" data-values='{"zones":["gov"],"roles":[],"stages":[],"funcs":[]}' data-pending="1"></div>
 *   <div data-cy-taxonomy="view" data-values='...'></div>   // 渲染为 4 个 .info-item，替换占位元素
 *   <select data-cy-apptype>…</select><span data-cy-source></span>  // 选择应用类型后自动显示来源
 */
(function () {
  var T = {
    zones: [
      { v: 'gov', t: '政府采购专区' },
      { v: 'soe', t: '国企采购专区' }
    ],
    roles: [
      { v: 'buyer', t: '采购人' },
      { v: 'agency', t: '代理机构' },
      { v: 'regulator', t: '监管机构' },
      { v: 'supplier', t: '供应商' }
    ],
    stages: [
      { v: 'pre', t: '采购前', d: '需求调查、采购文件准备' },
      { v: 'mid', t: '采购中', d: '投标响应、评审与风险核查' },
      { v: 'post', t: '采购后', d: '质疑处理、合同与履约管理' }
    ],
    funcs: [
      { v: 'gen', t: '生成内容' },
      { v: 'check', t: '检查核验' },
      { v: 'query', t: '查询信息' },
      { v: 'consult', t: '分析咨询' }
    ],
    // 应用类型 → 来源标识：平台托管 = 平台官方，其余 = 生态伙伴
    appTypes: [
      { v: 'hosted', t: '平台托管', src: 'official' },
      { v: 'protocol', t: '协议接入', src: 'partner' },
      { v: 'redirect', t: '外部跳转', src: 'partner' }
    ],
    sources: { official: '平台官方', partner: '生态伙伴' }
  };

  var FIELDS = [
    { key: 'zones', label: '专区', hint: '可多选，决定智能体出现在哪个专区' },
    { key: 'roles', label: '适用群体', hint: '可多选' },
    { key: 'stages', label: '采购阶段', hint: '可多选，跨阶段通用的工具可全选' },
    { key: 'funcs', label: '功能类型', hint: '可多选，对应智能体广场「我今天要做…」' }
  ];

  T.label = function (key, v) {
    var o = (T[key] || []).filter(function (x) { return x.v === v; })[0];
    return o ? o.t : v;
  };
  T.sourceOfAppType = function (v) {
    var o = T.appTypes.filter(function (x) { return x.v === v; })[0];
    return o ? o.src : '';
  };

  var CSS = '' +
    '.cy-tax{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px 24px;}' +
    '.cy-tax-item{display:flex;flex-direction:column;gap:8px;}' +
    '.cy-tax-item.wide{grid-column:1/-1;}' +
    '.cy-tax-label{font-size:14px;font-weight:500;color:var(--text-primary,#1e293b);display:flex;align-items:center;gap:8px;}' +
    '.cy-tax-label .req{color:red;}' +
    '.cy-tax-hint{font-size:12px;color:var(--text-muted,#94a3b8);}' +
    '.cy-pending{font-size:11px;font-weight:600;color:#B45309;background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:1px 7px;}' +
    '.cy-chks{display:flex;flex-wrap:wrap;gap:8px;}' +
    '.cy-chk{position:relative;display:inline-flex;flex-direction:column;gap:2px;padding:7px 14px;border:1px solid #dbe3f0;border-radius:10px;background:#fff;cursor:pointer;font-size:13px;color:#334155;transition:all .15s;user-select:none;}' +
    '.cy-chk:hover{border-color:#93b4f5;}' +
    '.cy-chk input{position:absolute;opacity:0;pointer-events:none;}' +
    '.cy-chk small{font-size:11.5px;color:#94a3b8;}' +
    '.cy-chk.on{border-color:#3B82F6;background:#EFF5FF;color:#1D4ED8;font-weight:600;box-shadow:0 0 0 2px rgba(59,130,246,.12);}' +
    '.cy-chk.on small{color:#5b7fc7;font-weight:400;}' +
    '.cy-chk.on::after{content:"✓";position:absolute;top:-7px;right:-7px;width:16px;height:16px;border-radius:50%;background:#3B82F6;color:#fff;font-size:10px;line-height:16px;text-align:center;}' +
    '.cy-chk.stage{min-width:150px;}' +
    '.cy-vals{display:flex;flex-wrap:wrap;gap:6px;}' +
    '.cy-val{font-size:12px;padding:2px 9px;border-radius:8px;background:#EFF5FF;color:#1D4ED8;border:1px solid #d6e4ff;}' +
    '.cy-empty{font-size:13px;color:#B45309;}' +
    '.cy-src{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;border-radius:7px;padding:2px 8px;}' +
    '.cy-src.official{color:#1D4ED8;background:#EFF5FF;border:1px solid #c7d9fb;}' +
    '.cy-src.partner{color:#C2410C;background:#FFF4EC;border:1px solid #fed7aa;}' +
    '.cy-src-row{font-size:12px;color:var(--text-muted,#94a3b8);display:flex;align-items:center;gap:6px;min-height:22px;}';

  function injectCss() {
    if (document.getElementById('cy-tax-css')) return;
    var s = document.createElement('style');
    s.id = 'cy-tax-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function parse(el) {
    try { return JSON.parse(el.getAttribute('data-values') || '{}'); } catch (e) { return {}; }
  }

  function renderEdit(el) {
    var vals = parse(el), pending = el.hasAttribute('data-pending');
    var html = '<div class="cy-tax">';
    FIELDS.forEach(function (f) {
      var sel = vals[f.key] || [];
      var wide = f.key === 'stages' ? ' wide' : '';
      html += '<div class="cy-tax-item' + wide + '"><div class="cy-tax-label">' + f.label + ' <span class="req">*</span>' +
        (pending && !sel.length ? '<span class="cy-pending">待运营维护</span>' : '') + '</div><div class="cy-chks">';
      T[f.key].forEach(function (o) {
        var on = sel.indexOf(o.v) > -1;
        html += '<label class="cy-chk' + (on ? ' on' : '') + (o.d ? ' stage' : '') + '"><input type="checkbox" name="' + f.key + '" value="' + o.v + '"' + (on ? ' checked' : '') + '>' +
          '<span>' + o.t + '</span>' + (o.d ? '<small>' + o.d + '</small>' : '') + '</label>';
      });
      html += '</div><span class="cy-tax-hint">' + f.hint + '</span></div>';
    });
    html += '</div>';
    el.innerHTML = html;
    el.addEventListener('change', function (e) {
      if (!e.target.matches('input[type=checkbox]')) return;
      e.target.closest('.cy-chk').classList.toggle('on', e.target.checked);
      var item = e.target.closest('.cy-tax-item');
      var badge = item.querySelector('.cy-pending');
      if (badge && item.querySelector('input:checked')) badge.remove();
    });
  }

  function renderView(el) {
    var vals = parse(el), html = '';
    FIELDS.forEach(function (f) {
      var sel = vals[f.key] || [];
      var body = sel.length
        ? '<div class="cy-vals">' + sel.map(function (v) { return '<span class="cy-val">' + T.label(f.key, v) + '</span>'; }).join('') + '</div>'
        : '<span class="cy-empty">未设置 · 待运营维护</span>';
      html += '<div class="info-item"><div class="info-label">' + f.label + '</div><div class="info-value">' + body + '</div></div>';
    });
    el.outerHTML = html;
  }

  function bindAppType(sel) {
    var out = sel.parentNode.querySelector('[data-cy-source]');
    function sync() {
      if (!out) return;
      var src = T.sourceOfAppType(sel.value);
      out.innerHTML = src
        ? '前台来源标识：<span class="cy-src ' + src + '">' + T.sources[src] + '</span>'
        : '平台托管显示「平台官方」，协议接入、外部跳转显示「生态伙伴」';
    }
    sel.addEventListener('change', sync);
    sync();
  }

  function init() {
    injectCss();
    document.querySelectorAll('[data-cy-taxonomy="edit"]').forEach(renderEdit);
    document.querySelectorAll('[data-cy-taxonomy="view"]').forEach(renderView);
    document.querySelectorAll('select[data-cy-apptype]').forEach(bindAppType);
  }

  window.CYTaxonomy = T;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
