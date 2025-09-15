/**
 * Amazon 4Cs Writing Principles Optimizer
 * Applies Clear, Concise, Correct, and Conversational principles to content
 */

class FourCsOptimizer {
    constructor() {
        this.clearityRules = new ClarityRules();
        this.concisenessRules = new ConcisenessRules();
        this.correctnessRules = new CorrectnessRules();
        this.conversationalRules = new ConversationalRules();
    }

    /**
     * Apply all 4Cs principles to content
     */
    optimizeContent(content) {
        let optimized = content;
        
        // Apply each principle in order
        optimized = this.clearityRules.apply(optimized);
        optimized = this.concisenessRules.apply(optimized);
        optimized = this.correctnessRules.apply(optimized);
        optimized = this.conversationalRules.apply(optimized);
        
        return {
            content: optimized,
            analysis: this.analyzeContent(content, optimized),
            suggestions: this.generateSuggestions(content, optimized)
        };
    }

    /**
     * Analyze content against 4Cs principles
     */
    analyzeContent(original, optimized) {
        return {
            clarity: this.clearityRules.analyze(optimized),
            conciseness: this.concisenessRules.analyze(original, optimized),
            correctness: this.correctnessRules.analyze(optimized),
            conversational: this.conversationalRules.analyze(optimized)
        };
    }

    /**
     * Generate improvement suggestions
     */
    generateSuggestions(original, optimized) {
        const suggestions = [];
        
        // Clarity suggestions
        suggestions.push(...this.clearityRules.getSuggestions(optimized));
        
        // Conciseness suggestions
        suggestions.push(...this.concisenessRules.getSuggestions(original, optimized));
        
        // Correctness suggestions
        suggestions.push(...this.correctnessRules.getSuggestions(optimized));
        
        // Conversational suggestions
        suggestions.push(...this.conversationalRules.getSuggestions(optimized));
        
        return suggestions;
    }
}

/**
 * Clarity Rules - Logical flow and structure
 */
class ClarityRules {
    apply(content) {
        let optimized = content;
        
        // Improve heading hierarchy
        optimized = this.optimizeHeadings(optimized);
        
        // Add transitions between sections
        optimized = this.addTransitions(optimized);
        
        // Improve paragraph structure
        optimized = this.optimizeParagraphs(optimized);
        
        return optimized;
    }

