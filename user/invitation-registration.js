/* 仅对带好友邀请码的企业注册链路生效，不改渠道商邀请码或当前登录账号的邀请关系。 */
(function () {
    'use strict';
    const params = new URLSearchParams(location.search);
    const code = params.get('friend_invite');
    const type = params.get('type');
    const supported = !type || ['buyer', 'supplier', 'agency'].includes(type);
    const person = code && supported ? window.CaiyiInvitations.validateCode(code) : null;
    const valid = person && !person.error;
    const current = location.pathname.split('/').pop().replace(/\.html$/, '');
    window.CaiyiFriendRegistration = {
        nextUrl(value) {
            if (!valid) return value;
            const url = new URL(value, location.href);
            url.searchParams.set('friend_invite', person.code);
            if (type && /\/register-success(?:\.html)?$/.test(url.pathname)) url.searchParams.set('type', type);
            return url.href;
        }
    };
    if (!code || !supported) return;
    const anchor = current === 'register-select' ? document.querySelector('.selector-sub')
        : current === 'register-form' ? document.querySelector('.type-badge')
        : document.querySelector('#enterpriseView .result-sub');
    if (!anchor) return;
    const notice = document.createElement('div');
    notice.id = 'friendInviteNotice';
    notice.setAttribute('role', 'status');
    notice.style.cssText = 'margin:16px 0;padding:14px 16px;background:#eff4ff;border:1px solid #c9d8fa;border-radius:12px;font-size:13px;line-height:1.8;color:#2456d4;text-align:left';
    const title = document.createElement('strong');
    title.textContent = valid ? (current === 'register-success' ? '好友邀请已随申请提交' : '来自好友 ' + person.name + ' 的邀请') : '好友邀请码无效';
    const detail = document.createElement('div');
    detail.textContent = valid ? '好友邀请码：' + person.code + (current === 'register-success' ? '。账号审核通过后建立邀请关系。' : '。完成注册并通过审核后，将与该好友建立邀请关系。') : '请联系邀请人核对链接。您也可以继续注册，登录后在“我的邀请人”中手动绑定。';
    notice.append(title, detail);
    anchor.after(notice);
    if (!valid) return;
    document.querySelectorAll('a[href]').forEach(a => {
        const url = new URL(a.getAttribute('href'), location.href);
        if (url.origin !== location.origin) return;
        const page = url.pathname.split('/').pop().replace(/\.html$/, '');
        if (!['register-select', 'register-form'].includes(page)) return;
        const nextType = url.searchParams.get('type');
        if (nextType && !['buyer', 'supplier', 'agency'].includes(nextType)) return;
        url.searchParams.set('friend_invite', person.code);
        a.href = url.href;
    });
})();
