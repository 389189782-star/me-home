const STORAGE_KEY = "laowu_five_dimension_records_v1";

const fields = [
  "sampleMode",
  "sampleNo",
  "sampleName",
  "launchDate",
  "days",
  "turnover",
  "reviewMove",
  "platformExists",
  "amplitude",
  "lowStructure",
  "maSupport",
  "startMode",
  "bodyQuality",
  "maPosition",
  "volumeMultiple",
  "volumePosition",
  "volumeRhythm",
  "macd",
  "lon",
  "sync",
  "monthly",
  "weekly",
  "wash",
  "note",
];

const selectText = {
  platformExists: {
    10: "是，边界清晰",
    5: "有，但边界一般",
    0: "否，平台不清楚",
  },
  amplitude: {
    7: "收敛，波动压缩",
    4: "一般，仍有波动",
    0: "发散，波动较乱",
  },
  lowStructure: {
    8: "低点抬高",
    4: "低点持平",
    0: "低点下移",
  },
  maSupport: {
    5: "多次获得支撑",
    3: "偶尔跌破后收回",
    0: "多次跌破且弱",
  },
  startMode: {
    9: "平台末端突破",
    6: "台阶式推升",
    0: "冲高假突破感强",
  },
  bodyQuality: {
    8: "实体较强",
    4: "实体一般",
    0: "上影线太长",
  },
  maPosition: {
    8: "站上关键均线",
    5: "贴近均线启动",
    0: "仍在均线下方",
  },
  volumePosition: {
    6: "平台末端",
    3: "突破当天",
    1.5: "拉升途中",
  },
  volumeRhythm: {
    6: "温和放大，后续承接",
    2: "放量后快速缩量",
    0: "放量后衰减明显",
  },
  macd: {
    5: "0轴上金叉 / 红柱放大",
    2.5: "有改善但不强",
    0: "未共振",
  },
  lon: {
    5: "0轴上金叉 / 红柱放大",
    2.5: "有改善但不强",
    0: "未共振",
  },
  sync: {
    5: "同步加强",
    3: "部分同步",
    0: "不同步",
  },
  monthly: {
    3: "多头",
    1.5: "横盘",
    0: "空头",
  },
  weekly: {
    4: "转强",
    2: "震荡",
    0: "转弱",
  },
  wash: {
    3: "有，且回收快",
    0: "无或不明显",
  },
};

function byId(id) {
  return document.getElementById(id);
}

function numeric(id) {
  const value = Number.parseFloat(byId(id).value);
  return Number.isFinite(value) ? value : 0;
}

function selected(id) {
  return Number.parseFloat(byId(id).value) || 0;
}

function optionLabel(id) {
  const el = byId(id);
  return el.options[el.selectedIndex]?.textContent.trim() || "";
}

function isWatchMode() {
  return byId("sampleMode").value === "watch";
}

function modeName() {
  return isWatchMode() ? "观察样本" : "历史样本";
}

