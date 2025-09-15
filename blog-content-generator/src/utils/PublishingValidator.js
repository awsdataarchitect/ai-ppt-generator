/**
 * Publishing Validator and Preparation Tool
 * Comprehensive validation for grammar, links, formatting, and publishing readiness
 */

class PublishingValidator {
    constructor() {
        this.grammarRules = new GrammarChecker();
        this.linkValidator = new LinkValidator();
        this.formatValidator = new FormatValidator();
        this.codeValidator = new CodeValidator();
        this.publishingChecker = new PublishingChecker();
    }

    /**
     * Comprehensive validation for publishing readiness
     */
    async validateForPublishing(content, metadata = {}) {
        console.log('🔍 Starting comprehensive publishing validation...\n');
        
        const results = {
            grammar: await this.grammarRules.check(content),
            links: await this.linkValidator.validateAll(content),
            formatting: this.formatValidator.validate(content),
            codeExamples: this.codeValidator.validate(content),
            publishing: this.publishingChecker.validate(content, metadata),
            overall: { score: 0, status: 'pending', issues: [] }
        };
        
        // Calculate overall score and status
        results.overall = this.calculateOverallScore(results);
        
        return results;
    }

    /**
     * Generate publishing report
     */
    generatePublishingReport(validationResults, fileName) {
        const report = {
            fileName,
            timestamp: new Date().toISOString(),
            overallScore: validationResults.overall.score,
            status: validationResults.overall.status,
            readyToPublish: validationResults.overall.score >= 85,
            sections: {
                grammar: this.formatGrammarReport(validationResults.grammar),
                links: this.formatLinksReport(validationResults.links),
                formatting: this.formatFormattingReport(validationResults.formatting),
                codeExamples: this.formatCodeReport(validationResults.codeExamples),
                publishing: this.formatPublishingReport(validationResults.publishing)
            },
            actionItems: this.generateActionItems(validationResults),
            platformReadiness: this.assessPlatformReadiness(validationResults)
        };
        
        return report;
    }

    calculateOverallScore(results) {
        const weights = {
            grammar: 0.25,
            links: 0.20,
            formatting: 0.20,
            codeExamples: 0.20,
            publishing: 0.15
        };
        
        let totalScore = 0;
        let totalWeight = 0;
        const issues = [];
        
        Object.entries(weights).forEach(([category, weight]) => {
            if (results[category] && typeof results[category].score === 'number') {
                totalScore += results[category].score * weight;
                totalWeight += weight;
                
                if (results[category].issues) {
                    issues.push(...results[category].issues);
                }
            }
        });
        
        const score = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
        
        let status;
        if (score >= 90) status = 'excellent';
        else if (score >= 85) status = 'ready';
        else if (score >= 70) status = 'needs-minor-fixes';
        else if (score >= 50) status = 'needs-major-fixes';
        else status = 'not-ready';
        
        return { score, status, issues };
    }

    formatGrammarReport(grammarResults) {
        return {
            score: grammarResults.score,
            issuesFound: grammarResults.issues.length,
            categories: {
                spelling: grammarResults.issues.filter(i => i.type === 'spelling').length,
                grammar: grammarResults.issues.filter(i => i.type === 'grammar').length,
                style: grammarResults.issues.filter(i => i.type === 'style').length
            },
            topIssues: grammarResults.issues.slice(0, 5)
        };
    }

    formatLinksReport(linkResults) {
        return {
            score: linkResults.score,
            totalLinks: linkResults.total,
            workingLinks: linkResults.working,
            brokenLinks: linkResults.broken.length,
            brokenLinksList: linkResults.broken,
            suggestions: linkResults.suggestions
        };
    }

    formatFormattingReport(formatResults) {
        return {
            score: formatResults.score,
            headingStructure: formatResults.headingStructure,
            markdownCompliance: formatResults.markdownCompliance,
            consistency: formatResults.consistency,
            issues: formatResults.issues
        };
    }

    formatCodeReport(codeResults) {
        return {
            score: codeResults.score,
            totalCodeBlocks: codeResults.total,
            validatedBlocks: codeResults.validated,
            syntaxErrors: codeResults.syntaxErrors,
            missingLanguageTags: codeResults.missingLanguageTags,
            suggestions: codeResults.suggestions
        };
    }

    formatPublishingReport(publishingResults) {
        return {
            score: publishingResults.score,
            seoReadiness: publishingResults.seoReadiness,
            socialMediaReadiness: publishingResults.socialMediaReadiness,
            platformCompatibility: publishingResults.platformCompatibility,
            contentQuality: publishingResults.contentQuality
        };
    }

