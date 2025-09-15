/**
 * Markdown Template Engine
 * Generates markdown content using templates and the 4Cs framework
 */

import Handlebars from 'handlebars';
import { FourCsFramework } from '../core/FourCsFramework.js';
import { ContentStructure } from '../core/ContentStructure.js';

export class MarkdownTemplateEngine {
  constructor() {
    this.fourCs = new FourCsFramework();
    this.contentStructure = new ContentStructure();
    this.registerHelpers();
  }

  /**
   * Registers Handlebars helpers for content generation
   */
  registerHelpers() {
    // Helper for code blocks with syntax highlighting
    Handlebars.registerHelper('codeBlock', function(code, language, description) {
      return new Handlebars.SafeString(`
${description ? `*${description}*` : ''}

\`\`\`${language || 'javascript'}
${code}
\`\`\`
`);
    });

    // Helper for creating engaging questions
    Handlebars.registerHelper('engagingQuestion', function(question) {
      return new Handlebars.SafeString(`> ${question}`);
    });

    // Helper for creating call-out boxes
    Handlebars.registerHelper('callout', function(type, content) {
      const emoji = {
        tip: '💡',
        warning: '⚠️',
        info: 'ℹ️',
        success: '✅'
      };
      
      return new Handlebars.SafeString(`
> ${emoji[type] || 'ℹ️'} **${type.toUpperCase()}**
> 
> ${content}
`);
    });

    // Helper for creating lists with proper formatting
    Handlebars.registerHelper('bulletList', function(items) {
      if (!Array.isArray(items)) return '';
      
      return new Handlebars.SafeString(
        items.map(item => `- ${item}`).join('\n')
      );
    });

    // Helper for creating numbered lists
    Handlebars.registerHelper('numberedList', function(items) {
      if (!Array.isArray(items)) return '';
      
      return new Handlebars.SafeString(
        items.map((item, index) => `${index + 1}. ${item}`).join('\n')
      );
    });

    // Helper for creating links with proper formatting
    Handlebars.registerHelper('link', function(url, text, description) {
      const linkText = text || url;
      const result = `[${linkText}](${url})`;
      return new Handlebars.SafeString(description ? `${result} - ${description}` : result);
    });

    // Helper for creating image markdown
    Handlebars.registerHelper('image', function(src, alt, caption) {
      let result = `![${alt || 'Image'}](${src})`;
      if (caption) {
        result += `\n\n*${caption}*`;
      }
      return new Handlebars.SafeString(result);
    });

    // Helper for creating table of contents
    Handlebars.registerHelper('tableOfContents', function(sections) {
      if (!Array.isArray(sections)) return '';
      
      const toc = sections
        .filter(section => section.title)
        .map(section => {
          const anchor = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return `- [${section.title}](#${anchor})`;
        })
        .join('\n');
      
      return new Handlebars.SafeString(`## Table of Contents\n\n${toc}\n`);
    });
  }

