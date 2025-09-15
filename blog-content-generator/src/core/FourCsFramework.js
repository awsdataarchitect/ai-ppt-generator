/**
 * Amazon 4Cs Writing Framework Implementation
 * Ensures content follows Clear, Concise, Correct, Conversational principles
 */

export class FourCsFramework {
  constructor() {
    this.principles = {
      clear: {
        name: 'Clear',
        description: 'Logical flow with well-structured sections',
        guidelines: [
          'Use descriptive headings and subheadings',
          'Maintain consistent narrative flow',
          'Provide context before diving into technical details',
          'Use bullet points and numbered lists for clarity'
        ]
      },
      concise: {
        name: 'Concise',
        description: 'Essential information without unnecessary fluff',
        guidelines: [
          'Focus on actionable insights',
          'Remove redundant explanations',
          'Use active voice over passive voice',
          'Keep paragraphs focused on single concepts'
        ]
      },
      correct: {
        name: 'Correct',
        description: 'Accurate technical details and verified examples',
        guidelines: [
          'Validate all code examples',
          'Include proper error handling',
          'Reference official documentation',
          'Test all technical instructions'
        ]
      },
      conversational: {
        name: 'Conversational',
        description: 'Engaging tone that connects with developers',
        guidelines: [
          'Use first-person narrative for personal experiences',
          'Include relatable challenges and solutions',
          'Ask rhetorical questions to engage readers',
          'Share lessons learned and insights'
        ]
      }
    };
  }

  /**
   * Validates content against 4Cs principles
   * @param {Object} content - Content object with sections
   * @returns {Object} Validation results with suggestions
   */
  validateContent(content) {
    const results = {
      clear: this.validateClarity(content),
      concise: this.validateConciseness(content),
      correct: this.validateCorrectness(content),
      conversational: this.validateConversationalTone(content)
    };

    return {
      score: this.calculateOverallScore(results),
      results,
      suggestions: this.generateSuggestions(results)
    };
  }

  validateClarity(content) {
    const checks = {
      hasStructuredHeadings: this.hasStructuredHeadings(content),
      hasLogicalFlow: this.hasLogicalFlow(content),
      hasContextualIntroductions: this.hasContextualIntroductions(content)
    };

    return {
      score: Object.values(checks).filter(Boolean).length / Object.keys(checks).length,
      checks,
      principle: this.principles.clear
    };
  }

  validateConciseness(content) {
    const checks = {
      hasActiveVoice: this.hasActiveVoice(content),
      hasFocusedParagraphs: this.hasFocusedParagraphs(content),
      avoidsRedundancy: this.avoidsRedundancy(content)
    };

    return {
      score: Object.values(checks).filter(Boolean).length / Object.keys(checks).length,
      checks,
      principle: this.principles.concise
    };
  }

  validateCorrectness(content) {
    const checks = {
      hasValidCodeExamples: this.hasValidCodeExamples(content),
      hasProperReferences: this.hasProperReferences(content),
      hasErrorHandling: this.hasErrorHandling(content)
    };

    return {
      score: Object.values(checks).filter(Boolean).length / Object.keys(checks).length,
      checks,
      principle: this.principles.correct
    };
  }

  validateConversationalTone(content) {
    const checks = {
      hasPersonalNarrative: this.hasPersonalNarrative(content),
      hasEngagingQuestions: this.hasEngagingQuestions(content),
      sharesLessonsLearned: this.sharesLessonsLearned(content)
    };

    return {
      score: Object.values(checks).filter(Boolean).length / Object.keys(checks).length,
      checks,
      principle: this.principles.conversational
    };
  }

  // Validation helper methods
  hasStructuredHeadings(content) {
    return content.sections && content.sections.length > 2;
  }

  hasLogicalFlow(content) {
    // Check if content follows problem -> solution -> results pattern
    const sectionTitles = content.sections?.map(s => s.title.toLowerCase()) || [];
    return sectionTitles.some(title => 
      title.includes('challenge') || title.includes('problem')
    ) && sectionTitles.some(title => 
      title.includes('solution') || title.includes('implementation')
    );
  }

  hasContextualIntroductions(content) {
    return content.introduction && content.introduction.length > 100;
  }

  hasActiveVoice(content) {
    // Simple heuristic: check for active voice patterns
    const text = this.extractText(content);
    const passiveIndicators = /\b(was|were|been|being)\s+\w+ed\b/gi;
    const passiveCount = (text.match(passiveIndicators) || []).length;
    const totalSentences = text.split(/[.!?]+/).length;
    return passiveCount / totalSentences < 0.2; // Less than 20% passive voice
  }

  hasFocusedParagraphs(content) {
    const text = this.extractText(content);
    const paragraphs = text.split(/\n\s*\n/);
    const averageLength = paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length;
    return averageLength < 500; // Paragraphs under 500 characters
  }

  avoidsRedundancy(content) {
    // Simple check for repeated phrases
    const text = this.extractText(content);
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length > 0.6; // 60% unique words
  }

  hasValidCodeExamples(content) {
    return content.codeExamples && content.codeExamples.length > 0;
  }

  hasProperReferences(content) {
    return content.references && content.references.length > 0;
  }

  hasErrorHandling(content) {
    const text = this.extractText(content);
    return /try|catch|error|exception/i.test(text);
  }

  hasPersonalNarrative(content) {
    const text = this.extractText(content);
    return /\b(I|my|we|our)\b/gi.test(text);
  }

  hasEngagingQuestions(content) {
    const text = this.extractText(content);
    return (text.match(/\?/g) || []).length > 2;
  }

  sharesLessonsLearned(content) {
    const text = this.extractText(content);
    return /lesson|learn|discover|realize|insight/i.test(text);
  }

  extractText(content) {
    if (typeof content === 'string') return content;
    
    let text = '';
    if (content.introduction) text += content.introduction + ' ';
    if (content.sections) {
      content.sections.forEach(section => {
        text += section.title + ' ' + section.content + ' ';
      });
    }
    if (content.conclusion) text += content.conclusion + ' ';
    
    return text;
  }

  calculateOverallScore(results) {
    const scores = Object.values(results).map(r => r.score);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  generateSuggestions(results) {
    const suggestions = [];
    
    Object.entries(results).forEach(([principle, result]) => {
      if (result.score < 0.7) {
        suggestions.push({
          principle: principle,
          message: `Improve ${principle}: ${result.principle.description}`,
          guidelines: result.principle.guidelines
        });
      }
    });

    return suggestions;
  }
}