    generateActionItems(results) {
        const actionItems = [];
        
        // High priority items
        if (results.links.broken.length > 0) {
            actionItems.push({
                priority: 'high',
                category: 'links',
                action: `Fix ${results.links.broken.length} broken links`,
                details: results.links.broken.map(link => link.url)
            });
        }
        
        if (results.codeExamples.syntaxErrors > 0) {
            actionItems.push({
                priority: 'high',
                category: 'code',
                action: `Fix ${results.codeExamples.syntaxErrors} code syntax errors`,
                details: 'Review and test all code examples'
            });
        }
        
        // Medium priority items
        if (results.grammar.issues.length > 5) {
            actionItems.push({
                priority: 'medium',
                category: 'grammar',
                action: `Address ${results.grammar.issues.length} grammar/style issues`,
                details: results.grammar.issues.slice(0, 3).map(i => i.message)
            });
        }
        
        if (results.formatting.issues.length > 0) {
            actionItems.push({
                priority: 'medium',
                category: 'formatting',
                action: 'Fix formatting inconsistencies',
                details: results.formatting.issues
            });
        }
        
        // Low priority items
        if (results.codeExamples.missingLanguageTags > 0) {
            actionItems.push({
                priority: 'low',
                category: 'code',
                action: `Add language tags to ${results.codeExamples.missingLanguageTags} code blocks`,
                details: 'Improves syntax highlighting and accessibility'
            });
        }
        
        return actionItems.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    assessPlatformReadiness(results) {
        const baseScore = results.overall.score;
        
        return {
            blog: {
                ready: baseScore >= 85,
                score: baseScore,
                requirements: ['Grammar check', 'Link validation', 'SEO optimization']
            },
            twitter: {
                ready: baseScore >= 80,
                score: baseScore,
                requirements: ['Character limits', 'Hashtag optimization', 'Thread structure']
            },
            linkedin: {
                ready: baseScore >= 85,
                score: baseScore,
                requirements: ['Professional tone', 'Engagement hooks', 'Industry relevance']
            },
            repost: {
                ready: baseScore >= 90,
                score: baseScore,
                requirements: ['Technical accuracy', 'Code examples', 'Comprehensive content']
            },
            medium: {
                ready: baseScore >= 85,
                score: baseScore,
                requirements: ['Long-form structure', 'Subheadings', 'Reading flow']
            },
            devto: {
                ready: baseScore >= 80,
                score: baseScore,
                requirements: ['Developer focus', 'Code examples', 'Community engagement']
            }
        };
    }
}

/**
 * Grammar and Style Checker
 */
class GrammarChecker {
    constructor() {
        this.commonErrors = [
            { pattern: /\bits\s/gi, suggestion: "it's", type: 'grammar' },
            { pattern: /\byour\s+going\b/gi, suggestion: "you're going", type: 'grammar' },
            { pattern: /\beffect\b/gi, suggestion: 'affect (verb) or effect (noun)', type: 'grammar' },
            { pattern: /\bthen\b/gi, suggestion: 'than (comparison) or then (time)', type: 'grammar' }
        ];
        
        this.styleIssues = [
            { pattern: /\bvery\s+\w+/gi, type: 'style', message: 'Consider stronger adjectives instead of "very"' },
            { pattern: /\bthat\s+that\b/gi, type: 'style', message: 'Redundant "that"' },
            { pattern: /\bin\s+order\s+to\b/gi, type: 'style', message: 'Use "to" instead of "in order to"' }
        ];
    }

