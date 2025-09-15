#!/usr/bin/env node

/**
 * Final Publishing Preparation Script
 * Comprehensive validation, optimization, and platform-specific preparation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PublishingValidator } from './src/utils/PublishingValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PublishingPreparation {
    constructor() {
        this.validator = new PublishingValidator();
        this.contentDir = path.join(__dirname, 'src/content');
        this.optimizedDir = path.join(__dirname, 'optimized-content');
        this.publishReadyDir = path.join(__dirname, 'publish-ready');
        this.reportPath = path.join(__dirname, 'publishing-report.md');
        this.metadataPath = path.join(__dirname, 'seo-metadata.json');
    }

    async prepareAllForPublishing() {
        console.log('📋 Starting final publishing preparation...\n');
        
        // Ensure directories exist
        [this.publishReadyDir, path.join(this.publishReadyDir, 'platforms')].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Load SEO metadata
        const metadata = this.loadMetadata();
        
        // Get content files
        const contentFiles = this.getContentFiles();
        const results = [];

        for (const file of contentFiles) {
            console.log(`📝 Preparing: ${path.basename(file)}`);
            const result = await this.prepareFile(file, metadata);
            results.push(result);
            
            const status = result.readyToPublish ? '✅ READY' : '⚠️  NEEDS WORK';
            console.log(`${status} - Score: ${result.overallScore}/100\n`);
        }

        // Generate comprehensive publishing report
        await this.generatePublishingReport(results);
        
        // Create platform-specific versions for ready content
        await this.createPlatformVersions(results.filter(r => r.readyToPublish));
        
        console.log('🎉 Publishing preparation complete!');
        console.log(`📊 Ready to publish: ${results.filter(r => r.readyToPublish).length}/${results.length} files`);
        console.log('📋 Check publishing-report.md for detailed analysis');
        
        return results;
    }

    getContentFiles() {
        const sourceDir = fs.existsSync(this.optimizedDir) ? this.optimizedDir : this.contentDir;
        return fs.readdirSync(sourceDir)
            .filter(file => file.endsWith('.md'))
            .map(file => path.join(sourceDir, file));
    }

    loadMetadata() {
        try {
            const metadataContent = fs.readFileSync(this.metadataPath, 'utf8');
            return JSON.parse(metadataContent);
        } catch (error) {
            console.warn('⚠️  Could not load SEO metadata, using defaults');
            return {};
        }
    }

    async prepareFile(filePath, allMetadata) {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);
        const fileMetadata = allMetadata[fileName] || {};
        
        // Validate content for publishing
        const validationResults = await this.validator.validateForPublishing(content, fileMetadata);
        
        // Generate publishing report for this file
        const report = this.validator.generatePublishingReport(validationResults, fileName);
        
        // Create publish-ready version if score is high enough
        if (report.readyToPublish) {
            await this.createPublishReadyVersion(filePath, content, fileMetadata, report);
        }
        
        return report;
    }

    async createPublishReadyVersion(filePath, content, metadata, report) {
        const fileName = path.basename(filePath);
        const publishReadyPath = path.join(this.publishReadyDir, fileName);
        
        // Create enhanced version with all metadata and optimizations
        const enhancedContent = this.createEnhancedContent(content, metadata, report);
        
        fs.writeFileSync(publishReadyPath, enhancedContent);
    }

    createEnhancedContent(content, metadata, report) {
        // Add comprehensive front matter for publishing
        const frontMatter = `---
# Publishing Metadata
title: "${metadata.title || 'Blog Post Title'}"
description: "${metadata.metaDescription || 'Blog post description'}"
keywords: "${metadata.keywords || 'blog, development'}"
author: "Developer Blog Platform"
publishDate: "${new Date().toISOString().split('T')[0]}"
readingTime: "${metadata.readingTime || '5 min read'}"
wordCount: ${content.split(/\s+/).length}

# Quality Scores
overallScore: ${report.overallScore}
grammarScore: ${report.sections.grammar.score}
linkScore: ${report.sections.links.score}
formatScore: ${report.sections.formatting.score}
codeScore: ${report.sections.codeExamples.score}
publishingScore: ${report.sections.publishing.score}

# SEO Optimization
canonical: "${metadata.canonical || ''}"
metaRobots: "index, follow"
structuredData: true

# Social Media
openGraph:
  title: "${metadata.socialMedia?.openGraph?.title || metadata.title || ''}"
  description: "${metadata.socialMedia?.openGraph?.description || metadata.metaDescription || ''}"
  image: "${metadata.socialMedia?.openGraph?.image || ''}"
  type: "article"

twitter:
  card: "summary_large_image"
  title: "${metadata.socialMedia?.twitter?.title || metadata.title || ''}"
  description: "${metadata.socialMedia?.twitter?.description || metadata.metaDescription || ''}"
  image: "${metadata.socialMedia?.twitter?.image || ''}"

# Platform Readiness
platforms:
  blog: ${report.platformReadiness.blog.ready}
  twitter: ${report.platformReadiness.twitter.ready}
  linkedin: ${report.platformReadiness.linkedin.ready}
  repost: ${report.platformReadiness.repost.ready}
  medium: ${report.platformReadiness.medium.ready}
  devto: ${report.platformReadiness.devto.ready}

# Publishing Checklist
checklist:
  grammarCheck: ${report.sections.grammar.score >= 85}
  linkValidation: ${report.sections.links.score >= 90}
  formatValidation: ${report.sections.formatting.score >= 85}
  codeValidation: ${report.sections.codeExamples.score >= 80}
  seoOptimization: ${report.sections.publishing.seoReadiness.score >= 80}
  socialMediaReady: ${report.sections.publishing.socialMediaReadiness.score >= 75}

# Action Items
${report.actionItems.length > 0 ? 'actionItems:' : '# No action items - ready to publish!'}
${report.actionItems.map(item => `  - priority: ${item.priority}
    category: ${item.category}
    action: "${item.action}"
    details: "${Array.isArray(item.details) ? item.details.join(', ') : item.details}"`).join('\n')}
---

`;

        return frontMatter + content;
    }

    async createPlatformVersions(readyFiles) {
        console.log('\n📱 Creating platform-specific versions...');
        
        const platformsDir = path.join(this.publishReadyDir, 'platforms');
        
        for (const fileReport of readyFiles) {
            const fileName = fileReport.fileName.replace('.md', '');
            
            // Create versions for each ready platform
            Object.entries(fileReport.platformReadiness).forEach(([platform, readiness]) => {
                if (readiness.ready) {
                    const platformContent = this.createPlatformSpecificContent(
                        fileReport, 
                        platform
                    );
                    
                    const platformFile = path.join(platformsDir, `${fileName}-${platform}.md`);
                    fs.writeFileSync(platformFile, platformContent);
                }
            });
        }
        
        console.log('✅ Platform-specific versions created');
    }

    createPlatformSpecificContent(fileReport, platform) {
        const originalPath = path.join(
            fs.existsSync(this.optimizedDir) ? this.optimizedDir : this.contentDir,
            fileReport.fileName
        );
        const content = fs.readFileSync(originalPath, 'utf8');
        
        switch (platform) {
            case 'twitter':
                return this.createTwitterContent(content, fileReport);
            case 'linkedin':
                return this.createLinkedInContent(content, fileReport);
            case 'repost':
                return this.createRepostContent(content, fileReport);
            case 'medium':
                return this.createMediumContent(content, fileReport);
            case 'devto':
                return this.createDevToContent(content, fileReport);
            default:
                return content;
        }
    }

    createTwitterContent(content, fileReport) {
        // Extract key points for Twitter thread
        const title = content.match(/^#\s+(.+)$/m)?.[1] || 'Blog Post';
        const sections = content.split(/\n## /).slice(1, 6); // First 5 sections
        
        let twitterThread = `🧵 THREAD: ${title}\n\n`;
        
        sections.forEach((section, index) => {
            const sectionTitle = section.split('\n')[0];
            const firstParagraph = section.split('\n\n')[1] || '';
            
            twitterThread += `${index + 1}/ ${sectionTitle}\n\n`;
            twitterThread += firstParagraph.substring(0, 200);
            if (firstParagraph.length > 200) twitterThread += '...';
            twitterThread += '\n\n';
        });
        
        twitterThread += `🔗 Read the full article: [link]\n\n`;
        twitterThread += `#AI #Development #AWS #Kiro #TechBlog`;
        
        return twitterThread;
    }

    createLinkedInContent(content, fileReport) {
        const title = content.match(/^#\s+(.+)$/m)?.[1] || 'Blog Post';
        const firstParagraph = content.split('\n\n')[1] || '';
        
        return `${title}

${firstParagraph}

🔑 Key takeaways:
• Workflow-first approach to AI development
• Spec-driven methodology for complex projects
• Real-world AWS implementation examples
• Practical development insights

What's your experience with AI-powered development tools?

Read the full article: [link]

#ArtificialIntelligence #SoftwareDevelopment #AWS #DeveloperTools #TechLeadership`;
    }

    createRepostContent(content, fileReport) {
        // re:Post optimized version with technical focus
        return `<!-- re:Post optimized version -->
${content}

## Additional Resources

- [GitHub Repository](https://github.com/example/repo)
- [Live Demo](https://main.d2ashs0ytllqag.amplifyapp.com)
- [AWS Documentation](https://docs.aws.amazon.com)

## Tags
AI Development, AWS, Bedrock, Kiro, RAG Systems, Serverless Architecture

---
*This article was optimized for re:Post with technical depth and practical examples.*`;
    }

    createMediumContent(content, fileReport) {
        // Medium-specific formatting
        return content
            .replace(/^# /gm, '# ')
            .replace(/^## /gm, '## ')
            .replace(/^### /gm, '### ') + `

---

*Originally published on [Developer Blog Platform](https://developerblog.com)*

*Follow for more AI development insights and AWS tutorials.*`;
    }

    createDevToContent(content, fileReport) {
        const title = content.match(/^#\s+(.+)$/m)?.[1] || 'Blog Post';
        
        const frontMatter = `---
title: ${title}
published: true
description: AI-powered development with Kiro and AWS services
tags: ai, aws, development, kiro
canonical_url: https://developerblog.com/article
cover_image: https://developerblog.com/images/cover.jpg
---

`;

        return frontMatter + content;
    }

    async generatePublishingReport(results) {
        const totalFiles = results.length;
        const readyFiles = results.filter(r => r.readyToPublish).length;
        const averageScore = results.reduce((sum, r) => sum + r.overallScore, 0) / totalFiles;
        
        const report = `# Publishing Preparation Report

Generated on: ${new Date().toISOString()}

## Summary

- **Total Files**: ${totalFiles}
- **Ready to Publish**: ${readyFiles}
- **Needs Work**: ${totalFiles - readyFiles}
- **Average Quality Score**: ${averageScore.toFixed(1)}/100

## Publishing Status

### ✅ Ready to Publish (Score ≥ 85)
${results.filter(r => r.readyToPublish).map(r => 
    `- **${r.fileName}** (${r.overallScore}/100) - All platforms ready`
).join('\n') || 'None yet'}

### ⚠️ Needs Work (Score < 85)
${results.filter(r => !r.readyToPublish).map(r => 
    `- **${r.fileName}** (${r.overallScore}/100) - ${r.actionItems.length} action items`
).join('\n') || 'All files ready!'}

## Detailed Analysis

${results.map(result => `
### ${result.fileName}

**Overall Score**: ${result.overallScore}/100
**Status**: ${result.readyToPublish ? '✅ Ready to Publish' : '⚠️ Needs Work'}

#### Quality Breakdown
- **Grammar & Style**: ${result.sections.grammar.score}/100 (${result.sections.grammar.issuesFound} issues)
- **Link Validation**: ${result.sections.links.score}/100 (${result.sections.links.brokenLinks}/${result.sections.links.totalLinks} broken)
- **Formatting**: ${result.sections.formatting.score}/100
- **Code Examples**: ${result.sections.codeExamples.score}/100 (${result.sections.codeExamples.syntaxErrors} syntax errors)
- **Publishing Readiness**: ${result.sections.publishing.score}/100

#### Platform Readiness
${Object.entries(result.platformReadiness).map(([platform, readiness]) => 
    `- **${platform}**: ${readiness.ready ? '✅' : '❌'} (${readiness.score}/100)`
).join('\n')}

${result.actionItems.length > 0 ? `#### Action Items (${result.actionItems.length})
${result.actionItems.map(item => 
    `- **${item.priority.toUpperCase()}**: ${item.action}`
).join('\n')}` : '#### ✅ No action items - ready to publish!'}

---
`).join('\n')}

## Publishing Checklist

### Before Publishing
- [ ] All high-priority action items addressed
- [ ] Links validated and working
- [ ] Code examples tested
- [ ] Grammar and style reviewed
- [ ] SEO metadata complete
- [ ] Social media assets prepared

### Platform-Specific Preparation
- [ ] **Blog**: SEO optimized, proper formatting
- [ ] **Twitter**: Thread format, character limits respected
- [ ] **LinkedIn**: Professional tone, engagement hooks
- [ ] **re:Post**: Technical depth, comprehensive examples
- [ ] **Medium**: Long-form structure, canonical URL
- [ ] **Dev.to**: Developer focus, proper tags

### Post-Publishing
- [ ] Monitor engagement metrics
- [ ] Respond to comments and feedback
- [ ] Share across social media channels
- [ ] Update internal links as needed

## Quality Standards Met

### Excellent (90-100)
${results.filter(r => r.overallScore >= 90).map(r => `- ${r.fileName}`).join('\n') || 'None yet - aim higher!'}

### Good (85-89)
${results.filter(r => r.overallScore >= 85 && r.overallScore < 90).map(r => `- ${r.fileName}`).join('\n') || 'None in this range'}

### Needs Improvement (70-84)
${results.filter(r => r.overallScore >= 70 && r.overallScore < 85).map(r => `- ${r.fileName}`).join('\n') || 'None in this range'}

### Requires Major Work (<70)
${results.filter(r => r.overallScore < 70).map(r => `- ${r.fileName}`).join('\n') || 'None - great job!'}

---

*This report was generated by the Publishing Preparation System. Files scoring 85+ are ready for publication across multiple platforms.*
`;

        fs.writeFileSync(this.reportPath, report);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const preparation = new PublishingPreparation();
    preparation.prepareAllForPublishing().catch(console.error);
}

export { PublishingPreparation };