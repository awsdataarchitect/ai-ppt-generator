/**
 * Simple usage example of the Blog Content Generator
 */

import { ContentGenerator } from '../src/generators/ContentGenerator.js';

async function generateSimplePost() {
  const generator = new ContentGenerator();
  
  const contentData = {
    title: "Building a Simple Web App with Modern Tools",
    author: "Developer",
    tags: ["javascript", "web-development", "tutorial"],
    
    // Crisis-to-solution structure
    crisis: {
      description: "I needed to build a web application quickly for a client demo.",
      constraints: ["48-hour deadline", "No existing codebase", "Multiple feature requirements"]
    },
    
    discovery: {
      narrative: "I decided to use modern development tools and frameworks to accelerate the process.",
      reasons: ["Faster development", "Better code quality", "Easier maintenance"]
    },
    
    implementation: {
      approach: "Used a combination of React, Node.js, and cloud services.",
      steps: [
        {
          title: "Setup Development Environment",
          description: "Configured the development tools and project structure.",
          learnings: ["Proper setup saves time later", "Use established patterns"]
        }
      ]
    },
    
    results: {
      summary: "Successfully delivered the web application on time with all required features.",
      metrics: [
        { label: "Development Time", value: "36 hours" },
        { label: "Features Delivered", value: "100%" }
      ]
    },
    
    lessonsLearned: [
      {
        title: "Modern Tools Accelerate Development",
        description: "Using the right tools and frameworks significantly speeds up development.",
        actionable: "Invest time in learning modern development tools and frameworks."
      }
    ],
    
    conclusion: {
      reflection: "This project showed how modern development practices can help meet tight deadlines.",
      callToAction: "Try these tools and techniques in your next project."
    }
  };

  try {
    const result = await generator.generateBlogPost(contentData);
    
    if (result.success) {
      console.log('✅ Blog post generated successfully!');
      console.log('📊 Metadata:');
      console.log(`   Word count: ${result.content.metadata.wordCount}`);
      console.log(`   Reading time: ${result.content.metadata.readingTime} minutes`);
      console.log(`   4Cs score: ${result.content.metadata.validation.score.toFixed(2)}`);
      
      // Save to file
      const fs = await import('fs/promises');
      await fs.writeFile('examples/generated-simple-post.md', result.content.markdown);
      console.log('💾 Saved to examples/generated-simple-post.md');
      
      return result;
    } else {
      console.error('❌ Generation failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSimplePost();
}

export { generateSimplePost };