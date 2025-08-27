# Overview

This is a modern full-stack web scraping application built with Express.js backend and React frontend. The application provides a comprehensive platform for extracting structured data from websites with features like contact extraction, real-time monitoring, and enterprise-grade reliability. It includes user authentication via Replit's OAuth system, job management capabilities, and a sophisticated scraping engine that supports both static and dynamic content extraction.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with a dark theme color scheme and custom CSS variables
- **Routing**: Wouter for client-side routing with role-based route protection
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod schema validation for type-safe forms
- **Authentication**: Protected routes that redirect unauthenticated users to login

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit's OpenID Connect (OIDC) OAuth integration with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL using connect-pg-simple
- **API Design**: RESTful API with comprehensive error handling and request logging
- **Scraping Engine**: Custom service with support for static HTML parsing using Cheerio and planned dynamic scraping capabilities

## Database Schema
- **Users Table**: Stores user profiles from Replit authentication (email, name, profile image)
- **Scraping Jobs Table**: Manages scraping tasks with status tracking, progress monitoring, and configuration storage
- **Scraped Data Table**: Stores extracted data with flexible JSON structure for different data types
- **Domain Adapters Table**: Configurable scraping rules and selectors for different websites
- **Job Logs Table**: Comprehensive logging system for debugging and monitoring scraping operations
- **Sessions Table**: Secure session storage for user authentication state

## Core Features Architecture
- **Job Management**: Complete lifecycle management from creation to completion with real-time status updates
- **Data Processing**: Flexible extraction system supporting emails, phone numbers, company information, and custom fields
- **User Interface**: Dashboard with statistics, active job monitoring, data exploration, and export capabilities
- **Adapter System**: JSON-based configuration system for site-specific scraping rules and selectors

# External Dependencies

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with migration support
- **Session Storage**: PostgreSQL-backed session management for authentication persistence

## Authentication & Security
- **Replit Authentication**: OAuth 2.0/OpenID Connect integration for user management
- **Passport.js**: Authentication middleware with OpenID Client strategy
- **Express Session**: Secure session management with PostgreSQL storage

## Frontend Libraries
- **UI Framework**: Comprehensive Radix UI component collection (dialogs, dropdowns, forms, tables, etc.)
- **Styling**: Tailwind CSS with PostCSS for utility-first styling approach
- **Icons**: Lucide React for consistent iconography throughout the application
- **Data Fetching**: TanStack Query for server state management, caching, and synchronization

## Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Type Safety**: TypeScript across the entire stack with strict type checking
- **Code Quality**: ESLint and development error overlays for debugging
- **Development Environment**: Replit-specific tooling and cartographer integration