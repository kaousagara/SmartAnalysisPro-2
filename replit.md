# Intelligence Analysis System

## Overview

This is a comprehensive intelligence analysis system designed for threat detection and assessment. The application combines a modern React frontend with a Python Flask backend to provide real-time threat scoring, data ingestion, scenario management, and analytical capabilities. The system is built for intelligence professionals and features security-focused design with clearance levels and classification handling.

## Recent Changes

### Authentication System Migration (July 14, 2025)
- ✅ **Complete migration from hardcoded to PostgreSQL authentication**
- ✅ **Database-driven user management with secure password hashing**
- ✅ **New API endpoints**: `/api/auth/login`, `/api/auth/user`, `/api/auth/logout`
- ✅ **Connection resilience**: Automatic reconnection handling for PostgreSQL
- ✅ **Frontend integration**: Updated React components to use database authentication
- ✅ **Test data management**: Fully functional admin interface with real-time statistics

### System Status
- **Authentication**: PostgreSQL-based with JWT tokens
- **Database**: PostgreSQL with connection pooling and error recovery
- **API**: Flask REST API with Express proxy layer
- **Frontend**: React with TypeScript, fully responsive
- **Documentation**: Complete project documentation generated
- **Deployment**: Ready for production deployment

### Documentation Generated (July 15, 2025)
- ✅ **README.md**: Main project documentation with quick start guide
- ✅ **PROJET_INTELLIGENCE_ANALYSIS.md**: Complete technical documentation
- ✅ **PRESENTATION_EXECUTIF.md**: Executive summary and key benefits
- ✅ **GUIDE_UTILISATION.md**: User guide with step-by-step instructions
- ✅ **README_DEPLOYMENT.md**: Deployment instructions for Replit

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: Tailwind CSS with custom dark theme optimized for intelligence work
- **Component Library**: Radix UI components with shadcn/ui styling
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Flask with Flask-RESTful for API endpoints
- **Language**: Python 3.x with TypeScript for Node.js proxy layer
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **Authentication**: JWT-based with 2FA support
- **Caching**: Redis for session management and real-time data caching
- **ML/AI**: scikit-learn and transformers for threat scoring and NLP
- **Prescription Engine**: Automated recommendation system with action prioritization

## Key Components

### 1. Threat Detection Engine
- **Purpose**: Real-time threat scoring and classification
- **Components**: ML models for intention probability, source credibility assessment, temporal coherence analysis
- **Scoring Algorithm**: Weighted combination of multiple factors with configurable thresholds
- **Output**: Threat scores (0-1), severity levels (low/medium/high/critical), and confidence metrics

### 2. Data Ingestion Service
- **Supported Formats**: JSON, STIX/TAXII, unstructured text
- **Processing**: Schema validation, data normalization, metadata enrichment
- **Integration**: Kafka for streaming data, REST APIs for batch processing
- **Monitoring**: Real-time status tracking and throughput metrics

### 3. Scenario Management
- **Dynamic Scenarios**: Condition-based triggering with configurable actions
- **Examples**: ATT-2024-MALI for regional threat patterns, CYBER-INTRUSION-07 for network security
- **Actions**: SIGINT collection, HUMINT tasking, network monitoring
- **Lifecycle**: Active/partial/inactive status tracking with validity windows

### 4. Prescription Engine (Advanced)
- **Purpose**: Automated generation of actionable security recommendations with predictive analytics
- **Categories**: Security measures, investigations, mitigation actions, incident response
- **Intelligence**: Threat-based recommendation logic with confidence scoring and delta analysis
- **Capabilities**: Status tracking, action execution, resource allocation planning, signal detection
- **Integration**: Real-time generation from threat predictions and manual creation
- **Predictive Features**: Weak/strong signal detection, trend analysis, auto-learning validation

### 5. Analytics Dashboard
- **Real-time Metrics**: Active threats, average scores, system health
- **Visualizations**: Threat evolution charts, severity distribution, data source status
- **Performance Tracking**: Detection rates, false positive metrics, processing latency
- **User Interface**: Dark theme optimized for 24/7 operations

### 6. Predictive Analytics Module
- **Signal Detection**: Automated identification of weak and strong threat signals
- **Trend Analysis**: Real-time tracking of threat score evolution and volatility
- **Collection Automation**: Intelligent generation of information requests based on gaps
- **Validation System**: Human feedback integration for continuous model improvement
- **Delta Scoring**: Reinforcement/weakening tracking for prediction confidence

## Data Flow

### 1. Data Ingestion
```
External Sources → Data Ingestion Service → Validation → Normalization → Database Storage
```

### 2. Threat Processing
```
Raw Data → Threat Service → ML Models → Scoring → Classification → Alert Generation
```

### 3. Scenario Execution
```
Threat Detection → Scenario Evaluation → Condition Matching → Action Triggering → Feedback Loop
```

### 4. User Interaction
```
Frontend → API Gateway → Authentication → Service Layer → Database → Response
```

### 5. Prescription Generation
```
Threat Detection → Risk Assessment → Prescription Engine → Action Prioritization → Resource Allocation
```

### 6. Predictive Analytics
```
Historical Data → Signal Detection → Trend Analysis → Prediction Validation → Auto-Learning
```

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (configured for Neon serverless)
- **Cache**: Redis for session management and real-time data
- **Message Queue**: Kafka for data streaming (optional)

### ML/AI Libraries
- **scikit-learn**: Classification and regression models
- **transformers**: BERT for natural language processing
- **NLTK**: Text processing and analysis
- **NumPy/Pandas**: Data manipulation and analysis

### Security & Authentication
- **JWT**: Token-based authentication with expiration
- **bcrypt**: Password hashing (via Werkzeug)
- **CORS**: Cross-origin resource sharing configuration

### Frontend Dependencies
- **React Ecosystem**: React 18, React Router (Wouter), React Hook Form
- **UI Components**: Radix UI primitives, Lucide React icons
- **Data Visualization**: Chart.js with React wrapper
- **Styling**: Tailwind CSS with custom intelligence theme

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server for frontend, Flask development server for backend
- **Hot Reload**: Full stack hot reloading with file watching
- **Database**: Local PostgreSQL or Neon development database
- **Environment Variables**: .env file for configuration

### Production Deployment
- **Frontend**: Static build served through Vite/Express
- **Backend**: Gunicorn WSGI server with multiple workers
- **Database**: Production PostgreSQL with connection pooling
- **Security**: Environment-based secrets management, HTTPS enforcement

### Architecture Decisions

1. **Hybrid Stack Choice**: Python backend for ML/AI capabilities with TypeScript frontend for modern UX
   - **Rationale**: Python's ML ecosystem and TypeScript's type safety
   - **Trade-offs**: Additional complexity but better performance and maintainability

2. **Microservices Pattern**: Separated services for ingestion, threats, scenarios, and analytics
   - **Benefits**: Scalability, maintainability, independent deployment
   - **Considerations**: Network overhead, distributed system complexity

3. **Real-time Architecture**: Redis caching with WebSocket-like polling for live updates
   - **Approach**: Optimistic updates with 5-30 second refresh intervals
   - **Performance**: Sub-400ms response times for critical operations

4. **Security-First Design**: JWT authentication with role-based access control
   - **Features**: Clearance levels, 2FA support, session management
   - **Compliance**: Designed for classified environments with audit trails

5. **Dark Theme UI**: Optimized for 24/7 operations in low-light environments
   - **Design**: High contrast, reduced eye strain, clear threat visualization
   - **Accessibility**: Color-blind friendly severity indicators, keyboard navigation