/**
 * 订阅智能体原型 - 共享脚本
 * 包含所有角色页面的通用功能
 */

// ============================================
// 模拟数据
// ============================================
const MockData = {
    // 开发者信息
    developer: {
        agents: [
            { id: 1, name: '智能客服助手', status: '在线', subscribers: 1256, monthlyRevenue: 25800, price: 19.9 },
            { id: 2, name: '营销文案生成器', status: '在线', subscribers: 892, monthlyRevenue: 17800, price: 29.9 },
            { id: 3, name: '数据分析专家', status: '审核中', subscribers: 0, monthlyRevenue: 0, price: 49.9 }
        ],
        totalRevenue: 43600,
        pendingSettlement: 12800,
        // 定价配置 - 按次计费(彩豆/次)
        pricingConfigs: [
            { id: 1, agentId: 1, name: '标准调用', code: 'STD_CALL_001', beansPerCall: 50, status: '已通过', time: '2026-05-14' },
            { id: 2, agentId: 1, name: '高级分析', code: 'ADV_ANALYSIS_001', beansPerCall: 100, status: '已通过', time: '2026-05-14' },
            { id: 3, agentId: 1, name: '批量处理', code: 'BATCH_PROC_001', beansPerCall: 30, status: '待审核', time: '2026-05-14' },
            { id: 4, agentId: 2, name: '标准调用', code: 'STD_CALL_002', beansPerCall: 300, status: '已通过', time: '2026-05-01' }
        ],
        notifications: [
            { id: 1, type: 'warning', title: '账户余额预警', content: '账户余额低于100元，请及时充值', time: '2026-05-14 10:30' },
            { id: 2, type: 'info', title: '新订阅通知', content: '用户"张三"订阅了您的智能客服助手', time: '2026-05-14 09:15' },
            { id: 3, type: 'success', title: '结算完成', content: '4月结算款项 ¥12,800 已打款', time: '2026-05-13 15:00' }
        ]
    },
    
    // 用户信息 (企业用户端)
    user: {
        balance: 356.80,              // 当前余额(元)
        beanBalance: 5000,            // 当前彩豆数量
        principalCoefficient: 0.01,   // 本金分摊系数 = 本金/彩豆数量
        beanToCashRatio: 0.01,        // 彩豆与金额比例(1彩豆=0.01元)
        subscriptions: [
            { id: 1, name: '智能客服助手', developer: 'AI工作室', price: 19.9, nextBilling: '2026-06-01', status: 'active' },
            { id: 2, name: '营销文案生成器', developer: '创意工坊', price: 29.9, nextBilling: '2026-05-20', status: 'active' }
        ],
        // 消费记录（每次调用一条记录）
        consumption: [
            { id: 1, orderNo: 'CN20260514001', agent: '合规监测智能体', pricingCode: 'STD_CALL_001', pricingName: '合规监测智能体-标准调用', callCount: 1, beans: 50, amount: 0.50, ip: '192.168.1.100', principalCoef: 0.01, beanRatio: 0.01, beforeBean: 5000, beforeAmount: 50.00, afterBean: 4950, afterAmount: 49.50, time: '2026-05-14 15:32:01', status: '待开票' },
            { id: 2, orderNo: 'CN20260514002', agent: '合规监测智能体', pricingCode: 'STD_CALL_001', pricingName: '合规监测智能体-标准调用', callCount: 1, beans: 50, amount: 0.50, ip: '192.168.1.100', principalCoef: 0.01, beanRatio: 0.01, beforeBean: 4950, beforeAmount: 49.50, afterBean: 4900, afterAmount: 49.00, time: '2026-05-14 15:31:45', status: '待开票' },
            { id: 3, orderNo: 'CN20260514003', agent: '数据分析智能体', pricingCode: 'STD_CALL_002', pricingName: '数据分析智能体-标准调用', callCount: 1, beans: 300, amount: 3.00, ip: '192.168.1.100', principalCoef: 0.01, beanRatio: 0.01, beforeBean: 4900, beforeAmount: 49.00, afterBean: 4600, afterAmount: 46.00, time: '2026-05-14 14:18:30', status: '待开票' },
            { id: 4, orderNo: 'CN20260513001', agent: '合规监测智能体', pricingCode: 'ADV_ANALYSIS_001', pricingName: '合规监测智能体-高级分析', callCount: 1, beans: 100, amount: 1.00, ip: '192.168.1.101', principalCoef: 0.01, beanRatio: 0.01, beforeBean: 4600, beforeAmount: 46.00, afterBean: 4500, afterAmount: 45.00, time: '2026-05-13 16:22:30', status: '待开票' }
        ],
        // 充值记录
        recharges: [
            { id: 1, orderNo: 'RC20260510001', amount: 50.00, beans: 5250, bonusBeans: 250, channel: '微信支付', beanRatio: 0.01, beforeBean: 0, beforeAmount: 0, beforePrincipalCoef: 0, afterBean: 5250, afterAmount: 50.00, afterPrincipalCoef: 0.0095, time: '2026-05-10 14:30', status: '成功' },
            { id: 2, orderNo: 'RC20260425001', amount: 100.00, beans: 11000, bonusBeans: 1000, channel: '支付宝', beanRatio: 0.01, beforeBean: 0, beforeAmount: 0, beforePrincipalCoef: 0, afterBean: 11000, afterAmount: 100.00, afterPrincipalCoef: 0.0091, time: '2026-04-25 10:15', status: '成功' }
        ],
        notifications: [
            { id: 1, type: 'info', title: '订阅即将到期', content: '您的营销文案生成器订阅将于5天后到期', time: '2026-05-14' },
            { id: 2, type: 'success', title: '充值成功', content: '成功充值 5,000 彩豆', time: '2026-05-12' }
        ]
    },
    
    // 管理员信息
    admin: {
        // 彩豆比例修改记录
        beanRatioHistory: [
            { id: 1, ratio: 0.01, operator: '管理员', time: '2026-05-01 09:00', remark: '初始设置：1元=100彩豆' },
            { id: 2, ratio: 0.012, operator: '管理员', time: '2026-03-15 14:30', remark: '调整比例：1元≈83彩豆' },
            { id: 3, ratio: 0.01, operator: '管理员', time: '2026-01-01 00:00', remark: '初始设置：1元=100彩豆' }
        ],
        transactions: [
            { id: 'TX20260514001', user: '张三', agent: '智能客服助手', amount: 19.9, type: '订阅', status: '成功', time: '2026-05-14 14:30' },
            { id: 'TX20260514002', user: '李四', agent: '营销文案生成器', amount: 29.9, type: '订阅', status: '成功', time: '2026-05-14 14:15' },
            { id: 'TX20260514003', user: '王五', agent: '智能客服助手', amount: 15.0, type: '消费', status: '成功', time: '2026-05-14 14:00' },
            { id: 'TX20260514004', user: '赵六', agent: '数据分析专家', amount: 49.9, type: '订阅', status: '处理中', time: '2026-05-14 13:45' }
        ],
        invoices: [
            { id: 'INV202605001', user: '张三', amount: 199.0, status: '待开票', time: '2026-05-10' },
            { id: 'INV202605002', user: '李四', amount: 299.0, status: '已开票', time: '2026-05-08' }
        ],
        settlements: [
            { id: 'ST202605001', developer: 'AI工作室', amount: 25800, status: '待打款', time: '2026-05-01' },
            { id: 'ST202605002', developer: '创意工坊', amount: 17800, status: '已打款', time: '2026-05-01' }
        ]
    },
    
    // 财务信息
    finance: {
        // 充值订单记录
        rechargeOrders: [
            { id: 'RC20260510001', user: '李用户', amount: 50.00, beans: 5250, time: '2026-05-10 14:30', orderType: '充值', orderNo: 'RC20260510001', channel: '微信支付', beforeAmount: 0, beforeBean: 0, beforePrincipalCoef: 0, afterAmount: 50.00, afterBean: 5250, afterPrincipalCoef: '0.0095', status: '成功' },
            { id: 'RC20260425001', user: '李用户', amount: 100.00, beans: 11000, time: '2026-04-25 10:15', orderType: '充值', orderNo: 'RC20260425001', channel: '支付宝', beforeAmount: 0, beforeBean: 0, beforePrincipalCoef: 0, afterAmount: 100.00, afterBean: 11000, afterPrincipalCoef: '0.0091', status: '成功' },
            { id: 'RC20260410001', user: '张用户', amount: 200.00, beans: 23000, time: '2026-04-10 09:00', orderType: '充值', orderNo: 'RC20260410001', channel: '微信支付', beforeAmount: 0, beforeBean: 0, beforePrincipalCoef: 0, afterAmount: 200.00, afterBean: 23000, afterPrincipalCoef: '0.0087', status: '成功' }
        ],
        // 消费订单记录（每次调用一条）
        consumptionOrders: [
            { id: 'CN20260514001', user: '李用户', agent: '合规监测智能体', pricingCode: 'STD_CALL_001', amount: 0.50, beans: 50, time: '2026-05-14 15:32:01', orderType: '消费', orderNo: 'CN20260514001', channel: 'API', beforeAmount: 50.00, beforeBean: 5000, principalCoef: '0.01', afterAmount: 49.50, afterBean: 4950, status: '成功' },
            { id: 'CN20260514002', user: '李用户', agent: '合规监测智能体', pricingCode: 'STD_CALL_001', amount: 0.50, beans: 50, time: '2026-05-14 15:31:45', orderType: '消费', orderNo: 'CN20260514002', channel: 'API', beforeAmount: 49.50, beforeBean: 4950, principalCoef: '0.01', afterAmount: 49.00, afterBean: 4900, status: '成功' },
            { id: 'CN20260514003', user: '李用户', agent: '数据分析智能体', pricingCode: 'STD_CALL_002', amount: 3.00, beans: 300, time: '2026-05-14 14:18:30', orderType: '消费', orderNo: 'CN20260514003', channel: 'API', beforeAmount: 49.00, beforeBean: 4900, principalCoef: '0.01', afterAmount: 46.00, afterBean: 4600, status: '成功' },
            { id: 'CN20260513001', user: '李用户', agent: '合规监测智能体', pricingCode: 'ADV_ANALYSIS_001', amount: 1.00, beans: 100, time: '2026-05-13 16:22:30', orderType: '消费', orderNo: 'CN20260513001', channel: 'API', beforeAmount: 46.00, beforeBean: 4600, principalCoef: '0.01', afterAmount: 45.00, afterBean: 4500, status: '成功' }
        ],
        settlements: [
            { id: 'ST202605001', developer: 'AI工作室', amount: 25800, platformFee: 5160, netAmount: 20640, status: '待打款', time: '2026-05-01' },
            { id: 'ST202605002', developer: '创意工坊', amount: 17800, platformFee: 3560, netAmount: 14240, status: '已打款', time: '2026-05-01' }
        ],
        invoices: [
            { id: 'INV202604001', developer: 'AI工作室', amount: 2580, type: '平台服务费', status: '待开票', requestTime: '2026-05-01' },
            { id: 'INV202604002', developer: '创意工坊', amount: 1780, type: '平台服务费', status: '已开票', requestTime: '2026-05-01' }
        ],
        summary: {
            totalRevenue: 125600,
            platformFee: 25120,
            developerPayout: 100480,
            pendingPayout: 43600
        }
    }
};

