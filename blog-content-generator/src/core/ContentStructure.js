/**
 * Content Structure Manager
 * Defines and manages blog post structure based on successful patterns
 */

export class ContentStructure {
  constructor() {
    this.storyArcPatterns = {
      crisisToSolution: {
        name: 'Crisis to Solution',
        description: 'Narrative starting with urgent problem, leading to discovery and resolution',
        sections: [
          { id: 'hook', title: 'Crisis Hook', required: true },
          { id: 'context', title: 'Background Context', required: true },
          { id: 'challenge', title: 'The Challenge', required: true },
          { id: 'discovery', title: 'Solution Discovery', required: true },
          { id: 'implementation', title: 'Implementation Journey', required: true },
          { id: 'results', title: 'Results & Impact', required: true },
          { id: 'lessons', title: 'Lessons Learned', required: false },
          { id: 'callToAction', title: 'Call to Action', required: true }
        ]
      },
      technicalJourney: {
        name: 'Technical Journey',
        description: 'Deep-dive into technical implementation with personal insights',
        sections: [
          { id: 'introduction', title: 'Project Introduction', required: true },
          { id: 'requirements', title: 'Requirements & Constraints', required: true },
          { id: 'architecture', title: 'Architecture Decisions', required: true },
          { id: 'implementation', title: 'Implementation Details', required: true },
          { id: 'challenges', title: 'Challenges Faced', required: false },
          { id: 'testing', title: 'Testing & Validation', required: false },
          { id: 'deployment', title: 'Deployment & Results', required: true },
          { id: 'reflection', title: 'Reflection & Next Steps', required: true }
        ]
      },
      tutorialGuide: {
        name: 'Tutorial Guide',
        description: 'Step-by-step instructional content with practical examples',
        sections: [
          { id: 'overview', title: 'What We\'ll Build', required: true },
          { id: 'prerequisites', title: 'Prerequisites', required: true },
          { id: 'setup', title: 'Initial Setup', required: true },
          { id: 'stepByStep', title: 'Step-by-Step Implementation', required: true },
          { id: 'testing', title: 'Testing Your Implementation', required: true },
          { id: 'troubleshooting', title: 'Common Issues & Solutions', required: false },
          { id: 'enhancements', title: 'Enhancements & Next Steps', required: false },
          { id: 'conclusion', title: 'Conclusion', required: true }
        ]
      }
    };

    this.contentElements = {
      codeExamples: {
        types: ['snippet', 'fullFile', 'configuration', 'command'],
        requirements: ['syntax', 'explanation', 'context']
      },
      mediaElements: {
        types: ['screenshot', 'diagram', 'gif', 'video'],
        placement: ['inline', 'figure', 'callout']
      },
      interactiveElements: {
        types: ['demo', 'repository', 'playground', 'tool'],
        formats: ['link', 'embed', 'iframe']
      }
    };
  }

  /**
   * Creates a structured content outline based on story pattern
   * @param {string} patternType - Type of story pattern to use
   * @param {Object} customizations - Custom sections or modifications
   * @returns {Object} Structured content outline
   */
  createOutline(patternType, customizations = {}) {
    const pattern = this.storyArcPatterns[patternType];
    if (!pattern) {
      throw new Error(`Unknown story pattern: ${patternType}`);
    }

    const outline = {
      pattern: pattern.name,
      description: pattern.description,
      sections: pattern.sections.map(section => ({
        ...section,
        content: '',
        wordCount: 0,
        elements: [],
        completed: false
      })),
      metadata: {
        estimatedReadingTime: 0,
        targetAudience: customizations.targetAudience || 'developers',
        difficulty: customizations.difficulty || 'intermediate',
        tags: customizations.tags || []
      }
    };

    // Apply customizations
    if (customizations.additionalSections) {
      outline.sections.push(...customizations.additionalSections);
    }

    if (customizations.removeSections) {
      outline.sections = outline.sections.filter(
        section => !customizations.removeSections.includes(section.id)
      );
    }

    return outline;
  }