    optimizeHeadings(content) {
        // Ensure proper heading hierarchy (H1 -> H2 -> H3)
        const lines = content.split('\n');
        let currentLevel = 0;
        
        return lines.map(line => {
            if (line.startsWith('#')) {
                const level = (line.match(/^#+/) || [''])[0].length;
                
                // Fix heading hierarchy jumps
                if (level > currentLevel + 1) {
                    const correctedLevel = Math.min(level, currentLevel + 1);
                    currentLevel = correctedLevel;
                    return '#'.repeat(correctedLevel) + line.substring(level);
                }
                
                currentLevel = level;
            }
            return line;
        }).join('\n');
    }

    addTransitions(content) {
        // Add smooth transitions between major sections
        const sections = content.split(/\n(?=##\s)/);
        
        return sections.map((section, index) => {
            if (index === 0) return section;
            
            // Add transition phrases for better flow
            const transitions = [
                "Building on this foundation,",
                "With this context in mind,",
                "Taking this approach further,",
                "This leads us to the next crucial step:",
                "Now that we've established this,"
            ];
            
            // Only add if section doesn't already have a transition
            if (!section.match(/^##\s.*\n\n(Building|With|Taking|This|Now)/)) {
                const transition = transitions[index % transitions.length];
                return section.replace(/^(##\s.*\n\n)/, `$1${transition}\n\n`);
            }
            
            return section;
        }).join('\n');
    }

    optimizeParagraphs(content) {
        // Break up long paragraphs (>5 sentences)
        const paragraphs = content.split('\n\n');
        
        return paragraphs.map(paragraph => {
            if (paragraph.startsWith('#') || paragraph.startsWith('```')) {
                return paragraph;
            }
            
            const sentences = paragraph.split(/[.!?]+\s+/);
            if (sentences.length > 5) {
                // Split into smaller paragraphs
                const midpoint = Math.ceil(sentences.length / 2);
                const firstHalf = sentences.slice(0, midpoint).join('. ') + '.';
                const secondHalf = sentences.slice(midpoint).join('. ');
                return `${firstHalf}\n\n${secondHalf}`;
            }
            
            return paragraph;
        }).join('\n\n');
    }

    analyze(content) {
        const headingLevels = (content.match(/^#+/gm) || []).map(h => h.length);
        const paragraphLengths = content.split('\n\n')
            .filter(p => !p.startsWith('#') && !p.startsWith('```'))
            .map(p => (p.match(/[.!?]/g) || []).length);
        
        return {
            headingHierarchy: this.checkHeadingHierarchy(headingLevels),
            averageParagraphLength: paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length || 0,
            longParagraphs: paragraphLengths.filter(l => l > 5).length,
            score: this.calculateClarityScore(headingLevels, paragraphLengths)
        };
    }

    checkHeadingHierarchy(levels) {
        let valid = true;
        let currentLevel = 0;
        
        for (const level of levels) {
            if (level > currentLevel + 1) {
                valid = false;
                break;
            }
            currentLevel = level;
        }
        
        return { valid, levels };
    }

    calculateClarityScore(headingLevels, paragraphLengths) {
        let score = 100;
        
        // Deduct for poor heading hierarchy
        if (!this.checkHeadingHierarchy(headingLevels).valid) {
            score -= 20;
        }
        
        // Deduct for long paragraphs
        const longParagraphs = paragraphLengths.filter(l => l > 5).length;
        score -= longParagraphs * 5;
        
        return Math.max(0, score);
    }

    getSuggestions(content) {
        const suggestions = [];
        const analysis = this.analyze(content);
        
        if (!analysis.headingHierarchy.valid) {
            suggestions.push({
                type: 'clarity',
                priority: 'high',
                message: 'Fix heading hierarchy - avoid jumping from H1 to H3 without H2'
            });
        }
        
        if (analysis.longParagraphs > 0) {
            suggestions.push({
                type: 'clarity',
                priority: 'medium',
                message: `Break up ${analysis.longParagraphs} long paragraphs (>5 sentences each)`
            });
        }
        
        return suggestions;
    }
}

/**
 * Conciseness Rules - Essential information only
 */
class ConcisenessRules {
    constructor() {
        this.fillerWords = [
            'actually', 'basically', 'essentially', 'literally', 'really',
            'quite', 'rather', 'somewhat', 'very', 'extremely',
            'in order to', 'due to the fact that', 'it should be noted that'
        ];
        
        this.passiveIndicators = [
            'was', 'were', 'been', 'being', 'is being', 'are being'
        ];
    }

    apply(content) {
        let optimized = content;
        
        // Remove filler words
        optimized = this.removeFillerWords(optimized);
        
        // Convert passive to active voice
        optimized = this.convertPassiveToActive(optimized);
        
        // Simplify complex sentences
        optimized = this.simplifySentences(optimized);
        
        return optimized;
    }

    removeFillerWords(content) {
        let optimized = content;
        
        this.fillerWords.forEach(filler => {
            const regex = new RegExp(`\\b${filler}\\b`, 'gi');
            optimized = optimized.replace(regex, '');
        });
        
        // Clean up extra spaces
        optimized = optimized.replace(/\s+/g, ' ');
        optimized = optimized.replace(/\s+\./g, '.');
        
        return optimized;
    }

    convertPassiveToActive(content) {
        // Simple passive voice conversions
        const conversions = [
            { passive: /was created by/gi, active: 'created' },
            { passive: /were generated by/gi, active: 'generated' },
            { passive: /is being processed by/gi, active: 'processes' },
            { passive: /was implemented by/gi, active: 'implemented' }
        ];
        
        let optimized = content;
        conversions.forEach(({ passive, active }) => {
            optimized = optimized.replace(passive, active);
        });
        
        return optimized;
    }

    simplifySentences(content) {
        // Break sentences longer than 25 words
        const sentences = content.split(/([.!?]+\s+)/);
        
        return sentences.map(sentence => {
            if (sentence.match(/[.!?]/)) return sentence;
            
            const words = sentence.split(/\s+/);
            if (words.length > 25) {
                // Find natural break points (conjunctions)
                const breakPoints = ['and', 'but', 'however', 'because', 'since', 'while'];
                
                for (const breakPoint of breakPoints) {
                    const index = words.findIndex(word => word.toLowerCase() === breakPoint);
                    if (index > 5 && index < words.length - 5) {
                        const firstPart = words.slice(0, index).join(' ');
                        const secondPart = words.slice(index + 1).join(' ');
                        return `${firstPart}. ${breakPoint.charAt(0).toUpperCase() + breakPoint.slice(1)} ${secondPart}`;
                    }
                }
            }
            
            return sentence;
        }).join('');
    }

    analyze(original, optimized) {
        const originalWords = original.split(/\s+/).length;
        const optimizedWords = optimized.split(/\s+/).length;
        const reduction = ((originalWords - optimizedWords) / originalWords) * 100;
        
        const fillerCount = this.countFillerWords(optimized);
        const passiveCount = this.countPassiveVoice(optimized);
        
        return {
            wordReduction: reduction,
            fillerWordsRemaining: fillerCount,
            passiveVoiceInstances: passiveCount,
            averageSentenceLength: this.calculateAverageSentenceLength(optimized),
            score: this.calculateConcisenessScore(fillerCount, passiveCount, optimized)
        };
    }

    countFillerWords(content) {
        let count = 0;
        this.fillerWords.forEach(filler => {
            const matches = content.match(new RegExp(`\\b${filler}\\b`, 'gi'));
            if (matches) count += matches.length;
        });
        return count;
    }

    countPassiveVoice(content) {
        let count = 0;
        this.passiveIndicators.forEach(indicator => {
            const matches = content.match(new RegExp(`\\b${indicator}\\b`, 'gi'));
            if (matches) count += matches.length;
        });
        return count;
    }

    calculateAverageSentenceLength(content) {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const totalWords = sentences.reduce((total, sentence) => {
            return total + sentence.split(/\s+/).length;
        }, 0);
        
        return sentences.length > 0 ? totalWords / sentences.length : 0;
    }

    calculateConcisenessScore(fillerCount, passiveCount, content) {
        let score = 100;
        
        // Deduct for filler words
        score -= fillerCount * 2;
        
        // Deduct for passive voice
        score -= passiveCount * 3;
        
        // Deduct for long sentences
        const avgSentenceLength = this.calculateAverageSentenceLength(content);
        if (avgSentenceLength > 20) {
            score -= (avgSentenceLength - 20) * 2;
        }
        
        return Math.max(0, score);
    }

    getSuggestions(original, optimized) {
        const suggestions = [];
        const analysis = this.analyze(original, optimized);
        
        if (analysis.fillerWordsRemaining > 5) {
            suggestions.push({
                type: 'conciseness',
                priority: 'medium',
                message: `Remove ${analysis.fillerWordsRemaining} remaining filler words`
            });
        }
        
        if (analysis.passiveVoiceInstances > 3) {
            suggestions.push({
                type: 'conciseness',
                priority: 'medium',
                message: `Convert ${analysis.passiveVoiceInstances} passive voice instances to active`
            });
        }
        
        if (analysis.averageSentenceLength > 20) {
            suggestions.push({
                type: 'conciseness',
                priority: 'high',
                message: `Average sentence length is ${analysis.averageSentenceLength.toFixed(1)} words - aim for under 20`
            });
        }
        
        return suggestions;
    }
}

/**
 * Correctness Rules - Accurate and verified content
 */
class CorrectnessRules {
    constructor() {
        this.technicalTerms = new Map([
            ['AWS Lambda', 'AWS Lambda'],
            ['DynamoDB', 'DynamoDB'],
            ['S3', 'Amazon S3'],
            ['Bedrock', 'Amazon Bedrock'],
            ['Amplify', 'AWS Amplify'],
            ['CDK', 'AWS CDK'],
            ['CloudFormation', 'AWS CloudFormation']
        ]);
    }

    apply(content) {
        let optimized = content;
        
        // Standardize technical terms
        optimized = this.standardizeTechnicalTerms(optimized);
        
        // Validate code examples
        optimized = this.validateCodeExamples(optimized);
        
        // Check links and references
        optimized = this.validateLinks(optimized);
        
        return optimized;
    }

    standardizeTechnicalTerms(content) {
        let optimized = content;
        
        this.technicalTerms.forEach((correct, term) => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            optimized = optimized.replace(regex, correct);
        });
        
        return optimized;
    }

    validateCodeExamples(content) {
        // Extract code blocks and validate syntax
        const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
        
        let optimized = content;
        
        codeBlocks.forEach(block => {
            // Add proper language tags if missing
            if (block.startsWith('```\n')) {
                // Try to detect language from content
                const codeContent = block.slice(4, -3);
                const language = this.detectLanguage(codeContent);
                if (language) {
                    const improvedBlock = `\`\`\`${language}\n${codeContent}\n\`\`\``;
                    optimized = optimized.replace(block, improvedBlock);
                }
            }
            
            // Add comments for complex code
            if (block.includes('function') && !block.includes('//') && !block.includes('#')) {
                // Add basic comments for functions
                const improvedBlock = this.addCodeComments(block);
                optimized = optimized.replace(block, improvedBlock);
            }
        });
        
        return optimized;
    }

    detectLanguage(code) {
        if (code.includes('import') && code.includes('from')) return 'python';
        if (code.includes('const') || code.includes('function')) return 'javascript';
        if (code.includes('interface') || code.includes('class') && code.includes(':')) return 'typescript';
        if (code.includes('aws ') || code.includes('cdk ')) return 'bash';
        return null;
    }

    addCodeComments(codeBlock) {
        // Simple comment addition for functions
        let improved = codeBlock;
        
        // Add comments before function definitions
        improved = improved.replace(
            /(function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|def\s+\w+)/g,
            '// Generated function\n$1'
        );
        
        return improved;
    }

    validateLinks(content) {
        // Extract and validate markdown links
        const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
        
        let optimized = content;
        
        links.forEach(link => {
            const [, text, url] = link.match(/\[([^\]]+)\]\(([^)]+)\)/) || [];
            
            if (url) {
                // Ensure HTTPS for external links
                if (url.startsWith('http://') && !url.includes('localhost')) {
                    const httpsUrl = url.replace('http://', 'https://');
                    const improvedLink = `[${text}](${httpsUrl})`;
                    optimized = optimized.replace(link, improvedLink);
                }
                
                // Add target="_blank" for external links in HTML context
                if (url.startsWith('http') && !url.includes('github.com')) {
                    // Note: This would be handled in HTML rendering
                }
            }
        });
        
        return optimized;
    }

    analyze(content) {
        const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
        const links = (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
        const technicalTerms = this.countTechnicalTerms(content);
        
        return {
            codeBlocksCount: codeBlocks,
            linksCount: links,
            technicalTermsUsed: technicalTerms,
            score: this.calculateCorrectnessScore(content)
        };
    }

    countTechnicalTerms(content) {
        let count = 0;
        this.technicalTerms.forEach((correct, term) => {
            const matches = content.match(new RegExp(`\\b${term}\\b`, 'gi'));
            if (matches) count += matches.length;
        });
        return count;
    }

    calculateCorrectnessScore(content) {
        let score = 100;
        
        // Check for common technical errors
        const errors = [
            /lambda function/gi, // Should be "Lambda function"
            /dynamodb table/gi,  // Should be "DynamoDB table"
            /s3 bucket/gi        // Should be "Amazon S3 bucket"
        ];
        
        errors.forEach(errorPattern => {
            const matches = content.match(errorPattern);
            if (matches) score -= matches.length * 5;
        });
        
        return Math.max(0, score);
    }

    getSuggestions(content) {
        const suggestions = [];
        
        // Check for unstandardized technical terms
        const unstandardized = content.match(/\b(lambda function|dynamodb table|s3 bucket)\b/gi);
        if (unstandardized) {
            suggestions.push({
                type: 'correctness',
                priority: 'high',
                message: `Standardize technical terms: ${unstandardized.join(', ')}`
            });
        }
        
        // Check for code blocks without language tags
        const untaggedCode = content.match(/```\n[^`]/g);
        if (untaggedCode) {
            suggestions.push({
                type: 'correctness',
                priority: 'medium',
                message: `Add language tags to ${untaggedCode.length} code blocks`
            });
        }
        
        return suggestions;
    }
}

/**
 * Conversational Rules - Engaging developer tone
 */
class ConversationalRules {
    constructor() {
        this.formalPhrases = new Map([
            ['it is important to note that', 'note that'],
            ['in order to', 'to'],
            ['due to the fact that', 'because'],
            ['it should be mentioned that', ''],
            ['one must consider', 'consider'],
            ['it is recommended that', 'I recommend']
        ]);
        
        this.engagementWords = [
            'you', 'your', 'we', 'our', 'let\'s', 'here\'s', 'imagine', 'picture'
        ];
    }

    apply(content) {
        let optimized = content;
        
        // Replace formal phrases
        optimized = this.replaceFormalPhrases(optimized);
        
        // Add personal pronouns
        optimized = this.addPersonalTouch(optimized);
        
        // Include rhetorical questions
        optimized = this.addEngagementElements(optimized);
        
        return optimized;
    }

    replaceFormalPhrases(content) {
        let optimized = content;
        
        this.formalPhrases.forEach((replacement, formal) => {
            const regex = new RegExp(formal, 'gi');
            optimized = optimized.replace(regex, replacement);
        });
        
        return optimized;
    }

    addPersonalTouch(content) {
        // Convert some third-person statements to first-person
        let optimized = content;
        
        // Convert "The developer" to "I" in appropriate contexts
        optimized = optimized.replace(/The developer (discovered|found|realized|learned)/gi, 'I $1');
        
        // Convert "One can" to "You can"
        optimized = optimized.replace(/One can/g, 'You can');
        
        return optimized;
    }

    addEngagementElements(content) {
        // Add occasional rhetorical questions and direct address
        const paragraphs = content.split('\n\n');
        
        return paragraphs.map((paragraph, index) => {
            // Skip headings and code blocks
            if (paragraph.startsWith('#') || paragraph.startsWith('```')) {
                return paragraph;
            }
            
            // Occasionally add engagement elements
            if (index % 4 === 0 && paragraph.length > 100) {
                // Add a question or direct address
                if (paragraph.includes('problem') || paragraph.includes('challenge')) {
                    return paragraph + '\n\nSound familiar?';
                }
                if (paragraph.includes('solution') || paragraph.includes('approach')) {
                    return paragraph + '\n\nHere\'s how we tackled it:';
                }
            }
            
            return paragraph;
        }).join('\n\n');
    }

    analyze(content) {
        const engagementScore = this.calculateEngagementScore(content);
        const personalPronouns = this.countPersonalPronouns(content);
        const formalPhrases = this.countFormalPhrases(content);
        
        return {
            engagementScore,
            personalPronounsCount: personalPronouns,
            formalPhrasesCount: formalPhrases,
            score: this.calculateConversationalScore(content)
        };
    }

    calculateEngagementScore(content) {
        let score = 0;
        
        this.engagementWords.forEach(word => {
            const matches = content.match(new RegExp(`\\b${word}\\b`, 'gi'));
            if (matches) score += matches.length;
        });
        
        return score;
    }

    countPersonalPronouns(content) {
        const pronouns = ['I', 'we', 'you', 'my', 'our', 'your'];
        let count = 0;
        
        pronouns.forEach(pronoun => {
            const matches = content.match(new RegExp(`\\b${pronoun}\\b`, 'gi'));
            if (matches) count += matches.length;
        });
        
        return count;
    }

    countFormalPhrases(content) {
        let count = 0;
        
        this.formalPhrases.forEach((replacement, formal) => {
            const matches = content.match(new RegExp(formal, 'gi'));
            if (matches) count += matches.length;
        });
        
        return count;
    }

    calculateConversationalScore(content) {
        let score = 50; // Base score
        
        // Add points for engagement
        score += this.calculateEngagementScore(content) * 2;
        
        // Deduct for formal phrases
        score -= this.countFormalPhrases(content) * 5;
        
        // Add points for personal pronouns
        score += Math.min(this.countPersonalPronouns(content) * 1, 30);
        
        return Math.min(100, Math.max(0, score));
    }

    getSuggestions(content) {
        const suggestions = [];
        const analysis = this.analyze(content);
        
        if (analysis.formalPhrasesCount > 3) {
            suggestions.push({
                type: 'conversational',
                priority: 'medium',
                message: `Replace ${analysis.formalPhrasesCount} formal phrases with conversational alternatives`
            });
        }
        
        if (analysis.personalPronounsCount < 10) {
            suggestions.push({
                type: 'conversational',
                priority: 'medium',
                message: 'Add more personal pronouns (I, we, you) to create connection with readers'
            });
        }
        
        if (analysis.engagementScore < 5) {
            suggestions.push({
                type: 'conversational',
                priority: 'high',
                message: 'Add more engagement elements like questions, direct address, and inclusive language'
            });
        }
        
        return suggestions;
    }
}

export { FourCsOptimizer };