function formatScore(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function scoreVolumeMultiple(value) {
  if (value >= 1.5) return 8;
  if (value >= 1.2 && value < 1.5) return 5;
  if (value >= 1 && value < 1.2) return 3;
  return 0;
}

function scoreLevel(total) {
  if (total <= 0) return "待填写";
  if (total >= 85) return "结构记录很强";
  if (total >= 75) return "结构记录偏强";
  if (total >= 60) return "结构记录一般";
  return "结构记录偏弱";
}

function hasAnyRecordInput() {
  const data = getFormData();
  return [
    "sampleNo",
    "sampleName",
    "launchDate",
    "days",
    "turnover",
    "reviewMove",
    "volumeMultiple",
    "note",
  ].some((field) => data[field]);
}

function getFormData() {
  return Object.fromEntries(fields.map((field) => [field, byId(field).value.trim()]));
}

function setFormData(data) {
  fields.forEach((field) => {
    if (data[field] !== undefined) {
      byId(field).value = data[field];
    }
  });
  updateUI();
}

function computeScores() {
  const volumeMultiple = numeric("volumeMultiple");
  const platform =
    selected("platformExists") +
    selected("amplitude") +
    selected("lowStructure") +
    selected("maSupport");
  const kline = selected("startMode") + selected("bodyQuality") + selected("maPosition");
  const volume =
    scoreVolumeMultiple(volumeMultiple) + selected("volumePosition") + selected("volumeRhythm");
  const indicator = selected("macd") + selected("lon") + selected("sync");
  const bonus = selected("monthly") + selected("weekly") + selected("wash");
  const total = Math.min(100, platform + kline + volume + indicator + bonus);

  return {
    platform,
    kline,
    volume,
    indicator,
    bonus,
    total,
    volumeMultiple,
  };
}

function collectWarnings(scores) {
  if (!hasAnyRecordInput() && scores.total === 0) {
    return [`先填写一条${modeName()}，再看扣分提醒。`];
  }

  const warnings = [];

  if (selected("platformExists") === 0) warnings.push("启动前缺少清晰平台，后续复盘不要只看突破当天。");
  if (selected("amplitude") === 0) warnings.push("平台振幅发散，说明平台后期并不稳定。");
  if (selected("lowStructure") === 0) warnings.push("低点结构下移，平台重心没有抬高。");
  if (selected("maSupport") === 0) warnings.push("平台期多次跌破关键均线，均线承接偏弱。");
  if (selected("startMode") === 0) warnings.push("启动方式更像假突破，不能只看一根冲高 K 线。");
  if (selected("bodyQuality") === 0) warnings.push("启动 K 线上影线偏长，说明当天分歧较大。");
  if (selected("maPosition") === 0) warnings.push("启动日未站上关键均线，上方压力仍要记录。");
  if (scores.volumeMultiple < 1.2) warnings.push("倍量不足，突破当天量能配合偏弱。");
  if (scores.volumeMultiple > 4) warnings.push("量能过大，注意过早天量或兑现压力。");
  if (selected("volumePosition") === 1.5) warnings.push("放量发生在拉升途中，位置不如平台末端干净。");
  if (selected("volumeRhythm") === 0) warnings.push("突破后量能衰减，持续性需要谨慎记录。");
  if (selected("macd") === 0) warnings.push("MACD 没有形成强同步，指标共振不足。");
  if (selected("lon") === 0) warnings.push("LON 没有形成强同步，中线趋势配合不足。");
  if (selected("sync") === 0) warnings.push("MACD 和 LON 不同步，指标信号不够一致。");
  if (selected("monthly") === 0) warnings.push("月线为空头，大周期没有配合。");
  if (selected("weekly") === 0) warnings.push("周线未转强，日线突破缺少更大周期支持。");

  return warnings.length
    ? warnings
    : ["暂无明显扣分提醒，仍需结合真实历史图和后续走势复查。"];
}

function buildRecord(scores, warnings) {
  const data = getFormData();
  const watchMode = isWatchMode();
  const warningLine = warnings[0].startsWith("暂无")
    ? warnings[0]
    : warnings.slice(0, 3).join("；");
  const note = data.note || "这个样本先按结构记录，不做当前行情推断。";

  return [
    `记录模式：${modeName()}`,
    `样本编号：${data.sampleNo || "未填写"}`,
    `启动日：${data.launchDate || "未填写"}`,
    `整理周期：${data.days || "未填写"}天`,
    `倍量：约${data.volumeMultiple || "未填写"}倍`,
    `换手：${data.turnover || "未填写"}%`,
    `${watchMode ? "后续记录" : "回溯涨幅"}：${data.reviewMove || (watchMode ? "待记录" : "未填写")}`,
    `五维记录分：${formatScore(scores.total)}分（${scoreLevel(scores.total)}）`,
    `分项记录：平台${formatScore(scores.platform)}/30，启动K线${formatScore(scores.kline)}/25，量能${formatScore(scores.volume)}/20，指标${formatScore(scores.indicator)}/15，大周期${formatScore(scores.bonus)}/10`,
    `主要扣分项：${warningLine}`,
    `一句话复盘：${note}`,
    watchMode
      ? "边界：这是观察样本的个人记录，不提供个股判断，也不作为买卖依据。"
      : "边界：这是历史样本复盘记录，不提供当前个股判断，也不作为买卖依据。",
  ].join("\n");
}

function shortSampleNo(value) {
  return value || "样本 No.xxx";
}

function updateRecordCard(scores, warnings) {
  const data = getFormData();
  const watchMode = isWatchMode();
  byId("cardTitle").textContent = shortSampleNo(data.sampleNo);
  byId("cardScore").textContent = `${formatScore(scores.total)}分`;
  byId("cardDays").textContent = data.days ? `${data.days}天` : "--天";
  byId("cardVolume").textContent = data.volumeMultiple ? `${data.volumeMultiple}倍` : "--倍";
  byId("cardTurnover").textContent = data.turnover ? `${data.turnover}%` : "--%";
  byId("cardMoveLabel").textContent = watchMode ? "后续记录" : "回溯表现";
  byId("cardMove").textContent = data.reviewMove || (watchMode ? "待记录" : "--");
  byId("cardWarning").textContent = warnings[0].startsWith("暂无")
    ? watchMode
      ? "暂无明显扣分提醒，后续只作个人观察记录。"
      : "暂无明显扣分提醒，仍需结合真实历史图复查。"
    : warnings[0];
  byId("cardNote").textContent = watchMode
    ? "观察样本只作个人记录，不提供个股判断，不构成投资建议。"
    : "只记录历史样本，不预测未来。个人复盘记录，不构成投资建议。";
}

function updateModeText() {
  const watchMode = isWatchMode();
  byId("reviewMoveTitle").textContent = watchMode ? "后续记录" : "回溯表现";
  byId("reviewMove").placeholder = watchMode ? "例如 待记录 / 观察中" : "例如 +96% / -30%";
  byId("modeNote").textContent = watchMode
    ? "观察样本模式只记录结构，不判断当前个股；后续表现需要自己继续补记。"
    : "历史样本模式用于记录已经走完一段的图形，方便后续复查和归档。";
}

function updateMeter(id, labelId, value, max) {
  byId(id).value = value;
  byId(id).style.width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
  byId(labelId).textContent = `${formatScore(value)}/${max}`;
}

function updateUI() {
  const scores = computeScores();
  const warnings = collectWarnings(scores);

  byId("totalScore").textContent = `${formatScore(scores.total)}分`;
  byId("scoreLevel").textContent = scoreLevel(scores.total);
  updateMeter("platformMeter", "platformScore", scores.platform, 30);
  updateMeter("klineMeter", "klineScore", scores.kline, 25);
  updateMeter("volumeMeter", "volumeScore", scores.volume, 20);
  updateMeter("indicatorMeter", "indicatorScore", scores.indicator, 15);
  updateMeter("bonusMeter", "bonusScore", scores.bonus, 10);

  byId("warnings").innerHTML = warnings.map((item) => `<li>${item}</li>`).join("");
  byId("recordOutput").value = buildRecord(scores, warnings);
  updateModeText();
  updateRecordCard(scores, warnings);
}

function readRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  renderSavedList();
}

