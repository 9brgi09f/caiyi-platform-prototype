/* 好友邀约的本地原型数据，与渠道商推荐关系独立。 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.CaiyiInvitations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const people = {
        CYZM2026: { id: '10001', name: '张*', code: 'CYZM2026' },
        CYWM2026: { id: '10002', name: '王*', code: 'CYWM2026' },
        CYFR2026: { id: '10008', name: '陈*宁', code: 'CYFR2026' },
        CYLH2026: { id: '10009', name: '李*华', code: 'CYLH2026' }
    };
    const key = role => 'caiyi.friend-invitation.v1.' + (role === 'member' ? 'member' : 'owner');
    const account = role => ({ ...people[role === 'member' ? 'CYWM2026' : 'CYZM2026'] });
    function validateCode(value, ownCode) {
        const code = String(value || '').trim().toUpperCase();
        if (!code) return { error: '请输入好友的邀请码' };
        if (!/^[A-Z0-9]{8}$/.test(code)) return { error: '请输入 8 位字母或数字组成的邀请码' };
        if (code === ownCode) return { error: '不能绑定自己的邀请码，请向好友获取邀请码' };
        if (!people[code]) return { error: '邀请码无效，请联系邀请人核对后重试' };
        return { ...people[code] };
    }
    function readBinding(storage, role) {
        try {
            const raw = storage.getItem(key(role));
            if (!raw) return { binding: null };
            const data = JSON.parse(raw);
            if (!people[data.code] || data.code === account(role).code || !data.time || !['邀请码绑定', '链接绑定'].includes(data.method)) {
                return { error: '绑定记录无法读取，请刷新重试；原记录已保留' };
            }
            return { binding: { ...people[data.code], time: data.time, method: data.method, channel: 'Web' } };
        } catch (_) {
            return { error: '无法读取绑定记录，请允许浏览器使用本地存储后重试' };
        }
    }
    function bind(storage, role, value, time, method = '邀请码绑定') {
        const existing = readBinding(storage, role);
        if (existing.error) return existing;
        if (existing.binding) return { error: '已绑定邀请人，邀请关系不可更改', binding: existing.binding };
        const person = validateCode(value, account(role).code);
        if (person.error) return person;
        const binding = { ...person, time: time || new Date().toLocaleString('sv-SE'), method: method === '链接绑定' ? method : '邀请码绑定', channel: 'Web' };
        try {
            storage.setItem(key(role), JSON.stringify(binding));
            return { binding };
        } catch (_) {
            return { error: '绑定未保存，请允许浏览器使用本地存储后重试' };
        }
    }
    function registrationLink(base, code) {
        const url = new URL('register-select.html', base);
        url.searchParams.set('friend_invite', code);
        return url.href;
    }
    const records = ['陈*明', '刘*怡', '黄*', '何*文', '周*琪', '林*', '许*华', '吴*琳', '郑*', '罗*然', '谢*宇', '梁*宁'].map((name, i) => ({
        name, id: String(10120 + i), method: i % 3 ? '链接绑定' : '邀请码绑定',
        time: '2026-09-' + String(12 - i).padStart(2, '0') + ' 10:30:00', channel: i % 3 === 1 ? '微信' : 'Web'
    }));
    return { account, validateCode, readBinding, bind, registrationLink, records };
});
