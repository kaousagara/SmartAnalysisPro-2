# LAKANA ANALYSIS - Python Dependencies Guide

## Overview

This document provides comprehensive information about the Python dependencies required for the LAKANA ANALYSIS system backend.

## Quick Installation

```bash
cd server
pip install -r requirements.txt
```

## Dependency Categories

### 1. Flask Web Framework
- **Flask** (2.3.3): Core web framework
- **Flask-CORS** (4.0.0): Cross-Origin Resource Sharing support
- **Flask-RESTful** (0.3.10): RESTful API development
- **Flask-JWT-Extended** (4.5.2): JWT authentication

### 2. Database & Storage
- **psycopg2-binary** (2.9.7): PostgreSQL database adapter
- **psycopg2-pool** (1.1): Connection pooling for PostgreSQL
- **redis** (4.6.0): In-memory data structure store for caching

### 3. Security
- **Werkzeug** (2.3.7): WSGI web application library with security utilities
- **bcrypt** (4.0.1): Password hashing library

### 4. Machine Learning & AI
- **scikit-learn** (1.3.0): Machine learning library for clustering, classification
- **torch** (2.0.1): PyTorch deep learning framework
- **torchvision** (0.15.2): Computer vision models and transforms for PyTorch
- **transformers** (4.33.2): State-of-the-art NLP models (BERT, GPT, etc.)
- **accelerate** (0.21.0): Training and inference optimization
- **tensorflow** (2.13.0): Alternative deep learning framework
- **keras** (2.13.1): High-level neural networks API

### 5. Data Processing
- **numpy** (1.24.3): Numerical computing library
- **pandas** (2.0.3): Data manipulation and analysis
- **nltk** (3.8.1): Natural Language Toolkit for text processing

### 6. API & External Services
- **openai** (1.3.0): OpenAI API client for GPT models
- **requests** (2.31.0): HTTP library for API calls
- **pydantic** (2.1.1): Data validation using Python type annotations

### 7. System & Utilities
- **python-dotenv** (1.0.0): Load environment variables from .env file
- **psutil** (5.9.5): System and process utilities
- **schedule** (1.2.0): Job scheduling library
- **gunicorn** (21.2.0): WSGI HTTP server for production deployment

## Version Compatibility

### Python Version
- Requires Python 3.8 or higher
- Tested with Python 3.11

### Critical Version Notes
- **torch** is pinned to 2.0.1 for compatibility with transformers
- **tensorflow** and **keras** versions must match (2.13.x)
- **psycopg2-binary** requires PostgreSQL client libraries

## Installation Issues & Solutions

### Common Problems

1. **PyTorch Installation**
   ```bash
   # For CPU-only installation
   pip install torch==2.0.1 torchvision==0.15.2 --index-url https://download.pytorch.org/whl/cpu
   
   # For CUDA 11.8
   pip install torch==2.0.1 torchvision==0.15.2 --index-url https://download.pytorch.org/whl/cu118
   ```

2. **TensorFlow Conflicts**
   - If TensorFlow conflicts with PyTorch, consider using virtual environments
   - Alternative: Use only one deep learning framework

3. **psycopg2 Installation**
   ```bash
   # If psycopg2-binary fails, install system dependencies first
   # Ubuntu/Debian:
   sudo apt-get install postgresql-dev python3-dev
   
   # macOS:
   brew install postgresql
   ```

## Development vs Production

### Development Dependencies
```bash
# Create a development requirements file
pip install pytest pytest-cov flake8 black mypy
```

### Production Optimization
```bash
# Use production-optimized versions
pip install torch==2.0.1+cpu torchvision==0.15.2+cpu -f https://download.pytorch.org/whl/torch_stable.html
```

## Virtual Environment Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Dependency Updates

To update dependencies while maintaining compatibility:

```bash
# Check outdated packages
pip list --outdated

# Update specific package
pip install --upgrade package_name

# Generate updated requirements
pip freeze > requirements_new.txt
```

## Security Considerations

- Regularly update dependencies for security patches
- Use `pip audit` to check for known vulnerabilities:
  ```bash
  pip install pip-audit
  pip-audit
  ```

## Troubleshooting

### Memory Issues
- TensorFlow and PyTorch can be memory-intensive
- Consider using environment variables to limit memory usage:
  ```bash
  export TF_FORCE_GPU_ALLOW_GROWTH=true
  ```

### Import Errors
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check Python version compatibility: `python --version`
- Verify virtual environment is activated

### Performance Optimization
- Use CPU-optimized versions for non-GPU systems
- Consider using `OMP_NUM_THREADS` to control CPU usage:
  ```bash
  export OMP_NUM_THREADS=4
  ```

## Contact & Support

For dependency-related issues specific to LAKANA ANALYSIS, please refer to the main documentation or create an issue in the project repository.