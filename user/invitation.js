(function () {
    'use strict';
    const api = window.CaiyiInvitations;
    const $ = id => document.getElementById(id);
    let role;
    try { role = sessionStorage.getItem('userRole') === 'member' ? 'member' : 'owner'; }
    catch (_) {
        const main = document.querySelector('main');
        main.querySelectorAll(':scope > section').forEach(section => { section.hidden = true; });
        const notice = document.createElement('section');
        notice.className = 'content-card invite-error';
        notice.setAttribute('role', 'alert');
        notice.textContent = '无法读取当前账号，请允许浏览器使用会话存储后刷新页面。';
        main.appendChild(notice);
        return;
    }
    const account = api.account(role);
    let toastTimer;
    function toast(message) {
        const el = $('invitationToast');
        el.textContent = message;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
    }
    document.querySelectorAll('.invite-dialog').forEach(dialog => {
        dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
        dialog.addEventListener('click', event => {
            const rect = dialog.getBoundingClientRect();
            if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
        });
    });

    if ($('inviteCode')) initFriends();
    if ($('bindForm')) initInviter();

    function initFriends() {
        const link = api.registrationLink(location.href, account.code);
        $('inviteCode').value = account.code;
        $('inviteLink').value = link;
        $('qrCodeText').textContent = account.code;
        const records = role === 'member' ? [] : api.records;
        $('invitedCount').textContent = records.length;
        let page = 1;
        let keyword = '';
        let method = '';
        const pageSize = 8;
        function renderRecords() {
            const rows = records.filter(row => (!keyword || row.name.includes(keyword) || row.id.includes(keyword)) && (!method || row.method === method));
            const pages = Math.max(1, Math.ceil(rows.length / pageSize));
            page = Math.min(page, pages);
            $('invitationRows').replaceChildren();
            rows.slice((page - 1) * pageSize, page * pageSize).forEach(row => {
                const tr = document.createElement('tr');
                ['name', 'id', 'method', 'time', 'channel'].forEach(key => {
                    const td = document.createElement('td');
                    td.textContent = row[key];
                    tr.appendChild(td);
                });
                $('invitationRows').appendChild(tr);
            });
            if (!rows.length) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = 5;
                td.className = 'invite-empty';
                td.textContent = records.length ? '没有匹配的邀请记录，请调整筛选条件。' : '暂无邀请记录，分享邀请码或链接，邀请第一位好友。';
                tr.appendChild(td);
                $('invitationRows').appendChild(tr);
            }
            $('recordsCount').textContent = '共 ' + rows.length + ' 条记录';
            $('pageInfo').textContent = '共 ' + rows.length + ' 条记录，每页显示 ' + pageSize + ' 条';
            $('pageNumber').textContent = page + ' / ' + pages;
            $('prevPage').disabled = page <= 1;
            $('nextPage').disabled = page >= pages;
        }
        $('recordFilters').addEventListener('submit', event => {
            event.preventDefault();
            keyword = $('recordKeyword').value.trim(); method = $('recordMethod').value; page = 1; renderRecords();
        });
        $('recordFilters').addEventListener('reset', () => { keyword = ''; method = ''; page = 1; renderRecords(); });
        $('prevPage').addEventListener('click', () => { page--; renderRecords(); });
        $('nextPage').addEventListener('click', () => { page++; renderRecords(); });
        renderRecords();

        async function copy(value) {
            try {
                if (!navigator.clipboard) throw new Error('Clipboard unavailable');
                await navigator.clipboard.writeText(value);
                return true;
            } catch (_) {
                const input = document.createElement('textarea');
                input.value = value;
                input.style.cssText = 'position:fixed;left:0;top:0;opacity:0;pointer-events:none';
                const previousFocus = document.activeElement;
                const host = document.querySelector('dialog[open]') || document.body;
                host.appendChild(input);
                input.select();
                let copied = false;
                try { copied = document.execCommand('copy'); } catch (_) { /* 手动复制兜底 */ }
                input.remove();
                if (previousFocus) previousFocus.focus();
                if (copied) return true;
                if ($('shareDialog').open) $('shareDialog').close();
                const target = value === account.code ? $('inviteCode') : $('inviteLink');
                target.focus(); target.select();
                toast('未能自动复制，已选中' + (value === account.code ? '邀请码' : '邀请链接') + '，请手动复制');
                return false;
            }
        }
        document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
            const isCode = button.dataset.copy === 'code';
            if (await copy(isCode ? account.code : link)) {
                const message = isCode ? '邀请码已复制' : '邀请链接已复制';
                if ($('shareDialog').open) $('shareStatus').textContent = message;
                else toast(message);
            }
        }));
        let qr;
        function openQR() {
            $('qrError').textContent = '';
            $('shareStatus').textContent = '';
            try {
                qr = window.qrcode(0, 'M');
                qr.addData(link);
                qr.make();
                $('inviteQR').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 16, scalable: true });
                $('downloadQR').disabled = false;
            } catch (_) {
                $('inviteQR').textContent = '二维码暂时无法生成';
                $('qrError').textContent = '请关闭后重试，或复制邀请链接分享。';
                $('downloadQR').disabled = true;
            }
            $('shareDialog').showModal();
        }
        document.querySelector('[data-share="qr"]').addEventListener('click', openQR);
        $('downloadQR').addEventListener('click', () => {
            if (!qr) return;
            try {
                const count = qr.getModuleCount();
                const cell = 8;
                const margin = 4;
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = (count + margin * 2) * cell;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#15213c';
                for (let y = 0; y < count; y++) for (let x = 0; x < count; x++) if (qr.isDark(y, x)) ctx.fillRect((x + margin) * cell, (y + margin) * cell, cell, cell);
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = '彩翼邀请-' + account.code + '.png';
                document.body.appendChild(a); a.click(); a.remove();
            } catch (_) { $('qrError').textContent = '图片未能保存，请复制邀请链接分享。'; }
        });
    }

    function initInviter() {
        let storage;
        try { storage = localStorage; } catch (_) { storage = { getItem() { throw new Error('Storage unavailable'); } }; }
        let pending;
        function renderBinding() {
            const state = api.readBinding(storage, role);
            $('bindingLoadError').hidden = !state.error;
            $('bindingLoadError').textContent = state.error || '';
            $('unboundState').hidden = !!state.binding || !!state.error;
            $('boundState').hidden = !state.binding;
            $('noBindingRecord').hidden = !!state.binding || !!state.error;
            $('bindingRecord').hidden = !state.binding;
            if (!state.binding) return;
            const binding = state.binding;
            $('inviterName').textContent = binding.name;
            $('inviterAvatar').textContent = binding.name.slice(0, 1);
            $('inviterId').textContent = binding.id;
            $('boundCode').textContent = binding.code;
            $('bindingMethod').textContent = binding.method;
            $('bindingTime').textContent = binding.time;
            $('bindingChannel').textContent = binding.channel;
        }
        $('inviteCodeInput').addEventListener('input', () => {
            $('bindError').textContent = '';
            $('inviteCodeInput').removeAttribute('aria-invalid');
        });
        $('bindForm').addEventListener('submit', event => {
            event.preventDefault();
            const person = api.validateCode($('inviteCodeInput').value, account.code);
            if (person.error) {
                $('bindError').textContent = person.error;
                $('inviteCodeInput').setAttribute('aria-invalid', 'true');
                $('inviteCodeInput').focus(); return;
            }
            pending = person;
            $('inviteCodeInput').value = person.code;
            $('confirmName').textContent = person.name;
            $('confirmAvatar').textContent = person.name.slice(0, 1);
            $('confirmId').textContent = person.id;
            $('confirmCode').textContent = person.code;
            $('confirmError').textContent = '';
            $('confirmDialog').showModal();
        });
        $('confirmBinding').addEventListener('click', () => {
            if (!pending) return;
            const result = api.bind(storage, role, pending.code);
            if (result.error) { $('confirmError').textContent = result.error; return; }
            pending = null;
            $('confirmDialog').close();
            renderBinding();
            $('boundTitle').tabIndex = -1;
            $('boundTitle').focus();
            toast('邀请人绑定成功');
        });
        $('confirmDialog').addEventListener('close', () => { pending = null; });
        window.addEventListener('storage', renderBinding);
        renderBinding();
    }
})();
