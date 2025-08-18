"""
Presentation output generator for modern web-based presentations
Supports Reveal.js and Marp output formats
"""
import json
import boto3
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import os
import uuid
import base64
from jinja2 import Template

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Environment variables
PRESENTATIONS_TABLE = os.environ['PRESENTATIONS_TABLE']
ASSETS_BUCKET = os.environ['ASSETS_BUCKET']

# DynamoDB tables
presentations_table = dynamodb.Table(PRESENTATIONS_TABLE)

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Main Lambda handler for presentation output generation
    """
    try:
        field_name = event['info']['fieldName']
        arguments = event.get('arguments', {})
        identity = event['identity']
        
        logger.info(f"Generating output: {field_name} for user: {identity.get('sub')}")
        
        # Route to appropriate generator
        if field_name == 'exportPresentationHTML':
            return export_presentation_html(arguments, identity)
        elif field_name == 'exportPresentationRevealJS':
            return export_presentation_revealjs(arguments, identity)
        elif field_name == 'exportPresentationMarp':
            return export_presentation_marp(arguments, identity)
        elif field_name == 'generatePresentationPreview':
            return generate_presentation_preview(arguments, identity)
        else:
            raise ValueError(f"Unknown output field: {field_name}")
            
    except Exception as e:
        logger.error(f"Error in presentation output: {str(e)}")
        raise e

def export_presentation_html(arguments: Dict[str, Any], identity: Dict[str, Any]) -> Dict[str, Any]:
    """Export presentation as standalone HTML"""
    user_id = identity['sub']
    presentation_id = arguments['presentationId']
    options = arguments.get('options', {})
    
    # Validate subscription
    if not validate_subscription(user_id):
        raise Exception("Active subscription required for HTML export")
    
    # Get presentation
    presentation = get_presentation_by_id(presentation_id, user_id)
    if not presentation:
        raise Exception("Presentation not found or access denied")
    
    # Generate HTML
    html_content = generate_standalone_html(presentation, options)
    
    # Upload to S3
    export_key = f"exports/{user_id}/{presentation_id}/presentation.html"
    s3_client.put_object(
        Bucket=ASSETS_BUCKET,
        Key=export_key,
        Body=html_content,
        ContentType='text/html',
        Metadata={
            'presentation-id': presentation_id,
            'user-id': user_id,
            'export-type': 'html',
            'generated-at': datetime.now(timezone.utc).isoformat()
        }
    )
    
    # Generate presigned URL
    download_url = s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': ASSETS_BUCKET, 'Key': export_key},
        ExpiresIn=3600  # 1 hour
    )
    
    logger.info(f"Generated HTML export for presentation {presentation_id}")
    return {
        'presentationId': presentation_id,
        'format': 'HTML',
        'downloadUrl': download_url,
        'expiresAt': (datetime.now(timezone.utc).timestamp() + 3600) * 1000,
        'generatedAt': datetime.now(timezone.utc).isoformat()
    }

def export_presentation_revealjs(arguments: Dict[str, Any], identity: Dict[str, Any]) -> Dict[str, Any]:
    """Export presentation as Reveal.js presentation"""
    user_id = identity['sub']
    presentation_id = arguments['presentationId']
    options = arguments.get('options', {})
    
    # Validate subscription
    if not validate_subscription(user_id):
        raise Exception("Active subscription required for Reveal.js export")
    
    # Get presentation
    presentation = get_presentation_by_id(presentation_id, user_id)
    if not presentation:
        raise Exception("Presentation not found or access denied")
    
    # Generate Reveal.js HTML
    revealjs_content = generate_revealjs_html(presentation, options)
    
    # Upload to S3
    export_key = f"exports/{user_id}/{presentation_id}/revealjs.html"
    s3_client.put_object(
        Bucket=ASSETS_BUCKET,
        Key=export_key,
        Body=revealjs_content,
        ContentType='text/html',
        Metadata={
            'presentation-id': presentation_id,
            'user-id': user_id,
            'export-type': 'revealjs',
            'generated-at': datetime.now(timezone.utc).isoformat()
        }
    )
    
    # Generate presigned URL
    download_url = s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': ASSETS_BUCKET, 'Key': export_key},
        ExpiresIn=3600
    )
    
    logger.info(f"Generated Reveal.js export for presentation {presentation_id}")
    return {
        'presentationId': presentation_id,
        'format': 'REVEALJS',
        'downloadUrl': download_url,
        'expiresAt': (datetime.now(timezone.utc).timestamp() + 3600) * 1000,
        'generatedAt': datetime.now(timezone.utc).isoformat()
    }

def export_presentation_marp(arguments: Dict[str, Any], identity: Dict[str, Any]) -> Dict[str, Any]:
    """Export presentation as Marp markdown"""
    user_id = identity['sub']
    presentation_id = arguments['presentationId']
    options = arguments.get('options', {})
    
    # Validate subscription
    if not validate_subscription(user_id):
        raise Exception("Active subscription required for Marp export")
    
    # Get presentation
    presentation = get_presentation_by_id(presentation_id, user_id)
    if not presentation:
        raise Exception("Presentation not found or access denied")
    
    # Generate Marp markdown
    marp_content = generate_marp_markdown(presentation, options)
    
    # Upload to S3
    export_key = f"exports/{user_id}/{presentation_id}/presentation.md"
    s3_client.put_object(
        Bucket=ASSETS_BUCKET,
        Key=export_key,
        Body=marp_content,
        ContentType='text/markdown',
        Metadata={
            'presentation-id': presentation_id,
            'user-id': user_id,
            'export-type': 'marp',
            'generated-at': datetime.now(timezone.utc).isoformat()
        }
    )
    
    # Generate presigned URL
    download_url = s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': ASSETS_BUCKET, 'Key': export_key},
        ExpiresIn=3600
    )
    
    logger.info(f"Generated Marp export for presentation {presentation_id}")
    return {
        'presentationId': presentation_id,
        'format': 'MARP',
        'downloadUrl': download_url,
        'expiresAt': (datetime.now(timezone.utc).timestamp() + 3600) * 1000,
        'generatedAt': datetime.now(timezone.utc).isoformat()
    }

def generate_presentation_preview(arguments: Dict[str, Any], identity: Dict[str, Any]) -> Dict[str, Any]:
    """Generate presentation preview"""
    user_id = identity['sub']
    presentation_id = arguments['presentationId']
    
    # Get presentation
    presentation = get_presentation_by_id(presentation_id, user_id)
    if not presentation:
        raise Exception("Presentation not found or access denied")
    
    # Generate preview HTML
    preview_content = generate_preview_html(presentation)
    
    # Upload to S3
    preview_key = f"previews/{user_id}/{presentation_id}/preview.html"
    s3_client.put_object(
        Bucket=ASSETS_BUCKET,
        Key=preview_key,
        Body=preview_content,
        ContentType='text/html',
        Metadata={
            'presentation-id': presentation_id,
            'user-id': user_id,
            'type': 'preview',
            'generated-at': datetime.now(timezone.utc).isoformat()
        }
    )
    
    # Generate presigned URL
    preview_url = s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': ASSETS_BUCKET, 'Key': preview_key},
        ExpiresIn=3600
    )
    
    logger.info(f"Generated preview for presentation {presentation_id}")
    return {
        'presentationId': presentation_id,
        'previewUrl': preview_url,
        'expiresAt': (datetime.now(timezone.utc).timestamp() + 3600) * 1000,
        'generatedAt': datetime.now(timezone.utc).isoformat()
    }

def generate_standalone_html(presentation: Dict[str, Any], options: Dict[str, Any]) -> str:
    """Generate standalone HTML presentation"""
    
    template = Template("""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ presentation.title }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: {{ theme.fontFamily }}, sans-serif;
            background: {{ theme.backgroundColor }};
            color: {{ theme.textColor }};
            overflow: hidden;
        }
        
        .presentation-container {
            width: 100vw;
            height: 100vh;
            position: relative;
        }
        
        .slide {
            width: 100%;
            height: 100%;
            display: none;
            padding: 60px;
            position: absolute;
            top: 0;
            left: 0;
            background: {{ theme.backgroundColor }};
            border: 2px solid {{ theme.primaryColor }};
        }
        
        .slide.active {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .slide h1 {
            font-size: 3em;
            color: {{ theme.primaryColor }};
            margin-bottom: 30px;
            text-align: center;
        }
        
        .slide h2 {
            font-size: 2.5em;
            color: {{ theme.secondaryColor }};
            margin-bottom: 25px;
            text-align: center;
        }
        
        .slide p, .slide li {
            font-size: {{ theme.fontSize }}px;
            line-height: 1.6;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .slide ul {
            list-style: none;
            max-width: 800px;
        }
        
        .slide li {
            padding: 10px 0;
            border-bottom: 1px solid {{ theme.accentColor }};
        }
        
        .navigation {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 20px;
            z-index: 1000;
        }
        
        .nav-btn {
            padding: 12px 24px;
            background: {{ theme.primaryColor }};
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
        }
        
        .nav-btn:hover {
            background: {{ theme.secondaryColor }};
        }
        
        .nav-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .slide-counter {
            position: fixed;
            top: 30px;
            right: 30px;
            background: {{ theme.accentColor }};
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
        }
        
        .title-slide {
            background: linear-gradient(135deg, {{ theme.primaryColor }}, {{ theme.secondaryColor }});
            color: white;
        }
        
        .title-slide h1 {
            color: white;
            font-size: 4em;
        }
        
        .content-slide {
            text-align: left;
        }
        
        .content-slide h2 {
            text-align: left;
            border-bottom: 3px solid {{ theme.accentColor }};
            padding-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="presentation-container">
        <div class="slide-counter">
            <span id="current-slide">1</span> / <span id="total-slides">{{ slides|length }}</span>
        </div>
        
        {% for slide in slides %}
        <div class="slide {% if slide.type == 'TITLE' %}title-slide{% else %}content-slide{% endif %} {% if loop.first %}active{% endif %}" data-slide="{{ loop.index0 }}">
            {% if slide.title %}
                {% if slide.type == 'TITLE' %}
                    <h1>{{ slide.title }}</h1>
                {% else %}
                    <h2>{{ slide.title }}</h2>
                {% endif %}
            {% endif %}
            
            {% if slide.content %}
                {% if slide.content.startswith('- ') or slide.content.startswith('* ') %}
                    <ul>
                        {% for line in slide.content.split('\n') %}
                            {% if line.strip() and (line.startswith('- ') or line.startswith('* ')) %}
                                <li>{{ line[2:].strip() }}</li>
                            {% endif %}
                        {% endfor %}
                    </ul>
                {% else %}
                    {% for paragraph in slide.content.split('\n\n') %}
                        {% if paragraph.strip() %}
                            <p>{{ paragraph.strip() }}</p>
                        {% endif %}
                    {% endfor %}
                {% endif %}
            {% endif %}
        </div>
        {% endfor %}
        
        <div class="navigation">
            <button class="nav-btn" id="prev-btn" onclick="previousSlide()">Previous</button>
            <button class="nav-btn" id="next-btn" onclick="nextSlide()">Next</button>
        </div>
    </div>
    
    <script>
        let currentSlide = 0;
        const totalSlides = {{ slides|length }};
        
        function showSlide(n) {
            const slides = document.querySelectorAll('.slide');
            
            if (n >= totalSlides) currentSlide = 0;
            if (n < 0) currentSlide = totalSlides - 1;
            
            slides.forEach(slide => slide.classList.remove('active'));
            slides[currentSlide].classList.add('active');
            
            document.getElementById('current-slide').textContent = currentSlide + 1;
            
            // Update navigation buttons
            document.getElementById('prev-btn').disabled = currentSlide === 0;
            document.getElementById('next-btn').disabled = currentSlide === totalSlides - 1;
        }
        
        function nextSlide() {
            if (currentSlide < totalSlides - 1) {
                currentSlide++;
                showSlide(currentSlide);
            }
        }
        
        function previousSlide() {
            if (currentSlide > 0) {
                currentSlide--;
                showSlide(currentSlide);
            }
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                previousSlide();
            }
        });
        
        // Initialize
        showSlide(0);
    </script>
</body>
</html>
    """)
    
    return template.render(
        presentation=presentation,
        slides=presentation.get('slides', []),
        theme=presentation.get('theme', {}),
        options=options
    )

def generate_revealjs_html(presentation: Dict[str, Any], options: Dict[str, Any]) -> str:
    """Generate Reveal.js presentation"""
    
    template = Template("""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ presentation.title }}</title>
    
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/white.css">
    
    <style>
        .reveal {
            font-family: {{ theme.fontFamily }}, sans-serif;
        }
        
        .reveal .slides section {
            background: {{ theme.backgroundColor }};
            color: {{ theme.textColor }};
        }
        
        .reveal h1, .reveal h2, .reveal h3 {
            color: {{ theme.primaryColor }};
        }
        
        .reveal .progress {
            color: {{ theme.accentColor }};
        }
        
        .reveal .controls {
            color: {{ theme.primaryColor }};
        }
        
        .title-slide {
            background: linear-gradient(135deg, {{ theme.primaryColor }}, {{ theme.secondaryColor }}) !important;
            color: white !important;
        }
        
        .title-slide h1, .title-slide h2 {
            color: white !important;
        }
    </style>
