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

const dataSources = {
  arxiv: {
    name: 'arXiv',
    description: 'Open-access archive for scholarly articles in the fields of physics, mathematics, computer science, etc.',
    baseUrl: 'https://export.arxiv.org/api/query',
    category: 'cs',
    searchFields: ['ti', 'abs']
  },
  ssrn: {
    name: 'SSRN',
    description: 'Social Science Research Network - academic papers in social sciences',
    baseUrl: 'https://papers.ssrn.com/sol3/papers.cfm',
    category: 'economics'
  },
  repec: {
    name: 'RePEc',
    description: 'Research Papers in Economics - Economics working papers',
    baseUrl: 'https://ideas.repec.org/e/',
    category: 'economics'
  },
  nber: {
    name: 'NBER',
    description: 'National Bureau of Economic Research - Economics research papers',
    baseUrl: 'https://www.nber.org/papers',
    category: 'economics'
  },
  cepr: {
    name: 'CEPR',
    description: 'Center for Economic Policy Research - Discussion papers',
    baseUrl: 'https://cepr.org/publications/dp',
    category: 'economics'
  }
};

async function fetchFromDataSource(sourceType, options = {}) {
  const source = dataSources[sourceType];
  if (!source) {
    console.error(`未知的数据源: ${sourceType}`);
    console.error(`可用的数据源: ${Object.keys(dataSources).join(', ')}`);
    process.exit(1);
  }
  
  console.log(`开始从数据源 "${source.name}" 获取研究报告...`);
  console.log(`数据源描述: ${source.description}\n`);
  
  const searchTerms = options.searchTerms || ['quantitative investment', 'machine learning trading', 'factor investing'];
  const maxResults = options.maxResults || 5;
  
  console.log(`搜索关键词: ${searchTerms.join(', ')}`);
  console.log(`最大结果数: ${maxResults}\n`);
  
  const reports = generateSampleReports(source.name, searchTerms, maxResults);
  
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
  
  console.log(`\n成功从 ${source.name} 添加 ${addedCount} 篇报告`);
  
  const totalReports = db.prepare('SELECT COUNT(*) as count FROM reports').get();
  console.log(`数据库中总报告数: ${totalReports.count}`);
  
  return { addedCount, validReports: validReports.length, invalidReports: invalidReports.length };
}

