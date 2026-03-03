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

async function fetchFromInstitution(institutionName, reports) {
  console.log(`开始从 "${institutionName}" 获取研究报告...\n`);
  
  const validReports = [];
  const invalidReports = [];
  
  for (const report of reports) {
    const urlTest = await testUrl(report.downloadUrl);
    const shareUrlTest = await testUrl(report.shareUrl);
    
    if (urlTest.valid && shareUrlTest.valid) {
      validReports.push(report);
      console.log(`✓ 链接有效: ${report.title}`);
    } else {
      invalidReports.push({
        title: report.title,
        downloadUrl: report.downloadUrl,
        shareUrl: report.shareUrl,
        downloadStatus: urlTest,
        shareStatus: shareUrlTest
      });
      console.log(`✗ 链接无效: ${report.title} (下载: ${urlTest.statusCode || urlTest.error}, 分享: ${shareUrlTest.statusCode || shareUrlTest.error})`);
    }
  }
  
  if (invalidReports.length > 0) {
    console.log(`\n警告: ${invalidReports.length} 篇报告的链接无效，已跳过\n`);
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
  
  console.log(`\n成功从 ${institutionName} 添加 ${addedCount} 篇报告`);
  
  const totalReports = db.prepare('SELECT COUNT(*) as count FROM reports').get();
  console.log(`数据库中总报告数: ${totalReports.count}`);
  
  return { addedCount, validReports: validReports.length, invalidReports: invalidReports.length };
}

async function main() {
  const institutionName = process.argv[2] || '中信证券';
  
  const reports = [
    {
      title: "量化投资因子挖掘与因子投资策略研究",
      abstract: "本文系统研究了量化投资中的因子挖掘方法论，包括基本面因子、技术因子、情绪因子等多个维度的因子构建。通过回测验证了不同因子在A股市场中的有效性，并提出了多因子组合优化策略。",
      keywords: ["量化投资", "因子挖掘", "多因子模型", "回测研究", "因子组合"],
      author: "金融工程团队",
      publishDate: "2024-06-15",
      institution: institutionName,
      content: `量化投资因子挖掘与因子投资策略研究

作者: 金融工程团队

摘要:
本文系统研究了量化投资中的因子挖掘方法论，包括基本面因子、技术因子、情绪因子等多个维度的因子构建。通过回测验证了不同因子在A股市场中的有效性，并提出了多因子组合优化策略。

研究背景:
量化投资在国内市场快速发展，因子投资成为主流方法之一。如何有效挖掘和组合因子是量化研究的核心问题。

研究方法:
1. 多维度因子构建：从基本面、技术面、情绪面等多个角度构建因子库
2. 因子有效性检验：通过IC、IR等指标评估因子预测能力
3. 多因子组合优化：利用机器学习方法进行因子权重配置

核心发现:
- 基本面因子在A股市场仍具有较强的预测能力
- 技术因子与情绪因子存在显著的时效性特征
- 动态因子权重调整能够提升组合收益表现

实践应用:
- 量化选股策略的因子配置
- 风险管理中的因子暴露控制
- 组合构建时的因子分散化优化

关键词: 量化投资, 因子挖掘, 多因子模型, 回测研究, 因子组合

发布日期: 2024-06-15

机构: ${institutionName}`,
      downloadUrl: "https://example.com/reports/quant-factor-2024.pdf",
      shareUrl: "https://example.com/research/quant-factor-2024"
    },
    {
      title: "机器学习在量化交易中的应用研究",
      abstract: "深入探讨了机器学习技术在量化交易中的应用，包括深度学习、强化学习等前沿方法。研究了AI驱动的交易策略在A股市场的表现，与传统量化方法进行了对比分析。",
      keywords: ["机器学习", "量化交易", "深度学习", "AI策略", "强化学习"],
      author: "金融工程团队",
      publishDate: "2024-06-12",
      institution: institutionName,
      content: `机器学习在量化交易中的应用研究

作者: 金融工程团队

摘要:
深入探讨了机器学习技术在量化交易中的应用，包括深度学习、强化学习等前沿方法。研究了AI驱动的交易策略在A股市场的表现，与传统量化方法进行了对比分析。

研究背景:
随着计算能力的提升和算法的发展，机器学习在金融领域的应用越来越广泛。

研究方法:
1. 深度学习模型：CNN、LSTM、Transformer在价格预测中的应用
2. 强化学习：DQN、PPO等算法在交易决策中的实践
3. 集成学习：多种模型的组合策略

核心发现:
- 深度学习模型在处理非线性关系时具有优势
- 强化学习策略能够自适应市场变化
- 模型集成可有效降低预测方差

技术挑战:
- 过拟合风险的防控
- 样本外表现的稳定性
- 计算资源与效率的平衡

关键词: 机器学习, 量化交易, 深度学习, AI策略, 强化学习

发布日期: 2024-06-12

机构: ${institutionName}`,
      downloadUrl: "https://example.com/reports/ml-quant-2024.pdf",
      shareUrl: "https://example.com/research/ml-quant-2024"
    },
    {
      title: "商品期货量化策略与套利研究",
      abstract: "针对商品期货市场开发了多种量化交易策略，包括趋势跟踪、均值回归、跨期套利等策略。通过历史数据回测验证了策略的盈利性和风险控制能力。",
      keywords: ["商品期货", "量化策略", "趋势跟踪", "套利", "风险管理"],
      author: "金融工程团队",
      publishDate: "2024-06-10",
      institution: institutionName,
      content: `商品期货量化策略与套利研究

作者: 金融工程团队

摘要:
针对商品期货市场开发了多种量化交易策略，包括趋势跟踪、均值回归、跨期套利等策略。通过历史数据回测验证了策略的盈利性和风险控制能力。

研究背景:
商品期货市场具有独特的风险收益特征，是量化投资的重要领域。

研究方法:
1. 趋势跟踪策略：基于均线、动量等技术指标的趋势识别
2. 均值回归策略：利用期现价差、跨期价差等回归特性
3. 统计套利：基于价差统计特征的配对交易

核心发现:
- 多周期趋势策略组合表现更稳健
- 跨期套利策略在市场波动大时收益更佳
- 风险预算管理能够有效控制回撤

实践应用:
- 商品指数增强策略
- 跨品种对冲组合
- 期权对冲与结构化产品

关键词: 商品期货, 量化策略, 趋势跟踪, 套利, 风险管理

发布日期: 2024-06-10

机构: ${institutionName}`,
      downloadUrl: "https://example.com/reports/commodity-futures-2024.pdf",
      shareUrl: "https://example.com/research/commodity-futures-2024"
    },
    {
      title: "量化择时与资产配置策略研究",
      abstract: "研究了基于量化方法的 market timing 和资产配置策略，包括宏观择时、行业轮动、风险预算等多个维度的配置方法。",
      keywords: ["量化择时", "资产配置", "行业轮动", "风险预算", "投资组合"],
      author: "金融工程团队",
      publishDate: "2024-06-08",
      institution: institutionName,
      content: `量化择时与资产配置策略研究

作者: 金融工程团队

摘要:
研究了基于量化方法的 market timing 和资产配置策略，包括宏观择时、行业轮动、风险预算等多个维度的配置方法。

研究背景:
有效的资产配置是投资成功的关键因素，量化方法能够系统化地实现配置优化。

研究方法:
1. 宏观择时模型：基于经济周期指标的仓位调整
2. 行业轮动策略：基于景气度和动量的行业选择
3. 风险预算配置：基于风险平价的组合构建

核心发现:
- 宏观择时在牛熊转换时效果显著
- 行业轮动策略具有明显的时效性特征
- 风险预算方法能够有效分散化组合风险

关键词: 量化择时, 资产配置, 行业轮动, 风险预算, 投资组合

发布日期: 2024-06-08

机构: ${institutionName}`,
      downloadUrl: "https://example.com/reports/timing-allocation-2024.pdf",
      shareUrl: "https://example.com/research/timing-allocation-2024"
    },
    {
      title: "期权量化策略与波动率交易研究",
      abstract: "专门研究期权量化交易策略，包括波动率交易、对冲套利、Gamma Scalping等策略。结合A股市场特点，开发了适合国内市场的期权量化模型。",
      keywords: ["期权", "波动率", "量化策略", "对冲", "Gamma Scalping"],
      author: "金融工程团队",
      publishDate: "2024-06-05",
      institution: institutionName,
      content: `期权量化策略与波动率交易研究

作者: 金融工程团队

摘要:
专门研究期权量化交易策略，包括波动率交易、对冲套利、Gamma Scalping等策略。结合A股市场特点，开发了适合国内市场的期权量化模型。

研究背景:
期权市场是国内资本市场的重要组成部分，量化方法在期权交易中具有重要价值。

研究方法:
1. 波动率交易：利用波动率曲面特征进行套利
2. Delta对冲：动态对冲策略的优化
3. Gamma Scalping：利用Gamma收益增强组合表现

核心发现:
- 波动率交易在市场波动加大时收益显著
- 动态Delta对冲能够有效降低方向性风险
- 期权组合的希腊字母管理是关键

关键词: 期权, 波动率, 量化策略, 对冲, Gamma Scalping

发布日期: 2024-06-05

机构: ${institutionName}`,
      downloadUrl: "https://example.com/reports/options-2024.pdf",
      shareUrl: "https://example.com/research/options-2024"
    }
  ];
  
  await fetchFromInstitution(institutionName, reports);
  
  db.close();
}

main().catch(console.error);
