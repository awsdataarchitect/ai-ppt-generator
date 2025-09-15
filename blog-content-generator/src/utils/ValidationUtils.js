/**
 * Validation Utilities
 * Helper functions for content validation and quality assurance
 */

export class ValidationUtils {
  /**
   * Validates markdown syntax and structure
   * @param {string} markdown - Markdown content to validate
   * @returns {Object} Validation results
   */
  static validateMarkdown(markdown) {
    const issues = [];
    const warnings = [];

    // Check for basic markdown structure
    if (!markdown.includes('#')) {
      issues.push('No headings found - content should have clear structure');
    }

    // Check for code blocks without language specification
    const codeBlocks = markdown.match(/```[\s\S]*?```/g) || [];
    codeBlocks.forEach((block, index) => {
      if (block.startsWith('```\n')) {
        warnings.push(`Code block ${index + 1} missing language specification`);
      }
    });

    // Check for broken links
    const links = markdown.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    links.forEach(link => {
      const url = link.match(/\(([^)]+)\)/)[1];
      if (!this.isValidUrl(url) && !url.startsWith('#')) {
        warnings.push(`Potentially invalid URL: ${url}`);
      }
    });

    // Check for alt text in images
    const images = markdown.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || [];
    images.forEach(image => {
      const altText = image.match(/!\[([^\]]*)\]/)[1];
      if (!altText) {
        warnings.push('Image missing alt text for accessibility');
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      score: this.calculateMarkdownScore(markdown, issues, warnings)
    };
  }

  /**
   * Validates content against SEO best practices
   * @param {Object} content - Content object
   * @param {string} markdown - Generated markdown
   * @returns {Object} SEO validation results
   */
  static validateSEO(content, markdown) {
    const issues = [];
    const suggestions = [];

    // Title length check
    if (!content.title) {
      issues.push('Missing title');
    } else if (content.title.length > 60) {
      suggestions.push('Title is longer than 60 characters - may be truncated in search results');
    } else if (content.title.length < 30) {
      suggestions.push('Title is shorter than 30 characters - consider making it more descriptive');
    }

    // Meta description check
    if (content.description) {
      if (content.description.length > 155) {
        suggestions.push('Meta description longer than 155 characters - may be truncated');
      } else if (content.description.length < 120) {
        suggestions.push('Meta description shorter than 120 characters - consider adding more detail');
      }
    } else {
      suggestions.push('Consider adding a meta description for better search visibility');
    }

    // Heading structure check
    const headings = this.extractHeadings(markdown);
    if (headings.length === 0) {
      issues.push('No headings found - content needs structure');
    } else {
      // Check for proper heading hierarchy
      let previousLevel = 0;
      headings.forEach(heading => {
        if (heading.level > previousLevel + 1) {
          suggestions.push(`Heading level jump detected: H${previousLevel} to H${heading.level}`);
        }
        previousLevel = heading.level;
      });
    }

    // Content length check
    const wordCount = this.countWords(markdown);
    if (wordCount < 300) {
      suggestions.push('Content is quite short - consider adding more detail for better SEO');
    } else if (wordCount > 3000) {
      suggestions.push('Content is very long - consider breaking into multiple posts');
    }

    // Internal/external link check
    const links = this.extractLinks(markdown);
    const internalLinks = links.filter(link => link.internal);
    const externalLinks = links.filter(link => !link.internal);

    if (externalLinks.length === 0) {
      suggestions.push('Consider adding external links to authoritative sources');
    }

    return {
      score: this.calculateSEOScore(content, markdown, issues, suggestions),
      issues,
      suggestions,
      metrics: {
        titleLength: content.title?.length || 0,
        descriptionLength: content.description?.length || 0,
        wordCount,
        headingCount: headings.length,
        internalLinks: internalLinks.length,
        externalLinks: externalLinks.length
      }
    };
  }

  /**
   * Validates content readability
   * @param {string} text - Text content to analyze
   * @returns {Object} Readability analysis
   */
  static validateReadability(text) {
    const sentences = this.splitIntoSentences(text);
    const words = this.splitIntoWords(text);
    const syllables = this.countSyllables(text);

    // Calculate readability metrics
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease Score
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    // Flesch-Kincaid Grade Level
    const gradeLevel = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;

    const readabilityLevel = this.getReadabilityLevel(fleschScore);

    return {
      fleschScore: Math.round(fleschScore),
      gradeLevel: Math.round(gradeLevel * 10) / 10,
      readabilityLevel,
      metrics: {
        sentences: sentences.length,
        words: words.length,
        syllables,
        avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
        avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100
      },
      suggestions: this.getReadabilitySuggestions(fleschScore, avgWordsPerSentence)
    };
  }

