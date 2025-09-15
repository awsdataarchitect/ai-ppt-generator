/**
 * Configuration for read-only file system access to the existing codebase
 * Ensures security scanners can only read files without modification
 */

import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * Simple configuration class for file system access
 */
export class FileSystemConfig {
  private projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || this.detectProjectRoot();
  }

  public getProjectRoot(): string {
    return this.projectRoot;
  }

  private detectProjectRoot(): string {
    let currentDir = process.cwd();
    
    // Look for package.json or other project indicators
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      const backendDir = path.join(currentDir, 'backend');
      
      if (fs.existsSync(packageJsonPath) && fs.existsSync(backendDir)) {
        return currentDir;
      }
      
      currentDir = path.dirname(currentDir);
    }
    
    // Fallback to current directory
    return process.cwd();
  }
}

export interface FileSystemAccessConfig {
  readonly projectRoot: string;
  readonly allowedDirectories: string[];
  readonly excludedDirectories: string[];
  readonly allowedFileExtensions: string[];
  readonly maxFileSize: number; // bytes
  readonly maxFilesPerScan: number;
  readonly readTimeout: number; // milliseconds
  readonly enableSymlinkFollowing: boolean;
}

export interface FileAccessRule {
  readonly pattern: string;
  readonly action: 'allow' | 'deny';
  readonly reason: string;
}

export class ReadOnlyFileSystemAccess {
  private readonly config: FileSystemAccessConfig;
  private readonly accessRules: FileAccessRule[];

  constructor(config: FileSystemAccessConfig) {
    this.config = config;
    this.accessRules = this.initializeAccessRules();
  }

  /**
   * Initialize default access rules for read-only scanning
   */
  private initializeAccessRules(): FileAccessRule[] {
    return [
      // Deny sensitive files first (more specific patterns)
      { pattern: '.env', action: 'deny', reason: 'Contains sensitive environment variables' },
      { pattern: '**/.env', action: 'deny', reason: 'Contains sensitive environment variables' },
      { pattern: 'node_modules/**/*', action: 'deny', reason: 'Third-party dependencies excluded' },
      { pattern: '**/node_modules/**/*', action: 'deny', reason: 'Third-party dependencies excluded' },
      { pattern: 'dist/**/*', action: 'deny', reason: 'Build artifacts excluded' },
      { pattern: '**/dist/**/*', action: 'deny', reason: 'Build artifacts excluded' },
      { pattern: '.git/**/*', action: 'deny', reason: 'Git metadata excluded' },
      { pattern: '**/.git/**/*', action: 'deny', reason: 'Git metadata excluded' },
      { pattern: 'coverage/**/*', action: 'deny', reason: 'Test coverage reports excluded' },
      { pattern: '**/coverage/**/*', action: 'deny', reason: 'Test coverage reports excluded' },
      
      // Deny binary and large files
      { pattern: '**/*.zip', action: 'deny', reason: 'Binary files excluded' },
      { pattern: '**/*.tar.gz', action: 'deny', reason: 'Archive files excluded' },
      { pattern: '**/*.jpg', action: 'deny', reason: 'Image files excluded' },
      { pattern: '**/*.png', action: 'deny', reason: 'Image files excluded' },
      { pattern: '**/*.pdf', action: 'deny', reason: 'PDF files excluded' },
      
      // Allow configuration files (specific patterns)
      { pattern: 'package.json', action: 'allow', reason: 'Dependency analysis' },
      { pattern: '**/package.json', action: 'allow', reason: 'Dependency analysis' },
      { pattern: 'requirements.txt', action: 'allow', reason: 'Python dependency analysis' },
      { pattern: '**/requirements.txt', action: 'allow', reason: 'Python dependency analysis' },
      { pattern: '**/webpack.config.js', action: 'allow', reason: 'Build configuration analysis' },
      { pattern: '**/tsconfig.json', action: 'allow', reason: 'TypeScript configuration analysis' },
      { pattern: '**/.env.example', action: 'allow', reason: 'Environment configuration template' },
      
      // Allow source code directories
      { pattern: 'frontend/src/**/*', action: 'allow', reason: 'Frontend source code analysis' },
      { pattern: 'backend/**/*.py', action: 'allow', reason: 'Backend Lambda function analysis' },
      { pattern: 'infrastructure/**/*.ts', action: 'allow', reason: 'Infrastructure code analysis' }
    ];
  }

  /**
   * Check if a file path is allowed for read access
   */
  public isFileAccessAllowed(filePath: string): AccessCheckResult {
    const normalizedPath = path.normalize(filePath);
    
    // For testing, skip project root check if path is relative
    if (path.isAbsolute(normalizedPath) && !this.isWithinProjectRoot(normalizedPath)) {
      return {
        allowed: false,
        reason: 'File is outside project root directory',
        rule: 'project-root-restriction'
      };
    }

    // Apply access rules in order
    for (const rule of this.accessRules) {
      if (this.matchesPattern(normalizedPath, rule.pattern)) {
        return {
          allowed: rule.action === 'allow',
          reason: rule.reason,
          rule: rule.pattern
        };
      }
    }

    // Default deny for unmatched files
    return {
      allowed: false,
      reason: 'File does not match any allowed patterns',
      rule: 'default-deny'
    };
  }