</head>
<body>
    <div class="reveal">
        <div class="slides">
            {% for slide in slides %}
            <section {% if slide.type == 'TITLE' %}class="title-slide"{% endif %}>
                {% if slide.title %}
                    {% if slide.type == 'TITLE' %}
                        <h1>{{ slide.title }}</h1>
                    {% else %}
                        <h2>{{ slide.title }}</h2>
                    {% endif %}
                {% endif %}
                
                {% if slide.content %}
                    {% if slide.content.startswith('- ') or slide.content.startswith('* ') %}
                        <ul>
                            {% for line in slide.content.split('\n') %}
                                {% if line.strip() and (line.startswith('- ') or line.startswith('* ')) %}
                                    <li>{{ line[2:].strip() }}</li>
                                {% endif %}
                            {% endfor %}
                        </ul>
                    {% else %}
                        {% for paragraph in slide.content.split('\n\n') %}
                            {% if paragraph.strip() %}
                                <p>{{ paragraph.strip() }}</p>
                            {% endif %}
                        {% endfor %}
                    {% endif %}
                {% endif %}
                
                {% if slide.notes %}
                    <aside class="notes">
                        {{ slide.notes }}
                    </aside>
                {% endif %}
            </section>
            {% endfor %}
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/plugin/notes/notes.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/plugin/markdown/markdown.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/plugin/highlight/highlight.js"></script>
    
    <script>
        Reveal.initialize({
            hash: true,
            controls: true,
            progress: true,
            center: true,
            transition: '{{ options.get("transition", "slide") }}',
            plugins: [ RevealMarkdown, RevealHighlight, RevealNotes ]
        });
    </script>
