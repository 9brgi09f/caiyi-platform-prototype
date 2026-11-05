(function(){
 'use strict';
 const R=window.CaiyiRefund,T=window.RefundRuntime;
 const path=location.pathname.split('/').pop().replace(/\.html$/,'');
 const sidebar=document.querySelector('.sidebar.user,.sidebar.admin,.sidebar.developer');
 if(!sidebar)return;
 const role=sidebar.classList.contains('user')?'user':sidebar.classList.contains('developer')?'developer':'admin';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const label=r=>r.status==='completed'?(r.type==='recharge'?'已退款':'已退豆'):R.labels[r.status];
 if(role==='admin'&&!sidebar.querySelector('a[href="role-list.html"]')){
  const link=document.createElement('a');link.href='role-list.html';link.className='sidebar-link'+(path==='role-list'?' active':'');
  link.innerHTML='<span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg></span><span>角色与权限</span>';
  sidebar.querySelector('a[href="org-type-list.html"]')?.after(link);
 }
 function nav(){
  if(!T.hasPermission()){sidebar.querySelector('[data-refund-nav]')?.remove();return;}
  if(sidebar.querySelector('[data-refund-nav]'))return;
  const link=document.createElement('a');link.href='refund-list.html';link.className='sidebar-link'+(path.startsWith('refund-')?' active':'');link.dataset.refundNav='';
  link.innerHTML='<span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 10h11a6 6 0 0 1 0 12M3 10l5-5M3 10l5 5"/></svg></span><span>退款管理</span>';
  if(path.startsWith('refund-'))link.setAttribute('aria-current','page');
  const anchor=sidebar.querySelector('a[href="consumption-list.html"],a[href="consumption-records.html"],a[href="revenue-list.html"]');
  if(anchor)anchor.after(link);else sidebar.querySelector('.sidebar-section').appendChild(link);
 }
 if(document.body.classList.contains('refund-page')){
  const button=document.createElement('button');button.type='button';button.className='rf-mobile-menu';button.setAttribute('aria-label','打开导航菜单');button.setAttribute('aria-expanded','false');
  button.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  const close=()=>{document.body.classList.remove('rf-nav-open');button.setAttribute('aria-expanded','false');};
  button.onclick=()=>{const open=document.body.classList.toggle('rf-nav-open');button.setAttribute('aria-expanded',String(open));};
  document.querySelector('.top-bar-left')?.prepend(button);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  document.querySelector('.main-content')?.addEventListener('click',close);
 }
 function summaryNote(s,parent){
  if(!parent)return;let el=parent.querySelector('.rf-summary-note');if(!el){el=document.createElement('span');el.className='rf-summary-note';parent.appendChild(el);}
  const b=R.summary(s);el.textContent='退款冻结 '+R.fmt(b.frozen)+' 彩豆 · 可用 '+R.fmt(b.available)+' 彩豆';
 }
 function balances(s){
  const b=R.summary(s);
  if(path==='index'){
   const stat=[...document.querySelectorAll('.stat-card')].find(x=>x.querySelector('.stat-label')?.textContent==='单位彩豆余额');
   if(stat){stat.querySelector('.stat-value').textContent=R.fmt(b.total)+' 彩豆';summaryNote(s,stat);}
  }
  if(path==='recharge-list'){const value=document.querySelector('.balance-value');if(value){value.innerHTML=R.fmt(b.total)+' <small>彩豆</small>';summaryNote(s,value.parentElement);}}
  if(path==='consumption-list'){const value=document.getElementById('statBalance');if(value){value.textContent=R.fmt(b.total)+' 彩豆';summaryNote(s,value.parentElement);}
   const eligible=s.consumptions.filter(c=>!R.invoiceReason(s,'consumption',c.id)).reduce((n,c)=>n+c.beans,0);const inv=document.getElementById('statInvoicable');if(inv)inv.textContent=R.fmt(eligible)+' 彩豆';
  }
  if(path==='balance'){
   const value=document.querySelector('.eb-card.pool .num');if(value){value.innerHTML=R.fmt(b.total)+' <small>彩豆</small>';summaryNote(s,value.parentElement);}
   const warn=document.querySelector('.warn-state span');if(warn)warn.textContent='当前可用彩豆 '+R.fmt(b.available)+(b.available<50000?'，已低于500彩豆预警阈值。':'，未触发余额预警。');
   document.querySelectorAll('[data-refund-ledger]').forEach(el=>el.remove());
   const holder=document.getElementById('lgRows');
   s.ledger.slice().reverse().forEach(l=>{const row=document.createElement('div');row.className='lg-row';row.dataset.type='refund';row.dataset.refundLedger='';row.innerHTML='<div class="lg-icon '+(l.totalDelta<0?'out':'in')+'">退</div><div><div class="lg-title">'+l.name+'</div><div class="lg-meta">'+l.time+' · '+l.refundId+' · '+l.orderId+'</div><div class="lg-bal">总额 '+R.fmt(l.before)+' → '+R.fmt(l.after)+' · 可用 '+R.fmt(l.available)+'</div></div><div class="lg-amt '+(l.totalDelta<0?'minus':'plus')+'">'+(l.totalDelta?(l.totalDelta>0?'+':'')+R.fmt(l.totalDelta)+' 彩豆':'冻结 '+(l.frozenDelta>0?'+':'')+R.fmt(l.frozenDelta))+'</div>';holder.prepend(row);});
   const select=document.getElementById('lgType');if(select&&!select.querySelector('[value=refund]')){const option=document.createElement('option');option.value='refund';option.textContent='退款变动';select.appendChild(option);}if(window.lgRender)window.lgRender();
  }
 }
 function originalOrders(s){
  if(path==='recharge-list')document.querySelectorAll('#rechargeRecords tr').forEach(row=>{
   const id=row.cells[0]?.textContent.trim();if(!/^RC/.test(id))return;
   const o=R.order(s,'recharge',id);if(o&&o.invoice==='开票待审核'){row.cells[7].textContent=o.invoice;row.dataset.invoice='processing';}
  });
  if(path==='consumption-list')document.querySelectorAll('#rows tr').forEach(row=>{
   const id=row.querySelector('.order')?.textContent;if(!id)return;
   const o=R.order(s,'consumption',id);if(o&&(o.returned||o.invoice==='开票待审核'))row.cells[9].textContent=o.returned?'已退豆，不可开票':o.invoice;
  });
  if(path==='consumption-view'){
   const id=document.getElementById('order')?.textContent;
   const o=R.order(s,'consumption',id);if(o&&(o.returned||o.invoice==='开票待审核'))document.getElementById('invoiceStatus').textContent=o.returned?'已退豆，不可开票':o.invoice;
  }
 }
 function invoice(s){
  const type=path==='invoice-add'?'recharge':path==='invoice-add-from-consumption'?'consumption':null;if(!type)return;
  document.querySelectorAll('.record').forEach(box=>{
   const id=box.getAttribute('aria-label')?.replace('选择 ','');box.dataset.refundOrder=id;
   const reason=R.invoiceReason(s,type,id);box.disabled=!!reason;if(reason)box.checked=false;
   const row=box.closest('tr');let notice=row.querySelector('.rf-reason');if(!notice){notice=document.createElement('span');notice.className='rf-reason';row.lastElementChild.appendChild(notice);}notice.textContent=reason;
  });
  const update=()=>{
   document.querySelectorAll('.record:disabled').forEach(b=>{b.checked=false;});
   const selected=[...document.querySelectorAll('.record:checked')],available=[...document.querySelectorAll('.record:not(:disabled)')];
   const total=selected.reduce((n,b)=>n+Math.round(Number(b.dataset.amount)*100),0);
   document.getElementById('total').textContent='¥'+R.fmt(total);
   const all=document.getElementById('selectAll');if(all){all.disabled=!available.length;all.checked=available.length>0&&selected.length===available.length;}
  };update();if(!document.body.dataset.refundInvoiceBound){document.body.dataset.refundInvoiceBound='';document.addEventListener('change',update);}
 }
 function settlement(s){
  if(!['revenue-list','settlement-list','reconciliation-list'].includes(path)||role==='user')return;
  if(!T.hasPermission()){document.getElementById('refundSettlementImpact')?.remove();return;}
  const rows=s.refunds.filter(r=>r.type==='consumption'&&(R.active(r)||r.status==='completed'));
  let panel=document.getElementById('refundSettlementImpact');
  if(!panel){panel=document.createElement('section');panel.id='refundSettlementImpact';panel.className='rf-embedded';document.querySelector('.main-content').appendChild(panel);}
  if(path==='reconciliation-list'){
   const b=R.summary(s),returned=s.ledger.reduce((n,l)=>n+(l.name==='消费退豆'?l.totalDelta:0),0),deducted=-s.ledger.reduce((n,l)=>n+(l.name==='充值退款扣豆'?l.totalDelta:0),0);
   panel.innerHTML='<h3>本次退款账本核对</h3><p>期初 '+R.fmt(1870000)+' + 消费退豆 '+R.fmt(returned)+' − 充值退款 '+R.fmt(deducted)+' = 期末 '+R.fmt(b.total)+' 彩豆</p><p>退款冻结 '+R.fmt(b.frozen)+' · 可用 '+R.fmt(b.available)+' 彩豆。冻结与解冻不改变总额。</p>';return;
  }
  panel.innerHTML='<h3>消费退款结算调整</h3>'+(rows.length?'<div style="overflow-x:auto"><table><thead><tr><th>消费单</th><th>退款状态</th><th>原应收</th><th>调整金额</th><th>结算处理</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+r.orderId+'</td><td>'+label(r)+'</td><td>¥'+R.fmt(r.originalReceivable)+'</td><td>'+(r.status==='completed'?'¥'+R.fmt(r.adjustment):'—')+'</td><td>'+(r.status==='completed'?'调整后应收 ¥'+R.fmt(r.finalReceivable):'暂缓对应消费收入结算')+'</td></tr>').join('')+'</tbody></table></div>':'<p>暂无消费退款占用或调整。</p>');
 }
 function invoiceRequests(s){
  if(role==='developer')return;
  const requests=s.invoiceRequests||[];
  if(path==='invoice-success'){
   const request=requests.find(x=>x.id===new URLSearchParams(location.search).get('request'));
   if(request){document.getElementById('invoiceNo').textContent=request.id;document.getElementById('amount').textContent='¥'+R.fmt(request.amount);}return;
  }
  if(path!=='invoice-list'||!requests.length)return;
  let panel=document.getElementById('refundInvoiceRequests');
  if(!panel){panel=document.createElement('section');panel.id='refundInvoiceRequests';panel.className='rf-embedded';document.querySelector('.main-content').prepend(panel);}
  panel.innerHTML='<h3>新增开票申请</h3><div style="overflow-x:auto"><table><thead><tr><th>申请单号 / 原订单</th><th>来源</th><th>金额</th><th>申请时间</th><th>状态</th><th>操作</th></tr></thead><tbody>'+requests.map(r=>'<tr><td>'+r.id+'<small style="display:block">'+r.ids.join('、')+'</small></td><td>'+(r.type==='recharge'?'充值':'智能体消费')+'</td><td>¥'+R.fmt(r.amount)+'</td><td>'+r.created+'</td><td>'+r.status+(r.note?'<small style="display:block">'+esc(r.note)+'</small>':'')+'</td><td>'+(r.status==='待审核'&&(role==='admin'||T.actor()==='owner')?'<button type="button" class="btn btn-sm btn-outline" data-invoice-release="'+r.id+'">'+(role==='admin'?'驳回申请':'撤销申请')+'</button>':'—')+'</td></tr>').join('')+'</tbody></table></div>';
  panel.querySelectorAll('[data-invoice-release]').forEach(button=>button.onclick=()=>{
   const dialog=document.createElement('dialog');dialog.className='rf-dialog';dialog.setAttribute('aria-label',role==='admin'?'驳回开票申请':'撤销开票申请');
   dialog.innerHTML='<h3>'+(role==='admin'?'驳回':'撤销')+'开票申请</h3><p>处理后释放所选订单的开票占用；如需退款，仍需重新校验退款条件。</p><label for="invoiceReleaseReason">处理原因</label><textarea id="invoiceReleaseReason" maxlength="500" style="width:100%;min-height:90px;margin-top:8px;border:1px solid #bdcce3;border-radius:8px;padding:10px;font:inherit"></textarea><p class="rf-error" role="alert"></p><div class="rf-actions"><button class="btn btn-outline" data-close type="button">取消</button><button class="btn btn-primary" data-submit type="button">确认</button></div>';
   document.body.appendChild(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.querySelector('[data-close]').onclick=()=>dialog.close();
   dialog.querySelector('[data-submit]').onclick=async e=>{const submit=e.currentTarget;submit.disabled=true;try{await T.commit({kind:role==='admin'?'invoice_reject':'invoice_cancel',id:button.dataset.invoiceRelease,note:dialog.querySelector('textarea').value});dialog.close();}catch(error){dialog.querySelector('.rf-error').textContent=error.message;submit.disabled=false;}};
   dialog.showModal();dialog.querySelector('textarea').focus();
  });
 }
 function render(){try{nav();const s=T.read();if(role==='user'){balances(s);originalOrders(s);invoice(s);}else settlement(s);invoiceRequests(s);}catch(e){let el=document.getElementById('refundDataError');if(!el){el=document.createElement('p');el.id='refundDataError';el.className='rf-error';el.setAttribute('role','alert');document.querySelector('.main-content')?.prepend(el);}el.textContent='退款记录暂不可用：'+e.message;}}
 window.addEventListener('refundchange',render);render();
})();