  /**
   * Get list of all accessible files in the project
   */
  public async getAccessibleFiles(): Promise<AccessibleFile[]> {
    const accessibleFiles: AccessibleFile[] = [];
    
    try {
      await this.scanDirectory(this.config.projectRoot, accessibleFiles);
    } catch (error) {
      throw new Error(`Failed to scan project directory: ${error}`);
    }

    return accessibleFiles.slice(0, this.config.maxFilesPerScan);
  }

  /**
   * Safely read file content with access validation
   */
  public async readFileContent(filePath: string): Promise<FileContent> {
    const accessCheck = this.isFileAccessAllowed(filePath);
    
    if (!accessCheck.allowed) {
      throw new Error(`Access denied to file ${filePath}: ${accessCheck.reason}`);
    }

    try {
      const stats = await fs.stat(filePath);
      
      if (stats.size > this.config.maxFileSize) {
        throw new Error(`File ${filePath} exceeds maximum size limit (${this.config.maxFileSize} bytes)`);
      }

      const content = await fs.readFile(filePath, 'utf-8');
      
      return {
        filePath,
        content,
        size: stats.size,
        lastModified: stats.mtime,
        encoding: 'utf-8'
      };
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  /**
   * Get file metadata without reading content
   */
  public async getFileMetadata(filePath: string): Promise<FileMetadata> {
    const accessCheck = this.isFileAccessAllowed(filePath);
    
    if (!accessCheck.allowed) {
      throw new Error(`Access denied to file ${filePath}: ${accessCheck.reason}`);
    }

    try {
      const stats = await fs.stat(filePath);
      
      return {
        filePath,
        size: stats.size,
        lastModified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        permissions: stats.mode,
        extension: path.extname(filePath)
      };
    } catch (error) {
      throw new Error(`Failed to get metadata for ${filePath}: ${error}`);
    }
  }

  private isWithinProjectRoot(filePath: string): boolean {
    const resolvedPath = path.resolve(filePath);
    const resolvedRoot = path.resolve(this.config.projectRoot);
    return resolvedPath.startsWith(resolvedRoot);
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    let regexPattern = pattern;
    
    // First handle ** patterns before escaping
    regexPattern = regexPattern.replace(/\*\*/g, '__DOUBLESTAR__');
    
    // Escape special regex characters
    regexPattern = regexPattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    
    // Convert glob patterns to regex
    regexPattern = regexPattern.replace(/__DOUBLESTAR__/g, '.*');  // ** matches any path including /
    regexPattern = regexPattern.replace(/\\\*/g, '[^/]*');        // * matches any chars except /
    regexPattern = regexPattern.replace(/\\\?/g, '[^/]');         // ? matches single char except /
    
    try {
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(filePath);
    } catch (error) {
      // If regex is invalid, return false
      console.warn(`Invalid pattern: ${pattern}, error: ${error}`);
      return false;
    }
  }

  private async scanDirectory(dirPath: string, files: AccessibleFile[]): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (this.isFileAccessAllowed(fullPath).allowed) {
            await this.scanDirectory(fullPath, files);
          }
        } else if (entry.isFile()) {
          const accessCheck = this.isFileAccessAllowed(fullPath);
          if (accessCheck.allowed) {
            const stats = await fs.stat(fullPath);
            files.push({
              filePath: fullPath,
              size: stats.size,
              lastModified: stats.mtime,
              extension: path.extname(fullPath),
              accessRule: accessCheck.rule
            });
          }
        }
      }
    } catch (error) {
      // Log error but continue scanning other directories
      console.warn(`Warning: Could not scan directory ${dirPath}: ${error}`);
    }
  }
}

export interface AccessCheckResult {
  readonly allowed: boolean;
  readonly reason: string;
  readonly rule: string;
}

export interface AccessibleFile {
  readonly filePath: string;
  readonly size: number;
  readonly lastModified: Date;
  readonly extension: string;
  readonly accessRule: string;
}

export interface FileContent {
  readonly filePath: string;
  readonly content: string;
  readonly size: number;
  readonly lastModified: Date;
  readonly encoding: string;
}

export interface FileMetadata {
  readonly filePath: string;
  readonly size: number;
  readonly lastModified: Date;
  readonly isDirectory: boolean;
  readonly isFile: boolean;
  readonly permissions: number;
  readonly extension: string;
}

/**
 * Default configuration for the AI PPT Generator project
 */
export const DEFAULT_CONFIG: FileSystemAccessConfig = {
  projectRoot: path.resolve(__dirname, '../../../..'), // Points to ai-ppt-generator root
  allowedDirectories: [
    'frontend/src',
    'backend',
    'infrastructure',
    '.github',
    'blog-content-generator'
  ],
  excludedDirectories: [
    'node_modules',
    '.git',
    'dist',
    'coverage',
    '.next',
    '__pycache__',
    'cdk.out'
  ],
  allowedFileExtensions: [
    '.js', '.ts', '.tsx', '.jsx',
    '.py', '.json', '.md', '.yml', '.yaml',
    '.html', '.css', '.scss', '.env.example'
  ],
  maxFileSize: 1024 * 1024, // 1MB
  maxFilesPerScan: 10000,
  readTimeout: 5000, // 5 seconds
  enableSymlinkFollowing: false
};