  /**
   * Validates content structure against pattern requirements
   * @param {Object} content - Content to validate
   * @param {string} patternType - Expected pattern type
   * @returns {Object} Validation results
   */
  validateStructure(content, patternType) {
    const pattern = this.storyArcPatterns[patternType];
    const requiredSections = pattern.sections.filter(s => s.required);
    
    const validation = {
      isValid: true,
      missingRequired: [],
      suggestions: [],
      completeness: 0
    };

    // Check required sections
    requiredSections.forEach(required => {
      const found = content.sections?.find(s => s.id === required.id);
      if (!found || !found.content) {
        validation.missingRequired.push(required);
        validation.isValid = false;
      }
    });

    // Calculate completeness
    const totalRequired = requiredSections.length;
    const completed = totalRequired - validation.missingRequired.length;
    validation.completeness = completed / totalRequired;

    // Generate suggestions
    if (validation.completeness < 1) {
      validation.suggestions.push(
        'Complete all required sections for better narrative flow'
      );
    }

    if (content.sections?.length < 5) {
      validation.suggestions.push(
        'Consider adding more sections for comprehensive coverage'
      );
    }

    return validation;
  }

  /**
   * Estimates reading time based on content
   * @param {Object} content - Content to analyze
   * @returns {number} Estimated reading time in minutes
   */
  estimateReadingTime(content) {
    const wordsPerMinute = 200; // Average reading speed
    let totalWords = 0;

    if (content.sections) {
      content.sections.forEach(section => {
        if (section.content) {
          totalWords += section.content.split(/\s+/).length;
        }
      });
    }

    // Add time for code examples (slower reading)
    if (content.codeExamples) {
      totalWords += content.codeExamples.length * 50; // 50 words equivalent per code block
    }

    return Math.ceil(totalWords / wordsPerMinute);
  }

  /**
   * Suggests content elements based on section type
   * @param {string} sectionId - Section identifier
   * @param {string} patternType - Story pattern type
   * @returns {Array} Suggested content elements
   */
  suggestContentElements(sectionId, patternType) {
    const suggestions = [];

    switch (sectionId) {
      case 'hook':
      case 'introduction':
        suggestions.push(
          { type: 'image', description: 'Hero image or project screenshot' },
          { type: 'statistic', description: 'Compelling metric or achievement' }
        );
        break;

      case 'implementation':
      case 'stepByStep':
        suggestions.push(
          { type: 'codeExample', description: 'Key implementation code' },
          { type: 'diagram', description: 'Architecture or flow diagram' },
          { type: 'screenshot', description: 'Development process or results' }
        );
        break;

      case 'results':
      case 'deployment':
        suggestions.push(
          { type: 'demo', description: 'Live demonstration link' },
          { type: 'metrics', description: 'Performance or usage statistics' },
          { type: 'screenshot', description: 'Final result or dashboard' }
        );
        break;

      case 'callToAction':
      case 'conclusion':
        suggestions.push(
          { type: 'repository', description: 'GitHub repository link' },
          { type: 'contact', description: 'Social media or contact information' },
          { type: 'resources', description: 'Additional learning resources' }
        );
        break;
    }

    return suggestions;
  }

  /**
   * Generates section templates with placeholders
   * @param {string} sectionId - Section identifier
   * @returns {Object} Section template with guidance
   */
  generateSectionTemplate(sectionId) {
    const templates = {
      hook: {
        template: `# [Compelling Title]

[Opening line that captures attention - describe the crisis, challenge, or exciting discovery]

[Brief context about what this post will cover and why it matters to readers]`,
        guidance: 'Start with a compelling scenario that readers can relate to. Use specific details to make it vivid.'
      },

      challenge: {
        template: `## The Challenge

[Describe the specific problem you faced]

**Key constraints:**
- [Constraint 1]
- [Constraint 2]
- [Constraint 3]

[Explain why this was particularly challenging and what was at stake]`,
        guidance: 'Be specific about the problem. Help readers understand the complexity and urgency.'
      },

      implementation: {
        template: `## Implementation Journey

[Describe your approach and key decisions]

\`\`\`[language]
// Key code example
[code here]
\`\`\`

[Explain the code and why you chose this approach]

**Key learnings:**
- [Learning 1]
- [Learning 2]`,
        guidance: 'Include working code examples with explanations. Share your thought process and decision-making.'
      },

      results: {
        template: `## Results & Impact

[Describe what you achieved]

**Metrics:**
- [Metric 1]: [Value]
- [Metric 2]: [Value]

[Link to live demo or repository]

[Reflect on the outcome and its significance]`,
        guidance: 'Provide concrete evidence of success. Include links to working examples when possible.'
      }
    };

    return templates[sectionId] || {
      template: `## [Section Title]

[Content goes here]`,
      guidance: 'Provide clear, engaging content that serves the overall narrative.'
    };
  }
}