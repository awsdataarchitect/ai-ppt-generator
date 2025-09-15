# Security Assessment CLI - Usage Guide

This guide provides practical examples for running security assessments on the AI PPT Generator project.

## Quick Start Commands

### 1. Comprehensive Assessment (Recommended)
```bash
# Complete security assessment with all scanners
node dist/cli/SecurityAssessmentCLI.js \
  --config ./config/security-assessment.config.json \
  --target .. \
  --output ./security-reports \
  --verbose
```

### 2. Quick Security Scan
```bash
# Fast scan focusing on critical issues
node dist/cli/SecurityAssessmentCLI.js \
  --config ./config/quick-scan.config.json \
  --target .. \
  --output ./quick-reports
```

### 3. Compliance-Focused Assessment
```bash
# OWASP, GDPR, NIST compliance analysis
node dist/cli/SecurityAssessmentCLI.js \
  --config ./config/compliance-focused.config.json \
  --target .. \
  --output ./compliance-reports
```

## Specific Scanner Usage

### Infrastructure Security Only
```bash
# Scan AWS CDK configurations
node dist/cli/SecurityAssessmentCLI.js \
  --scanners infrastructure \
  --target .. \
  --output ./infrastructure-reports \
  --individual
```

### Dependency Vulnerabilities Only
```bash
# Check third-party library vulnerabilities
node dist/cli/SecurityAssessmentCLI.js \
  --scanners dependencies \
  --target .. \
  --output ./dependency-reports \
  --verbose
```

### Data Flow Security Only
```bash
# Analyze PII exposure and privacy compliance
node dist/cli/SecurityAssessmentCLI.js \
  --scanners dataflow \
  --target .. \
  --output ./privacy-reports \
  --individual
```

## Output Customization

### Generate Individual Reports
```bash
# Create separate reports for each scanner
node dist/cli/SecurityAssessmentCLI.js \
  --config ./config/security-assessment.config.json \
  --target .. \
  --output ./detailed-reports \
  --individual \
  --verbose
```

### JSON Format Output
```bash
# Generate machine-readable JSON reports
node dist/cli/SecurityAssessmentCLI.js \
  --scanners infrastructure,dependencies \
  --target .. \
  --output ./json-reports \
  --format json
```

### Debug Mode
```bash
# Enable detailed logging for troubleshooting
node dist/cli/SecurityAssessmentCLI.js \
  --config ./config/security-assessment.config.json \
  --target .. \
  --output ./debug-reports \
  --debug \
  --log-file ./security-debug.log
```

## Performance Options

### Parallel Execution (Default)
```bash
# Run multiple scanners simultaneously
node dist/cli/SecurityAssessmentCLI.js \
  --scanners infrastructure,dependencies,dataflow \
  --target .. \
  --parallel \
  --max-concurrent 3
```

### Sequential Execution
```bash
# Run scanners one at a time (for resource-constrained environments)
node dist/cli/SecurityAssessmentCLI.js \
  --scanners infrastructure,dependencies \
  --target .. \
  --sequential \
  --timeout 600
```

### Continue on Errors
```bash
# Don't stop if one scanner fails
node dist/cli/SecurityAssessmentCLI.js \
  --config ./config/security-assessment.config.json \
  --target .. \
  --continue-on-error \
  --verbose
```

## Configuration File Examples

### Custom Configuration
Create a custom config file `my-assessment.config.json`:
```json
{
  "projectName": "AI PPT Generator Custom Scan",
  "scanners": ["infrastructure", "dependencies", "dataflow"],
  "outputFormat": "markdown",
  "generateIndividualReports": true,
  "parallel": true,
  "maxConcurrent": 2,
  "timeout": 300,
  "continueOnError": true,
  "reportOptions": {
    "includeExecutiveSummary": true,
    "includeRiskAssessment": true,
    "includeComplianceMapping": true,
    "includeTechnicalDetails": true
  }
}
```

Then run:
```bash
node dist/cli/SecurityAssessmentCLI.js \
  --config ./my-assessment.config.json \
  --target .. \
  --output ./custom-reports
```

## Troubleshooting

### Memory Issues
```bash
# Increase Node.js memory limit for large projects
node --max-old-space-size=4096 dist/cli/SecurityAssessmentCLI.js \
  --config ./config/security-assessment.config.json \
  --target ..
```

### Scanner Timeout
```bash
# Increase timeout for slow scanners
node dist/cli/SecurityAssessmentCLI.js \
  --scanners infrastructure \
  --target .. \
  --timeout 900 \
  --debug
```

### Build Issues
```bash
# Clean rebuild if encountering errors
rm -rf dist node_modules
npm install
npm run build
```

## Understanding Output

### Console Output Example
```
🔒 Security Assessment Tool - Batch Mode

📋 Configuration:
  Project: AI PPT Generator
  Target: ..
  Scanners: infrastructure, dependencies, dataflow
  Output: ./security-reports

🚀 Starting security assessment...
[████████████████████] 100% | Complete

📊 Results Summary:
  Total Vulnerabilities: 376
  Critical: 47 | High: 91 | Medium: 189 | Low: 32
  Security Grade: C
  Compliance Rate: 4.4%

📄 Reports Generated:
  - comprehensive-security-assessment.md
  - executive-summary.md
  - technical-appendix.md
  - compliance-gap-analysis.md
```

### Generated Report Files
After running the assessment, you'll find:
- `SECURITY-ASSESSMENT-REPORT.md` - Complete comprehensive security analysis

## Best Practices

### Regular Assessments
```bash
# Weekly security scan
node dist/cli/SecurityAssessmentCLI.js \
  --config ./config/quick-scan.config.json \
  --target .. \
  --output ./weekly-scan-$(date +%Y%m%d)
```

### Pre-deployment Check
```bash
# Before production deployment
node dist/cli/SecurityAssessmentCLI.js \
  --scanners infrastructure,dependencies \
  --target .. \
  --output ./pre-deployment-check \
  --continue-on-error
```

### Compliance Audit
```bash
# Quarterly compliance review
node dist/cli/SecurityAssessmentCLI.js \
  --config ./config/compliance-focused.config.json \
  --target .. \
  --output ./compliance-audit-$(date +%Y-Q%q) \
  --individual \
  --log-file ./compliance-audit.log
```

## Help and Support

### Show All Options
```bash
node dist/cli/SecurityAssessmentCLI.js --help
```

### Version Information
```bash
node dist/cli/SecurityAssessmentCLI.js --version
```

### Dry Run (Validate Configuration)
```bash
node dist/cli/SecurityAssessmentCLI.js \
  --config ./config/security-assessment.config.json \
  --dry-run
```

---

*For more detailed information, see the main README.md file.*