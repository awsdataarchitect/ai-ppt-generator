"""
Centralized timeout management for Lambda functions
Provides consistent timeout handling across all services
"""
import os
import time
import logging
from typing import Optional, Dict, Any, Callable
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class TimeoutType(Enum):
    """Types of timeout operations"""
    DOCUMENT_PROCESSING = "document_processing"
    RAG_QUERY = "rag_query"
    PRESENTATION_GENERATION = "presentation_generation"
    BEDROCK_API = "bedrock_api"
    S3_OPERATION = "s3_operation"
    DYNAMODB_OPERATION = "dynamodb_operation"
    KNOWLEDGE_BASE_SYNC = "knowledge_base_sync"

@dataclass
class TimeoutConfig:
    """Configuration for timeout management"""
    operation_timeout: int  # Maximum time for the operation in seconds
    warning_threshold: float = 0.8  # Warn when 80% of timeout is reached
    grace_period: int = 5  # Grace period before hard timeout
    enable_partial_save: bool = True  # Whether to save partial progress
    max_retries: int = 3  # Maximum retry attempts
    retry_delay: float = 1.0  # Delay between retries in seconds

class TimeoutManager:
    """
    Centralized timeout management with environment variable configuration
    """
    
    # Default timeout configurations (in seconds)
    DEFAULT_TIMEOUTS = {
        TimeoutType.DOCUMENT_PROCESSING: TimeoutConfig(
            operation_timeout=int(os.environ.get('DOCUMENT_PROCESSING_TIMEOUT', '840')),  # 14 minutes
            warning_threshold=0.8,
            grace_period=10,
            enable_partial_save=True,
            max_retries=2
        ),
        TimeoutType.RAG_QUERY: TimeoutConfig(
            operation_timeout=int(os.environ.get('RAG_QUERY_TIMEOUT', '60')),  # 1 minute
            warning_threshold=0.7,
            grace_period=5,
            enable_partial_save=False,
            max_retries=3
        ),
        TimeoutType.PRESENTATION_GENERATION: TimeoutConfig(
            operation_timeout=int(os.environ.get('PRESENTATION_GENERATION_TIMEOUT', '540')),  # 9 minutes
            warning_threshold=0.8,
            grace_period=15,
            enable_partial_save=True,
            max_retries=2
        ),
        TimeoutType.BEDROCK_API: TimeoutConfig(
            operation_timeout=int(os.environ.get('BEDROCK_API_TIMEOUT', '300')),  # 5 minutes
            warning_threshold=0.8,
            grace_period=5,
            enable_partial_save=False,
            max_retries=3
        ),
        TimeoutType.S3_OPERATION: TimeoutConfig(
            operation_timeout=int(os.environ.get('S3_OPERATION_TIMEOUT', '120')),  # 2 minutes
            warning_threshold=0.7,
            grace_period=5,
            enable_partial_save=False,
            max_retries=3
        ),
        TimeoutType.DYNAMODB_OPERATION: TimeoutConfig(
            operation_timeout=int(os.environ.get('DYNAMODB_OPERATION_TIMEOUT', '30')),  # 30 seconds
            warning_threshold=0.7,
            grace_period=2,
            enable_partial_save=False,
            max_retries=3
        ),
        TimeoutType.KNOWLEDGE_BASE_SYNC: TimeoutConfig(
            operation_timeout=int(os.environ.get('KNOWLEDGE_BASE_SYNC_TIMEOUT', '600')),  # 10 minutes
            warning_threshold=0.8,
            grace_period=15,
            enable_partial_save=True,
            max_retries=2
        )
    }
    
    def __init__(self, timeout_type: TimeoutType, custom_config: Optional[TimeoutConfig] = None):
        """
        Initialize timeout manager for specific operation type
        
        Args:
            timeout_type: Type of operation being managed
            custom_config: Optional custom configuration to override defaults
        """
        self.timeout_type = timeout_type
        self.config = custom_config or self.DEFAULT_TIMEOUTS[timeout_type]
        self.start_time = time.time()
        self.warning_issued = False
        self.partial_progress = {}
        
        logger.info(f"TimeoutManager initialized for {timeout_type.value} with {self.config.operation_timeout}s timeout")
    
    def get_elapsed_time(self) -> float:
        """Get elapsed time since initialization"""
        return time.time() - self.start_time
    
    def get_remaining_time(self) -> float:
        """Get remaining time before timeout"""
        return max(0, self.config.operation_timeout - self.get_elapsed_time())
    
    def get_progress_percentage(self) -> float:
        """Get progress as percentage of total timeout"""
        return min(100.0, (self.get_elapsed_time() / self.config.operation_timeout) * 100)
    
    def is_approaching_timeout(self) -> bool:
        """Check if we're approaching the timeout threshold"""
        return self.get_elapsed_time() >= (self.config.operation_timeout * self.config.warning_threshold)
    
    def is_timeout_exceeded(self) -> bool:
        """Check if timeout has been exceeded"""
        return self.get_elapsed_time() >= self.config.operation_timeout
    
    def check_timeout(self, operation_name: str = "operation") -> None:
        """
        Check timeout and raise exception if exceeded
        
        Args:
            operation_name: Name of the current operation for logging
            
        Raises:
            TimeoutError: If timeout is exceeded
        """
        elapsed = self.get_elapsed_time()
        remaining = self.get_remaining_time()
        
        # Issue warning if approaching timeout
        if self.is_approaching_timeout() and not self.warning_issued:
            self.warning_issued = True
            logger.warning(
                f"{operation_name} approaching timeout: {elapsed:.1f}s elapsed, "
                f"{remaining:.1f}s remaining ({self.get_progress_percentage():.1f}% complete)"
            )
        
        # Check for timeout
        if self.is_timeout_exceeded():
            error_msg = (
                f"{operation_name} timeout exceeded: {elapsed:.1f}s elapsed "
                f"(limit: {self.config.operation_timeout}s)"
            )
            logger.error(error_msg)
            raise TimeoutError(error_msg)
    
    def save_partial_progress(self, progress_data: Dict[str, Any]) -> None:
        """
        Save partial progress for recovery
        
        Args:
            progress_data: Dictionary containing progress information
        """
        if self.config.enable_partial_save:
            self.partial_progress.update(progress_data)
            logger.info(f"Saved partial progress: {len(progress_data)} items")
        else:
            logger.debug("Partial progress saving is disabled")
    
    def get_partial_progress(self) -> Dict[str, Any]:
        """Get saved partial progress"""
        return self.partial_progress.copy()
    
    def execute_with_timeout(
        self, 
        operation: Callable,
        operation_name: str,
        *args,
        **kwargs
    ) -> Any:
        """
        Execute an operation with timeout checking
        
        Args:
            operation: Function to execute
            operation_name: Name for logging
            *args: Arguments for the operation
            **kwargs: Keyword arguments for the operation
            
        Returns:
            Result of the operation
            
        Raises:
            TimeoutError: If operation times out
        """
        try:
            self.check_timeout(operation_name)
            logger.debug(f"Starting {operation_name}")
            
            result = operation(*args, **kwargs)
            
            elapsed = self.get_elapsed_time()
            logger.info(f"{operation_name} completed in {elapsed:.1f}s")
            
            return result
            
        except TimeoutError:
            # Save partial progress if enabled
            if self.config.enable_partial_save and self.partial_progress:
                logger.info(f"Saving partial progress for {operation_name}")
            raise
        except Exception as e:
            elapsed = self.get_elapsed_time()
            logger.error(f"{operation_name} failed after {elapsed:.1f}s: {str(e)}")
            raise
    
    def execute_with_retry(
        self,
        operation: Callable,
        operation_name: str,
        *args,
        **kwargs
    ) -> Any:
        """
        Execute an operation with retry logic and timeout checking
        
        Args:
            operation: Function to execute
            operation_name: Name for logging
            *args: Arguments for the operation
            **kwargs: Keyword arguments for the operation
            
        Returns:
            Result of the operation
            
        Raises:
            TimeoutError: If operation times out
            Exception: If all retries fail
        """
        last_exception = None
        
        for attempt in range(self.config.max_retries + 1):
            try:
                self.check_timeout(f"{operation_name} (attempt {attempt + 1})")
                
                if attempt > 0:
                    logger.info(f"Retrying {operation_name} (attempt {attempt + 1}/{self.config.max_retries + 1})")
                    time.sleep(self.config.retry_delay * attempt)  # Exponential backoff
                
                return self.execute_with_timeout(operation, operation_name, *args, **kwargs)
                
            except TimeoutError:
                # Don't retry on timeout
                raise
            except Exception as e:
                last_exception = e
                if attempt < self.config.max_retries:
                    logger.warning(f"{operation_name} failed (attempt {attempt + 1}): {str(e)}")
                else:
                    logger.error(f"{operation_name} failed after {attempt + 1} attempts: {str(e)}")
        
        # All retries failed
        raise last_exception
    
    def get_timeout_status(self) -> Dict[str, Any]:
        """
        Get current timeout status information
        
        Returns:
            Dictionary with timeout status details
        """
        elapsed = self.get_elapsed_time()
        remaining = self.get_remaining_time()
        progress = self.get_progress_percentage()
        
        return {
            'timeout_type': self.timeout_type.value,
            'elapsed_time': elapsed,
            'remaining_time': remaining,
            'progress_percentage': progress,
            'is_approaching_timeout': self.is_approaching_timeout(),
            'is_timeout_exceeded': self.is_timeout_exceeded(),
            'warning_issued': self.warning_issued,
            'partial_progress_items': len(self.partial_progress),
            'config': {
                'operation_timeout': self.config.operation_timeout,
                'warning_threshold': self.config.warning_threshold,
                'grace_period': self.config.grace_period,
                'enable_partial_save': self.config.enable_partial_save,
                'max_retries': self.config.max_retries
            }
        }
    
    @classmethod
    def get_environment_config(cls) -> Dict[str, int]:
        """
        Get current environment timeout configuration
        
        Returns:
            Dictionary of timeout environment variables and their values
        """
        return {
            'DOCUMENT_PROCESSING_TIMEOUT': int(os.environ.get('DOCUMENT_PROCESSING_TIMEOUT', '840')),
            'RAG_QUERY_TIMEOUT': int(os.environ.get('RAG_QUERY_TIMEOUT', '60')),
            'PRESENTATION_GENERATION_TIMEOUT': int(os.environ.get('PRESENTATION_GENERATION_TIMEOUT', '540')),
            'BEDROCK_API_TIMEOUT': int(os.environ.get('BEDROCK_API_TIMEOUT', '300')),
            'S3_OPERATION_TIMEOUT': int(os.environ.get('S3_OPERATION_TIMEOUT', '120')),
            'DYNAMODB_OPERATION_TIMEOUT': int(os.environ.get('DYNAMODB_OPERATION_TIMEOUT', '30')),
            'KNOWLEDGE_BASE_SYNC_TIMEOUT': int(os.environ.get('KNOWLEDGE_BASE_SYNC_TIMEOUT', '600'))
        }

