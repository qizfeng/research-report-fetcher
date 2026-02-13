const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/reports.db');
const db = new Database(dbPath);

async function main() {
  console.log('开始从证券公司获取研究报告...\n');
  
  // 示例：添加证券公司的研究报告
  const reports = [
    {
      title: "量化投资因子挖掘与因子投资研究",
      abstract: "本文系统研究了量化投资中的因子挖掘方法论，包括基本面因子、技术因子、情绪因子等多个维度的因子构建。通过回测验证了不同因子在A股市场中的有效性，并提出了多因子组合优化策略。",
      keywords: ["量化投资", "因子挖掘", "多因子模型", "回测研究"],
      author: "某某证券金融工程团队",
      publishDate: "2024-06-15",
      institution: "某某证券",
      content: `量化投资因子挖掘与因子投资研究

作者: 某某证券金融工程团队

摘要:
本文系统研究了量化投资中的因子挖掘方法论，包括基本面因子、技术因子、情绪因子等多个维度的因子构建。通过回测验证了不同因子在A股市场中的有效性，并提出了多因子组合优化策略。

研究方法:
1. 因子挖掘：从基本面、技术面、情绪面等多个维度挖掘有效因子
2. 因子检验：通过历史回测验证因子的有效性
3. 组合优化：构建多因子组合，优化风险调整后收益

核心发现:
- 价值因子、动量因子、质量因子在A股市场表现稳健
- 多因子组合可有效降低单一因子的风险
- 因子轮动策略可进一步提升收益

关键词: 量化投资, 因子挖掘, 多因子模型, 回测研究

发布日期: 2024-06-15

机构: 某某证券`,
      downloadUrl: "https://example.com/reports/quant-factor-mining.pdf",
      shareUrl: "https://example.com/reports/quant-factor-mining"
    }
  ];
  
  console.log(`准备添加 ${reports.length} 篇研究报告\n`);
  
  let addedCount = 0;
  
  for (const report of reports) {
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
      console.log(`✓ 添加: ${report.title}`);
    } catch (error) {
      console.error(`✗ 添加失败: ${report.title}`, error.message);
    }
  }
  
  console.log(`\n成功添加 ${addedCount} 篇研究报告`);
  
  // 显示更新后的统计
  const totalReports = db.prepare('SELECT COUNT(*) as count FROM reports').get();
  console.log(`\n数据库中总报告数: ${totalReports.count}`);
  
  db.close();
  console.log('\n操作完成');
}

main().catch(console.error);
