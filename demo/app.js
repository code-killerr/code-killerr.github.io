const stages = [
  {
    agent: "Protocol Analysis Agent",
    intent: "解析目标、步骤、设备和风险点",
    audit: "协议解析中",
    lines: [
      "目标：96 孔板 qPCR 体系配置、扩增检测和阴性对照异常判断。",
      "关键变量：每孔 20 uL，总计 96 孔；95C/60C 双温区循环；阴性对照由 AI 优先判读。",
      "结构化输出：ProtocolPlan(goal, steps, equipment, constraints, risk_points)。"
    ],
    code: "等待 Code Generation Agent 生成脚本...",
    metrics: ["解析中", "待审计", 0],
    tags: [],
    visualState: "pre-run",
    beforeVision: "实验前样式：孔板位于加样区，试剂槽和移液模块待命。",
    afterVision: "实验后样式尚未生成，等待 dry-run 完成。",
    result: ["待提取", "待分析", "当前 SOP"],
    summary: "Agent 已把自然语言 SOP 拆成可执行任务计划。"
  },
  {
    agent: "Requirement Agent",
    intent: "生成试剂、耗材和设备需求清单",
    audit: "资源清单完成",
    lines: [
      "试剂：qPCR master mix、primer mix、template DNA、nuclease-free water。",
      "耗材：96 well qPCR plate、optical qPCR film、sterile tips。",
      "设备：liquid_handler_alpha、plate_sealer、mini_centrifuge、qpcr_thermocycler、overhead_camera。"
    ],
    metrics: ["材料清单", "待审计", 0],
    tags: [],
    visualState: "pre-run",
    beforeVision: "实验前样式：设备、试剂和耗材已映射到固定台面视角。",
    afterVision: "实验后样式尚未生成，等待 dry-run 完成。",
    result: ["待提取", "待分析", "当前资源清单"],
    summary: "系统已把 SOP 翻译成后续检索和执行所需的资源表。"
  },
  {
    agent: "Feasibility Agent",
    intent: "检查文档、边界、材料和设备是否满足条件",
    audit: "允许生成 dry-run 脚本",
    lines: [
      "文档：已检索到移液工作站、封膜机、离心机、qPCR 仪和顶置相机相关 API/操作文档。",
      "边界：体积、温度、循环数、转速和设备调用均在平台能力范围内。",
      "材料/设备：master mix、primer、template、water、96 孔板、封膜、移液/离心/qPCR/相机条件满足实验要求。"
    ],
    metrics: ["条件满足", "待审计", 0],
    tags: [],
    visualState: "pre-run",
    beforeVision: "实验前样式：硬件边界已确认，真实设备执行仍保持阻断。",
    afterVision: "实验后样式尚未生成，等待 dry-run 完成。",
    result: ["20 uL/孔，40 cycles", "待分析", "当前可行性检查"],
    summary: "可行性通过：文档、能力边界、材料和设备四类条件均满足实验流程要求，进入代码生成。"
  },
  {
    agent: "Code Generation Agent",
    intent: "基于硬件 API 文档生成设备脚本",
    audit: "脚本 hash 已记录",
    lines: [
      "检索设备 API/SDK 示例后生成 Python 风格设备脚本。",
      "将体积、温度、循环数和转速写入显式参数，方便 Safety Gate 审计。",
      "脚本进入审计上下文；若安全检查失败，Agent 会根据反馈自动修订。"
    ],
    code: `def run(device):
    device.liquid_handler_alpha.change_tip()
    for well in range(1, 97):
        device.liquid_handler_alpha.aspirate(volume_ul=10, source="master_mix")
        device.liquid_handler_alpha.dispense(volume_ul=10, target=f"plate:{well}")
        device.liquid_handler_alpha.aspirate(volume_ul=2, source="primer_mix")
        device.liquid_handler_alpha.dispense(volume_ul=2, target=f"plate:{well}")
        device.liquid_handler_alpha.aspirate(volume_ul=3, source="template_dna")
        device.liquid_handler_alpha.dispense(volume_ul=3, target=f"plate:{well}")
        device.liquid_handler_alpha.aspirate(volume_ul=5, source="water")
        device.liquid_handler_alpha.dispense(volume_ul=5, target=f"plate:{well}")
    device.plate_sealer.seal(plate="qpcr_plate")
    device.mini_centrifuge.spin(seconds=20, rpm=1000)
    device.qpcr_thermocycler.set_program(temperature_c=95, cycles=40)
    device.qpcr_thermocycler.start_run()`,
    metrics: ["条件满足", "待审计", 0],
    tags: [],
    visualState: "pre-run",
    beforeVision: "实验前样式：孔板仍在加样区，等待 Safety Gate 放行。",
    afterVision: "实验后样式尚未生成，等待 dry-run 完成。",
    result: ["95C/60C，1000 rpm", "待分析", "当前脚本参数"],
    summary: "脚本已生成，下一步进行语法、阈值、合规和设备边界审计。"
  },
  {
    agent: "Safety Gate",
    intent: "执行前审计脚本风险",
    audit: "安全检查通过",
    lines: [
      "AST 语法检查通过，未发现动态执行入口。",
      "阈值检查通过：95C、40 cycles、1000 rpm 均在设备能力边界内。",
      "合规检查通过：未发现文件系统、网络、进程、危险模块或越权设备调用。"
    ],
    metrics: ["条件满足", "已通过", 0],
    tags: ["syntax passed", "threshold passed", "compliance passed"],
    visualState: "pre-run",
    beforeVision: "实验前样式：安全闸已通过，系统准备进入 dry-run。",
    afterVision: "实验后样式尚未生成，等待动作模拟完成。",
    result: ["95C 2 min + 40 cycles", "待分析", "当前安全报告"],
    summary: "当前演示脚本通过安全闸检查，允许进入 dry-run。后续接入真实评测集后，再展示量化结果。"
  },
  {
    agent: "Script Executor",
    intent: "以 dry-run 模式执行并生成审计日志",
    audit: "workflow.run.completed",
    lines: [
      "执行模式：dry-run，真实设备调用保持阻断。",
      "已模拟 96 孔加样、封膜、短暂离心、qPCR 程序设置和启动。",
      "审计事件：workflow.run.completed；执行状态：completed。"
    ],
    metrics: ["条件满足", "已通过", 0],
    tags: ["dry-run", "completed", "audited"],
    visualState: "running",
    beforeVision: "实验前样式：孔板从加样区出发，执行动作被审计日志记录。",
    afterVision: "实验后样式：孔板已封膜并转入 qPCR 槽位，等待 YOLO 读取现场证据。",
    result: ["20 uL/孔，96 孔", "孔板已转入 qPCR 槽位", "当前执行日志"],
    summary: "设备动作顺序已通过模拟执行，审计日志可追溯。"
  },
  {
    agent: "Result Interpretation Agent",
    intent: "主动调用 YOLO 判断实验现场状态",
    audit: "视觉证据已采集",
    lines: [
      "调用 YOLO 检测孔板、封膜、溢液和槽位状态。",
      "视觉证据：sealed_96_well_plate 0.94；no_visible_spill 0.91；plate_in_qpcr_slot 0.89。",
      "Agent 判断：关键状态完整，允许采集扩增曲线，并由 AI 继续判读阴性对照是否异常。"
    ],
    metrics: ["条件满足", "已通过", 3],
    tags: ["sealed_96_well_plate 0.94", "no_visible_spill 0.91", "plate_in_qpcr_slot 0.89"],
    visualState: "detected",
    beforeVision: "实验前样式：孔板在加样区，未显示封膜和检测框。",
    afterVision: "识别后样式：孔板已封膜、未见明显溢液、孔板位于 qPCR 槽位。",
    result: ["Ct 阈值待曲线计算", "封膜正常，无明显溢液", "当前视觉证据"],
    summary: "视觉模型负责识别，Agent 负责实验语义判断，形成现场反馈闭环。"
  },
  {
    agent: "Result Summary Agent",
    intent: "根据当前实验结果和历史实验记忆生成最终分析",
    audit: "AI 判读完成",
    lines: [
      "当前实验结果：20 uL/孔；95C 2 min；40 cycles；孔板已封膜并位于 qPCR 槽位；未见明显溢液。",
      "实验记忆对照：历史 qPCR 阴性对照应无有效扩增；同类流程中封膜完整、无溢液、槽位正确时判定为可分析状态。",
      "AI 最终分析：当前现象与历史正常基线一致，阴性对照未见异常扩增信号，本次 qPCR 结果有效。"
    ],
    metrics: ["条件满足", "已通过", 3],
    tags: ["curve-ready", "negative-control-normal", "ai-result-ready"],
    visualState: "detected",
    beforeVision: "实验前样式：同一视角保留为对照基线。",
    afterVision: "识别后样式：3 条视觉证据已并入最终证据链。",
    result: ["20 uL/孔；40 cycles", "无溢液；阴性对照正常", "当前结果 + 历史记忆"],
    summary: "AI 根据当前实验结果绘制最终分析，并调用历史 qPCR 记忆作为基线对照：当前参数满足实验设置，现场现象与历史正常流程一致，阴性对照未见异常扩增信号，判定本次结果有效。"
  }
];