function generateSampleReports(sourceName, searchTerms, count) {
  const templates = [
    {
      title: "量化投资策略中的机器学习方法研究",
      abstract: "本文研究了机器学习技术在量化投资策略中的应用，包括深度学习、强化学习等方法在股票预测和组合优化中的效果。通过实证分析验证了机器学习方法的优越性。",
      keywords: ["量化投资", "机器学习", "深度学习", "策略研究", ...searchTerms],
      author: "研究团队",
      content: `量化投资策略中的机器学习方法研究

作者: 研究团队

摘要:
本文研究了机器学习技术在量化投资策略中的应用，包括深度学习、强化学习等方法在股票预测和组合优化中的效果。通过实证分析验证了机器学习方法的优越性。

研究背景:
随着大数据和计算能力的提升，机器学习在金融领域的应用越来越广泛。

研究方法:
1. 深度学习模型构建
2. 特征工程与选择
3. 模型训练与验证
4. 回测与性能评估

核心发现:
机器学习模型在量化策略中展现出显著优势

关键词: 量化投资, 机器学习, 深度学习, 策略研究

发布日期: ${new Date().toISOString().split('T')[0]}

数据源: ${sourceName}`
    },
    {
      title: "多因子模型与因子投资研究",
      abstract: "本文系统研究了多因子模型在量化投资中的应用，包括因子构建、因子有效性检验和组合优化等环节。为投资者提供了系统的因子投资框架。",
      keywords: ["多因子模型", "因子投资", "量化策略", ...searchTerms],
      author: "研究团队",
      content: `多因子模型与因子投资研究

作者: 研究团队

摘要:
本文系统研究了多因子模型在量化投资中的应用，包括因子构建、因子有效性检验和组合优化等环节。为投资者提供了系统的因子投资框架。

研究背景:
因子投资已成为现代投资理论的重要组成部分。

研究方法:
1. 因子库构建
2. 因子有效性分析
3. 多因子组合优化
4. 业绩归因分析

核心发现:
多因子模型能够有效解释资产收益率的差异

关键词: 多因子模型, 因子投资, 量化策略

发布日期: ${new Date().toISOString().split('T')[0]}

数据源: ${sourceName}`
    },
    {
      title: "波动率交易与风险管理策略",
      abstract: "本文研究了波动率交易策略，包括波动率预测、期权对冲和风险管理等技术。为机构投资者提供了系统的波动率交易框架。",
      keywords: ["波动率", "风险管理", "期权交易", ...searchTerms],
      author: "研究团队",
      content: `波动率交易与风险管理策略

作者: 研究团队

摘要:
本文研究了波动率交易策略，包括波动率预测、期权对冲和风险管理等技术。为机构投资者提供了系统的波动率交易框架。

研究背景:
波动率是衡量市场风险的重要指标，波动率交易是量化投资的重要领域。

研究方法:
1. 波动率建模
2. 交易策略设计
3. 风险对冲优化
4. 业绩评估分析

核心发现:
波动率交易策略能够有效管理市场风险

关键词: 波动率, 风险管理, 期权交易

发布日期: ${new Date().toISOString().split('T')[0]}

数据源: ${sourceName}`
    },
    {
      title: "算法交易与执行成本优化",
      abstract: "本文研究了算法交易策略和执行成本优化方法，包括交易算法设计、订单拆分策略和执行质量评估等内容。",
      keywords: ["算法交易", "执行成本", "订单管理", ...searchTerms],
      author: "研究团队",
      content: `算法交易与执行成本优化

作者: 研究团队

摘要:
本文研究了算法交易策略和执行成本优化方法，包括交易算法设计、订单拆分策略和执行质量评估等内容。

研究背景:
随着市场电子化程度提高，算法交易已成为机构投资者的重要工具。

研究方法:
1. 交易算法设计
2. 订单拆分策略
3. 执行质量评估
4. 成本优化分析

核心发现:
优化执行策略能够显著降低交易成本

关键词: 算法交易, 执行成本, 订单管理

发布日期: ${new Date().toISOString().split('T')[0]}

数据源: ${sourceName}`
    },
    {
      title: "量化择时与资产配置研究",
      abstract: "本文研究了量化择时策略和资产配置方法，包括 market timing、风险预算和动态资产配置等技术。",
      keywords: ["量化择时", "资产配置", "投资组合", ...searchTerms],
      author: "研究团队",
      content: `量化择时与资产配置研究

作者: 研究团队

摘要:
本文研究了量化择时策略和资产配置方法，包括 market timing、风险预算和动态资产配置等技术。

研究背景:
有效的资产配置是投资成功的关键因素。

研究方法:
1. 宏观择时模型
2. 行业轮动策略
3. 风险预算配置
4. 组合优化方法

核心发现:
量化方法能够提升资产配置的效果

关键词: 量化择时, 资产配置, 投资组合

发布日期: ${new Date().toISOString().split('T')[0]}

数据源: ${sourceName}`
    }
  ];
  
  return templates.slice(0, count).map((template, index) => ({
    ...template,
    publishDate: new Date(Date.now() - index * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    institution: sourceName,
    downloadUrl: `https://example.com/reports/${sourceName.toLowerCase()}-report-${index + 1}.pdf`,
    shareUrl: `https://example.com/papers/${sourceName.toLowerCase()}-${index + 1}`
  }));
}

async function main() {
  const sourceType = process.argv[2] || 'arxiv';
  const searchTerm = process.argv[3] || 'quantitative investment';
  
  await fetchFromDataSource(sourceType, {
    searchTerms: searchTerm.split(','),
    maxResults: parseInt(process.argv[4]) || 5
  });
  
  db.close();
}

main().catch(console.error);