function currentRecord() {
  const scores = computeScores();
  const warnings = collectWarnings(scores);
  return {
    id: `record-${Date.now()}`,
    createdAt: new Date().toISOString(),
    data: getFormData(),
    scores,
    warnings,
    output: buildRecord(scores, warnings),
  };
}

function saveRecord() {
  const records = readRecords();
  records.unshift(currentRecord());
  writeRecords(records.slice(0, 50));
}

function deleteRecord(id) {
  writeRecords(readRecords().filter((record) => record.id !== id));
}

function renderSavedList() {
  const records = readRecords();
  const list = byId("savedList");
  if (!records.length) {
    list.innerHTML = '<p class="empty">还没有保存记录。</p>';
    return;
  }

  list.innerHTML = records
    .map((record) => {
      const no = record.data.sampleNo || "未命名";
      const score = formatScore(record.scores.total);
      return `
        <div class="saved-item">
          <div>
            <strong>${no}</strong>
            <span>${score}分 · ${record.data.launchDate || "未填日期"}</span>
          </div>
          <button type="button" data-load="${record.id}">载入</button>
          <button type="button" class="delete" data-delete="${record.id}">删除</button>
        </div>
      `;
    })
    .join("");
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function exportCsv() {
  const records = readRecords();
  const items = records.length ? records : [currentRecord()];
  const rows = [
    [
      "样本编号",
      "记录模式",
      "启动日",
      "整理周期",
      "倍量",
      "换手",
      "回溯涨幅",
      "总分",
      "平台",
      "启动K线",
      "量能",
      "指标",
      "大周期",
      "主要扣分项",
      "一句话复盘",
    ],
  ];

  items.forEach((record) => {
    rows.push([
      record.data.sampleNo,
      record.data.sampleMode === "watch" ? "观察样本" : "历史样本",
      record.data.launchDate,
      record.data.days,
      record.data.volumeMultiple,
      record.data.turnover,
      record.data.reviewMove,
      formatScore(record.scores.total),
      formatScore(record.scores.platform),
      formatScore(record.scores.kline),
      formatScore(record.scores.volume),
      formatScore(record.scores.indicator),
      formatScore(record.scores.bonus),
      record.warnings.slice(0, 3).join("；"),
      record.data.note,
    ]);
  });

  download(
    `五维记录_${new Date().toISOString().slice(0, 10)}.csv`,
    rows.map((row) => row.map(csvCell).join(",")).join("\n"),
    "text/csv;charset=utf-8"
  );
}

function exportJson() {
  const records = readRecords();
  const items = records.length ? records : [currentRecord()];
  download(
    `五维记录_${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(items, null, 2),
    "application/json;charset=utf-8"
  );
}

function drawText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const chars = String(text).split("");
  const lines = [];
  let line = "";
  chars.forEach((char) => {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((item, index) => {
    const output = index === maxLines - 1 && lines.length > maxLines ? `${item.slice(0, -1)}…` : item;
    ctx.fillText(output, x, y + index * lineHeight);
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function exportCardPng() {
  const scores = computeScores();
  const warnings = collectWarnings(scores);
  const data = getFormData();
  const watchMode = isWatchMode();
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0f3b36";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f07a22";
  ctx.fillRect(0, 0, 34, canvas.height);
  ctx.fillStyle = "#14514b";
  ctx.fillRect(34, 0, 16, canvas.height);

  ctx.fillStyle = "#9db9b2";
  ctx.font = "700 34px Microsoft YaHei, sans-serif";
  ctx.fillText(`纪律老吴｜主升浪${watchMode ? "观察样本" : "历史样本"}记录`, 96, 120);

  ctx.fillStyle = "#fff6e8";
  ctx.font = "900 78px Microsoft YaHei, sans-serif";
  drawText(ctx, shortSampleNo(data.sampleNo), 96, 235, 860, 88, 2);

  ctx.fillStyle = "#f07a22";
  ctx.font = "900 116px Microsoft YaHei, sans-serif";
  ctx.fillText(`${formatScore(scores.total)}分`, 96, 420);

  ctx.fillStyle = "#fff6e8";
  ctx.font = "800 42px Microsoft YaHei, sans-serif";
  ctx.fillText(scoreLevel(scores.total), 96, 490);

  ctx.fillStyle = "#f07a22";
  ctx.fillRect(96, 540, 690, 9);

  const cards = [
    ["整理周期", data.days ? `${data.days}天` : "--"],
    ["倍量", data.volumeMultiple ? `${data.volumeMultiple}倍` : "--"],
    ["换手", data.turnover ? `${data.turnover}%` : "--"],
    [watchMode ? "后续记录" : "回溯表现", data.reviewMove || (watchMode ? "待记录" : "--")],
  ];

  cards.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 96 + col * 430;
    const y = 620 + row * 158;
    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
    roundRect(ctx, x, y, 386, 118, 12);
    ctx.fill();
    ctx.fillStyle = "#9db9b2";
    ctx.font = "700 26px Microsoft YaHei, sans-serif";
    ctx.fillText(label, x + 28, y + 38);
    ctx.fillStyle = "#fff6e8";
    ctx.font = "900 44px Microsoft YaHei, sans-serif";
    drawText(ctx, value, x + 28, y + 90, 320, 46, 1);
  });

  const warning = warnings[0].startsWith("暂无")
    ? watchMode
      ? "暂无明显扣分提醒，后续只作个人观察记录。"
      : "暂无明显扣分提醒，仍需结合真实历史图复查。"
    : warnings[0];
  ctx.fillStyle = "#fff6e8";
  ctx.font = "800 34px Microsoft YaHei, sans-serif";
  drawText(ctx, `扣分提醒：${warning}`, 96, 1010, 860, 54, 3);

  ctx.fillStyle = "#9db9b2";
  ctx.font = "700 28px Microsoft YaHei, sans-serif";
  drawText(
    ctx,
    watchMode
      ? "观察样本只作个人记录，不提供个股判断，不构成投资建议。"
      : "只记录历史样本，不预测未来。个人复盘记录，不构成投资建议。",
    96,
    1268,
    860,
    42,
    2
  );

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const name = (data.sampleNo || "五维记录卡").replace(/[\\/:*?"<>|]/g, "");
    a.href = url;
    a.download = `${name}_五维记录卡.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

async function copyRecord() {
  const text = byId("recordOutput").value;
  try {
    await navigator.clipboard.writeText(text);
    byId("copyRecord").textContent = "已复制";
    setTimeout(() => {
      byId("copyRecord").textContent = "复制复盘摘要";
    }, 1200);
  } catch {
    byId("recordOutput").select();
    document.execCommand("copy");
  }
}

function loadSample066() {
  setFormData({
    sampleMode: "historical",
    sampleNo: "样本 No.066",
    sampleName: "高分对照样本",
    launchDate: "2010-03-03",
    days: "71",
    turnover: "9.7",
    reviewMove: "+96%",
    platformExists: "10",
    amplitude: "4",
    lowStructure: "0",
    maSupport: "3",
    startMode: "9",
    bodyQuality: "8",
    maPosition: "8",
    volumeMultiple: "4.2",
    volumePosition: "6",
    volumeRhythm: "6",
    macd: "5",
    lon: "5",
    sync: "5",
    monthly: "3",
    weekly: "4",
    wash: "3",
    note: "这个样本不是每一项都完美，平台里也有低点下移和偶尔跌破，但启动 K 线、量能、指标和大周期同时补上了分。",
  });
}

function loadSample067() {
  setFormData({
    sampleMode: "historical",
    sampleNo: "样本 No.067",
    sampleName: "低分对照样本",
    launchDate: "2026-04-22",
    days: "93",
    turnover: "10.6",
    reviewMove: "-30%",
    platformExists: "5",
    amplitude: "0",
    lowStructure: "0",
    maSupport: "0",
    startMode: "9",
    bodyQuality: "0",
    maPosition: "8",
    volumeMultiple: "3",
    volumePosition: "6",
    volumeRhythm: "6",
    macd: "5",
    lon: "5",
    sync: "5",
    monthly: "3",
    weekly: "0",
    wash: "0",
    note: "表面上也有平台、放量和指标共振，但平台发散、低点下移、长上影和周线未转强，把结构分拉下来了。",
  });
}

function clearForm() {
  fields.forEach((field) => {
    const el = byId(field);
    if (el.tagName === "SELECT") {
      el.selectedIndex = 0;
    } else {
      el.value = "";
    }
  });
  updateUI();
}

function init() {
  fields.forEach((field) => {
    byId(field).addEventListener("input", updateUI);
    byId(field).addEventListener("change", updateUI);
  });

  byId("loadSample066").addEventListener("click", loadSample066);
  byId("loadSample067").addEventListener("click", loadSample067);
  byId("saveRecord").addEventListener("click", saveRecord);
  byId("copyRecord").addEventListener("click", copyRecord);
  byId("exportCard").addEventListener("click", exportCardPng);
  byId("exportCsv").addEventListener("click", exportCsv);
  byId("exportJson").addEventListener("click", exportJson);
  byId("clearForm").addEventListener("click", clearForm);

  byId("savedList").addEventListener("click", (event) => {
    const loadId = event.target.dataset.load;
    const deleteId = event.target.dataset.delete;
    if (loadId) {
      const record = readRecords().find((item) => item.id === loadId);
      if (record) setFormData(record.data);
    }
    if (deleteId) deleteRecord(deleteId);
  });

  updateUI();
  renderSavedList();
}

init();