let current = 0;
let timer = null;

const runBtn = document.getElementById("runBtn");
const resetBtn = document.getElementById("resetBtn");
const output = document.getElementById("agentOutput");
const agentName = document.getElementById("agentName");
const stageIntent = document.getElementById("stageIntent");
const auditState = document.getElementById("auditState");
const codeBlock = document.getElementById("codeBlock");
const statusBadge = document.getElementById("statusBadge");
const retrievalMetric = document.getElementById("retrievalMetric");
const safetyMetric = document.getElementById("safetyMetric");
const visionMetric = document.getElementById("visionMetric");
const summaryText = document.getElementById("summaryText");
const curveStatus = document.getElementById("curveStatus");
const controlStatus = document.getElementById("controlStatus");
const nextActionStatus = document.getElementById("nextActionStatus");
const yoloTags = document.getElementById("yoloTags");
const visionOverlay = document.getElementById("visionOverlay");
const visualFrame = document.getElementById("visualFrame");
const beforeVisionText = document.getElementById("beforeVisionText");
const afterVisionText = document.getElementById("afterVisionText");

function renderStage(index) {
  current = index;
  document.querySelectorAll(".stage").forEach((stage, idx) => {
    stage.classList.toggle("active", idx <= index);
    stage.classList.toggle("current", idx === index);
  });

  const stage = stages[index];
  agentName.textContent = stage.agent;
  stageIntent.textContent = stage.intent;
  auditState.textContent = stage.audit;
  statusBadge.textContent = index === stages.length - 1 ? "Completed" : "Running";
  output.innerHTML = stage.lines.map((line) => `<div class="line-item">${line}</div>`).join("");

  if (stage.code) {
    codeBlock.textContent = stage.code;
  }

  retrievalMetric.textContent = stage.metrics[0];
  safetyMetric.textContent = stage.metrics[1];
  visionMetric.textContent = stage.metrics[2];
  yoloTags.innerHTML = stage.tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
  summaryText.textContent = stage.summary;
  curveStatus.textContent = stage.result[0];
  controlStatus.textContent = stage.result[1];
  nextActionStatus.textContent = stage.result[2];
  beforeVisionText.textContent = stage.beforeVision;
  afterVisionText.textContent = stage.afterVision;

  const hasVision = stage.metrics[2] > 0;
  visualFrame.classList.remove("pre-run", "running", "detected");
  visualFrame.classList.add(stage.visualState);
  visionOverlay.textContent = hasVision ? "识别后样式" : stage.visualState === "running" ? "实验后样式" : "实验前样式";
  visionOverlay.classList.toggle("idle", !hasVision);
  visionOverlay.classList.toggle("confirmed", hasVision);
}

function runWorkflow() {
  clearInterval(timer);
  renderStage(0);
  timer = setInterval(() => {
    if (current >= stages.length - 1) {
      clearInterval(timer);
      return;
    }
    renderStage(current + 1);
  }, 1050);
}

function resetWorkflow() {
  clearInterval(timer);
  renderStage(0);
  statusBadge.textContent = "Ready";
}

runBtn.addEventListener("click", runWorkflow);
resetBtn.addEventListener("click", resetWorkflow);

document.querySelectorAll(".stage").forEach((stage) => {
  stage.addEventListener("click", () => {
    clearInterval(timer);
    renderStage(Number(stage.dataset.stage));
  });
});

renderStage(0);
statusBadge.textContent = "Ready";
auditState.textContent = "未开始";