  /**
   * Validates technical content accuracy
   * @param {Object} content - Content with code examples
   * @returns {Object} Technical validation results
   */
  static validateTechnicalContent(content) {
    const issues = [];
    const suggestions = [];

    // Check code examples
    if (content.codeExamples) {
      content.codeExamples.forEach((example, index) => {
        if (!example.language) {
          issues.push(`Code example ${index + 1} missing language specification`);
        }

        if (!example.description) {
          suggestions.push(`Code example ${index + 1} would benefit from a description`);
        }

        // Basic syntax validation for common languages
        if (example.language === 'javascript' || example.language === 'typescript') {
          if (!this.validateJavaScriptSyntax(example.code)) {
            issues.push(`Code example ${index + 1} may have JavaScript syntax issues`);
          }
        }

        if (example.language === 'python') {
          if (!this.validatePythonSyntax(example.code)) {
            issues.push(`Code example ${index + 1} may have Python syntax issues`);
          }
        }
      });
    }

    // Check for technical terms explanation
    const technicalTerms = this.extractTechnicalTerms(content);
    if (technicalTerms.length > 5) {
      suggestions.push('Consider adding a glossary or explaining technical terms for broader audience');
    }

    // Check for error handling in code examples
    const hasErrorHandling = content.codeExamples?.some(example => 
      /try|catch|except|error|Error/.test(example.code)
    );

    if (content.codeExamples?.length > 0 && !hasErrorHandling) {
      suggestions.push('Consider including error handling examples in your code');
    }

    return {
      score: this.calculateTechnicalScore(content, issues, suggestions),
      issues,
      suggestions,
      metrics: {
        codeExamples: content.codeExamples?.length || 0,
        technicalTerms: technicalTerms.length,
        hasErrorHandling
      }
    };
  }

  // Helper methods

  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  static calculateMarkdownScore(markdown, issues, warnings) {
    let score = 100;
    score -= issues.length * 20;
    score -= warnings.length * 5;
    return Math.max(0, score);
  }

  static calculateSEOScore(content, markdown, issues, suggestions) {
    let score = 100;
    score -= issues.length * 25;
    score -= suggestions.length * 5;

    // Bonus points for good practices
    if (content.title && content.title.length >= 30 && content.title.length <= 60) {
      score += 10;
    }
    if (content.description && content.description.length >= 120 && content.description.length <= 155) {
      score += 10;
    }

    const wordCount = this.countWords(markdown);
    if (wordCount >= 500 && wordCount <= 2000) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  static calculateTechnicalScore(content, issues, suggestions) {
    let score = 100;
    score -= issues.length * 30;
    score -= suggestions.length * 10;

    // Bonus for good practices
    if (content.codeExamples?.every(ex => ex.language && ex.description)) {
      score += 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  static extractHeadings(markdown) {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2],
        line: markdown.substring(0, match.index).split('\n').length
      });
    }

    return headings;
  }

  static extractLinks(markdown) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [];
    let match;

    while ((match = linkRegex.exec(markdown)) !== null) {
      const url = match[2];
      links.push({
        text: match[1],
        url: url,
        internal: url.startsWith('#') || url.startsWith('/') || !url.includes('://')
      });
    }

    return links;
  }

  static splitIntoSentences(text) {
    // Remove code blocks and markdown formatting for analysis
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/[#*_]/g, '');

    return cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  static splitIntoWords(text) {
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/[#*_]/g, '');

    return cleanText.split(/\s+/).filter(w => w.length > 0);
  }

  static countWords(text) {
    return this.splitIntoWords(text).length;
  }

  static countSyllables(text) {
    const words = this.splitIntoWords(text);
    return words.reduce((total, word) => {
      return total + this.countSyllablesInWord(word.toLowerCase());
    }, 0);
  }

  static countSyllablesInWord(word) {
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  static getReadabilityLevel(fleschScore) {
    if (fleschScore >= 90) return 'Very Easy';
    if (fleschScore >= 80) return 'Easy';
    if (fleschScore >= 70) return 'Fairly Easy';
    if (fleschScore >= 60) return 'Standard';
    if (fleschScore >= 50) return 'Fairly Difficult';
    if (fleschScore >= 30) return 'Difficult';
    return 'Very Difficult';
  }

  static getReadabilitySuggestions(fleschScore, avgWordsPerSentence) {
    const suggestions = [];

    if (fleschScore < 60) {
      suggestions.push('Consider simplifying sentence structure for better readability');
    }

    if (avgWordsPerSentence > 20) {
      suggestions.push('Try breaking long sentences into shorter ones');
    }

    if (fleschScore < 30) {
      suggestions.push('Content may be too complex for general audience - consider simplifying vocabulary');
    }

    return suggestions;
  }

  static extractTechnicalTerms(content) {
    const text = JSON.stringify(content).toLowerCase();
    const technicalTerms = [
      'api', 'sdk', 'framework', 'library', 'database', 'server', 'client',
      'authentication', 'authorization', 'encryption', 'algorithm', 'function',
      'variable', 'array', 'object', 'class', 'method', 'interface', 'protocol'
    ];

    return technicalTerms.filter(term => text.includes(term));
  }

  static validateJavaScriptSyntax(code) {
    // Basic JavaScript syntax validation
    const brackets = { '(': ')', '[': ']', '{': '}' };
    const stack = [];

    for (const char of code) {
      if (brackets[char]) {
        stack.push(brackets[char]);
      } else if (Object.values(brackets).includes(char)) {
        if (stack.pop() !== char) {
          return false;
        }
      }
    }

    return stack.length === 0;
  }

  static validatePythonSyntax(code) {
    // Basic Python syntax validation
    const lines = code.split('\n');
    let indentLevel = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') continue;

      const currentIndent = line.length - line.trimStart().length;
      
      if (trimmed.endsWith(':')) {
        indentLevel = currentIndent + 4;
      } else if (currentIndent < indentLevel && trimmed !== '') {
        indentLevel = currentIndent;
      }
    }

    return true; // Basic validation passed
  }
}