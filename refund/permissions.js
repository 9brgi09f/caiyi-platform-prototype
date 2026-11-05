(function(){
 'use strict';
 const R=window.CaiyiRefund,T=window.RefundRuntime,root=document.getElementById('refundMenuPermissions');
 const $=id=>document.getElementById(id),drafts=new Map(),busy=new Set();
 const fields={owner:['企业用户端','单位主账号','申请退款、撤销申请、查看本单位退款'],member:['企业用户端','单位子账号','申请退款、撤销申请、查看本单位退款'],developer:['开发者端','开发者账号','审核自身智能体消费退豆'],admin:['平台运营端','平台管理员','平台终审、线下付款登记']};
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(){
  try{
   if(T.actor()!=='admin')throw Error('当前账号无菜单授权管理权限');
   const s=T.read();
   $('refundPermissionRows').innerHTML=Object.entries(fields).map(([target,[end,account,operations]])=>{
    const enabled=drafts.has(target)?drafts.get(target).enabled:R.hasMenuPermission(s,target);
    return '<tr><td>'+end+'</td><td>'+account+'</td><td><label class="rf-menu-check"><input data-refund-permission="'+target+'" type="checkbox" '+(enabled?'checked ':'')+(busy.has(target)?'disabled ':'')+'aria-label="'+end+' '+account+' 退款管理"/>退款管理</label></td><td>'+operations+'</td><td><button class="btn btn-sm btn-outline" data-save-menu="'+target+'" type="button" '+(busy.has(target)?'disabled':'')+'>保存</button></td></tr>';
   }).join('');
   $('refundPermissionHistory').innerHTML=s.menuPermissionHistory.length?s.menuPermissionHistory.map(h=>'<tr><td>'+esc(h.time)+'</td><td>'+esc(R.permissionTargets[h.target])+'</td><td>'+(h.enabled?'授予':'取消')+'退款管理权限</td><td>'+esc(h.actor)+'</td></tr>').join(''):'<tr><td colspan="4">暂无授权记录</td></tr>';
   root.querySelectorAll('[data-refund-permission]').forEach(input=>input.onchange=()=>{
    const target=input.dataset.refundPermission;
    if(!drafts.has(target))drafts.set(target,{expectedEnabled:R.hasMenuPermission(s,target),enabled:input.checked});
    else drafts.get(target).enabled=input.checked;
    $('refundPermissionStatus').textContent='权限修改尚未保存';
   });
   root.querySelectorAll('[data-save-menu]').forEach(button=>button.onclick=()=>save(button.dataset.saveMenu));
  }catch(error){$('refundPermissionError').textContent=error.message;root.querySelectorAll('input,button').forEach(el=>el.disabled=true);}
 }
 async function save(target){
  if(busy.has(target))return;
  try{
   const latest=T.read(),change=drafts.get(target)||{expectedEnabled:R.hasMenuPermission(latest,target),enabled:R.hasMenuPermission(latest,target)};
   busy.add(target);$('refundPermissionError').textContent='';$('refundPermissionStatus').textContent='';render();
   await T.commit({kind:'set_menu_permission',target,...change});drafts.delete(target);
   $('refundPermissionStatus').textContent=R.permissionTargets[target]+'的退款管理权限已'+(change.enabled?'授予':'取消');
  }catch(error){$('refundPermissionError').textContent='保存失败：'+error.message;}
  finally{busy.delete(target);render();}
 }
 window.addEventListener('refundchange',render);render();
})();