# Convenience functions for common timeout operations
def create_document_processing_timeout() -> TimeoutManager:
    """Create timeout manager for document processing"""
    return TimeoutManager(TimeoutType.DOCUMENT_PROCESSING)

def create_rag_query_timeout() -> TimeoutManager:
    """Create timeout manager for RAG queries"""
    return TimeoutManager(TimeoutType.RAG_QUERY)

def create_presentation_timeout() -> TimeoutManager:
    """Create timeout manager for presentation generation"""
    return TimeoutManager(TimeoutType.PRESENTATION_GENERATION)

def create_bedrock_timeout() -> TimeoutManager:
    """Create timeout manager for Bedrock API calls"""
    return TimeoutManager(TimeoutType.BEDROCK_API)

def create_s3_timeout() -> TimeoutManager:
    """Create timeout manager for S3 operations"""
    return TimeoutManager(TimeoutType.S3_OPERATION)

def create_dynamodb_timeout() -> TimeoutManager:
    """Create timeout manager for DynamoDB operations"""
    return TimeoutManager(TimeoutType.DYNAMODB_OPERATION)

def create_knowledge_base_timeout() -> TimeoutManager:
    """Create timeout manager for Knowledge Base operations"""
    return TimeoutManager(TimeoutType.KNOWLEDGE_BASE_SYNC)