</body>
</html>
    """)
    
    return template.render(
        presentation=presentation,
        slides=presentation.get('slides', []),
        theme=presentation.get('theme', {}),
        options=options
    )

def generate_marp_markdown(presentation: Dict[str, Any], options: Dict[str, Any]) -> str:
    """Generate Marp markdown presentation"""
    
    theme = presentation.get('theme', {})
    slides = presentation.get('slides', [])
    
    # Marp header
    marp_content = f"""---
marp: true
theme: default
class: lead
paginate: true
backgroundColor: {theme.get('backgroundColor', '#ffffff')}
color: {theme.get('textColor', '#333333')}
---

<!-- 
_class: lead
_backgroundColor: {theme.get('primaryColor', '#2563eb')}
_color: white
-->

"""
    
    # Add slides
    for i, slide in enumerate(slides):
        if i > 0:
            marp_content += "\n---\n\n"
        
        # Title slide styling
        if slide.get('type') == 'TITLE':
            marp_content += f"""<!-- 
_class: lead
_backgroundColor: {theme.get('primaryColor', '#2563eb')}
_color: white
-->

"""
        
        # Add slide content
        if slide.get('title'):
            if slide.get('type') == 'TITLE':
                marp_content += f"# {slide['title']}\n\n"
            else:
                marp_content += f"## {slide['title']}\n\n"
        
        if slide.get('content'):
            marp_content += f"{slide['content']}\n\n"
        
        # Add speaker notes if present
        if slide.get('notes'):
            marp_content += f"<!-- \nSpeaker Notes:\n{slide['notes']}\n-->\n\n"
    
    return marp_content

def generate_preview_html(presentation: Dict[str, Any]) -> str:
    """Generate lightweight preview HTML"""
    
    template = Template("""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview: {{ presentation.title }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .preview-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .presentation-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .slides-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .slide-preview {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            min-height: 200px;
        }
        
        .slide-number {
            background: #007bff;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-bottom: 10px;
            display: inline-block;
        }
        
        .slide-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        
        .slide-content {
            font-size: 14px;
            color: #666;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="presentation-info">
            <h1>{{ presentation.title }}</h1>
            {% if presentation.description %}
                <p>{{ presentation.description }}</p>
            {% endif %}
            <p><strong>Slides:</strong> {{ slides|length }} | <strong>Estimated Duration:</strong> {{ presentation.estimatedDuration or (slides|length * 2) }} minutes</p>
        </div>
        
        <div class="slides-grid">
            {% for slide in slides %}
            <div class="slide-preview">
                <div class="slide-number">Slide {{ loop.index }}</div>
                {% if slide.title %}
                    <div class="slide-title">{{ slide.title }}</div>
                {% endif %}
                {% if slide.content %}
                    <div class="slide-content">{{ slide.content[:200] }}{% if slide.content|length > 200 %}...{% endif %}</div>
                {% endif %}
            </div>
            {% endfor %}
        </div>
    </div>
</body>
</html>
    """)
    
    return template.render(
        presentation=presentation,
        slides=presentation.get('slides', [])
    )

def get_presentation_by_id(presentation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Get presentation by ID with user validation"""
    try:
        response = presentations_table.get_item(Key={'id': presentation_id})
        item = response.get('Item')
        
        if item and item['userId'] == user_id:
            return item
        return None
        
    except Exception as e:
        logger.error(f"Error getting presentation {presentation_id}: {str(e)}")
        return None

def validate_subscription(user_id: str) -> bool:
    """Validate user has active subscription with admin bypass"""
    try:
        # Admin bypass mode for testing
        admin_bypass = os.environ.get('ADMIN_BYPASS_MODE', 'false').lower() == 'true'
        if admin_bypass:
            logger.info(f"Admin bypass mode enabled for user {user_id}")
            return True
        
        # Get subscription from DynamoDB
        subscriptions_table = dynamodb.Table(os.environ.get('SUBSCRIPTIONS_TABLE', 'ai-ppt-subscriptions'))
        
        response = subscriptions_table.get_item(Key={'userId': user_id})
        subscription = response.get('Item')
        
        if not subscription:
            return False
        
        # Check if subscription is active
        if subscription['status'] not in ['ACTIVE', 'TRIALING']:
            return False
        
        # Check if subscription is not expired
        current_time = datetime.now(timezone.utc)
        period_end = datetime.fromisoformat(subscription['currentPeriodEnd'].replace('Z', '+00:00'))
        
        if current_time > period_end:
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error validating subscription for user {user_id}: {str(e)}")
        # In admin bypass mode, allow access on error
        admin_bypass = os.environ.get('ADMIN_BYPASS_MODE', 'false').lower() == 'true'
        return admin_bypass