  /**
   * Generates a complete blog post from template and data
   * @param {string} templateName - Name of the template to use
   * @param {Object} data - Data to populate the template
   * @returns {string} Generated markdown content
   */
  generatePost(templateName, data) {
    const template = this.getTemplate(templateName);
    const compiledTemplate = Handlebars.compile(template);
    
    // Enhance data with 4Cs principles
    const enhancedData = this.enhanceDataWith4Cs(data);
    
    // Generate content
    const markdown = compiledTemplate(enhancedData);
    
    // Validate against 4Cs framework
    const validation = this.fourCs.validateContent(enhancedData);
    
    return {
      markdown,
      validation,
      metadata: {
        wordCount: this.countWords(markdown),
        readingTime: this.contentStructure.estimateReadingTime(enhancedData),
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Gets template content by name
   * @param {string} templateName - Template identifier
   * @returns {string} Template content
   */
  getTemplate(templateName) {
    const templates = {
      'crisis-to-solution': this.getCrisisToSolutionTemplate(),
      'technical-journey': this.getTechnicalJourneyTemplate(),
      'tutorial-guide': this.getTutorialGuideTemplate(),
      'kiro-experience': this.getKiroExperienceTemplate()
    };

    return templates[templateName] || templates['crisis-to-solution'];
  }

  /**
   * Crisis to Solution template (based on successful re:post pattern)
   */
  getCrisisToSolutionTemplate() {
    return `---
title: "{{title}}"
subtitle: "{{subtitle}}"
author: "{{author}}"
date: "{{date}}"
tags: {{#each tags}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
readingTime: "{{readingTime}} min read"
---

# {{title}}

{{#if subtitle}}
## {{subtitle}}
{{/if}}

{{#if heroImage}}
{{image heroImage title "Hero image showcasing the project"}}
{{/if}}

## The Crisis

{{crisis.description}}

{{#if crisis.urgency}}
{{callout "warning" crisis.urgency}}
{{/if}}

**The situation:**
{{bulletList crisis.constraints}}

{{#if crisis.stakeholders}}
**Who was affected:**
{{bulletList crisis.stakeholders}}
{{/if}}

## The Challenge

{{challenge.description}}

{{#if challenge.technicalDetails}}
### Technical Constraints

{{challenge.technicalDetails}}

{{#if challenge.codeExample}}
{{codeBlock challenge.codeExample.code challenge.codeExample.language challenge.codeExample.description}}
{{/if}}
{{/if}}

{{engagingQuestion "Have you ever found yourself in a similar situation where traditional approaches just weren't cutting it?"}}

## The Discovery

{{discovery.narrative}}

{{#if discovery.keyMoment}}
{{callout "success" discovery.keyMoment}}
{{/if}}

### Why This Solution Made Sense

{{numberedList discovery.reasons}}

## Implementation Journey

{{implementation.approach}}

{{#each implementation.steps}}
### {{@index}}. {{this.title}}

{{this.description}}

{{#if this.codeExample}}
{{codeBlock this.codeExample.code this.codeExample.language this.codeExample.description}}
{{/if}}

{{#if this.learnings}}
**Key learnings:**
{{bulletList this.learnings}}
{{/if}}

{{/each}}

{{#if implementation.challenges}}
### Challenges Along the Way

{{#each implementation.challenges}}
**{{this.title}}**

{{this.description}}

{{#if this.solution}}
*Solution:* {{this.solution}}
{{/if}}

{{/each}}
{{/if}}

## Results & Impact

{{results.summary}}

{{#if results.metrics}}
### By the Numbers

{{#each results.metrics}}
- **{{this.label}}**: {{this.value}}
{{/each}}
{{/if}}

{{#if results.demoLink}}
{{callout "tip" "Try it yourself: " results.demoLink}}
{{/if}}

{{#if results.repositoryLink}}
### Explore the Code

{{link results.repositoryLink "View on GitHub" "Complete source code and documentation"}}
{{/if}}

## Lessons Learned

{{#each lessonsLearned}}
### {{this.title}}

{{this.description}}

{{#if this.actionable}}
**Actionable takeaway:** {{this.actionable}}
{{/if}}

{{/each}}

## What's Next?

{{conclusion.reflection}}

{{#if conclusion.futureWork}}
### Future Enhancements

{{bulletList conclusion.futureWork}}
{{/if}}

### Try It Yourself

{{conclusion.callToAction}}

{{#if conclusion.resources}}
### Additional Resources

{{#each conclusion.resources}}
- {{link this.url this.title this.description}}
{{/each}}
{{/if}}

---

*What challenges are you facing in your current projects? I'd love to hear about your experiences and help if I can. Connect with me on [LinkedIn]({{authorLinkedIn}}) or check out more of my work on [GitHub]({{authorGitHub}}).*

{{#if tags}}
**Tags:** {{#each tags}}#{{this}} {{/each}}
{{/if}}`;
  }

  /**
   * Technical Journey template for deep technical posts
   */
  getTechnicalJourneyTemplate() {
    return `---
title: "{{title}}"
subtitle: "{{subtitle}}"
author: "{{author}}"
date: "{{date}}"
tags: {{#each tags}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
difficulty: "{{difficulty}}"
readingTime: "{{readingTime}} min read"
---

# {{title}}

{{#if tableOfContents}}
{{tableOfContents sections}}
{{/if}}

## Project Overview

{{overview.description}}

{{#if overview.architecture}}
{{image overview.architecture "System Architecture" "High-level architecture diagram"}}
{{/if}}

### What We Built

{{bulletList overview.features}}

### Technology Stack

{{#each techStack}}
- **{{this.category}}**: {{this.technologies}}
{{/each}}

## Requirements & Constraints

{{requirements.description}}

{{#if requirements.functional}}
### Functional Requirements

{{numberedList requirements.functional}}
{{/if}}

{{#if requirements.nonFunctional}}
### Non-Functional Requirements

{{numberedList requirements.nonFunctional}}
{{/if}}

{{#if requirements.constraints}}
### Constraints

{{bulletList requirements.constraints}}
{{/if}}

## Architecture Decisions

{{#each architectureDecisions}}
### {{this.title}}

{{this.description}}

{{#if this.alternatives}}
**Alternatives considered:**
{{bulletList this.alternatives}}
{{/if}}

**Why we chose this approach:**
{{this.rationale}}

{{#if this.tradeoffs}}
**Trade-offs:**
{{bulletList this.tradeoffs}}
{{/if}}

{{/each}}

## Implementation Deep Dive

{{#each implementation}}
### {{this.title}}

{{this.description}}

{{#if this.codeExample}}
{{codeBlock this.codeExample.code this.codeExample.language this.codeExample.description}}
{{/if}}

{{#if this.keyPoints}}
**Key implementation points:**
{{bulletList this.keyPoints}}
{{/if}}

{{/each}}

{{#if challenges}}
## Challenges & Solutions

{{#each challenges}}
### {{this.title}}

**The Problem:**
{{this.problem}}

**Our Solution:**
{{this.solution}}

{{#if this.codeExample}}
{{codeBlock this.codeExample.code this.codeExample.language this.codeExample.description}}
{{/if}}

**Lessons learned:**
{{this.lessons}}

{{/each}}
{{/if}}

## Testing & Validation

{{testing.approach}}

{{#if testing.strategies}}
### Testing Strategies

{{#each testing.strategies}}
- **{{this.type}}**: {{this.description}}
{{/each}}
{{/if}}

{{#if testing.codeExample}}
{{codeBlock testing.codeExample.code testing.codeExample.language testing.codeExample.description}}
{{/if}}

## Deployment & Results

{{deployment.description}}

{{#if deployment.metrics}}
### Performance Metrics

{{#each deployment.metrics}}
- **{{this.metric}}**: {{this.value}} {{#if this.improvement}}({{this.improvement}} improvement){{/if}}
{{/each}}
{{/if}}

{{#if deployment.demoLink}}
{{callout "success" "See it in action: " deployment.demoLink}}
{{/if}}

## Reflection & Next Steps

{{reflection.summary}}

### What Worked Well

{{bulletList reflection.successes}}

### What We'd Do Differently

{{bulletList reflection.improvements}}

### Future Enhancements

{{bulletList reflection.futureWork}}

---

{{#if repositoryLink}}
**Source Code:** {{link repositoryLink "GitHub Repository" "Complete implementation with documentation"}}
{{/if}}

{{#if demoLink}}
**Live Demo:** {{link demoLink "Try it out" "Interactive demonstration"}}
{{/if}}

*Questions about the implementation? Feel free to reach out on [LinkedIn]({{authorLinkedIn}}) or open an issue on GitHub.*`;
  }

  /**
   * Kiro Experience template for Kiro-focused content
   */
  getKiroExperienceTemplate() {
    return `---
title: "{{title}}"
subtitle: "{{subtitle}}"
author: "{{author}}"
date: "{{date}}"
tags: {{#each tags}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
readingTime: "{{readingTime}} min read"
---

# {{title}}

{{crisis.hook}}

{{#if heroImage}}
{{image heroImage title "Project built with Kiro"}}
{{/if}}

## The Development Challenge

{{challenge.situation}}

**Traditional approach limitations:**
{{bulletList challenge.limitations}}

**Project requirements:**
{{bulletList challenge.requirements}}

{{engagingQuestion "Sound familiar? This is where Kiro changed everything."}}

## Discovering Kiro

{{discovery.moment}}

### First Impressions

{{discovery.firstExperience}}

{{#if discovery.initialSkepticism}}
{{callout "info" discovery.initialSkepticism}}
{{/if}}

## Building with Kiro

{{#each kiroExperience}}
### {{this.title}}

{{this.description}}

{{#if this.kiroFeature}}
**Kiro feature used:** {{this.kiroFeature}}
{{/if}}

{{#if this.codeExample}}
{{codeBlock this.codeExample.code this.codeExample.language this.codeExample.description}}
{{/if}}

{{#if this.timesSaved}}
**Time saved:** {{this.timesSaved}}
{{/if}}

{{#if this.insights}}
**Key insights:**
{{bulletList this.insights}}
{{/if}}

{{/each}}

### Favorite Kiro Features

{{#each favoriteFeatures}}
#### {{this.name}}

{{this.description}}

{{#if this.example}}
**Example use case:**
{{this.example}}
{{/if}}

**Why it's game-changing:**
{{this.impact}}

{{/each}}

## Project Results

{{results.summary}}

### Built With

{{#each techStack}}
- **{{this.category}}**: {{this.technologies}}
{{/each}}

### Key Achievements

{{#each results.achievements}}
- {{this.description}} {{#if this.metric}}({{this.metric}}){{/if}}
{{/each}}

{{#if results.demoLink}}
### Try It Out

{{link results.demoLink "Live Demo" "See the project in action"}}
{{/if}}

{{#if results.repositoryLink}}
{{link results.repositoryLink "Source Code" "Explore the implementation on GitHub"}}
{{/if}}

## How Kiro Transformed My Development

{{transformation.overview}}

### Before Kiro

{{bulletList transformation.before}}

### After Kiro

{{bulletList transformation.after}}

### The Biggest Game-Changer

{{transformation.biggestImpact}}

## Lessons for Fellow Developers

{{#each lessons}}
### {{this.title}}

{{this.description}}

{{#if this.practical}}
**Practical tip:** {{this.practical}}
{{/if}}

{{/each}}

## Getting Started with Kiro

{{gettingStarted.introduction}}

### Recommended First Steps

{{numberedList gettingStarted.steps}}

### Best Practices I've Learned

{{bulletList gettingStarted.bestPractices}}

{{#if gettingStarted.resources}}
### Helpful Resources

{{#each gettingStarted.resources}}
- {{link this.url this.title this.description}}
{{/each}}
{{/if}}

## What's Next?

{{conclusion.reflection}}

{{#if conclusion.futureProjects}}
### Future Projects with Kiro

{{bulletList conclusion.futureProjects}}
{{/if}}

### Join the Conversation

{{conclusion.callToAction}}

---

*Have you tried Kiro for your development projects? I'd love to hear about your experiences! Connect with me on [LinkedIn]({{authorLinkedIn}}) and let's discuss how AI is transforming software development.*

**Built with:** {{#each builtWith}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

{{#if tags}}
**Tags:** {{#each tags}}#{{this}} {{/each}}
{{/if}}`;
  }

  /**
   * Tutorial Guide template for step-by-step content
   */
  getTutorialGuideTemplate() {
    return `---
title: "{{title}}"
subtitle: "{{subtitle}}"
author: "{{author}}"
date: "{{date}}"
tags: {{#each tags}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
difficulty: "{{difficulty}}"
estimatedTime: "{{estimatedTime}}"
readingTime: "{{readingTime}} min read"
---

# {{title}}

{{overview.description}}

{{#if overview.finalResult}}
{{image overview.finalResult "Final Result" "What we'll build together"}}
{{/if}}

## What You'll Learn

{{bulletList overview.learningObjectives}}

## Prerequisites

{{#if prerequisites.knowledge}}
### Required Knowledge

{{bulletList prerequisites.knowledge}}
{{/if}}

{{#if prerequisites.tools}}
### Tools & Software

{{#each prerequisites.tools}}
- **{{this.name}}**: {{this.description}} {{#if this.version}}({{this.version}}){{/if}}
{{/each}}
{{/if}}

{{#if prerequisites.accounts}}
### Accounts & Services

{{bulletList prerequisites.accounts}}
{{/if}}

## Initial Setup

{{setup.description}}

{{#each setup.steps}}
### Step {{@index}}: {{this.title}}

{{this.description}}

{{#if this.codeExample}}
{{codeBlock this.codeExample.code this.codeExample.language this.codeExample.description}}
{{/if}}

{{#if this.verification}}
**Verify it works:**
{{this.verification}}
{{/if}}

{{/each}}

## Step-by-Step Implementation

{{#each implementation}}
## Step {{@index}}: {{this.title}}

{{this.description}}

{{#if this.substeps}}
{{#each this.substeps}}
### {{@../index}}.{{@index}} {{this.title}}

{{this.description}}

{{#if this.codeExample}}
{{codeBlock this.codeExample.code this.codeExample.language this.codeExample.description}}
{{/if}}

{{/each}}
{{/if}}

{{#if this.codeExample}}
{{codeBlock this.codeExample.code this.codeExample.language this.codeExample.description}}
{{/if}}

{{#if this.explanation}}
### Understanding the Code

{{this.explanation}}
{{/if}}

{{#if this.testing}}
### Test Your Progress

{{this.testing}}
{{/if}}

{{#if this.checkpoint}}
{{callout "success" this.checkpoint}}
{{/if}}

{{/each}}

## Testing Your Implementation

{{testing.description}}

{{#each testing.testCases}}
### {{this.title}}

{{this.description}}

{{#if this.codeExample}}
{{codeBlock this.codeExample.code this.codeExample.language this.codeExample.description}}
{{/if}}

**Expected result:** {{this.expectedResult}}

{{/each}}

{{#if troubleshooting}}
## Common Issues & Solutions

{{#each troubleshooting}}
### {{this.issue}}

**Problem:** {{this.description}}

**Solution:** {{this.solution}}

{{#if this.prevention}}
**Prevention:** {{this.prevention}}
{{/if}}

{{/each}}
{{/if}}

## Enhancements & Next Steps

{{enhancements.description}}

{{#if enhancements.ideas}}
### Enhancement Ideas

{{#each enhancements.ideas}}
#### {{this.title}}

{{this.description}}

{{#if this.difficulty}}
**Difficulty:** {{this.difficulty}}
{{/if}}

{{#if this.resources}}
**Resources:**
{{bulletList this.resources}}
{{/if}}

{{/each}}
{{/if}}

## Conclusion

{{conclusion.summary}}

### What You've Accomplished

{{bulletList conclusion.achievements}}

### Key Takeaways

{{bulletList conclusion.keyTakeaways}}

{{#if conclusion.nextSteps}}
### Recommended Next Steps

{{numberedList conclusion.nextSteps}}
{{/if}}

---

{{#if repositoryLink}}
**Complete Code:** {{link repositoryLink "GitHub Repository" "Full implementation with all examples"}}
{{/if}}

{{#if demoLink}}
**Live Demo:** {{link demoLink "Try it yourself" "Interactive version of what we built"}}
{{/if}}

*Questions about this tutorial? Found an issue? Let me know on [LinkedIn]({{authorLinkedIn}}) or open an issue on GitHub.*

{{#if relatedTutorials}}
### Related Tutorials

{{#each relatedTutorials}}
- {{link this.url this.title this.description}}
{{/each}}
{{/if}}`;
  }

  /**
   * Enhances data with 4Cs principles
   * @param {Object} data - Original data
   * @returns {Object} Enhanced data
   */
  enhanceDataWith4Cs(data) {
    return {
      ...data,
      // Add current date if not provided
      date: data.date || new Date().toISOString().split('T')[0],
      // Ensure readingTime is calculated
      readingTime: data.readingTime || this.contentStructure.estimateReadingTime(data),
      // Add engaging elements if missing
      engagingElements: data.engagingElements || this.generateEngagingElements(data)
    };
  }

  /**
   * Generates engaging elements based on content
   * @param {Object} data - Content data
   * @returns {Object} Engaging elements
   */
  generateEngagingElements(data) {
    return {
      questions: [
        "Have you faced similar challenges in your projects?",
        "What would you do differently in this situation?",
        "How do you handle complex technical decisions?"
      ],
      callouts: [
        { type: 'tip', content: 'Pro tip: Always validate your approach with small experiments first.' },
        { type: 'warning', content: 'Remember to backup your work before making major changes.' }
      ]
    };
  }

  /**
   * Counts words in markdown content
   * @param {string} markdown - Markdown content
   * @returns {number} Word count
   */
  countWords(markdown) {
    // Remove markdown syntax and count words
    const plainText = markdown
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]*`/g, '') // Remove inline code
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
      .replace(/[#*_~`]/g, '') // Remove markdown formatting
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return plainText ? plainText.split(' ').length : 0;
  }
}