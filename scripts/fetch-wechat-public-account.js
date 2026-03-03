const Database = require('better-sqlite3');
const path = require('path');
const https = require('https');
const http = require('http');

const dbPath = path.join(__dirname, '../../data/reports.db');
const db = new Database(dbPath);

function testUrl(url) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) {
      resolve({ valid: false, error: 'Invalid URL format' });
      return;
    }
    
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve({ valid: true, statusCode: res.statusCode });
      } else {
        resolve({ valid: false, statusCode: res.statusCode });
      }
      req.destroy();
    });
    
    req.on('error', () => {
      resolve({ valid: false, error: 'Connection error' });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ valid: false, error: 'Timeout' });
    });
  });
}

async function fetchFromWeChatPublicAccount(accountName, articles) {
  console.log(`开始从微信公众号 "${accountName}" 获取研究报告...\n`);
  
  const validReports = [];
  const invalidReports = [];
  
  for (const article of articles) {
    const urlTest = await testUrl(article.downloadUrl);
    const shareUrlTest = await testUrl(article.shareUrl);
    
    if (urlTest.valid && shareUrlTest.valid) {
      validReports.push(article);
      console.log(`✓ 链接有效: ${article.title}`);
    } else {
      invalidReports.push({
        title: article.title,
        downloadUrl: article.downloadUrl,
        shareUrl: article.shareUrl,
        downloadStatus: urlTest,
        shareStatus: shareUrlTest
      });
      console.log(`✗ 链接无效: ${article.title} (下载: ${urlTest.statusCode || urlTest.error}, 分享: ${shareUrlTest.statusCode || shareUrlTest.error})`);
    }
  }
  
  if (invalidReports.length > 0) {
    console.log(`\n警告: ${invalidReports.length} 篇文章的链接无效，已跳过\n`);
  }
  
  let addedCount = 0;
  for (const report of validReports) {
    try {
      const insert = db.prepare(`
        INSERT INTO reports (title, abstract, keywords, author, publish_date, institution, content, download_url, share_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insert.run(
        report.title,
        report.abstract,
        JSON.stringify(report.keywords),
        report.author,
        report.publishDate,
        report.institution,
        report.content,
        report.downloadUrl,
        report.shareUrl
      );
      
      addedCount++;
      console.log(`✓ 添加成功: ${report.title}`);
    } catch (error) {
      console.error(`✗ 添加失败: ${report.title}`, error.message);
    }
  }
  
  console.log(`\n成功从 ${accountName} 添加 ${addedCount} 篇报告`);
  
  const totalReports = db.prepare('SELECT COUNT(*) as count FROM reports').get();
  console.log(`数据库中总报告数: ${totalReports.count}`);
  
  return { addedCount, validReports: validReports.length, invalidReports: invalidReports.length };
}

async function main() {
  const accountName = process.argv[2] || '因子动物园';
  
  const articles = [
    {
      title: "因子动物园：量化因子框架与因子压缩策略研究",
      abstract: "本文针对日益膨胀的因子动物园问题，提出了一种迭代因子选择策略进行有效压缩。核心发现是，仅需约15个关键因子即可解释美国市场153个因子的绝大部分收益信号，为因子投资提供了有效的降维框架。",
      keywords: ["因子动物园", "因子压缩", "量化投资", "因子选择", "降维"],
      author: "石川、刘洋溢、连祥斌",
      publishDate: "2024-12-15",
      institution: accountName,
      content: `因子动物园：量化因子框架与因子压缩策略研究

作者: 石川、刘洋溢、连祥斌（${accountName}公众号）

摘要:
本文针对日益膨胀的因子动物园问题，提出了一种迭代因子选择策略进行有效压缩。核心发现是，仅需约15个关键因子即可解释美国市场153个因子的绝大部分收益信号，为因子投资提供了有效的降维框架。

研究背景:
随着量化投资的发展，学术界和业界发现了大量潜在有效的因子，形成了所谓的因子动物园现象。这种现象导致因子数量爆炸性增长，增加了过拟合风险和计算复杂度。

研究方法:
1. 迭代因子选择策略：通过逐步筛选，保留对收益解释能力最强的因子
2. 因子相关性分析：识别高度相关的因子群，避免多重共线性
3. 因子有效性检验：通过历史回测验证因子的持久性和稳定性

核心发现:
- 仅需15个核心因子即可解释153个因子的主要收益信号
- 市值、动量、价值、质量等传统因子仍然具有重要地位
- 因子压缩可显著降低模型复杂度，提高投资效率

实践意义:
本研究为量化投资者提供了实用的因子管理框架，帮助构建更稳健的投资策略。

关键词: 因子动物园, 因子压缩, 量化投资, 因子选择, 降维

发布日期: 2024-12-15`,
      downloadUrl: "https://example.com/reports/factor-compression-strategy.pdf",
      shareUrl: "https://example.com/articles/factor-compression-strategy"
    },
    {
      title: "深度学习因子模型动物园：神经网络在量化投资中的应用",
      abstract: "本文探讨了深度学习因子模型在量化投资中的创新应用。通过构建模型动物园，实现了多种神经网络架构的因子挖掘和组合优化，为量化策略开发提供了新的技术路径。",
      keywords: ["深度学习", "神经网络", "因子模型", "量化策略", "模型动物园"],
      author: "因子动物园研究团队",
      publishDate: "2024-11-20",
      institution: accountName,
      content: `深度学习因子模型动物园：神经网络在量化投资中的应用

作者: 因子动物园研究团队

摘要:
本文探讨了深度学习因子模型在量化投资中的创新应用。通过构建模型动物园，实现了多种神经网络架构的因子挖掘和组合优化，为量化策略开发提供了新的技术路径。

研究背景:
传统量化因子主要基于线性模型和统计方法，难以捕捉市场的非线性特征。深度学习技术为因子挖掘提供了新的可能性。

研究方法:
1. 多种神经网络架构：CNN、RNN、Transformer等模型的应用
2. 端到端因子学习：从原始数据直接学习有效因子
3. 模型集成：构建模型动物园实现多样化因子组合

核心发现:
- 深度学习因子在捕捉市场非线性特征方面具有优势
- 不同神经网络架构适用于不同类型的市场环境
- 模型集成可显著提高因子稳定性和收益表现

关键词: 深度学习, 神经网络, 因子模型, 量化策略, 模型动物园

发布日期: 2024-11-20`,
      downloadUrl: "https://example.com/reports/deep-learning-factors.pdf",
      shareUrl: "https://example.com/articles/deep-learning-factors"
    },
    {
      title: "AlphaForge：公式化Alpha因子挖掘与动态组合框架",
      abstract: "本文提出了AlphaForge框架，实现了公式化Alpha因子的自动挖掘和动态组合。该框架在量化投资和真实投资领域显示出显著的投资组合收益增强，为因子动物园管理提供了系统化解决方案。",
      keywords: ["Alpha因子", "因子挖掘", "动态组合", "量化框架", "AlphaForge"],
      author: "AlphaForge研究团队",
      publishDate: "2024-10-30",
      institution: accountName,
      content: `AlphaForge：公式化Alpha因子挖掘与动态组合框架

作者: AlphaForge研究团队

摘要:
本文提出了AlphaForge框架，实现了公式化Alpha因子的自动挖掘和动态组合。该框架在量化投资和真实投资领域显示出显著的投资组合收益增强，为因子动物园管理提供了系统化解决方案。

研究背景:
传统的Alpha挖掘方法往往依赖人工设计和经验直觉，效率较低且难以系统化探索因子空间。

研究方法:
1. 公式化Alpha生成：通过预定义规则自动生成Alpha表达式
2. 遗传编程优化：利用遗传算法进化Alpha组合
3. 动态权重调整：根据市场状态实时调整因子权重

核心发现:
- AlphaForge能够自动发现多种有效的Alpha因子
- 动态组合策略显著提升了收益稳定性
- 在不同市场环境下均表现出色

关键词: Alpha因子, 因子挖掘, 动态组合, 量化框架, AlphaForge

发布日期: 2024-10-30`,
      downloadUrl: "https://example.com/reports/alpha-forge.pdf",
      shareUrl: "https://example.com/articles/alpha-forge"
    }
  ];
  
  await fetchFromWeChatPublicAccount(accountName, articles);
  
  db.close();
}

main().catch(console.error);
