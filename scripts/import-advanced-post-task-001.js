const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const post = {
  title: "前端性能深水区：从 INP 到主线程调度的系统化优化实战",
  slug: "frontend-performance-inp-main-thread-scheduling-playbook",
  excerpt:
    "这是一篇面向中高级前端的长文，聚焦交互性能优化的完整链路：指标选择、性能剖析、任务切片、调度策略、渲染拆分与回归验证。",
  createdAt: "2022-09-15T09:00:00.000Z",
  category: "性能工程",
  tags: ["INP", "Web Vitals", "Performance", "JavaScript", "架构实践"],
  content: `## 前言：为什么“页面已经很快了”仍然会被用户吐槽卡顿

很多团队在性能治理里做了大量工作：CDN、图片压缩、SSR、缓存、预加载、懒加载，LCP 看起来不错，首屏也不慢，但真实反馈仍是“点了没反应”“输入时有延迟”“筛选一多就卡”。

问题在于，首屏速度只是体验的一部分。随着业务复杂度上升，真正决定体感的是**交互阶段的主线程竞争**。用户在输入、点击、滚动、切换筛选时，页面是否能快速响应，核心就是 INP（Interaction to Next Paint）背后的那条执行链路。

这篇文章不讲零散技巧，而是给你一套可复用的体系：如何定位问题、如何改、如何验证、如何避免回退。

---

## 一、先统一目标：我们到底在优化什么

在内容站和管理后台里，交互卡顿往往来自这几类场景：

1. 搜索框输入后触发高频筛选，CPU 飙升。
2. 表格排序/过滤时做了大量同步计算。
3. 点击展开详情后，主线程被重渲染和布局计算长期占用。
4. 切换路由时，组件树更新过大且存在阻塞任务。

这些问题的共同点是：不是“网络慢”，而是**主线程被长任务占满**，导致用户输入无法及时得到下一帧反馈。

实践中建议设定两层目标：

1. 体验目标：核心交互稳定在“可接受延迟”内，连续操作不掉帧。
2. 工程目标：建立可观测、可定位、可回归的性能基线，而不是一次性调优。

---

## 二、定位阶段：先抓“长任务”，再谈优化策略

很多优化失败，不是技术不够，而是顺序错了。正确顺序应该是：

1. 找到最差交互路径（不是平均路径）。
2. 找到这条路径中最重的长任务。
3. 再决定该拆分、降级、延后还是异步化。

### 2.1 你应该优先采集的数据

1. 交互事件类型：click、input、keydown、change。
2. 事件到下一次绘制之间的耗时分布（P75/P95）。
3. 长任务堆栈热点：哪些函数长期出现在高耗时片段。
4. 设备分层：中低端机与高端机分开看，避免均值掩盖问题。

### 2.2 两类常见“伪优化”

1. 只看 Lighthouse 单次分数，不看真实交互。
2. 把所有问题都归结为“虚拟列表没上”，忽略计算与渲染争抢。

---

## 三、优化核心：把“不可中断的大块工作”拆成可调度的小任务

主线程卡顿往往不是因为任务多，而是因为任务太“整块”。只要单次任务超过一帧预算，用户就会感知到顿挫。

### 3.1 任务切片策略（Chunking）

适合场景：大数组过滤、复杂排序、文本高亮、批量映射。

关键原则：

1. 把总工作切成多个小批次。
2. 每批次之间让出执行权，给输入和渲染机会。
3. 保持结果可渐进展示，不必等待全量完成。

这种策略的价值在于：你可能没有减少总计算量，但显著提升了“可响应性”。

### 3.2 事件优先级管理

很多页面把“输入回显”和“列表重算”放在同一优先级，导致用户键入时卡顿。正确做法是：

1. 输入回显保持最高优先级。
2. 派生计算降级处理。
3. 非关键更新延后到空闲或下一拍。

对于 React 页面，这意味着要主动区分“用户立即可见反馈”和“可稍后完成的计算”。

### 3.3 防抖/节流不是银弹

防抖能减少触发次数，但它常常让反馈变晚。节流能控频，但容易让状态跳变。真正稳定的方案通常是：

1. 高频输入走轻量同步路径（保持跟手）。
2. 重计算走异步或低优先级路径（保持流畅）。
3. 最终结果允许短暂“渐进一致”，而不是一次性阻塞输出。

---

## 四、渲染层治理：减少“无意义重渲染”与布局抖动

主线程卡顿的一半来自 JS 计算，另一半来自渲染成本。下面几条在后台系统和博客前台都很常见。

### 4.1 把状态边界收紧

当一个顶层状态变化触发整页重渲染时，再好的机器也会掉帧。应该把状态放在离消费点更近的位置，避免全树联动。

### 4.2 列表渲染做“稳定键 + 渐进更新”

如果 key 不稳定、排序频繁全量重排，会让 diff 和布局代价大幅增加。实践里优先保证：

1. key 稳定且与实体身份一致。
2. 首屏只渲染必要条目，后续再补。
3. 大列表分段挂载，不在一次提交里完成所有 DOM 更新。

### 4.3 控制同步布局读写交错

在同一交互里频繁读写布局信息（例如 offset/scroll/client）会触发强制同步计算。建议把读和写分离到不同阶段，降低抖动与阻塞。

---

## 五、内容站可直接落地的优化清单

结合博客场景，以下改动通常收益明显：

1. 搜索框：输入实时回显，结果集异步更新。
2. 归档页：按年份分组延迟展开，首屏仅渲染当前可视分组。
3. 标签页：预计算标签索引，避免每次点击全量扫描。
4. 文章页：评论区与推荐区拆分加载，主内容优先可读。
5. 后台表格：筛选和排序分离，分页计算避免全量处理。

---

## 六、验证与回归：没有基线，优化就会失效

性能优化最容易“改完当天快，过两周又慢”。你需要一套固定回归动作：

1. 固定关键交互脚本（输入、筛选、切页、展开）。
2. 固定设备档位（至少有一组中端机或限速配置）。
3. 固定统计口径（P75/P95，且按页面和交互分开）。
4. 每次发布后比对趋势，不只看单次峰值。

团队协作里，再加一条规则很重要：**性能阈值失败要像测试失败一样可见**。否则优化只会靠个人记忆。

---

## 七、容易被忽视但决定上限的工程细节

1. 业务计算与展示层耦合过深，导致无法独立调度。
2. 工具链升级后默认策略变化，旧经验失效却没人复盘。
3. 只做“快路径”优化，不做异常路径（大数据量、弱网、低端机）验证。

真正成熟的性能体系，不是某个技巧，而是“发现问题 -> 定位 -> 改造 -> 验证 -> 防回退”的闭环能力。

---

## 结语

交互性能优化的本质，是在有限主线程预算内合理分配优先级。你不需要一次做完所有优化，但要从最差交互开始，持续把“大块阻塞工作”变成“可调度的渐进工作”。

当你的页面在复杂操作下依然保持跟手，用户不会夸你用了什么技术栈，但会自然地觉得：这个系统很可靠、很专业。

## 参考来源（延伸阅读）

- web.dev: https://web.dev/articles/optimize-long-tasks
- web.dev: https://web.dev/articles/inp
- React 文档（优先级与交互更新相关 API）: https://react.dev/reference/react/useTransition`,
};

async function ensureAdmin() {
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (admin) return admin;

  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      name: "Admin",
      role: "admin",
      password: passwordHash,
    },
  });
}

async function main() {
  const admin = await ensureAdmin();

  await prisma.post.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.category.deleteMany({});

  const category = await prisma.category.create({
    data: { name: post.category },
  });

  const tags = [];
  for (const name of post.tags) {
    const tag = await prisma.tag.create({ data: { name } });
    tags.push(tag);
  }

  await prisma.post.create({
    data: {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      published: true,
      createdAt: new Date(post.createdAt),
      authorId: admin.id,
      categoryId: category.id,
      tags: {
        connect: tags.map((tag) => ({ id: tag.id })),
      },
    },
  });

  console.log("Imported TASK-001 advanced long-form post.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
