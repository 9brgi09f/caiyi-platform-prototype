from pathlib import Path

checks = {
    "user/enterprise-bean.html": [
        '<div class="lab"><i></i>本月企业消费</div><div class="num">800 <small>彩豆</small></div>',
        "陈晓 · 政府采购数据分析智能体",
        "企业来源",
        "−80.00 彩豆",
        "成员额度预警 1 人；已达上限 1 人",
    ],
    "user/enterprise-bean-members.html": [
        "张敏", "王晨", "陈晓", "额度预警", "已达上限",
        "企业来源已用 380 / 1,000", "width:38%", "正常",
        "企业来源已用 340 / 400", "width:85%",
        '<div class="quota-value">已用 80 / 80</div>',
        '<span class="qstate full quota-status danger">已达上限</span>',
        '<i class="full quota-progress danger" style="width:100%"></i>',
        "100%",
        "已用达周期额度 80% 触发预警，达 100% 后停止企业扣减",
    ],
}

for file_name, tokens in checks.items():
    content = Path(file_name).read_text(encoding="utf-8")
    for token in tokens:
        assert token in content, f"{file_name} 缺少 {token}"

for file_name in ["user/enterprise-bean.html", "user/enterprise-bean-members.html"]:
    content = Path(file_name).read_text(encoding="utf-8")
    assert "820" not in content, f"{file_name} 仍存在 820 旧口径"

members = Path("user/enterprise-bean-members.html").read_text(encoding="utf-8")
for token in ["380", "1000", "340", "400", "80 / 80", "100%", "正常", "额度预警", "已达上限"]:
    assert token in members, f"成员额度页缺少 {token}"

for token in ["已达上限成员", "已达上限成员</span><b style=\"color:#c0392b\">1 人</b>"]:
    assert token in members, f"成员额度页缺少满额统计 {token}"

consumption = Path("user/consumption-list.html").read_text(encoding="utf-8")
for token in ["800", "陈晓", "80"]:
    assert token in consumption, f"消费记录页缺少 {token}"
assert consumption.count("陈晓") == 1, "消费记录页必须仅保留一笔陈晓消费"
assert consumption.count("80") >= 1, "消费记录页缺少陈晓 80 彩豆消费"
assert "820" not in consumption, "消费记录页仍存在 820 旧口径"

for token in ["企业授权记录", "发票资格", "额度/共享池变动"]:
    assert token not in consumption, f"消费记录页仍保留非核心列 {token}"
for token in ["开票状态", "invoice-status eligible", "invoice-status pending", "consumption-view.html?order="]:
    assert token in consumption, f"消费记录页缺少开票状态或详情入口 {token}"

for token in ["<th>消费单号</th>", "<th>消费时间</th>", "<th>智能体</th>", '<th class="org-only" data-org-only>使用者</th>', "agent-name", "<td class=\"org-only\" data-org-only><span class=\"mem\">张敏</span></td>"]:
    assert token in consumption, f"消费记录页缺少按视图区分的列 {token}"
assert "智能体与使用者" not in consumption, "消费记录页仍保留合并的智能体与使用者列"
assert "订单号：QA-TEST-XF-" not in consumption, "消费记录页仍保留旧订单号展示形式"
