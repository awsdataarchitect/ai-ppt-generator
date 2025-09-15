/**
 * SEO Optimization and Social Sharing Elements Generator
 * Creates compelling meta descriptions, social media previews, and SEO-optimized content
 */

class SEOOptimizer {
    constructor() {
        this.targetKeywords = [
            'AI development', 'AWS Bedrock', 'Kiro IDE', 'spec-driven development',
            'RAG system', 'S3 Vectors', 'serverless architecture', 'developer tools',
            'AI coding assistant', 'AWS Lambda', 'DynamoDB', 'React development'
        ];
        
        this.socialPlatforms = {
            twitter: { titleLimit: 70, descriptionLimit: 200 },
            linkedin: { titleLimit: 150, descriptionLimit: 300 },
            facebook: { titleLimit: 100, descriptionLimit: 300 },
            repost: { titleLimit: 120, descriptionLimit: 400 }
        };
    }

    /**
     * Generate comprehensive SEO metadata for blog content
     */
    generateSEOMetadata(content, title, targetAudience = 'developers') {
        const analysis = this.analyzeContent(content);
        
        return {
            meta: this.generateMetaTags(content, title, analysis),
            socialMedia: this.generateSocialMediaTags(content, title, analysis),
            keywords: this.extractKeywords(content, analysis),
            structuredData: this.generateStructuredData(content, title, analysis),
            internalLinks: this.suggestInternalLinks(content),
            externalLinks: this.optimizeExternalLinks(content),
            readabilityScore: this.calculateReadabilityScore(content),
            seoScore: this.calculateSEOScore(content, title, analysis)
        };
    }