// ============================================
// 工具函数
// ============================================
const Utils = {
    // 格式化金额
    formatMoney(amount) {
        return '¥' + parseFloat(amount).toFixed(2);
    },
    
    // 格式化彩豆
    formatBeans(beans) {
        return parseInt(beans).toLocaleString('zh-CN') + ' 彩豆';
    },
    
    // 金额转彩豆
    cashToBeans(amount, ratio = 0.01) {
        return Math.floor(parseFloat(amount) / ratio);
    },
    
    // 彩豆转金额
    beansToCash(beans, ratio = 0.01) {
        return parseFloat((parseInt(beans) * ratio).toFixed(2));
    },
    
    // 计算本金分摊系数
    calcPrincipalCoefficient(previousPrincipal, currentAmount, previousBeans, currentBeans) {
        const totalPrincipal = parseFloat(previousPrincipal) + parseFloat(currentAmount);
        const totalBeans = parseInt(previousBeans) + parseInt(currentBeans);
        if (totalBeans === 0) return 0;
        return parseFloat((totalPrincipal / totalBeans).toFixed(6));
    },
    
    // 格式化日期
    formatDate(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },
    
    // 格式化时间
    formatDateTime(date) {
        const d = new Date(date);
        return `${this.formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },
    
    // 获取状态颜色
    getStatusColor(status) {
        const colors = {
            '在线': '#52c41a',
            '离线': '#999',
            '审核中': '#faad14',
            'active': '#52c41a',
            '成功': '#52c41a',
            '处理中': '#1890ff',
            '待处理': '#faad14',
            '已拒绝': '#f5222d',
            '待打款': '#faad14',
            '已打款': '#52c41a',
            '待开票': '#faad14',
            '已开票': '#52c41a',
            '已通过': '#52c41a',
            '待审核': '#faad14'
        };
        return colors[status] || '#999';
    },
    
    // 生成ID
    generateId(prefix = '') {
        const now = new Date();
        const id = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        return prefix + id + String(Math.floor(Math.random() * 100)).padStart(2, '0');
    }
};

// ============================================
// 导航功能
// ============================================
const Navigation = {
    // 当前路径
    currentPath: window.location.pathname,
    
    // 初始化导航
    init() {
        this.highlightCurrentNav();
        this.bindMobileMenu();
        this.injectTopbarNotify();
        this.injectSidebarIcons();
    },

    // 侧边栏单色线性图标（按菜单文字映射，替换 emoji；一处维护全站生效）
    injectSidebarIcons() {
        const S = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
        const E = '</svg>';
        const ICONS = {
            '概览': S + '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>' + E,
            '智能体管理': S + '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>' + E,
            '智能体市场': S + '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>' + E,
            '收入看板': S + '<path d="M18 20V10M12 20V4M6 20v-6"/>' + E,
            '数据统计': S + '<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>' + E,
            '结算单': S + '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>' + E,
            '结算管理': S + '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>' + E,
            '提现管理': S + '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>' + E,
            '提现审核': S + '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>' + E,
            '提现打款': S + '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>' + E,
            '收款账户': S + '<path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M12 3l9 6H3l9-6z"/>' + E,
            '付款账户': S + '<path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M12 3l9 6H3l9-6z"/>' + E,
            '发票管理': S + '<path d="M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2H4z"/><path d="M8 7h8M8 11h8M8 15h5"/>' + E,
            '通知': S + '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>' + E,
            '交易流水': S + '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>' + E,
            '规则设置': S + '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>' + E,
            '充值记录': S + '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>' + E,
            '账户充值': S + '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>' + E,
            '余额管理': S + '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>' + E,
            '消费记录': S + '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>' + E,
            '我的邀请码': S + '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/>' + E,
            '客户管理': S + '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' + E,
            '推荐确认单': S + '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/>' + E,
            '分成结算': S + '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>' + E,
            '渠道管理': S + '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>' + E,
            '对账报表': S + '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 13l2 2 4-4"/>' + E,
            '账户对账': S + '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6"/><path d="M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01"/><path d="M9 19h6"/>' + E,
        };
        document.querySelectorAll('.sidebar-link').forEach(link => {
            const iconEl = link.querySelector('.icon');
            if (!iconEl || iconEl.querySelector('svg')) return;
            const labelEl = iconEl.nextElementSibling;
            const label = labelEl ? labelEl.textContent.trim() : '';
            if (ICONS[label]) iconEl.innerHTML = ICONS[label];
        });
    },
    
    // 高亮当前导航项
    highlightCurrentNav() {
        const navLinks = document.querySelectorAll('.nav-links a, .sidebar-menu a');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    },
    
    // 移动端菜单
    bindMobileMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar, .developer-sidebar, .admin-sidebar, .finance-sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
            
            // 点击外部关闭
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                    menuToggle.classList.remove('active');
                }
            });
        }
    },

    // 顶栏通知铃铛（账号名左侧；开发者端带未读角标并链接通知页）
    injectTopbarNotify() {
        const right = document.querySelector('.top-bar-right');
        if (!right || right.querySelector('.topbar-notify')) return;
        const END = document.querySelector('.sidebar.developer') ? 'developer'
            : document.querySelector('.sidebar.user') ? 'user'
            : document.querySelector('.sidebar.admin') ? 'admin'
            : document.querySelector('.sidebar.finance') ? 'finance'
            : document.querySelector('.sidebar.channel') ? 'channel' : null;
        if (!END) return;
        const UNREAD = { developer: 3, user: 2, admin: 5, finance: 2, channel: 3 }; // 各端未读通知数，改此处即可
        const n = UNREAD[END] || 0;
        const a = document.createElement('a');
        a.className = 'topbar-notify';
        a.href = 'notification-list.html';
        a.title = '通知';
        a.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
            + (n > 0 ? '<span class="topbar-notify-badge">' + n + '</span>' : '');
        right.insertBefore(a, right.firstChild);
    }
};

// ============================================
// 模态框功能
// ============================================
const Modal = {
    // 显示模态框
    show(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },
    
    // 隐藏模态框
    hide(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },
    
    // 初始化模态框事件
    init() {
        // 点击关闭按钮
        document.querySelectorAll('[data-modal-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.getAttribute('data-modal-close');
                this.hide(modalId);
            });
        });
        
        // 点击背景关闭
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
                document.body.style.overflow = '';
            }
        });
    }
};

// ============================================
// 表单功能
// ============================================
const Form = {
    // 验证表单
    validate(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('error');
                this.showError(input, '此字段为必填项');
            } else {
                input.classList.remove('error');
                this.hideError(input);
            }
        });
        
        return isValid;
    },
    
    // 显示错误
    showError(input, message) {
        let errorEl = input.parentElement.querySelector('.error-message');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'error-message';
            input.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
    },
    
    // 隐藏错误
    hideError(input) {
        const errorEl = input.parentElement.querySelector('.error-message');
        if (errorEl) {
            errorEl.remove();
        }
    },
    
    // 初始化表单事件
    init() {
        // 实时验证
        document.querySelectorAll('input[required], select[required]').forEach(input => {
            input.addEventListener('blur', () => {
                if (!input.value.trim()) {
                    input.classList.add('error');
                    this.showError(input, '此字段为必填项');
                } else {
                    input.classList.remove('error');
                    this.hideError(input);
                }
            });
            
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    input.classList.remove('error');
                    this.hideError(input);
                }
            });
        });
    }
};

// ============================================
// 通知功能
// ============================================
const Notification = {
    // 显示通知
    show(type, title, message, duration = 3000) {
        const container = document.getElementById('notification-container') || this.createContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                ${this.getIcon(type)}
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        container.appendChild(notification);
        
        // 显示动画
        setTimeout(() => notification.classList.add('show'), 10);
        
        // 自动关闭
        const timer = setTimeout(() => this.close(notification), duration);
        
        // 点击关闭
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(timer);
            this.close(notification);
        });
    },
    
    // 关闭通知
    close(notification) {
        notification.classList.remove('show');
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 300);
    },
    
    // 创建容器
    createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
        return container;
    },
    
    // 获取图标
    getIcon(type) {
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
        };
        return icons[type] || icons.info;
    }
};

// ============================================
// 表格功能
// ============================================
const Table = {
    // 排序
    sort(tableId, column, type = 'string') {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const th = table.querySelector(`th:nth-child(${column})`);
        const isAsc = th.classList.contains('sort-asc');
        
        // 清除其他排序状态
        table.querySelectorAll('th').forEach(t => {
            t.classList.remove('sort-asc', 'sort-desc');
        });
        
        // 排序
        rows.sort((a, b) => {
            const aVal = a.cells[column - 1].textContent.trim();
            const bVal = b.cells[column - 1].textContent.trim();
            
            if (type === 'number') {
                return isAsc ? parseFloat(aVal) - parseFloat(bVal) : parseFloat(bVal) - parseFloat(aVal);
            }
            return isAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
        
        th.classList.add(isAsc ? 'sort-desc' : 'sort-asc');
        rows.forEach(row => tbody.appendChild(row));
    },
    
    // 搜索
    search(tableId, inputId) {
        const table = document.getElementById(tableId);
        const input = document.getElementById(inputId);
        if (!table || !input) return;
        
        const rows = table.querySelectorAll('tbody tr');
        const keyword = input.value.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(keyword) ? '' : 'none';
        });
    },
    
    // 分页
    paginate(tableId, options = {}) {
        const defaults = {
            pageSize: 10,
            showPageInfo: true
        };
        const config = { ...defaults, ...options };
        
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const totalPages = Math.ceil(rows.length / config.pageSize);
        let currentPage = 1;
        
        // 隐藏所有行
        rows.forEach(row => row.style.display = 'none');
        
        // 显示当前页
        const showPage = (page) => {
            const start = (page - 1) * config.pageSize;
            const end = start + config.pageSize;
            rows.forEach((row, index) => {
                row.style.display = index >= start && index < end ? '' : 'none';
            });
            currentPage = page;
        };
        
        // 创建分页控件
        let pagination = table.parentElement.querySelector('.pagination');
        if (!pagination) {
            pagination = document.createElement('div');
            pagination.className = 'pagination';
            table.parentElement.appendChild(pagination);
        }
        
        pagination.innerHTML = `
            <button ${currentPage === 1 ? 'disabled' : ''} data-action="prev">上一页</button>
            <span class="page-info">${currentPage} / ${totalPages}</span>
            <button ${currentPage === totalPages ? 'disabled' : ''} data-action="next">下一页</button>
        `;
        
        pagination.addEventListener('click', (e) => {
            const target = e.target;
            if (target.dataset.action === 'prev' && currentPage > 1) {
                showPage(currentPage - 1);
            } else if (target.dataset.action === 'next' && currentPage < totalPages) {
                showPage(currentPage + 1);
            }
            pagination.innerHTML = `
                <button ${currentPage === 1 ? 'disabled' : ''} data-action="prev">上一页</button>
                <span class="page-info">${currentPage} / ${totalPages}</span>
                <button ${currentPage === totalPages ? 'disabled' : ''} data-action="next">下一页</button>
            `;
        });
        
        showPage(1);
    }
};

// ============================================
// Tab切换
// ============================================
const Tabs = {
    init() {
        document.querySelectorAll('.tabs').forEach(tabsContainer => {
            const tabs = tabsContainer.querySelectorAll('.tab-item');
            const panels = tabsContainer.querySelectorAll('.tab-panel');
            
            tabs.forEach((tab, index) => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    panels.forEach(p => p.classList.remove('active'));
                    
                    tab.classList.add('active');
                    if (panels[index]) {
                        panels[index].classList.add('active');
                    }
                });
            });
        });
    }
};

// ============================================
// 图表功能（简化版）
// ============================================
const Chart = {
    // 渲染简易柱状图
    renderBarChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const maxValue = Math.max(...data.map(d => d.value));
        const defaults = {
            barColor: '#1890ff',
            height: 200,
            showValues: true
        };
        const config = { ...defaults, ...options };
        
        let html = `<div class="bar-chart" style="height: ${config.height}px;">`;
        data.forEach(item => {
            const height = (item.value / maxValue) * 100;
            html += `
                <div class="bar-item">
                    <div class="bar" style="height: ${height}%; background-color: ${item.color || config.barColor};">
                        ${config.showValues ? `<span class="bar-value">${item.value}</span>` : ''}
                    </div>
                    <div class="bar-label">${item.label}</div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    },
    
    // 渲染简易饼图
    renderPieChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const colors = options.colors || ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
        
        let gradientStops = [];
        let currentAngle = 0;
        
        data.forEach((item, index) => {
            const angle = (item.value / total) * 360;
            gradientStops.push(`${colors[index % colors.length]} ${currentAngle}deg ${currentAngle + angle}deg`);
            currentAngle += angle;
        });
        
        let html = `<div class="pie-chart" style="background: conic-gradient(${gradientStops.join(', ')});"></div>`;
        html += '<div class="pie-legend">';
        data.forEach((item, index) => {
            html += `
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${colors[index % colors.length]};"></span>
                    <span class="legend-label">${item.label}</span>
                    <span class="legend-value">${item.value} (${((item.value / total) * 100).toFixed(1)}%)</span>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }
};

// ============================================
// 初始化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();
    Modal.init();
    Form.init();
    Tabs.init();
    
    // 添加全局样式
    const style = document.createElement('style');
    style.textContent = `
        /* 通知样式 */
        #notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        }
        .notification {
            display: flex;
            align-items: flex-start;
            padding: 16px;
            margin-bottom: 12px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        }
        .notification.show {
            opacity: 1;
            transform: translateX(0);
        }
        .notification.hide {
            opacity: 0;
            transform: translateX(100%);
        }
        .notification-icon {
            flex-shrink: 0;
            width: 24px;
            height: 24px;
            margin-right: 12px;
        }
        .notification-icon svg {
            width: 100%;
            height: 100%;
        }
        .notification-success .notification-icon { color: #52c41a; }
        .notification-error .notification-icon { color: #f5222d; }
        .notification-warning .notification-icon { color: #faad14; }
        .notification-info .notification-icon { color: #1890ff; }
        .notification-content { flex: 1; }
        .notification-title { font-weight: 600; margin-bottom: 4px; }
        .notification-message { color: #666; font-size: 14px; }
        .notification-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #999;
            padding: 0;
            margin-left: 8px;
        }
        .notification-close:hover { color: #333; }
        
        /* 图表样式 */
        .bar-chart {
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            padding: 20px;
            background: #fafafa;
            border-radius: 8px;
        }
        .bar-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
        }
        .bar {
            width: 40px;
            min-height: 10px;
            border-radius: 4px 4px 0 0;
            position: relative;
            transition: height 0.5s ease;
        }
        .bar-value {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 12px;
            font-weight: 600;
        }
        .bar-label {
            margin-top: 8px;
            font-size: 12px;
            color: #666;
        }
        .pie-chart {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            margin: 20px auto;
        }
        .pie-legend {
            margin-top: 20px;
        }
        .legend-item {
            display: flex;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .legend-item:last-child { border-bottom: none; }
        .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            margin-right: 8px;
        }
        .legend-label { flex: 1; }
        .legend-value { color: #666; }
        
        /* 分页样式 */
        .pagination {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-top: 20px;
        }
        .pagination button {
            padding: 8px 16px;
            border: 1px solid #d9d9d9;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .pagination button:hover:not(:disabled) {
            border-color: #1890ff;
            color: #1890ff;
        }
        .pagination button:disabled {
            color: #d9d9d9;
            cursor: not-allowed;
        }
        .page-info {
            color: #666;
            font-size: 14px;
        }
        
        /* 表单错误样式 */
        input.error, select.error, textarea.error {
            border-color: #f5222d !important;
        }
        .error-message {
            color: #f5222d;
            font-size: 12px;
            margin-top: 4px;
        }
        
        /* 排序样式 */
        th.sort-asc::after { content: ' ↑'; }
        th.sort-desc::after { content: ' ↓'; }
        th { cursor: pointer; }
        th:hover { background-color: #f5f5f5; }
        
        /* 移动端菜单按钮 */
        .menu-toggle {
            display: none;
        }
        @media (max-width: 768px) {
            .menu-toggle {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                width: 24px;
                height: 18px;
                background: none;
                border: none;
                cursor: pointer;
                padding: 0;
            }
            .menu-toggle span {
                display: block;
                width: 100%;
                height: 2px;
                background-color: #333;
                transition: all 0.3s;
            }
            .menu-toggle.active span:nth-child(1) {
                transform: rotate(45deg) translate(5px, 5px);
            }
            .menu-toggle.active span:nth-child(2) {
                opacity: 0;
            }
            .menu-toggle.active span:nth-child(3) {
                transform: rotate(-45deg) translate(5px, -5px);
            }
        }
    `;
    document.head.appendChild(style);
});

// 导出全局对象
window.MockData = MockData;
window.Utils = Utils;
window.Navigation = Navigation;
window.Modal = Modal;
window.Form = Form;
window.Notification = Notification;
window.Table = Table;
window.Tabs = Tabs;
window.Chart = Chart;

// ========== 状态标签页行过滤（全局统一） ==========
// 用法：标签按钮 onclick="filterStatus('已开票', this)"；'all' 表示全部。
// 行需带 data-status 属性；卡片列表可传第三个参数指定行选择器。
window.filterStatus = function (status, btn, rowSelector) {
    var nav = btn.closest('.tab-nav');
    if (nav) {
        nav.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
    }
    btn.classList.add('active');
    var rows = document.querySelectorAll(rowSelector || '[data-status]');
    rows.forEach(function (row) {
        var s = row.getAttribute('data-status') || '';
        row.style.display = (status === 'all' || s === status) ? '' : 'none';
    });
};

// ========== 通知页 全部/未读 标签过滤 ==========
window.notifFilter = function (mode, btn) {
    var nav = btn.closest('.tab-nav');
    if (nav) {
        nav.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
    }
    btn.classList.add('active');
    document.querySelectorAll('.notification-card').forEach(function (c) {
        c.style.display = (mode === 'all' || c.classList.contains('unread')) ? '' : 'none';
    });
};
