# Research Report Fetcher Skill

A Trae Skill for fetching research reports from various sources (institutions, WeChat public accounts, academic databases, etc.) and adding them to the research report database.

## Description

This skill helps you automatically fetch research reports from different sources and integrate them into your research report database. It supports:

- Securities firms and financial institutions
- WeChat public accounts
- Academic databases
- Custom data sources

## Installation

### Method 1: Copy to Trae Skills Directory

1. Copy the `research-report-fetcher` folder to your Trae workspace's `.trae/skills/` directory:
   ```bash
   cp -r research-report-fetcher /path/to/your/workspace/.trae/skills/
   ```

2. Restart Trae or reload the workspace to activate the skill.

### Method 2: Git Clone

1. Clone this repository into your Trae skills directory:
   ```bash
   cd /path/to/your/workspace/.trae/skills/
   git clone https://github.com/yourusername/research-report-fetcher.git
   ```

2. Restart Trae to load the skill.

## Usage

Once installed, you can use natural language to invoke this skill:

```
从某某券商获取研究报告
从某某公众号获取研究报告
添加某某机构的研究报告
```

The skill will automatically:
1. Search for available reports from the specified source
2. Create a fetch script tailored to that source
3. Execute the script to add reports to the database
4. Verify the results

## Features

- **Multi-source Support**: Works with APIs, web scraping, RSS feeds, and more
- **Quality Control**: Ensures reports meet quality standards before adding
- **Deduplication**: Automatically checks for and prevents duplicate entries
- **Flexible Configuration**: Easy to customize for different data sources
- **Error Handling**: Graceful handling of network issues and data inconsistencies

## Supported Source Types

### 1. Securities Firms (券商)
- API integration where available
- Web scraping for public reports
- Examples: 广发证券, 中信建投, 海通证券

### 2. WeChat Public Accounts (微信公众号)
- Article extraction and parsing
- Content structuring and formatting
- Example: 因子动物园

### 3. Academic Databases
- arXiv API integration
- SSRN and other academic sources
- Automated metadata extraction

### 4. Custom Sources
- Easy to extend for new sources
- Template-based script generation
- Configurable data mapping

## Database Schema

The skill expects a SQLite database with the following `reports` table:

```sql
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  abstract TEXT,
  keywords TEXT,  -- JSON array
  author TEXT,
  publish_date TEXT,  -- YYYY-MM-DD format
  institution TEXT,
  content TEXT,
  download_url TEXT,
  share_url TEXT
);
```

## Workflow

When you request reports from a source, the skill follows this workflow:

1. **Source Analysis**: Understands the source type and available access methods
2. **Report Discovery**: Searches for available reports from the source
3. **Script Generation**: Creates a custom Node.js script to fetch the reports
4. **Data Extraction**: Extracts metadata (title, abstract, date, author, etc.)
5. **Quality Check**: Validates reports meet quality standards
6. **Database Insertion**: Adds reports to the SQLite database
7. **Verification**: Confirms successful addition and shows statistics

## Example Scripts

### Fetching from a Securities Firm

```javascript
const reports = [
  {
    title: "量化投资因子挖掘研究",
    abstract: "本文系统研究了量化投资中的因子挖掘方法论...",
    keywords: ["量化投资", "因子挖掘", "多因子模型"],
    author: "xx证券金融工程团队",
    publishDate: "2024-06-15",
    institution: "xx证券",
    content: "Full report content...",
    downloadUrl: "https://www.gf.com.cn/reports/quant-research.pdf",
    shareUrl: "https://www.gf.com.cn/reports/quant-research"
  }
];
```

### Fetching from WeChat Public Account

```javascript
const reports = [
  {
    title: "因子动物园：量化因子框架研究",
    abstract: "本文针对日益膨胀的因子动物园问题...",
    keywords: ["因子动物园", "因子压缩", "量化投资"],
    author: "张三、李四",
    publishDate: "2024-12-15",
    institution: "因子动物园公众号",
    content: "Full report content...",
    downloadUrl: "https://factorzoo.com/reports/factor-framework.pdf",
    shareUrl: "https://factorzoo.com/research/factor-framework"
  }
];
```

## Best Practices

1. **Always check for duplicates** before adding new reports
2. **Use consistent date format** (YYYY-MM-DD)
3. **Store keywords as JSON array** in the keywords field
4. **Include meaningful content** not just placeholder text
5. **Set proper institution name** for filtering and organization
6. **Validate URLs** before storing them
7. **Handle errors gracefully** and log them for debugging

## Requirements

- Node.js 14+
- better-sqlite3 package
- axios (for API calls)
- cheerio (for HTML parsing, optional)

Install dependencies:
```bash
npm install better-sqlite3 axios cheerio
```

## Customization

You can customize the skill by modifying the `SKILL.md` file:

1. Add new source types
2. Modify quality control criteria
3. Change database schema mappings
4. Add custom data processing logic

## Troubleshooting

### Database Locked Error
Ensure no other process is accessing the database when running the skill.

### Duplicate Reports
Run the deduplication script after adding new reports:
```bash
node scripts/find-and-remove-duplicates.js
```

### Invalid Dates
Ensure all dates are in YYYY-MM-DD format. Use the `formatDate()` helper function.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this skill in your projects.

## Author

Created for Trae IDE users to simplify research report management.

## Acknowledgments

- Inspired by the need for automated research report collection
- Thanks to the Trae community for feedback and suggestions
