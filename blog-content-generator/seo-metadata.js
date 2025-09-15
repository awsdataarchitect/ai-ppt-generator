#!/usr/bin/env node

/**
 * SEO Metadata Generator
 * Creates comprehensive SEO metadata and social sharing elements for blog content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SEOOptimizer } from './src/utils/SEOOptimizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SEOMetadataGenerator {
    constructor() {
        this.seoOptimizer = new SEOOptimizer();
        this.contentDir = path.join(__dirname, 'src/content');
        this.outputDir = path.join(__dirname, 'seo-optimized');
        this.metadataPath = path.join(__dirname, 'seo-metadata.json');
    }

    async generateAllMetadata() {
        console.log('🔍 Generating SEO metadata and social sharing elements...\n');
        
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        const contentFiles = this.getContentFiles();
        const allMetadata = {};

        for (const file of contentFiles) {
            console.log(`📊 Analyzing: ${path.basename(file)}`);
            const metadata = await this.generateFileMetadata(file);
            allMetadata[path.basename(file)] = metadata;
            
            // Create SEO-optimized version with metadata
            await this.createSEOOptimizedFile(file, metadata);
            
            console.log(`✅ SEO Score: ${metadata.seoScore.score}/100 (${metadata.seoScore.level})\n`);
        }

        // Save comprehensive metadata
        fs.writeFileSync(this.metadataPath, JSON.stringify(allMetadata, null, 2));
        
        // Generate platform-specific versions
        await this.generatePlatformVersions(allMetadata);
        
        console.log('🎉 SEO optimization complete! Check seo-metadata.json for details.');
        return allMetadata;
    }

    getContentFiles() {
        return fs.readdirSync(this.contentDir)
            .filter(file => file.endsWith('.md'))
            .map(file => path.join(this.contentDir, file));
    }

    async generateFileMetadata(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath, '.md');
        
        // Extract title from content
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : this.generateTitleFromFilename(fileName);
        
        // Generate comprehensive SEO metadata
        const seoData = this.seoOptimizer.generateSEOMetadata(content, title);
        
        return {
            fileName,
            title,
            ...seoData,
            platformVersions: this.generatePlatformVersions(content, title, seoData)
        };
    }

    generateTitleFromFilename(fileName) {
        return fileName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async createSEOOptimizedFile(filePath, metadata) {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);
        
        // Create SEO-optimized version with metadata header
        const seoContent = this.buildSEOOptimizedContent(content, metadata);
        
        const outputPath = path.join(this.outputDir, fileName);
        fs.writeFileSync(outputPath, seoContent);
    }

    buildSEOOptimizedContent(content, metadata) {
        const metadataHeader = `---
title: "${metadata.meta.title}"
description: "${metadata.meta.description}"
keywords: "${metadata.meta.keywords}"
author: "${metadata.meta.author}"
readingTime: "${metadata.meta.readingTime}"
wordCount: ${metadata.meta.wordCount}
seoScore: ${metadata.seoScore.score}
canonical: "${metadata.meta.canonical}"

# Open Graph / Social Media
og:title: "${metadata.socialMedia.openGraph.title}"
og:description: "${metadata.socialMedia.openGraph.description}"
og:type: "${metadata.socialMedia.openGraph.type}"
og:url: "${metadata.socialMedia.openGraph.url}"
og:image: "${metadata.socialMedia.openGraph.image}"

# Twitter Card
twitter:card: "${metadata.socialMedia.twitter.card}"
twitter:title: "${metadata.socialMedia.twitter.title}"
twitter:description: "${metadata.socialMedia.twitter.description}"
twitter:image: "${metadata.socialMedia.twitter.image}"

# LinkedIn
linkedin:title: "${metadata.socialMedia.linkedin.title}"
linkedin:description: "${metadata.socialMedia.linkedin.description}"

# re:Post
repost:title: "${metadata.socialMedia.repost.title}"
repost:description: "${metadata.socialMedia.repost.description}"
repost:tags: [${metadata.socialMedia.repost.tags.map(tag => `"${tag}"`).join(', ')}]
repost:category: "${metadata.socialMedia.repost.category}"

# SEO Analysis
primaryKeywords: [${metadata.keywords.primary.map(k => `"${k}"`).join(', ')}]
secondaryKeywords: [${metadata.keywords.secondary.map(k => `"${k}"`).join(', ')}]
technicalTerms: [${metadata.keywords.technical.slice(0, 10).map(k => `"${k}"`).join(', ')}]

# Readability
readabilityScore: ${metadata.readabilityScore.fleschScore}
readabilityLevel: "${metadata.readabilityScore.level}"
avgSentenceLength: ${metadata.readabilityScore.avgSentenceLength}

# Internal Links Suggestions
internalLinks:
${metadata.internalLinks.map(link => `  - url: "${link.url}"
    anchor: "${link.anchor}"
    context: "${link.context}"`).join('\n')}

# Structured Data (JSON-LD)
structuredData: |
  ${JSON.stringify(metadata.structuredData, null, 2).split('\n').join('\n  ')}
---

`;

        return metadataHeader + content;
    }

    generatePlatformVersions(content, title, seoData) {
        return {
            twitter: this.createTwitterVersion(content, title, seoData),
            linkedin: this.createLinkedInVersion(content, title, seoData),
            repost: this.createRepostVersion(content, title, seoData),
            medium: this.createMediumVersion(content, title, seoData),
            devto: this.createDevToVersion(content, title, seoData)
        };
    }

    createTwitterVersion(content, title, seoData) {
        const twitterTitle = seoData.socialMedia.twitter.title;
        const twitterDesc = seoData.socialMedia.twitter.description;
        
        return {
            title: twitterTitle,
            description: twitterDesc,
            hashtags: ['#AI', '#AWS', '#Kiro', '#Development', '#Serverless'],
            thread: this.createTwitterThread(content, title),
            image: seoData.socialMedia.twitter.image
        };
    }

    createTwitterThread(content, title) {
        // Extract key points for Twitter thread
        const sections = content.split(/\n## /);
        const thread = [];
        
        // Opening tweet
        thread.push(`🧵 ${title}\n\nA thread about transforming software development with AI-powered workflows 👇`);
        
        // Key points from each section
        sections.slice(1, 6).forEach((section, index) => {
            const sectionTitle = section.split('\n')[0];
            const firstParagraph = section.split('\n\n')[1] || '';
            
            if (firstParagraph.length > 0) {
                let tweet = `${index + 2}/ ${sectionTitle}\n\n${firstParagraph.substring(0, 200)}`;
                if (firstParagraph.length > 200) tweet += '...';
                thread.push(tweet);
            }
        });
        
        // Closing tweet
        thread.push(`🎯 Key takeaway: AI-powered development isn't about replacing developers—it's about amplifying our capabilities through better workflows.\n\nTry the live demo: https://main.d2ashs0ytllqag.amplifyapp.com\n\n#AI #Development #AWS #Kiro`);
        
        return thread;
    }

    createLinkedInVersion(content, title, seoData) {
        const linkedinTitle = seoData.socialMedia.linkedin.title;
        const linkedinDesc = seoData.socialMedia.linkedin.description;
        
        // Create LinkedIn-optimized post
        const post = `${linkedinTitle}

${linkedinDesc}

🔑 Key insights from this journey:

• Workflow-first approach beats tool-first thinking
• Spec-driven development enables fearless iteration  
• AI assistants excel at architectural guidance
• Modular specs prevent technical debt accumulation

The result? A production AWS-native RAG system built in weeks, not months.

💡 What's your experience with AI-powered development? Have you found workflow changes more impactful than the tools themselves?

Try the live system: https://main.d2ashs0ytllqag.amplifyapp.com

#ArtificialIntelligence #SoftwareDevelopment #AWS #DeveloperTools #Innovation #TechLeadership`;

        return {
            title: linkedinTitle,
            post,
            image: seoData.socialMedia.linkedin.image,
            tags: ['AI', 'Software Development', 'AWS', 'Developer Tools', 'Innovation']
        };
    }

    createRepostVersion(content, title, seoData) {
        return {
            title: seoData.socialMedia.repost.title,
            description: seoData.socialMedia.repost.description,
            tags: seoData.socialMedia.repost.tags,
            category: seoData.socialMedia.repost.category,
            content: this.optimizeForRepost(content),
            callToAction: 'Try the live AI PPT Generator and experience spec-driven development firsthand.'
        };
    }

    createMediumVersion(content, title, seoData) {
        // Medium-specific optimizations
        const mediumContent = content
            .replace(/^# /gm, '# ') // Keep H1 as is
            .replace(/^## /gm, '## ') // Keep H2 as is
            .replace(/^### /gm, '### '); // Keep H3 as is
        
        return {
            title: title,
            subtitle: seoData.meta.description,
            content: mediumContent,
            tags: seoData.keywords.primary.concat(seoData.keywords.secondary).slice(0, 5),
            canonicalUrl: seoData.meta.canonical
        };
    }

    createDevToVersion(content, title, seoData) {
        // Dev.to specific front matter
        const devToFrontMatter = `---
title: ${title}
published: true
description: ${seoData.meta.description}
tags: ${seoData.keywords.primary.slice(0, 4).join(', ')}
canonical_url: ${seoData.meta.canonical}
cover_image: ${seoData.socialMedia.openGraph.image}
---

`;

        return {
            frontMatter: devToFrontMatter,
            content: devToFrontMatter + content,
            tags: seoData.keywords.primary.slice(0, 4)
        };
    }

    optimizeForRepost(content) {
        // re:Post specific optimizations
        return content
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Bold formatting
            .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Italic formatting
            .replace(/`([^`]+)`/g, '<code>$1</code>'); // Inline code
    }

    async generatePlatformVersions(allMetadata) {
        const platformsDir = path.join(this.outputDir, 'platforms');
        if (!fs.existsSync(platformsDir)) {
            fs.mkdirSync(platformsDir, { recursive: true });
        }

        Object.entries(allMetadata).forEach(([fileName, metadata]) => {
            const baseName = fileName.replace('.md', '');
            
            // Create platform-specific files
            Object.entries(metadata.platformVersions).forEach(([platform, data]) => {
                const platformFile = path.join(platformsDir, `${baseName}-${platform}.json`);
                fs.writeFileSync(platformFile, JSON.stringify(data, null, 2));
            });
        });

        console.log('📱 Generated platform-specific versions in seo-optimized/platforms/');
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const generator = new SEOMetadataGenerator();
    generator.generateAllMetadata().catch(console.error);
}

export { SEOMetadataGenerator };