    /**
     * Analyze content for SEO optimization
     */
    analyzeContent(content) {
        const wordCount = content.split(/\s+/).length;
        const headings = this.extractHeadings(content);
        const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
        const links = (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
        const images = (content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length;
        
        return {
            wordCount,
            headings,
            codeBlocks,
            links,
            images,
            readingTime: Math.ceil(wordCount / 200), // Average reading speed
            keywordDensity: this.calculateKeywordDensity(content)
        };
    }

    /**
     * Generate meta tags for SEO
     */
    generateMetaTags(content, title, analysis) {
        const description = this.generateMetaDescription(content, title);
        const keywords = this.extractTopKeywords(content, 10);
        
        return {
            title: this.optimizeTitle(title),
            description,
            keywords: keywords.join(', '),
            author: 'Developer Blog Platform',
            robots: 'index, follow',
            canonical: this.generateCanonicalUrl(title),
            viewport: 'width=device-width, initial-scale=1.0',
            charset: 'UTF-8',
            language: 'en-US',
            readingTime: `${analysis.readingTime} min read`,
            wordCount: analysis.wordCount.toString()
        };
    }

    /**
     * Generate optimized meta description
     */
    generateMetaDescription(content, title) {
        // Extract first meaningful paragraph (skip headings and code)
        const paragraphs = content.split('\n\n')
            .filter(p => !p.startsWith('#') && !p.startsWith('```') && p.trim().length > 50)
            .slice(0, 3);
        
        let description = paragraphs.join(' ').substring(0, 300);
        
        // Clean up markdown formatting
        description = description
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1')     // Remove italic
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
            .replace(/`([^`]+)`/g, '$1')     // Remove inline code
            .trim();
        
        // Ensure it ends with a complete sentence
        const lastSentence = description.lastIndexOf('.');
        if (lastSentence > 150) {
            description = description.substring(0, lastSentence + 1);
        }
        
        // Add call-to-action if space allows
        if (description.length < 140) {
            description += ' Learn the complete implementation approach.';
        }
        
        return description;
    }

    /**
     * Generate social media sharing tags
     */
    generateSocialMediaTags(content, title, analysis) {
        const baseDescription = this.generateMetaDescription(content, title);
        
        return {
            openGraph: {
                title: this.optimizeTitle(title, 60),
                description: baseDescription.substring(0, 300),
                type: 'article',
                url: this.generateCanonicalUrl(title),
                image: this.suggestFeaturedImage(content),
                siteName: 'Developer Blog Platform',
                locale: 'en_US'
            },
            twitter: {
                card: 'summary_large_image',
                title: this.optimizeTitle(title, 70),
                description: baseDescription.substring(0, 200),
                image: this.suggestFeaturedImage(content),
                creator: '@developerblog',
                site: '@developerblog'
            },
            linkedin: {
                title: this.optimizeTitle(title, 150),
                description: baseDescription.substring(0, 300),
                image: this.suggestFeaturedImage(content)
            },
            repost: {
                title: this.optimizeTitle(title, 120),
                description: baseDescription.substring(0, 400),
                tags: this.extractTopKeywords(content, 5),
                category: 'Developer Tools'
            }
        };
    }

    /**
     * Optimize title for SEO and character limits
     */
    optimizeTitle(title, maxLength = 60) {
        // Ensure primary keyword is in title
        let optimized = title;
        
        // Add primary keyword if not present
        if (!title.toLowerCase().includes('kiro') && !title.toLowerCase().includes('ai development')) {
            optimized = `${title} | Kiro AI Development`;
        }
        
        // Truncate if too long
        if (optimized.length > maxLength) {
            optimized = optimized.substring(0, maxLength - 3) + '...';
        }
        
        return optimized;
    }

    /**
     * Extract and rank keywords from content
     */
    extractKeywords(content, analysis) {
        const keywords = this.extractTopKeywords(content, 20);
        
        return {
            primary: keywords.slice(0, 3),
            secondary: keywords.slice(3, 10),
            longTail: this.extractLongTailKeywords(content),
            technical: this.extractTechnicalTerms(content),
            density: this.calculateKeywordDensity(content)
        };
    }

    /**
     * Extract top keywords based on frequency and relevance
     */
    extractTopKeywords(content, limit = 10) {
        // Remove code blocks and links for keyword analysis
        const cleanContent = content
            .replace(/```[\s\S]*?```/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .toLowerCase();
        
        // Split into words and filter
        const words = cleanContent
            .split(/\s+/)
            .filter(word => word.length > 3)
            .filter(word => !this.isStopWord(word))
            .filter(word => /^[a-zA-Z]+$/.test(word));
        
        // Count frequency
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        // Sort by frequency and relevance
        const sorted = Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .map(([word]) => word);
        
        // Prioritize target keywords
        const prioritized = [];
        this.targetKeywords.forEach(keyword => {
            const keywordWords = keyword.toLowerCase().split(' ');
            if (keywordWords.some(word => sorted.includes(word))) {
                prioritized.push(keyword);
            }
        });
        
        // Add other high-frequency words
        sorted.forEach(word => {
            if (prioritized.length < limit && !prioritized.some(k => k.includes(word))) {
                prioritized.push(word);
            }
        });
        
        return prioritized.slice(0, limit);
    }

    /**
     * Extract long-tail keywords (2-4 word phrases)
     */
    extractLongTailKeywords(content) {
        const sentences = content
            .replace(/```[\s\S]*?```/g, '')
            .split(/[.!?]+/)
            .map(s => s.trim().toLowerCase());
        
        const phrases = [];
        
        sentences.forEach(sentence => {
            const words = sentence.split(/\s+/).filter(w => w.length > 2);
            
            // Extract 2-4 word phrases
            for (let i = 0; i < words.length - 1; i++) {
                for (let len = 2; len <= 4 && i + len <= words.length; len++) {
                    const phrase = words.slice(i, i + len).join(' ');
                    if (this.isRelevantPhrase(phrase)) {
                        phrases.push(phrase);
                    }
                }
            }
        });
        
        // Count and sort phrases
        const frequency = {};
        phrases.forEach(phrase => {
            frequency[phrase] = (frequency[phrase] || 0) + 1;
        });
        
        return Object.entries(frequency)
            .filter(([, count]) => count > 1)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([phrase]) => phrase);
    }

    /**
     * Extract technical terms and proper nouns
     */
    extractTechnicalTerms(content) {
        const technicalPatterns = [
            /AWS \w+/g,
            /Amazon \w+/g,
            /\b[A-Z][a-z]+[A-Z]\w*/g, // CamelCase
            /\b[A-Z]{2,}\b/g, // Acronyms
            /\w+\.js\b/g, // JavaScript files
            /\w+\.py\b/g, // Python files
            /\w+DB\b/g // Database names
        ];
        
        const terms = new Set();
        
        technicalPatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            matches.forEach(match => terms.add(match));
        });
        
        return Array.from(terms).slice(0, 15);
    }

    /**
     * Calculate keyword density
     */
    calculateKeywordDensity(content) {
        const totalWords = content.split(/\s+/).length;
        const density = {};
        
        this.targetKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
            const matches = content.match(regex) || [];
            density[keyword] = {
                count: matches.length,
                density: ((matches.length / totalWords) * 100).toFixed(2) + '%'
            };
        });
        
        return density;
    }

    /**
     * Generate structured data (JSON-LD)
     */
    generateStructuredData(content, title, analysis) {
        return {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            description: this.generateMetaDescription(content, title),
            author: {
                '@type': 'Person',
                name: 'Developer Blog Platform',
                url: 'https://developerblog.com/about'
            },
            publisher: {
                '@type': 'Organization',
                name: 'Developer Blog Platform',
                logo: {
                    '@type': 'ImageObject',
                    url: 'https://developerblog.com/logo.png'
                }
            },
            datePublished: new Date().toISOString(),
            dateModified: new Date().toISOString(),
            wordCount: analysis.wordCount,
            timeRequired: `PT${analysis.readingTime}M`,
            articleSection: 'Developer Tools',
            keywords: this.extractTopKeywords(content, 10).join(', '),
            mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': this.generateCanonicalUrl(title)
            }
        };
    }

    /**
     * Suggest internal links based on content
     */
    suggestInternalLinks(content) {
        const suggestions = [];
        
        // Define internal link opportunities
        const linkOpportunities = [
            {
                keywords: ['kiro', 'ai development', 'coding assistant'],
                url: '/kiro-guide',
                anchor: 'Learn more about Kiro AI development'
            },
            {
                keywords: ['aws', 'bedrock', 'lambda'],
                url: '/aws-integration-guide',
                anchor: 'Complete AWS integration guide'
            },
            {
                keywords: ['spec-driven', 'development methodology'],
                url: '/spec-driven-development',
                anchor: 'Spec-driven development methodology'
            },
            {
                keywords: ['rag system', 's3 vectors'],
                url: '/rag-implementation',
                anchor: 'RAG system implementation guide'
            }
        ];
        
        linkOpportunities.forEach(opportunity => {
            const hasKeywords = opportunity.keywords.some(keyword => 
                content.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (hasKeywords) {
                suggestions.push({
                    url: opportunity.url,
                    anchor: opportunity.anchor,
                    context: `Add internal link when mentioning: ${opportunity.keywords.join(', ')}`
                });
            }
        });
        
        return suggestions;
    }

    /**
     * Optimize external links
     */
    optimizeExternalLinks(content) {
        const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
        const optimized = [];
        
        links.forEach(link => {
            const [, text, url] = link.match(/\[([^\]]+)\]\(([^)]+)\)/) || [];
            
            if (url && url.startsWith('http')) {
                optimized.push({
                    original: link,
                    text,
                    url,
                    suggestions: this.getExternalLinkSuggestions(url, text)
                });
            }
        });
        
        return optimized;
    }

    /**
     * Get suggestions for external link optimization
     */
    getExternalLinkSuggestions(url, text) {
        const suggestions = [];
        
        // Ensure HTTPS
        if (url.startsWith('http://')) {
            suggestions.push({
                type: 'security',
                message: 'Convert to HTTPS for better SEO and security',
                fix: url.replace('http://', 'https://')
            });
        }
        
        // Add rel attributes for external links
        if (!url.includes('developerblog.com')) {
            suggestions.push({
                type: 'seo',
                message: 'Add rel="noopener noreferrer" for external links',
                fix: 'Add target="_blank" rel="noopener noreferrer" in HTML'
            });
        }
        
        // Suggest descriptive anchor text
        if (text.toLowerCase().includes('click here') || text.toLowerCase().includes('read more')) {
            suggestions.push({
                type: 'accessibility',
                message: 'Use more descriptive anchor text for better SEO and accessibility',
                fix: 'Replace with descriptive text about the destination'
            });
        }
        
        return suggestions;
    }

    /**
     * Calculate readability score
     */
    calculateReadabilityScore(content) {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = content.split(/\s+/);
        const syllables = this.countSyllables(content);
        
        // Flesch Reading Ease Score
        const avgSentenceLength = words.length / sentences.length;
        const avgSyllablesPerWord = syllables / words.length;
        
        const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
        
        return {
            fleschScore: Math.round(fleschScore),
            level: this.getReadabilityLevel(fleschScore),
            avgSentenceLength: Math.round(avgSentenceLength),
            avgSyllablesPerWord: avgSyllablesPerWord.toFixed(2),
            recommendations: this.getReadabilityRecommendations(fleschScore, avgSentenceLength)
        };
    }

    /**
     * Calculate overall SEO score
     */
    calculateSEOScore(content, title, analysis) {
        let score = 0;
        const factors = [];
        
        // Title optimization (20 points)
        if (title.length >= 30 && title.length <= 60) {
            score += 20;
            factors.push('✓ Title length optimized');
        } else {
            factors.push('✗ Title should be 30-60 characters');
        }
        
        // Content length (15 points)
        if (analysis.wordCount >= 1000 && analysis.wordCount <= 3000) {
            score += 15;
            factors.push('✓ Content length optimized');
        } else if (analysis.wordCount < 1000) {
            factors.push('✗ Content too short (aim for 1000+ words)');
        } else {
            factors.push('✗ Content very long (consider breaking up)');
        }
        
        // Heading structure (15 points)
        if (analysis.headings.h1 === 1 && analysis.headings.h2 >= 2) {
            score += 15;
            factors.push('✓ Good heading structure');
        } else {
            factors.push('✗ Improve heading structure (1 H1, multiple H2s)');
        }
        
        // Keyword usage (20 points)
        const keywordScore = this.calculateKeywordScore(content);
        score += keywordScore;
        if (keywordScore >= 15) {
            factors.push('✓ Good keyword usage');
        } else {
            factors.push('✗ Improve keyword usage and density');
        }
        
        // Internal links (10 points)
        const internalLinks = this.suggestInternalLinks(content).length;
        if (internalLinks >= 2) {
            score += 10;
            factors.push('✓ Good internal linking opportunities');
        } else {
            factors.push('✗ Add more internal links');
        }
        
        // External links (10 points)
        if (analysis.links >= 3) {
            score += 10;
            factors.push('✓ Good external link usage');
        } else {
            factors.push('✗ Add more authoritative external links');
        }
        
        // Media content (10 points)
        if (analysis.images >= 1 || analysis.codeBlocks >= 2) {
            score += 10;
            factors.push('✓ Good use of media/code examples');
        } else {
            factors.push('✗ Add images or more code examples');
        }
        
        return {
            score: Math.min(100, score),
            level: this.getSEOLevel(score),
            factors,
            recommendations: this.getSEORecommendations(score, factors)
        };
    }

    // Helper methods
    extractHeadings(content) {
        const headings = { h1: 0, h2: 0, h3: 0, h4: 0 };
        const lines = content.split('\n');
        
        lines.forEach(line => {
            if (line.startsWith('# ')) headings.h1++;
            else if (line.startsWith('## ')) headings.h2++;
            else if (line.startsWith('### ')) headings.h3++;
            else if (line.startsWith('#### ')) headings.h4++;
        });
        
        return headings;
    }

    generateCanonicalUrl(title) {
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        
        return `https://developerblog.com/${slug}`;
    }

    suggestFeaturedImage(content) {
        // Suggest featured image based on content
        if (content.includes('Kiro')) return 'https://developerblog.com/images/kiro-development.jpg';
        if (content.includes('AWS')) return 'https://developerblog.com/images/aws-architecture.jpg';
        if (content.includes('RAG')) return 'https://developerblog.com/images/rag-system.jpg';
        return 'https://developerblog.com/images/developer-tools.jpg';
    }

    isStopWord(word) {
        const stopWords = [
            'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
            'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
            'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his',
            'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
            'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
            'who', 'whom', 'whose', 'this', 'that', 'these', 'those', 'am', 'is',
            'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
            'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can', 'shall'
        ];
        
        return stopWords.includes(word.toLowerCase());
    }

    isRelevantPhrase(phrase) {
        // Check if phrase contains relevant technical terms
        const relevantTerms = [
            'ai', 'aws', 'kiro', 'development', 'code', 'system', 'api', 'data',
            'server', 'client', 'function', 'method', 'class', 'interface',
            'database', 'query', 'response', 'request', 'service', 'application'
        ];
        
        return relevantTerms.some(term => phrase.includes(term));
    }

    countSyllables(text) {
        // Simple syllable counting algorithm
        const words = text.toLowerCase().split(/\s+/);
        let totalSyllables = 0;
        
        words.forEach(word => {
            word = word.replace(/[^a-z]/g, '');
            if (word.length === 0) return;
            
            let syllables = word.match(/[aeiouy]+/g) || [];
            if (word.endsWith('e')) syllables.pop();
            if (syllables.length === 0) syllables = [1];
            
            totalSyllables += syllables.length;
        });
        
        return totalSyllables;
    }

    getReadabilityLevel(score) {
        if (score >= 90) return 'Very Easy';
        if (score >= 80) return 'Easy';
        if (score >= 70) return 'Fairly Easy';
        if (score >= 60) return 'Standard';
        if (score >= 50) return 'Fairly Difficult';
        if (score >= 30) return 'Difficult';
        return 'Very Difficult';
    }

    getReadabilityRecommendations(score, avgSentenceLength) {
        const recommendations = [];
        
        if (score < 60) {
            recommendations.push('Simplify sentence structure for better readability');
        }
        
        if (avgSentenceLength > 20) {
            recommendations.push('Break up long sentences (current average: ' + avgSentenceLength + ' words)');
        }
        
        if (score < 50) {
            recommendations.push('Use simpler vocabulary where possible');
            recommendations.push('Add more transition words and phrases');
        }
        
        return recommendations;
    }

    calculateKeywordScore(content) {
        let score = 0;
        const density = this.calculateKeywordDensity(content);
        
        Object.values(density).forEach(({ count, density: densityPercent }) => {
            const percent = parseFloat(densityPercent);
            if (percent >= 0.5 && percent <= 2.5) {
                score += 3; // Good density
            } else if (count > 0) {
                score += 1; // Present but not optimal
            }
        });
        
        return Math.min(20, score);
    }

    getSEOLevel(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Good';
        if (score >= 70) return 'Fair';
        if (score >= 60) return 'Needs Improvement';
        return 'Poor';
    }

    getSEORecommendations(score, factors) {
        const recommendations = [];
        
        factors.forEach(factor => {
            if (factor.startsWith('✗')) {
                recommendations.push(factor.substring(2));
            }
        });
        
        if (score < 70) {
            recommendations.push('Focus on improving title and heading structure first');
            recommendations.push('Add more relevant keywords naturally throughout content');
            recommendations.push('Include more internal and external links');
        }
        
        return recommendations;
    }
}

export { SEOOptimizer };