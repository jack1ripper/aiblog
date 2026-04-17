const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const post = {
  title: "深度学习到底是个啥？用大白话给你讲明白",
  slug: "deep-learning-plain-language-intro",
  excerpt:
    "不用数学公式、不讲晦涩术语，这篇文章用生活中最常见的比喻，带你从零理解神经网络、深度学习、训练、过拟合这些核心概念。",
  createdAt: "2024-05-10T09:00:00.000Z",
  category: "人工智能",
  tags: ["深度学习", "AI入门", "神经网络", "机器学习", "科普"],
  coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&q=80",
  content: `## 写在前面：别怕，这玩意儿没那么玄乎

如果你在网上搜"深度学习"，大概率会被一堆词砸晕：神经网络、反向传播、梯度下降、卷积、Transformer……光看名字就劝退了。

但这篇文章不会扔公式给你。我们就用生活中最熟悉的例子——**教学生做题**——把深度学习的底层逻辑讲清楚。读完你会发现，深度学习的核心思想其实非常朴素。

![AI abstract visualization](https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80)

---

## 一、机器学习 vs 深度学习：先分清这两个词

**机器学习**是大的圈子，**深度学习**是圈子里最近十年最火的一个分支。

打个比方：
- **机器学习**就像"整个教育界"，里面有各种教学方法。
- **深度学习**则是"一种特别厉害的教学法"，它让学生自己去悟规律，而不是老师一条一条列规则。

传统的机器学习，很多时候需要人类专家"手工提取特征"。比如要识别一只猫，工程师得告诉电脑："猫有两只尖耳朵、圆眼睛、三角形鼻子。"电脑把这些规则记下来，再去比对图片。

而深度学习说："别费那劲了，直接把几百万张猫图丢给我，我自己总结猫长什么样。"

这就是关键区别：**规则是人写的，还是机器自己学的？**

---

## 二、神经网络：一个不断刷题的"学生"

深度学习之所以厉害，是因为它背后有一个叫**神经网络**的结构。你可以把它想象成一个有无数层筛子的过滤系统，或者更直观一点——一个"超级学生"。

这个学生的大脑里，有成千上亿的"知识点连接"，我们叫它们**神经元之间的连接权重**（weights）。

![Neural network abstract nodes](https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&q=80)

### 学生的第一次考试

刚开始，这个学生对猫狗分类一窍不通。你给它一张猫图，它瞎蒙一个答案："这是狗。"

你告诉他："错了，这是猫。"于是他默默调整自己的"脑回路"，下一次遇到类似图片时，倾向说"猫"一些。

这个过程重复几百万次。错的多了，调整得就越精细。最后他对猫的长相心里有数了，甚至能识别出一些你没教过的品种。

这就是**训练**的本质：**不断做题、对答案、修正思路**。

---

## 三、为什么是"深度"学习？层数越多越聪明吗？

早期的神经网络只有一两层，像个幼儿园小朋友，只能理解很简单的规律。

现代的深度学习网络可能有几十层、几百层，甚至更多。这就像一个学生从幼儿园读到研究生，每一层都在做更抽象的提炼：

- **第一层**：看图片的边、角、颜色块；
- **第二层**：把这些边组合成眼睛、耳朵、毛发的形状；
- **第三层**：把这些形状组合成"猫脸"、"狗脸"的整体概念；
- **更高层**：识别"这是一只布偶猫，正趴在沙发上"。

每一层都在前一层的基础上做更复杂的判断。**层数越深，能理解的规律就越抽象、越高级。**

![Layered learning abstract](https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=800&q=80)

当然，层数不是越多越好。如果学生死记硬背的功夫太强，反而会把练习题里的"噪音"也当成规律记下来，这就是后面要说的**过拟合**。

---

## 四、训练数据：喂什么，就长成什么样

神经网络这个学生，智商其实取决于你给他看什么教材。

如果你只给他看白猫的图，他见了黑猫可能就不认识了。如果你教材里的图片都带着水印，他可能以为"水印=猫"。

这在现实里闹出过很多笑话：
- 有研究者发现，他的"哈士奇 vs 狼"分类器，其实是在根据图片背景里有没有雪来判断——因为训练数据里狼的照片大多在雪地里拍的。
- 还有人发现，某些人脸识别系统对深肤色人群表现差，因为训练数据里白人面孔占绝大多数。

所以，**数据的质量和多样性，往往比算法本身更重要。** 这行有句话叫："Garbage in, garbage out."（垃圾进，垃圾出。）

---

## 五、过拟合与欠拟合：学生太笨还是太机灵？

训练一个神经网络时，最常见的两种失败模式：

### 1. 过拟合（Overfitting）——死记硬背的学生

这个学生把练习册的答案全背下来了，但换个数字就不会做了。换到模型上，就是它对训练数据表现极好，但遇到新图片就露馅。

解决过拟合的办法有很多，比如：
- **增加数据量**：多见题型，少背答案；
- **正则化**：给学生加一点"惩罚"，不让他把权重调得太极端；
- **Dropout**：随机让一部分神经元"睡觉"，逼学生用多种思路解题，而不是依赖某一条固定路径。

### 2. 欠拟合（Underfitting）——根本就没学会

学生连练习册都没做对，说明模型太简单、层数太少，或者训练时间不够。

解决办法通常是对症下药：加深网络、训练更久、换更厉害的算法。

![Data and model balance](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80)

---

## 六、深度学习能干啥？不只是聊天机器人

提到深度学习，很多人第一反应是 ChatGPT。但其实它的应用远不止此：

| 领域 | 典型应用 |
|------|----------|
| 图像 | 人脸识别、医学影像诊断、自动驾驶感知 |
| 语音 | 语音助手、实时翻译、电话客服机器人 |
| 文本 | 机器翻译、文章生成、智能客服、代码补全 |
| 推荐 | 抖音/小红书的"猜你喜欢"、Netflix 剧集推荐 |
| 游戏 | AlphaGo 下围棋、OpenAI Five 打 Dota |
| 科学 | 蛋白质结构预测（AlphaFold）、新药分子设计 |

可以说，只要某个任务有**大量历史数据**，并且数据背后**隐藏着某种规律**，深度学习就有用武之地。

---

## 七、普通人需要担心被 AI 取代吗？

这个问题被讨论太多了。我的看法是：**与其说 AI 取代人，不如说会用 AI 的人取代不会用 AI 的人。**

深度学习本质上是一个强大的"模式识别工具"。它能做大量重复性判断，但还远不能替代人类的创造力、同理心和复杂决策。

更重要的是，AI 并不是"自己冒出来"的。它需要你定义问题、准备数据、评估结果、处理伦理边界。这些环节，人类的判断力依然不可或缺。

![Human and AI collaboration](https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&q=80)

---

## 写在最后

深度学习的核心，其实就三句话：

1. **它是个学生**（神经网络），脑子里有无数知识点连接；
2. **学习方式是刷题**（训练），错了就改连接权重；
3. **学得怎么样，关键看教材**（数据），教材垃圾，学生再聪明也白搭。

希望这篇文章帮你拆掉了那些唬人的术语外壳。如果你理解了"学生刷题"这个比喻，你就已经掌握了深度学习 80% 的直觉。

如果对你有帮助，欢迎点赞收藏，也欢迎在评论区留下你想进一步了解的 AI 话题。

---

## 延伸阅读

- 3Blue1Brown《神经网络入门》系列视频
- 吴恩达 Coursera《机器学习》课程
- 李宏毅《机器学习》中文课程`,
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

  const existing = await prisma.post.findUnique({
    where: { slug: post.slug },
  });

  if (existing) {
    console.log("Post already exists:", post.slug);
    return;
  }

  const category = await prisma.category.upsert({
    where: { name: post.category },
    update: {},
    create: { name: post.category },
  });

  const tags = await Promise.all(
    post.tags.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  await prisma.post.create({
    data: {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      published: true,
      createdAt: new Date(post.createdAt),
      authorId: admin.id,
      categoryId: category.id,
      tags: {
        connect: tags.map((tag) => ({ id: tag.id })),
      },
    },
  });

  console.log("Imported post:", post.title);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
