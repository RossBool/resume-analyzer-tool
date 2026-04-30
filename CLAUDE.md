# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Resume Analyzer Tool for the gaming industry (简历分析工具). The tool helps recruiters and hiring managers analyze candidate resumes specifically for game industry positions, extracting relevant skills, experience, and generating interview questions.

## Tech Stack

**Backend:**
- PHP 8.3
- webman-admin framework (based on Workerman)

**Frontend:**
- Vue.js
- Pinia for state management
- Vue Router for routing
- Axios for API communication

**Web Server:**
- Nginx or Apache

## Core Features

1. **Information Extraction**: Personal info, education, work experience, skills
2. **Skill Matching**: Compare candidate skills against job descriptions
3. **Experience Analysis**: Game industry-specific experience evaluation
4. **Education Assessment**: Degree and relevance evaluation
5. **Achievement Recognition**: Identify contributions to game development/projects
6. **Potential Prediction**: Future development potential in gaming industry
7. **Personalized Reports**: Generate analysis reports with strengths and weaknesses
8. **Data Visualization**: Charts for skill matching, experience, etc.
9. **Interview Question Generation**: Auto-generate questions based on resume content
10. **Multi-format Support**: PDF, Word, LinkedIn profiles

## Architecture Notes

- **File Upload**: RESTful API endpoints for resume upload and processing
- **Security**: Must validate file uploads to prevent malicious files
- **Privacy**: Ensure compliance with data protection regulations for resume data
- **Extensibility**: Design architecture to support new features and resume formats

## Development Commands

*(To be added when project structure is established)*

## Project Structure

*(To be established during initial development)*
