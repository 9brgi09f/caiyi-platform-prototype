/*
 * 智能体广场 / 我的收藏 共用：示例数据、收藏存储、卡片渲染
 * 字段口径见 ../agent-taxonomy.js（专区 / 适用群体 / 采购阶段 / 功能类型 / 应用类型→来源）
 */
(function () {
  var AGENTS = [
    { id: 'compliance', name: '采购文件合规检测智能体', desc: '检查采购文件中的合规风险，定位问题条款，辅助生成审查报告。', icon: 'shield', tone: 'blue', app: 'hosted', zones: ['gov', 'soe'], roles: ['buyer', 'agency', 'supplier', 'regulator'], stages: ['pre', 'mid'], funcs: ['check'], users: 147, price: '约 1~5 彩豆/次', pv: 1, bill: '按 Token', trial: 16, manual: true, video: true, kw: '审文件 文件审核 招标文件 条款检查 合规' },
    { id: 'credit', name: '企业信用报告查询', desc: '查询企业工商、信用与风险信息，生成来源可核对的企业信用报告。', icon: 'search', tone: 'indigo', app: 'hosted', zones: ['gov', 'soe'], roles: ['agency', 'buyer', 'regulator', 'supplier'], stages: ['pre', 'mid', 'post'], funcs: ['query'], users: 21, price: '约 1~2 彩豆/次', pv: 1, bill: '按 Token', trial: 2, manual: true, kw: '查企业 工商信息 信用查询 企业风险' },
    { id: 'relation', name: '企业关系穿透分析', desc: '分析企业投资、股东和人员关联，清晰呈现企业关系图谱与风险线索。', icon: 'link', tone: 'violet', app: 'hosted', zones: ['gov', 'soe'], roles: ['agency', 'buyer', 'regulator', 'supplier'], stages: ['pre', 'mid', 'post'], funcs: ['query', 'consult'], users: 24, price: '约 1~2 彩豆/次', pv: 1, bill: '按 Token', manual: true, kw: '股东关系 关联企业 企业关系' },
    { id: 'consult', name: '采购智能咨询助手', desc: '解答采购流程、法规适用和文件编制问题，提供贴合业务场景的咨询建议。', icon: 'chat', tone: 'amber', app: 'hosted', zones: ['gov', 'soe'], roles: ['buyer', 'supplier'], stages: ['pre', 'mid', 'post'], funcs: ['consult'], users: 47, price: '约 1~2 彩豆/次', pv: 1, bill: '按 Token', trial: 0, manual: true, video: true, kw: '采购咨询 采购法规 流程问答' },
    { id: 'reply', name: '质疑回复智能体', desc: '结合质疑内容、项目信息与法规依据，辅助生成规范的答复建议。', icon: 'reply', tone: 'green', app: 'hosted', zones: ['gov'], roles: ['buyer', 'agency', 'supplier', 'regulator'], stages: ['post'], funcs: ['gen'], users: 27, price: '约 5~20 彩豆/次', pv: 5, bill: '按 Token', manual: true, kw: '投诉回复 答复质疑 质疑处理' },
    { id: 'notice', name: '政府采购公告查询', desc: '集中检索政府采购公告与原文，支持按地区、品目和时间快速定位。', icon: 'search', tone: 'pink', app: 'protocol', zones: ['gov'], roles: ['buyer', 'supplier', 'agency', 'regulator'], stages: ['pre', 'mid'], funcs: ['query'], users: 10, price: '约 1 彩豆/次', pv: 1, bill: '按 Token', manual: false, kw: '采购公告 中标公告 公告检索' },
    { id: 'collusion', name: '串围标检查', desc: '分析企业关联、投标文件与报价行为，辅助发现异常关联和串围标风险线索。', icon: 'link', tone: 'violet', app: 'hosted', zones: ['gov', 'soe'], roles: ['buyer', 'agency', 'supplier', 'regulator'], stages: ['mid'], funcs: ['check'], users: 14, price: '约 100~3000 彩豆/次', pv: 100, bill: '按 Token', manual: true, video: true, kw: '围标串标 投标异常 串标检查' },
    { id: 'furniture', name: '家具需求调查智能体', desc: '整理家具采购需求，查询商品与价格样本，生成可追溯的询价记录。', icon: 'home', tone: 'green', app: 'hosted', zones: ['gov'], roles: ['buyer'], stages: ['pre'], funcs: ['gen', 'query'], users: 12, price: '约 80~150 彩豆/次', pv: 80, bill: '按 Token', manual: true, kw: '市场调查 家具采购需求 价格样本' },
    { id: 'report', name: '采购需求调查报告', desc: '汇总采购需求、商品清单与调研资料，生成结构化的采购需求调查报告。', icon: 'doc', tone: 'amber', app: 'hosted', zones: ['gov'], roles: ['buyer', 'agency'], stages: ['pre'], funcs: ['gen'], users: 7, price: '约 80~150 彩豆/次', pv: 80, bill: '按 Token', manual: false, kw: '采购需求 需求调查 调查报告' },
    { id: 'compare', name: '家具采购项目自动比价智能体', desc: '围绕家具采购清单，开展需求分析、历史价格对比和供应商协同询价。', icon: 'chart', tone: 'blue', app: 'hosted', zones: ['gov'], roles: ['buyer'], stages: ['pre'], funcs: ['consult'], users: 8, price: '30 彩豆/次', pv: 30, bill: '按次', manual: false, kw: '家具询价 比价 历史价格 供应商询价' },
    { id: 'xiaoyi', name: '小易智采AI助手', desc: '围绕招采法律法规与实务案例，解答采购流程、文件编制等工作问题。', icon: 'chat', tone: 'blue', app: 'redirect', zones: ['gov', 'soe'], roles: ['buyer', 'agency'], stages: ['pre', 'mid', 'post'], funcs: ['consult'], users: 3, price: '单独计价', pv: null, bill: '', manual: true, bundle: ['采购流程咨询', '法规与案例解答', '文件编制建议'], kw: '法规咨询 流程问答 规则解读' },
    { id: 'bid', name: '柏菲可丽 · 投标智能体', desc: '复用历史标书结构，按评分点组织响应内容，辅助编制与检查投标文件。', icon: 'doc', tone: 'green', app: 'redirect', zones: ['gov', 'soe'], roles: ['supplier'], stages: ['mid'], funcs: ['gen', 'check'], users: 5, price: '单独计价', pv: null, bill: '', manual: true, video: true, bundle: ['评分点拆解', '投标文件编制', '响应内容检查'], kw: '投标文件 标书制作 评分点' },
    { id: 'tender', name: '柏菲可丽 · 招标智能体', desc: '辅助解读招标需求、编制招标文件，并对多家投标文件进行提取与对比。', icon: 'doc', tone: 'blue', app: 'redirect', zones: ['gov', 'soe'], roles: ['buyer', 'agency'], stages: ['pre', 'mid'], funcs: ['gen'], users: 3, price: '单独计价', pv: null, bill: '', manual: false, bundle: ['招标需求解读', '招标文件编制', '投标文件提取与对比'], kw: '招标文件 招标需求 投标文件对比' },
    { id: 'zhicai', name: '智采AI平台智能体', desc: '覆盖需求提取、智能比价与风险预警，辅助完成采购流程中的关键工作。', icon: 'chart', tone: 'indigo', app: 'protocol', zones: ['soe'], roles: ['buyer', 'agency', 'supplier', 'regulator'], stages: ['pre', 'mid'], funcs: ['consult', 'check'], users: 7, price: '单独计价', pv: null, bill: '', manual: true, bundle: ['需求提取', '智能比价', '风险预警'], kw: '采购需求提取 智能比价 风险预警' },
    { id: 'parameter', name: '技术参数条款一键提取智能体', desc: '识别并提取采购文件中的技术参数要求，帮助整理审查要点与响应内容。', icon: 'doc', tone: 'green', app: 'protocol', zones: ['gov'], roles: ['buyer', 'agency'], stages: ['pre', 'mid'], funcs: ['gen'], users: 3, price: '约 2~10 彩豆/次', pv: 2, bill: '按 Token', manual: false, kw: '技术参数 条款提取 响应要求' },
    { id: 'ruichao', name: '瑞晁招采文件合规检测智能体', desc: '检查招采文件中的合规风险，辅助采购单位完成文件审核与问题核对。', icon: 'shield', tone: 'blue', app: 'protocol', zones: ['gov', 'soe'], roles: ['buyer'], stages: ['pre', 'mid'], funcs: ['check'], users: 3, price: '单独计价', pv: null, bill: '', manual: true, kw: '招采文件 文件合规 风险检查' },
    { id: 'biaozhida', name: '标智达', desc: '汇聚招标合规、投标生成、辅助评审与合同审查等采购场景能力。', icon: 'grid', tone: 'green', app: 'redirect', zones: ['soe'], roles: ['agency'], stages: ['pre', 'mid', 'post'], funcs: ['consult', 'gen', 'check'], users: 4, price: '单独计价', pv: null, bill: '', manual: false, bundle: ['招标合规检查', '投标文件生成', '辅助评审', '合同审查'], kw: '招标合规 投标生成 辅助评审 合同审查' },
    { id: 'star', name: '星号条款一键提取智能体', desc: '提取采购文件中的关键及实质性响应条款，减少重要条款遗漏。', icon: 'star', tone: 'amber', app: 'protocol', zones: ['gov'], roles: ['buyer', 'regulator'], stages: ['pre', 'mid'], funcs: ['check'], users: 4, price: '约 1~3 彩豆/次', pv: 1, bill: '按 Token', manual: false, kw: '星号条款 实质性要求 关键条款' }
  ];

  var TONES = { blue: ['#38BDF8', '#2563EB'], indigo: ['#818CF8', '#4F46E5'], violet: ['#C084FC', '#7C3AED'], amber: ['#FBBF24', '#EA580C'], green: ['#34D399', '#059669'], pink: ['#F472B6', '#DB2777'] };
  var ICONS = {
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11.5 11 13.5 15 9.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16" y2="16"/>',
    link: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7.5l3 8M16 7.5l-3 8M8.5 6h7"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
    reply: '<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>',
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-6h6v6"/>',
    doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    star: '<polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5"/>'
  };

  var T = window.CYTaxonomy;
  // 详情页据此决定返回到哪里：广场进入 → 返回智能体广场；其余 → 返回我的收藏
  var FROM = /agent-square\.html/.test(location.pathname) ? '&from=square' + (/zone=soe/.test(location.search) ? '&zone=soe' : '') : '';
  function lbl(key, v) { return T ? T.label(key, v) : v; }
  function source(a) { return T ? T.sourceOfAppType(a.app) : (a.app === 'hosted' ? 'official' : 'partner'); }

  /* ---------- 收藏：localStorage，记录收藏时间用于「最近收藏」排序 ---------- */
  var FAV_KEY = 'cy-agent-favorites-v2';
  function loadFavs() {
    try {
      var raw = localStorage.getItem(FAV_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    var now = Date.now();
    return { compliance: now - 1000, consult: now - 86400000, credit: now - 3 * 86400000, bid: now - 5 * 86400000, zhicai: now - 6 * 86400000 };
  }
  var favs = loadFavs();
  function saveFavs() { try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) {} }

  function icon(a) {
    var c = TONES[a.tone] || TONES.blue, gid = 'g-' + a.id;
    return '<div class="mkt-icon"><svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="url(#' + gid + ')"/><g transform="translate(12,12)" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[a.icon] || ICONS.doc) + '</g></svg></div>';
  }
  function stageText(a) {
    if (a.stages.length === 3) return '全阶段';
    return a.stages.map(function (s) { return lbl('stages', s); }).join(' / ');
  }
  function trialBadge(a) {
    if (a.trial === undefined) return '';
    if (a.trial === 0) return '<span class="free-use done">免费体验已用完 · 按计费规则扣费</span>';
    return '<span class="free-use' + (a.trial <= 3 ? ' warn' : '') + '">新用户体验剩余 ' + a.trial + ' 次</span>';
  }

  function card(a) {
    var src = source(a), saved = !!favs[a.id];
    var tags = '<span class="tag tag-stage">' + stageText(a) + '</span>' +
      a.funcs.map(function (f) { return '<span class="tag">' + lbl('funcs', f) + '</span>'; }).join('') +
      (a.bundle ? '<span class="tag tag-bundle">功能集合 · ' + a.bundle.length + ' 项</span>' : '');
    var price = a.pv === null
      ? '<span class="mkt-price other">单独计价</span>'
      : '<span class="mkt-price">' + a.price + ' <small>· ' + a.bill + '</small></span>';
    var opsL = (a.manual ? '<button type="button" class="mbtn mbtn-icon" data-act="manual" data-id="' + a.id + '">📖 手册</button>' : '') +
      (a.video ? '<button type="button" class="mbtn mbtn-icon" data-act="video" data-id="' + a.id + '">▶ 视频</button>' : '') +
      '<button type="button" class="mbtn mbtn-match" data-act="match" data-id="' + a.id + '" title="撮合即将上线">🤝 撮合</button>';
    return '<article class="mkt-card" data-id="' + a.id + '">' +
      '<div class="mkt-top">' +
      (src === 'official' ? '<img class="gz-logo" src="../gz-procurement-logo.png" alt="广州市政府采购中心" title="广州市政府采购中心"/>' : '') + icon(a) +
      '<div class="mkt-head"><h3 class="mkt-name" title="' + a.name + '">' + a.name + '</h3>' +
      '<span class="src ' + src + '">' + (src === 'official' ? '平台官方' : '生态伙伴') + '</span></div>' +
      '<div class="mkt-side"><button type="button" class="fav-btn' + (saved ? ' on' : '') + '" data-act="fav" data-id="' + a.id + '" aria-pressed="' + saved + '" title="' + (saved ? '取消收藏' : '加入我的收藏') + '">' + (saved ? '★' : '☆') + '</button></div></div>' +
      '<p class="mkt-desc">' + a.desc + '</p>' +
      '<div class="mkt-tags">' + tags + '</div>' +
      '<div class="mkt-meta"><span>' + a.users + ' 家在用</span>' + price + '</div>' + trialBadge(a) +
      '<div class="mkt-ops"><div class="ops-l">' + opsL + '</div><a class="mbtn mbtn-primary" href="agent-view.html?id=' + a.id + FROM + '">' + (a.bundle ? '查看能力并使用' : '立即使用') + '</a></div>' +
      '</article>';
  }

  function searchText(a) {
    return [a.name, a.desc, a.kw || '', (a.bundle || []).join(' '),
      a.roles.map(function (r) { return lbl('roles', r); }).join(' '),
      a.funcs.map(function (f) { return lbl('funcs', f); }).join(' ')].join(' ').toLowerCase();
  }

  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'cy-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  function videoModal(a) {
    var m = document.getElementById('cyVideo');
    if (!m) {
      m = document.createElement('div'); m.id = 'cyVideo'; m.className = 'cy-modal';
      m.innerHTML = '<div class="cy-modal-box" role="dialog" aria-modal="true"><div class="cy-modal-hd"><b id="cyVideoTitle"></b><button type="button" class="cy-x" aria-label="关闭">×</button></div><div class="cy-video">▶ 操作视频</div></div>';
      document.body.appendChild(m);
      m.addEventListener('click', function (e) { if (e.target === m || e.target.classList.contains('cy-x')) m.classList.remove('show'); });
    }
    document.getElementById('cyVideoTitle').textContent = a.name + ' · 操作视频';
    m.classList.add('show');
  }

  /* 卡片区事件委托：收藏 / 手册 / 视频 / 撮合 */
  function bindGrid(grid, onFavChange) {
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var a = byId(b.getAttribute('data-id')); if (!a) return;
      var act = b.getAttribute('data-act');
      if (act === 'fav') {
        if (favs[a.id]) { delete favs[a.id]; toast('已取消收藏'); }
        else { favs[a.id] = Date.now(); toast('已加入我的收藏'); }
        saveFavs();
        onFavChange && onFavChange(a);
      } else if (act === 'video') videoModal(a);
      else if (act === 'manual') toast('打开《' + a.name + '》操作手册');
      else if (act === 'match') toast('撮合功能即将上线，敬请期待');
    });
  }
  function byId(id) { return AGENTS.filter(function (a) { return a.id === id; })[0]; }

  window.CYMarket = {
    agents: AGENTS, card: card, source: source, searchText: searchText, bindGrid: bindGrid, toast: toast,
    isFav: function (id) { return !!favs[id]; }, favAt: function (id) { return favs[id] || 0; },
    favCount: function () { return Object.keys(favs).length; }
  };
})();
