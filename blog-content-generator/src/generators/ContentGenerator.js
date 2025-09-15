/**
 * Content Generator
 * Main orchestrator for generating blog content using templates and 4Cs framework
 */

import { MarkdownTemplateEngine } from '../templates/MarkdownTemplateEngine.js';
import { ContentStructure } from '../core/ContentStructure.js';
import { FourCsFramework } from '../core/FourCsFramework.js';

export class ContentGenerator {
  constructor() {
    this.templateEngine = new MarkdownTemplateEngine();
    this.contentStructure = new ContentStructure();
    this.fourCs = new FourCsFramework();
  }

  /**
   * Generates a complete blog post from content data
   * @param {Object} contentData - Structured content data
   * @param {Object} options - Generation options
   * @returns {Object} Generated content with metadata
   */
  async generateBlogPost(contentData, options = {}) {
    try {
      // Validate input data
      this.validateContentData(contentData);

      // Determine template type
      const templateType = options.template || this.determineTemplateType(contentData);

      // Create content outline if not provided
      if (!contentData.outline) {
        contentData.outline = this.contentStructure.createOutline(
          this.mapTemplateToPattern(templateType),
          options.customizations
        );
      }

      // Generate markdown content
      const result = this.templateEngine.generatePost(templateType, contentData);

      // Validate against 4Cs framework
      const validation = this.fourCs.validateContent(contentData);

      // Generate SEO metadata
      const seoMetadata = this.generateSEOMetadata(contentData, result.markdown);

      return {
        success: true,
        content: {
          markdown: result.markdown,
          html: options.generateHTML ? this.convertToHTML(result.markdown) : null,
          metadata: {
            ...result.metadata,
            seo: seoMetadata,
            validation: validation,
            template: templateType,
            generatedAt: new Date().toISOString()
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestions: this.generateErrorSuggestions(error)
      };
    }
  }

  /**
   * Generates content specifically for Kiro experience posts
   * @param {Object} kiroData - Kiro-specific content data
   * @returns {Object} Generated Kiro experience post
   */
  async generateKiroExperiencePost(kiroData) {
    const enhancedData = {
      ...kiroData,
      template: 'kiro-experience',
      // Add Kiro-specific enhancements
      kiroFeatures: this.extractKiroFeatures(kiroData),
      developmentJourney: this.structureKiroJourney(kiroData),
      transformation: this.analyzeKiroTransformation(kiroData)
    };

    return this.generateBlogPost(enhancedData, { template: 'kiro-experience' });
  }

  /**
   * Generates content outline based on successful post patterns
   * @param {string} postType - Type of post to generate
   * @param {Object} projectData - Project-specific data
   * @returns {Object} Content outline
   */
  generateContentOutline(postType, projectData = {}) {
    const patterns = {
      'crisis-solution': 'crisisToSolution',
      'technical-deep-dive': 'technicalJourney',
      'tutorial': 'tutorialGuide',
      'kiro-experience': 'crisisToSolution' // Kiro posts often follow crisis-to-solution pattern
    };

    const patternType = patterns[postType] || 'crisisToSolution';
    
    return this.contentStructure.createOutline(patternType, {
      targetAudience: projectData.targetAudience || ['developers', 'technical-leads'],
      difficulty: projectData.difficulty || 'intermediate',
      tags: projectData.tags || [],
      additionalSections: projectData.customSections || []
    });
  }

  /**
   * Validates content data structure
   * @param {Object} contentData - Content to validate
   * @throws {Error} If validation fails
   */
  validateContentData(contentData) {
    const required = ['title', 'author'];
    const missing = required.filter(field => !contentData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (contentData.sections && !Array.isArray(contentData.sections)) {
      throw new Error('Sections must be an array');
    }

    if (contentData.codeExamples && !Array.isArray(contentData.codeExamples)) {
      throw new Error('Code examples must be an array');
    }
  }

  /**
   * Determines appropriate template based on content characteristics
   * @param {Object} contentData - Content to analyze
   * @returns {string} Template type
   */
  determineTemplateType(contentData) {
    // Check for Kiro-specific content
    if (this.isKiroContent(contentData)) {
      return 'kiro-experience';
    }

    // Check for tutorial characteristics
    if (this.isTutorialContent(contentData)) {
      return 'tutorial-guide';
    }

    // Check for technical deep-dive characteristics
    if (this.isTechnicalContent(contentData)) {
      return 'technical-journey';
    }

    // Default to crisis-to-solution pattern
    return 'crisis-to-solution';
  }

  /**
   * Maps template types to content structure patterns
   * @param {string} templateType - Template identifier
   * @returns {string} Pattern type
   */
  mapTemplateToPattern(templateType) {
    const mapping = {
      'crisis-to-solution': 'crisisToSolution',
      'technical-journey': 'technicalJourney',
      'tutorial-guide': 'tutorialGuide',
      'kiro-experience': 'crisisToSolution'
    };

    return mapping[templateType] || 'crisisToSolution';
  }

  /**
   * Checks if content is Kiro-related
   * @param {Object} contentData - Content to check
   * @returns {boolean} True if Kiro-related
   */
  isKiroContent(contentData) {
    const kiroIndicators = ['kiro', 'ai assistant', 'code generation', 'spec-driven'];
    const text = JSON.stringify(contentData).toLowerCase();
    
    return kiroIndicators.some(indicator => text.includes(indicator));
  }

  /**
   * Checks if content is tutorial-style
   * @param {Object} contentData - Content to check
   * @returns {boolean} True if tutorial-style
   */
  isTutorialContent(contentData) {
    const tutorialIndicators = ['step', 'tutorial', 'guide', 'how to', 'walkthrough'];
    const text = JSON.stringify(contentData).toLowerCase();
    
    return tutorialIndicators.some(indicator => text.includes(indicator)) ||
           (contentData.sections && contentData.sections.some(s => 
             s.title && /step \d+|part \d+/i.test(s.title)
           ));
  }

  /**
   * Checks if content is technical deep-dive
   * @param {Object} contentData - Content to check
   * @returns {boolean} True if technical content
   */
  isTechnicalContent(contentData) {
    return (contentData.codeExamples && contentData.codeExamples.length > 3) ||
           (contentData.techStack && contentData.techStack.length > 0) ||
           (contentData.architecture && contentData.architecture.length > 0);
  }

  /**
   * Extracts Kiro-specific features from content
   * @param {Object} kiroData - Kiro content data
   * @returns {Array} Kiro features used
   */
  extractKiroFeatures(kiroData) {
    const features = [];
    const text = JSON.stringify(kiroData).toLowerCase();

    const featureMap = {
      'specs': 'Spec-driven development',
      'hooks': 'Agent hooks automation',
      'autopilot': 'Autopilot mode',
      'code generation': 'AI code generation',
      'chat context': 'Contextual chat assistance'
    };

    Object.entries(featureMap).forEach(([keyword, feature]) => {
      if (text.includes(keyword)) {
        features.push({
          name: feature,
          keyword: keyword,
          description: `Used ${feature} to enhance development workflow`
        });
      }
    });

    return features;
  }

  /**
   * Structures Kiro development journey
   * @param {Object} kiroData - Kiro content data
   * @returns {Object} Structured journey
   */
  structureKiroJourney(kiroData) {
    return {
      discovery: kiroData.discovery || 'Discovered Kiro during a challenging development phase',
      firstExperience: kiroData.firstExperience || 'Initial skepticism turned to amazement',
      keyMoments: kiroData.keyMoments || [],
      transformation: kiroData.transformation || 'Completely changed development approach'
    };
  }

  /**
   * Analyzes Kiro transformation impact
   * @param {Object} kiroData - Kiro content data
   * @returns {Object} Transformation analysis
   */
  analyzeKiroTransformation(kiroData) {
    return {
      before: kiroData.beforeKiro || [
        'Manual code writing and debugging',
        'Time-consuming research and documentation',
        'Repetitive development tasks'
      ],
      after: kiroData.afterKiro || [
        'AI-assisted code generation',
        'Automated workflows and processes',
        'Focus on high-level architecture and design'
      ],
      impact: kiroData.impact || 'Significant improvement in development velocity and code quality'
    };
  }

  /**
   * Generates SEO metadata for content
   * @param {Object} contentData - Content data
   * @param {string} markdown - Generated markdown
   * @returns {Object} SEO metadata
   */
  generateSEOMetadata(contentData, markdown) {
    const wordCount = this.countWords(markdown);
    const readingTime = Math.ceil(wordCount / 200);

    return {
      title: contentData.title,
      description: this.generateMetaDescription(contentData, markdown),
      keywords: this.extractKeywords(contentData, markdown),
      wordCount,
      readingTime,
      socialPreview: {
        title: contentData.title,
        description: this.generateSocialDescription(contentData),
        image: contentData.heroImage || null
      }
    };
  }

  /**
   * Generates meta description from content
   * @param {Object} contentData - Content data
   * @param {string} markdown - Markdown content
   * @returns {string} Meta description
   */
  generateMetaDescription(contentData, markdown) {
    if (contentData.subtitle) {
      return contentData.subtitle.substring(0, 155);
    }

    // Extract first paragraph from markdown
    const firstParagraph = markdown
      .replace(/^#.*$/gm, '') // Remove headers
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .split('\n\n')[0]
      .replace(/[*_`]/g, '') // Remove markdown formatting
      .trim();

    return firstParagraph.substring(0, 155) + (firstParagraph.length > 155 ? '...' : '');
  }

  /**
   * Extracts keywords from content
   * @param {Object} contentData - Content data
   * @param {string} markdown - Markdown content
   * @returns {Array} Keywords
   */
  extractKeywords(contentData, markdown) {
    const keywords = new Set();

    // Add explicit tags
    if (contentData.tags) {
      contentData.tags.forEach(tag => keywords.add(tag));
    }

    // Add technology stack items
    if (contentData.techStack) {
      contentData.techStack.forEach(tech => {
        if (typeof tech === 'string') {
          keywords.add(tech);
        } else if (tech.technologies) {
          tech.technologies.split(',').forEach(t => keywords.add(t.trim()));
        }
      });
    }

    // Add common technical terms
    const technicalTerms = [
      'javascript', 'typescript', 'react', 'node.js', 'aws', 'lambda',
      'serverless', 'api', 'database', 'frontend', 'backend', 'fullstack',
      'kiro', 'ai', 'automation', 'development', 'coding'
    ];

    const text = markdown.toLowerCase();
    technicalTerms.forEach(term => {
      if (text.includes(term)) {
        keywords.add(term);
      }
    });

    return Array.from(keywords).slice(0, 10); // Limit to 10 keywords
  }

  /**
   * Generates social media description
   * @param {Object} contentData - Content data
   * @returns {string} Social description
   */
  generateSocialDescription(contentData) {
    if (contentData.socialDescription) {
      return contentData.socialDescription;
    }

    const templates = {
      'kiro-experience': `How I built ${contentData.title} using Kiro's AI-powered development tools. A real-world story of transformation and efficiency.`,
      'technical-journey': `Deep dive into building ${contentData.title}. Architecture decisions, implementation details, and lessons learned.`,
      'tutorial-guide': `Step-by-step guide: ${contentData.title}. Complete tutorial with code examples and best practices.`,
      'crisis-to-solution': `From crisis to solution: ${contentData.title}. A developer's journey through challenges and breakthroughs.`
    };

    const templateType = this.determineTemplateType(contentData);
    return templates[templateType] || `${contentData.title} - A developer's technical story and insights.`;
  }

  /**
   * Counts words in text
   * @param {string} text - Text to count
   * @returns {number} Word count
   */
  countWords(text) {
    return text.trim().split(/\s+/).length;
  }

  /**
   * Generates error suggestions based on error type
   * @param {Error} error - Error that occurred
   * @returns {Array} Suggestions for fixing the error
   */
  generateErrorSuggestions(error) {
    const suggestions = [];

    if (error.message.includes('Missing required fields')) {
      suggestions.push('Ensure all required fields (title, author) are provided');
      suggestions.push('Check the content data structure matches expected format');
    }

    if (error.message.includes('array')) {
      suggestions.push('Verify that sections and codeExamples are arrays');
      suggestions.push('Check data types in your content structure');
    }

    suggestions.push('Review the ContentGenerator documentation for proper data format');
    suggestions.push('Use the generateContentOutline method to create a proper structure');

    return suggestions;
  }

  /**
   * Converts markdown to HTML (placeholder for future implementation)
   * @param {string} markdown - Markdown content
   * @returns {string} HTML content
   */
  convertToHTML(markdown) {
    // Placeholder - would integrate with a markdown parser like marked
    return `<div class="blog-content">${markdown}</div>`;
  }
}