    async check(content) {
        const issues = [];
        
        // Check common grammar errors
        this.commonErrors.forEach(error => {
            const matches = content.match(error.pattern);
            if (matches) {
                matches.forEach(match => {
                    issues.push({
                        type: error.type,
                        message: `Consider: "${match}" → "${error.suggestion}"`,
                        severity: 'medium'
                    });
                });
            }
        });
        
        // Check style issues
        this.styleIssues.forEach(style => {
            const matches = content.match(style.pattern);
            if (matches) {
                matches.forEach(match => {
                    issues.push({
                        type: style.type,
                        message: `${style.message}: "${match}"`,
                        severity: 'low'
                    });
                });
            }
        });
        
        // Check sentence length
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        sentences.forEach((sentence, index) => {
            const words = sentence.split(/\s+/).length;
            if (words > 30) {
                issues.push({
                    type: 'style',
                    message: `Long sentence (${words} words) at position ${index + 1}`,
                    severity: 'medium'
                });
            }
        });
        
        // Check paragraph length
        const paragraphs = content.split('\n\n').filter(p => !p.startsWith('#') && p.trim().length > 0);
        paragraphs.forEach((paragraph, index) => {
            const sentences = paragraph.split(/[.!?]+/).length;
            if (sentences > 8) {
                issues.push({
                    type: 'style',
                    message: `Long paragraph (${sentences} sentences) at position ${index + 1}`,
                    severity: 'low'
                });
            }
        });
        
        const score = Math.max(0, 100 - (issues.length * 5));
        
        return { score, issues, totalIssues: issues.length };
    }
}

/**
 * Link Validator
 */
class LinkValidator {
    async validateAll(content) {
        const links = this.extractLinks(content);
        const results = {
            total: links.length,
            working: 0,
            broken: [],
            suggestions: []
        };
        
        for (const link of links) {
            const isValid = await this.validateLink(link.url);
            if (isValid) {
                results.working++;
            } else {
                results.broken.push(link);
            }
            
            // Add suggestions for link optimization
            const suggestions = this.getLinkSuggestions(link);
            results.suggestions.push(...suggestions);
        }
        
        const score = links.length > 0 ? Math.round((results.working / links.length) * 100) : 100;
        results.score = score;
        
        return results;
    }

    extractLinks(content) {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const links = [];
        let match;
        
        while ((match = linkRegex.exec(content)) !== null) {
            links.push({
                text: match[1],
                url: match[2],
                fullMatch: match[0]
            });
        }
        
        return links;
    }

    async validateLink(url) {
        // Simulate link validation (in real implementation, would make HTTP requests)
        // For demo purposes, assume most links are valid except obvious issues
        
        if (!url || url.trim() === '') return false;
        if (url.startsWith('http://example.com')) return false;
        if (url.includes('localhost') && !url.includes('3000')) return false;
        
        // Check for common valid patterns
        const validPatterns = [
            /^https:\/\/github\.com/,
            /^https:\/\/docs\.aws\.amazon\.com/,
            /^https:\/\/linkedin\.com/,
            /^https:\/\/main\.d2ashs0ytllqag\.amplifyapp\.com/
        ];
        
        return validPatterns.some(pattern => pattern.test(url));
    }

    getLinkSuggestions(link) {
        const suggestions = [];
        
        // Suggest HTTPS
        if (link.url.startsWith('http://')) {
            suggestions.push({
                type: 'security',
                link: link.fullMatch,
                message: 'Convert to HTTPS for better security and SEO'
            });
        }
        
        // Suggest descriptive anchor text
        if (link.text.toLowerCase().includes('click here') || 
            link.text.toLowerCase().includes('read more')) {
            suggestions.push({
                type: 'accessibility',
                link: link.fullMatch,
                message: 'Use more descriptive anchor text'
            });
        }
        
        // Suggest rel attributes for external links
        if (link.url.startsWith('http') && !link.url.includes('developerblog.com')) {
            suggestions.push({
                type: 'seo',
                link: link.fullMatch,
                message: 'Add rel="noopener noreferrer" for external links'
            });
        }
        
        return suggestions;
    }
}

/**
 * Format Validator
 */
class FormatValidator {
    validate(content) {
        const issues = [];
        let score = 100;
        
        // Check heading structure
        const headingStructure = this.validateHeadingStructure(content);
        if (!headingStructure.valid) {
            issues.push('Invalid heading hierarchy');
            score -= 15;
        }
        
        // Check markdown compliance
        const markdownCompliance = this.validateMarkdownCompliance(content);
        score -= (markdownCompliance.issues.length * 5);
        issues.push(...markdownCompliance.issues);
        
        // Check consistency
        const consistency = this.validateConsistency(content);
        score -= (consistency.issues.length * 3);
        issues.push(...consistency.issues);
        
        return {
            score: Math.max(0, score),
            headingStructure,
            markdownCompliance,
            consistency,
            issues
        };
    }

