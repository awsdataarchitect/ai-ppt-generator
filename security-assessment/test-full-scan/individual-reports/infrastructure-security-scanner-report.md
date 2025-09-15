# Infrastructure Security Scanner Security Report

**Generated:** 8/28/2025  
**Scanner Version:** 1.0.0  
**Files Scanned:** 13  
**Vulnerabilities Found:** 54  
**Scan Duration:** 0s  
**Confidence:** 100%

## Vulnerability Summary




### 1. S3 Bucket with Public Access

**Severity:** Critical  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 39  

**Description:** S3 bucket is configured to allow public access, potentially exposing sensitive data

**Remediation:** Remove public access and implement proper access controls

---

### 2. S3 Bucket Without Encryption

**Severity:** High  
**Category:** Cryptographic Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 39  

**Description:** S3 bucket does not have server-side encryption enabled

**Remediation:** Enable server-side encryption for S3 bucket

---

### 3. S3 Bucket with Permissive CORS Policy

**Severity:** Medium  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 39  

**Description:** S3 bucket CORS policy allows requests from any origin (*)

**Remediation:** Restrict CORS policy to specific trusted origins

---

### 4. S3 Bucket with Public Access

**Severity:** Critical  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 52  

**Description:** S3 bucket is configured to allow public access, potentially exposing sensitive data

**Remediation:** Remove public access and implement proper access controls

---

### 5. S3 Bucket Without Encryption

**Severity:** High  
**Category:** Cryptographic Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 52  

**Description:** S3 bucket does not have server-side encryption enabled

**Remediation:** Enable server-side encryption for S3 bucket

---

### 6. S3 Bucket with Permissive CORS Policy

**Severity:** Medium  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 52  

**Description:** S3 bucket CORS policy allows requests from any origin (*)

**Remediation:** Restrict CORS policy to specific trusted origins

---

### 7. DynamoDB Table Without Customer-Managed Encryption

**Severity:** Medium  
**Category:** Cryptographic Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 68  

**Description:** DynamoDB table uses default encryption instead of customer-managed keys

**Remediation:** Consider using customer-managed KMS keys for enhanced security

---

### 8. DynamoDB Table Without Point-in-Time Recovery

**Severity:** Low  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 68  

**Description:** DynamoDB table does not have point-in-time recovery enabled

**Remediation:** Enable point-in-time recovery for critical tables

---

### 9. DynamoDB Table Without Customer-Managed Encryption

**Severity:** Medium  
**Category:** Cryptographic Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 81  

**Description:** DynamoDB table uses default encryption instead of customer-managed keys

**Remediation:** Consider using customer-managed KMS keys for enhanced security

---

### 10. DynamoDB Table Without Point-in-Time Recovery

**Severity:** Low  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 81  

**Description:** DynamoDB table does not have point-in-time recovery enabled

**Remediation:** Enable point-in-time recovery for critical tables

---

### 11. Cognito User Pool with Weak Password Policy

**Severity:** Medium  
**Category:** Authentication Bypass  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 105  

**Description:** Cognito User Pool has a weak password policy that may allow easily guessable passwords

**Remediation:** Strengthen password policy requirements

---

### 12. Cognito User Pool Without MFA Configuration

**Severity:** Medium  
**Category:** Authentication Bypass  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 105  

**Description:** Cognito User Pool does not have multi-factor authentication configured

**Remediation:** Configure multi-factor authentication options

---

### 13. Cognito User Pool Without MFA Configuration

**Severity:** Medium  
**Category:** Authentication Bypass  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 142  

**Description:** Cognito User Pool does not have multi-factor authentication configured

**Remediation:** Configure multi-factor authentication options

---

### 14. Overprivileged IAM Role

**Severity:** High  
**Category:** Authorization Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 152  

**Description:** IAM role contains wildcard permissions that grant excessive access

**Remediation:** Apply principle of least privilege to IAM roles

---

### 15. IAM Role Missing Assume Role Conditions

**Severity:** Medium  
**Category:** Authorization Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 152  

**Description:** IAM role lacks conditions in assume role policy, potentially allowing unauthorized access

**Remediation:** Add appropriate conditions to assume role policy

---

### 16. Lambda Function with Excessive Timeout

**Severity:** Low  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 221  

**Description:** Lambda function has a very long timeout that could impact cost and security

**Remediation:** Review and optimize Lambda timeout settings

---

### 17. Lambda Function with Excessive Timeout

**Severity:** Low  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 298  

**Description:** Lambda function has a very long timeout that could impact cost and security

**Remediation:** Review and optimize Lambda timeout settings

---

### 18. Overprivileged IAM Role

**Severity:** High  
**Category:** Authorization Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 360  

**Description:** IAM role contains wildcard permissions that grant excessive access

**Remediation:** Apply principle of least privilege to IAM roles

---

### 19. IAM Role Missing Assume Role Conditions

**Severity:** Medium  
**Category:** Authorization Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 360  

**Description:** IAM role lacks conditions in assume role policy, potentially allowing unauthorized access

**Remediation:** Add appropriate conditions to assume role policy

---

