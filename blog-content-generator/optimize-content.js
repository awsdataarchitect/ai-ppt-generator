#!/usr/bin/env node

/**
 * Content Optimization Script
 * Applies Amazon 4Cs principles to all blog content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FourCsOptimizer } from './src/utils/FourCsOptimizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ContentOptimizer {
    constructor() {
        this.optimizer = new FourCsOptimizer();
        this.contentDir = path.join(__dirname, 'src/content');
        this.outputDir = path.join(__dirname, 'optimized-content');
        this.reportPath = path.join(__dirname, 'optimization-report.md');
    }

    async optimizeAllContent() {
        console.log('🚀 Starting Amazon 4Cs content optimization...\n');
        
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        const contentFiles = this.getContentFiles();
        const results = [];

        for (const file of contentFiles) {
            console.log(`📝 Optimizing: ${file}`);
            const result = await this.optimizeFile(file);
            results.push(result);
            console.log(`✅ Completed: ${file} (Score improved by ${result.improvement}%)\n`);
        }

        // Generate comprehensive report
        await this.generateOptimizationReport(results);
        
        console.log('🎉 Optimization complete! Check optimization-report.md for details.');
        return results;
    }

    getContentFiles() {
        return fs.readdirSync(this.contentDir)
            .filter(file => file.endsWith('.md'))
            .map(file => path.join(this.contentDir, file));
    }

    async optimizeFile(filePath) {
        const originalContent = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);
        
        // Apply 4Cs optimization
        const optimizationResult = this.optimizer.optimizeContent(originalContent);
        
        // Calculate improvement scores
        const originalScore = this.calculateOverallScore(originalContent);
        const optimizedScore = this.calculateOverallScore(optimizationResult.content);
        const improvement = Math.round(optimizedScore - originalScore);
        
        // Save optimized content
        const outputPath = path.join(this.outputDir, fileName);
        fs.writeFileSync(outputPath, optimizationResult.content);
        
        return {
            fileName,
            originalPath: filePath,
            optimizedPath: outputPath,
            originalScore,
            optimizedScore,
            improvement,
            analysis: optimizationResult.analysis,
            suggestions: optimizationResult.suggestions,
            wordCount: {
                original: originalContent.split(/\s+/).length,
                optimized: optimizationResult.content.split(/\s+/).length
            }
        };
    }

    calculateOverallScore(content) {
        const analysis = this.optimizer.optimizeContent(content).analysis;
        return Math.round((
            analysis.clarity.score +
            analysis.conciseness.score +
            analysis.correctness.score +
            analysis.conversational.score
        ) / 4);
    }

    async generateOptimizationReport(results) {
        const report = this.buildOptimizationReport(results);
        fs.writeFileSync(this.reportPath, report);
    }

    buildOptimizationReport(results) {
        const totalFiles = results.length;
        const averageImprovement = results.reduce((sum, r) => sum + r.improvement, 0) / totalFiles;
        const totalWordReduction = results.reduce((sum, r) => 
            sum + (r.wordCount.original - r.wordCount.optimized), 0);

        let report = `# Amazon 4Cs Content Optimization Report

Generated on: ${new Date().toISOString()}

## Summary

- **Files Optimized**: ${totalFiles}
- **Average Score Improvement**: ${averageImprovement.toFixed(1)}%
- **Total Word Reduction**: ${totalWordReduction} words
- **Optimization Principles Applied**: Clear, Concise, Correct, Conversational

## Individual File Results

`;

        results.forEach(result => {
            report += `### ${result.fileName}

**Score Improvement**: ${result.originalScore}% → ${result.optimizedScore}% (+${result.improvement}%)
**Word Count**: ${result.wordCount.original} → ${result.wordCount.optimized} (${result.wordCount.original - result.wordCount.optimized} words saved)

#### 4Cs Analysis
- **Clarity**: ${result.analysis.clarity.score}% (${result.analysis.clarity.longParagraphs} long paragraphs)
- **Conciseness**: ${result.analysis.conciseness.score}% (${result.analysis.conciseness.wordReduction.toFixed(1)}% word reduction)
- **Correctness**: ${result.analysis.correctness.score}% (${result.analysis.correctness.codeBlocksCount} code blocks, ${result.analysis.correctness.linksCount} links)
- **Conversational**: ${result.analysis.conversational.score}% (${result.analysis.conversational.personalPronounsCount} personal pronouns)

#### Improvement Suggestions
${result.suggestions.map(s => `- **${s.type}** (${s.priority}): ${s.message}`).join('\n')}

---

`;
        });

        report += `## Optimization Guidelines Applied

### Clear: Logical Flow and Structure
- Fixed heading hierarchy issues
- Added smooth transitions between sections
- Broke up paragraphs longer than 5 sentences
- Improved visual structure with proper formatting

### Concise: Essential Information Only
- Removed filler words and redundant phrases
- Converted passive voice to active voice
- Simplified complex sentences (target: <20 words)
- Eliminated unnecessary background information

### Correct: Accurate and Verified Content
- Standardized technical terminology (AWS Lambda, DynamoDB, etc.)
- Added proper language tags to code blocks
- Validated and improved code examples
- Ensured HTTPS links for external references

### Conversational: Engaging Developer Tone
- Replaced formal academic language with conversational tone
- Added personal pronouns and direct address
- Included rhetorical questions and engagement elements
- Maintained professional but approachable voice

## Next Steps

1. **Review Optimized Content**: Check files in \`optimized-content/\` directory
2. **Address High-Priority Suggestions**: Focus on items marked as "high" priority
3. **Test Code Examples**: Verify all code blocks work as expected
4. **Validate Links**: Ensure all external links are functional
5. **Final Proofread**: Review for grammar, flow, and technical accuracy

## Quality Metrics

### Target Scores (Amazon 4Cs Standards)
- **Clarity**: >85% (proper structure, clear flow)
- **Conciseness**: >80% (minimal filler, active voice)
- **Correctness**: >95% (accurate technical content)
- **Conversational**: >75% (engaging, personal tone)

### Files Meeting All Targets
${results.filter(r => 
    r.analysis.clarity.score >= 85 &&
    r.analysis.conciseness.score >= 80 &&
    r.analysis.correctness.score >= 95 &&
    r.analysis.conversational.score >= 75
).map(r => `- ${r.fileName}`).join('\n') || 'None yet - continue optimizing!'}

---

*This report was generated using the Amazon 4Cs Writing Framework optimizer. For more information about the 4Cs principles, see \`templates/amazon-4cs-guidelines.md\`.*
`;

        return report;
    }
}

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const optimizer = new ContentOptimizer();
    optimizer.optimizeAllContent().catch(console.error);
}

export { ContentOptimizer };