    validateHeadingStructure(content) {
        const headings = content.match(/^#+\s+.+$/gm) || [];
        const levels = headings.map(h => (h.match(/^#+/) || [''])[0].length);
        
        let valid = true;
        let currentLevel = 0;
        
        for (const level of levels) {
            if (level > currentLevel + 1) {
                valid = false;
                break;
            }
            currentLevel = level;
        }
        
        return {
            valid,
            levels,
            h1Count: levels.filter(l => l === 1).length,
            h2Count: levels.filter(l => l === 2).length,
            h3Count: levels.filter(l => l === 3).length
        };
    }

    validateMarkdownCompliance(content) {
        const issues = [];
        
        // Check for proper code block formatting
        const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
        codeBlocks.forEach(block => {
            if (!block.startsWith('```\n') && !block.match(/^```\w+\n/)) {
                issues.push('Code block missing language specification');
            }
        });
        
        // Check for proper list formatting
        const listItems = content.match(/^\s*[-*+]\s+/gm) || [];
        const numberedItems = content.match(/^\s*\d+\.\s+/gm) || [];
        
        if (listItems.length > 0 && numberedItems.length > 0) {
            // Check for consistent list markers
            const bulletMarkers = listItems.map(item => item.trim()[0]);
            const uniqueMarkers = [...new Set(bulletMarkers)];
            if (uniqueMarkers.length > 1) {
                issues.push('Inconsistent bullet list markers');
            }
        }
        
        return { issues };
    }

    validateConsistency(content) {
        const issues = [];
        
        // Check for consistent emphasis formatting
        const boldPatterns = [
            content.match(/\*\*[^*]+\*\*/g) || [],
            content.match(/__[^_]+__/g) || []
        ];
        
        if (boldPatterns[0].length > 0 && boldPatterns[1].length > 0) {
            issues.push('Inconsistent bold formatting (mix of ** and __)');
        }
        
        // Check for consistent italic formatting
        const italicPatterns = [
            content.match(/\*[^*]+\*/g) || [],
            content.match(/_[^_]+_/g) || []
        ];
        
        if (italicPatterns[0].length > 0 && italicPatterns[1].length > 0) {
            issues.push('Inconsistent italic formatting (mix of * and _)');
        }
        
        return { issues };
    }
}

/**
 * Code Validator
 */
class CodeValidator {
    validate(content) {
        const codeBlocks = this.extractCodeBlocks(content);
        let syntaxErrors = 0;
        let missingLanguageTags = 0;
        const suggestions = [];
        
        codeBlocks.forEach(block => {
            // Check for language tags
            if (!block.language) {
                missingLanguageTags++;
                suggestions.push({
                    type: 'language-tag',
                    message: `Add language tag to code block: ${block.code.substring(0, 50)}...`
                });
            }
            
            // Basic syntax validation
            if (block.language === 'javascript' || block.language === 'typescript') {
                if (this.hasJavaScriptSyntaxErrors(block.code)) {
                    syntaxErrors++;
                }
            }
            
            if (block.language === 'python') {
                if (this.hasPythonSyntaxErrors(block.code)) {
                    syntaxErrors++;
                }
            }
        });
        
        const total = codeBlocks.length;
        const validated = total - syntaxErrors;
        const score = total > 0 ? Math.round((validated / total) * 100) : 100;
        
        return {
            score,
            total,
            validated,
            syntaxErrors,
            missingLanguageTags,
            suggestions
        };
    }

    extractCodeBlocks(content) {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const blocks = [];
        let match;
        
        while ((match = codeBlockRegex.exec(content)) !== null) {
            blocks.push({
                language: match[1] || null,
                code: match[2],
                fullMatch: match[0]
            });
        }
        
        return blocks;
    }

    hasJavaScriptSyntaxErrors(code) {
        // Basic JavaScript syntax checks
        const errors = [
            /\bfunction\s+\w+\s*\([^)]*\)\s*{[^}]*$/m, // Unclosed function
            /\bif\s*\([^)]*\)\s*{[^}]*$/m, // Unclosed if statement
            /\bfor\s*\([^)]*\)\s*{[^}]*$/m, // Unclosed for loop
            /[{[](?:[^{}\[\]]*[{[])*[^{}\[\]]*$/m // Unmatched brackets
        ];
        
        return errors.some(pattern => pattern.test(code));
    }

    hasPythonSyntaxErrors(code) {
        // Basic Python syntax checks
        const errors = [
            /^\s*def\s+\w+\([^)]*\):\s*$/m, // Function without body
            /^\s*if\s+[^:]*:\s*$/m, // If statement without body
            /^\s*for\s+[^:]*:\s*$/m, // For loop without body
            /^\s*class\s+\w+[^:]*:\s*$/m // Class without body
        ];
        
        return errors.some(pattern => pattern.test(code));
    }
}

/**
 * Publishing Checker
 */
class PublishingChecker {
    validate(content, metadata = {}) {
        const seoReadiness = this.checkSEOReadiness(content, metadata);
        const socialMediaReadiness = this.checkSocialMediaReadiness(content, metadata);
        const platformCompatibility = this.checkPlatformCompatibility(content);
        const contentQuality = this.checkContentQuality(content);
        
        const score = Math.round((
            seoReadiness.score +
            socialMediaReadiness.score +
            platformCompatibility.score +
            contentQuality.score
        ) / 4);
        
        return {
            score,
            seoReadiness,
            socialMediaReadiness,
            platformCompatibility,
            contentQuality
        };
    }

    checkSEOReadiness(content, metadata) {
        let score = 100;
        const issues = [];
        
        // Check title
        if (!metadata.title || metadata.title.length < 30 || metadata.title.length > 60) {
            score -= 20;
            issues.push('Title should be 30-60 characters');
        }
        
        // Check meta description
        if (!metadata.metaDescription || metadata.metaDescription.length < 150) {
            score -= 15;
            issues.push('Meta description should be 150-160 characters');
        }
        
        // Check keywords
        if (!metadata.keywords || metadata.keywords.split(',').length < 5) {
            score -= 10;
            issues.push('Include at least 5 relevant keywords');
        }
        
        // Check content length
        const wordCount = content.split(/\s+/).length;
        if (wordCount < 1000) {
            score -= 15;
            issues.push('Content should be at least 1000 words for SEO');
        }
        
        return { score: Math.max(0, score), issues };
    }

    checkSocialMediaReadiness(content, metadata) {
        let score = 100;
        const issues = [];
        
        // Check for social media metadata
        if (!metadata.socialMedia) {
            score -= 30;
            issues.push('Missing social media metadata');
        } else {
            if (!metadata.socialMedia.openGraph) {
                score -= 15;
                issues.push('Missing Open Graph tags');
            }
            if (!metadata.socialMedia.twitter) {
                score -= 15;
                issues.push('Missing Twitter Card tags');
            }
        }
        
        // Check for engaging elements
        const hasQuestions = /\?/.test(content);
        const hasCallToAction = /try|learn|discover|explore/i.test(content);
        
        if (!hasQuestions) {
            score -= 10;
            issues.push('Add engaging questions for social media');
        }
        
        if (!hasCallToAction) {
            score -= 10;
            issues.push('Include clear call-to-action');
        }
        
        return { score: Math.max(0, score), issues };
    }

    checkPlatformCompatibility(content) {
        let score = 100;
        const issues = [];
        
        // Check markdown compatibility
        const hasComplexTables = /\|.*\|.*\|/.test(content);
        const hasComplexFormatting = /<[^>]+>/.test(content);
        
        if (hasComplexTables) {
            score -= 10;
            issues.push('Complex tables may not render well on all platforms');
        }
        
        if (hasComplexFormatting) {
            score -= 15;
            issues.push('HTML formatting may not be supported on all platforms');
        }
        
        // Check for platform-specific elements
        const hasCodeBlocks = /```/.test(content);
        const hasImages = /!\[.*\]\(.*\)/.test(content);
        
        if (hasCodeBlocks) {
            score += 10; // Good for developer platforms
        }
        
        if (hasImages) {
            score += 5; // Good for visual platforms
        }
        
        return { score: Math.min(100, Math.max(0, score)), issues };
    }

    checkContentQuality(content) {
        let score = 100;
        const issues = [];
        
        // Check structure
        const headings = (content.match(/^#+\s+/gm) || []).length;
        if (headings < 3) {
            score -= 15;
            issues.push('Add more headings for better structure');
        }
        
        // Check examples and evidence
        const codeBlocks = (content.match(/```/g) || []).length / 2;
        const links = (content.match(/\[.*\]\(.*\)/g) || []).length;
        
        if (codeBlocks < 2) {
            score -= 10;
            issues.push('Add more code examples');
        }
        
        if (links < 3) {
            score -= 10;
            issues.push('Add more supporting links');
        }
        
        // Check readability
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgSentenceLength = content.split(/\s+/).length / sentences.length;
        
        if (avgSentenceLength > 25) {
            score -= 15;
            issues.push('Reduce average sentence length for better readability');
        }
        
        return { score: Math.max(0, score), issues };
    }
}

export { PublishingValidator };