### 20. Lambda Function with Excessive Timeout

**Severity:** Low  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 469  

**Description:** Lambda function has a very long timeout that could impact cost and security

**Remediation:** Review and optimize Lambda timeout settings

---

### 21. Lambda Function with Excessive Timeout

**Severity:** Low  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.js`  
**Line:** 524  

**Description:** Lambda function has a very long timeout that could impact cost and security

**Remediation:** Review and optimize Lambda timeout settings

---

### 22. S3 Bucket with Public Access

**Severity:** Critical  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 17  

**Description:** S3 bucket is configured to allow public access, potentially exposing sensitive data

**Remediation:** Remove public access and implement proper access controls

---

### 23. S3 Bucket Without Encryption

**Severity:** High  
**Category:** Cryptographic Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 17  

**Description:** S3 bucket does not have server-side encryption enabled

**Remediation:** Enable server-side encryption for S3 bucket

---

### 24. S3 Bucket with Permissive CORS Policy

**Severity:** Medium  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 17  

**Description:** S3 bucket CORS policy allows requests from any origin (*)

**Remediation:** Restrict CORS policy to specific trusted origins

---

### 25. S3 Bucket with Public Access

**Severity:** Critical  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 31  

**Description:** S3 bucket is configured to allow public access, potentially exposing sensitive data

**Remediation:** Remove public access and implement proper access controls

---

### 26. S3 Bucket Without Encryption

**Severity:** High  
**Category:** Cryptographic Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 31  

**Description:** S3 bucket does not have server-side encryption enabled

**Remediation:** Enable server-side encryption for S3 bucket

---

### 27. S3 Bucket with Permissive CORS Policy

**Severity:** Medium  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 31  

**Description:** S3 bucket CORS policy allows requests from any origin (*)

**Remediation:** Restrict CORS policy to specific trusted origins

---

### 28. DynamoDB Table Without Customer-Managed Encryption

**Severity:** Medium  
**Category:** Cryptographic Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 49  

**Description:** DynamoDB table uses default encryption instead of customer-managed keys

**Remediation:** Consider using customer-managed KMS keys for enhanced security

---

### 29. DynamoDB Table Without Point-in-Time Recovery

**Severity:** Low  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 49  

**Description:** DynamoDB table does not have point-in-time recovery enabled

**Remediation:** Enable point-in-time recovery for critical tables

---

### 30. DynamoDB Table Without Customer-Managed Encryption

**Severity:** Medium  
**Category:** Cryptographic Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 64  

**Description:** DynamoDB table uses default encryption instead of customer-managed keys

**Remediation:** Consider using customer-managed KMS keys for enhanced security

---

### 31. DynamoDB Table Without Point-in-Time Recovery

**Severity:** Low  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 64  

**Description:** DynamoDB table does not have point-in-time recovery enabled

**Remediation:** Enable point-in-time recovery for critical tables

---

### 32. Cognito User Pool with Weak Password Policy

**Severity:** Medium  
**Category:** Authentication Bypass  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 92  

**Description:** Cognito User Pool has a weak password policy that may allow easily guessable passwords

**Remediation:** Strengthen password policy requirements

---

### 33. Cognito User Pool Without MFA Configuration

**Severity:** Medium  
**Category:** Authentication Bypass  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 92  

**Description:** Cognito User Pool does not have multi-factor authentication configured

**Remediation:** Configure multi-factor authentication options

---

### 34. Cognito User Pool Without MFA Configuration

**Severity:** Medium  
**Category:** Authentication Bypass  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 130  

**Description:** Cognito User Pool does not have multi-factor authentication configured

**Remediation:** Configure multi-factor authentication options

---

### 35. Overprivileged IAM Role

**Severity:** High  
**Category:** Authorization Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 141  

**Description:** IAM role contains wildcard permissions that grant excessive access

**Remediation:** Apply principle of least privilege to IAM roles

---

### 36. IAM Role Missing Assume Role Conditions

**Severity:** Medium  
**Category:** Authorization Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 141  

**Description:** IAM role lacks conditions in assume role policy, potentially allowing unauthorized access

**Remediation:** Add appropriate conditions to assume role policy

---

### 37. Lambda Function with Excessive Timeout

**Severity:** Low  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 234  

**Description:** Lambda function has a very long timeout that could impact cost and security

**Remediation:** Review and optimize Lambda timeout settings

---

### 38. Overprivileged IAM Role

**Severity:** High  
**Category:** Authorization Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 322  

**Description:** IAM role contains wildcard permissions that grant excessive access

**Remediation:** Apply principle of least privilege to IAM roles

---

### 39. IAM Role Missing Assume Role Conditions

**Severity:** Medium  
**Category:** Authorization Failure  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 322  

**Description:** IAM role lacks conditions in assume role policy, potentially allowing unauthorized access

**Remediation:** Add appropriate conditions to assume role policy

---

### 40. Lambda Function with Excessive Timeout

**Severity:** Low  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 433  

**Description:** Lambda function has a very long timeout that could impact cost and security

**Remediation:** Review and optimize Lambda timeout settings

---

### 41. Lambda Function with Excessive Timeout

**Severity:** Low  
**Category:** Insecure Configuration  
**File:** `../infrastructure/lib/ai-ppt-complete-stack.ts`  
**Line:** 515  

**Description:** Lambda function has a very long timeout that could impact cost and security

**Remediation:** Review and optimize Lambda timeout settings

---

### 42. S3 Bucket Without Encryption

**Severity:** High  
**Category:** Cryptographic Failure  
**File:** `../security-assessment/src/scanners/InfrastructureSecurityScanner.ts`  
**Line:** 553  

**Description:** S3 bucket does not have server-side encryption enabled

**Remediation:** Enable server-side encryption for S3 bucket

---

### 43. S3 Bucket Without Encryption

**Severity:** High  
**Category:** Cryptographic Failure  
**File:** `../security-assessment/src/scanners/InfrastructureSecurityScanner.ts`  
**Line:** 553  

**Description:** S3 bucket does not have server-side encryption enabled

**Remediation:** Enable server-side encryption for S3 bucket

---

### 44. API Gateway Without Authentication

**Severity:** High  
**Category:** Authentication Bypass  
**File:** `../security-assessment/src/scanners/InfrastructureSecurityScanner.ts`  
**Line:** 693  

**Description:** API Gateway does not have authentication configured

**Remediation:** Implement authentication for API Gateway

---

### 45. API Gateway Without Logging

**Severity:** Medium  
**Category:** Logging Failure  
**File:** `../security-assessment/src/scanners/InfrastructureSecurityScanner.ts`  
**Line:** 693  

**Description:** API Gateway does not have logging enabled for security monitoring

**Remediation:** Enable logging for API Gateway

---

### 46. API Gateway Without Authentication

**Severity:** High  
**Category:** Authentication Bypass  
**File:** `../security-assessment/src/scanners/InfrastructureSecurityScanner.ts`  
**Line:** 693  

**Description:** API Gateway does not have authentication configured

**Remediation:** Implement authentication for API Gateway

---

### 47. API Gateway Without Logging

**Severity:** Medium  
**Category:** Logging Failure  
**File:** `../security-assessment/src/scanners/InfrastructureSecurityScanner.ts`  
**Line:** 693  

**Description:** API Gateway does not have logging enabled for security monitoring

**Remediation:** Enable logging for API Gateway

---

### 48. DynamoDB Table Without Customer-Managed Encryption

**Severity:** Medium  
**Category:** Cryptographic Failure  
**File:** `../security-assessment/src/scanners/InfrastructureSecurityScanner.ts`  
**Line:** 786  

**Description:** DynamoDB table uses default encryption instead of customer-managed keys

**Remediation:** Consider using customer-managed KMS keys for enhanced security

---

### 49. DynamoDB Table Without Point-in-Time Recovery

**Severity:** Low  
**Category:** Insecure Configuration  
**File:** `../security-assessment/src/scanners/InfrastructureSecurityScanner.ts`  
**Line:** 786  

**Description:** DynamoDB table does not have point-in-time recovery enabled

**Remediation:** Enable point-in-time recovery for critical tables

---

### 50. DynamoDB Table Without Customer-Managed Encryption

**Severity:** Medium  
**Category:** Cryptographic Failure  
**File:** `../security-assessment/src/scanners/InfrastructureSecurityScanner.ts`  
**Line:** 786  

**Description:** DynamoDB table uses default encryption instead of customer-managed keys

**Remediation:** Consider using customer-managed KMS keys for enhanced security

---

### 51. DynamoDB Table Without Point-in-Time Recovery

**Severity:** Low  
**Category:** Insecure Configuration  
**File:** `../security-assessment/src/scanners/InfrastructureSecurityScanner.ts`  
**Line:** 786  

**Description:** DynamoDB table does not have point-in-time recovery enabled

**Remediation:** Enable point-in-time recovery for critical tables

---

### 52. DynamoDB Table Without Point-in-Time Recovery

**Severity:** Low  
**Category:** Insecure Configuration  
**File:** `../security-assessment/src/scanners/InfrastructureSecurityScanner.ts`  
**Line:** 798  

**Description:** DynamoDB table does not have point-in-time recovery enabled

**Remediation:** Enable point-in-time recovery for critical tables

---

### 53. Cognito User Pool Without MFA Configuration

**Severity:** Medium  
**Category:** Authentication Bypass  
**File:** `../security-assessment/src/scanners/InfrastructureSecurityScanner.ts`  
**Line:** 879  

**Description:** Cognito User Pool does not have multi-factor authentication configured

**Remediation:** Configure multi-factor authentication options

---

### 54. Cognito User Pool Without MFA Configuration

**Severity:** Medium  
**Category:** Authentication Bypass  
**File:** `../security-assessment/src/scanners/InfrastructureSecurityScanner.ts`  
**Line:** 879  

**Description:** Cognito User Pool does not have multi-factor authentication configured

**Remediation:** Configure multi-factor authentication options

---


## Scan Errors

No errors encountered.



---

*Report generated by Infrastructure Security Scanner v1.0.0*
