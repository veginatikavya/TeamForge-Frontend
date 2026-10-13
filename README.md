# TeamForge – Frontend

### Constraint-Aware Skill-Based Team Formation and Project Capability Analysis Platform

TeamForge is a full-stack web application designed to help organizations form project teams based on verified employee skills, proficiency levels, project requirements, availability, and team-size constraints.

This repository contains the **React frontend** of TeamForge.

The application provides role-based dashboards for administrators and candidates, supporting project management, skill verification, candidate matching, team formation, and project capability analysis.

## Problem Statement

Forming effective project teams manually can be challenging because organizations must consider multiple factors, including:

- Employee technical skills and proficiency levels
- Reliability of self-reported skills
- Mandatory and optional project requirements
- Team-size limitations
- Employee availability
- Skill gaps within existing teams
- Suitable replacements for team members

TeamForge addresses these challenges through a centralized platform that supports verified skill management and constraint-aware team formation.

## Technologies Used

| Technology | Purpose |
|------------|---------|
| React | Frontend user interface |
| JavaScript | Application logic |
| Vite | Development server and build tool |
| HTML5 | Page structure |
| CSS3 | Application styling |
| Fetch API | Communication with backend REST APIs |
| JWT | Authentication and protected API requests |

## User Roles

TeamForge supports two primary user roles.

### Administrator

Administrators can:

- Manage candidate profiles
- Manage projects and skill requirements
- Review candidate-submitted skills
- Verify skills and approve proficiency levels
- Evaluate candidate matching scores
- Form and manage project teams
- Generate automatic team recommendations
- Analyze team capability gaps
- Evaluate candidate contributions and replacements

### Candidate

Candidates can:

- Log in to their personal dashboard
- View their profile information
- Submit technical skills
- Specify claimed proficiency levels
- Edit previously submitted proficiency levels
- View skill verification status

When a candidate updates a previously approved skill, the change requires administrator review.

## Main Features

### 1. Authentication and Role-Based Dashboards

- Login using registered credentials
- JWT-based authentication
- Separate administrator and candidate dashboards
- Role-specific access to application features
- Logout functionality

### 2. Project Management

- Create and manage projects
- Define project descriptions and team sizes
- Configure required technical skills
- Specify minimum proficiency levels
- Classify requirements as mandatory or optional

### 3. Candidate Management

- View and manage candidate profiles
- Maintain preferred roles and experience
- Track candidate availability
- Update candidate information

### 4. Skill Management and Verification

- Maintain a centralized list of technical skills
- Allow candidates to submit their skills
- Record claimed proficiency levels
- Allow candidates to update proficiency claims
- Provide administrator verification of submitted skills
- Store administrator-approved proficiency levels
- Track pending skill reviews

### 5. Verified Skill-Based Candidate Matching

- Evaluate candidates against project requirements
- Calculate weighted matching scores
- Identify missing mandatory skills
- Rank candidates according to matching results
- Display candidate eligibility and matching explanations

**Important:** Candidate matching uses administrator-verified skills and approved proficiency levels rather than relying solely on self-reported proficiency.

### 6. Team Formation and Management

- Assign candidates to project teams
- View existing team members
- Remove team members when required
- Enforce project team-size constraints through backend validation

### 7. Capability Gap Analysis

- Analyze skills covered by existing team members
- Identify missing or insufficient skill coverage
- Display project capability summaries
- Highlight requirements needing additional expertise

### 8. Team Recommendations

- Recommend candidates who can improve team capabilities
- Display candidate contribution scores
- Identify skills that a candidate can add or strengthen

### 9. Automatic Team Formation

- Generate team suggestions based on project requirements
- Consider candidate availability and verified skills
- Respect project team-size limitations
- Display warnings when a complete team cannot be formed

### 10. Team Replacement Analysis

- Analyze possible replacements for existing team members
- Compare replacement candidates based on skill coverage
- Display replacement scores and capability impact
- Highlight remaining requirement gaps

## Application Workflow

### Administrator Workflow

1. Log in as an administrator.
2. Create or select a project.
3. Configure project skill requirements.
4. Manage candidate profiles.
5. Review and approve candidate skills.
6. Run verified skill-based candidate matching.
7. Form a project team manually or generate recommendations.
8. Analyze team capability gaps.
9. Evaluate team improvements and replacements.

### Candidate Workflow

1. Log in as a candidate.
2. Open the candidate dashboard.
3. View profile and skill information.
4. Submit technical skills and proficiency levels.
5. Update proficiency claims when necessary.
6. Wait for administrator review and approval.

## Project Architecture

The React frontend communicates with the Spring Boot backend through REST APIs.

```text
+--------------------------------+
|         React Frontend         |
|                                |
|  Admin and Candidate Dashboards|
|  Project and Skill Management  |
|  Matching and Analysis Views   |
+---------------+----------------+
                |
                | HTTP / JSON
                | JWT Authentication
                v
+--------------------------------+
|       Spring Boot Backend      |
|                                |
|  REST Controllers              |
|  Authentication and Security   |
|  Matching and Team Services    |
|  Skill Verification Logic      |
+---------------+----------------+
                |
                | Spring Data JPA
                v
+--------------------------------+
|         MySQL Database         |
+--------------------------------+
```

## Prerequisites

Before running the frontend, install:

- Node.js
- npm
- A code editor such as Visual Studio Code

The TeamForge backend must also be running for API-dependent features to work.

## Installation and Setup

### 1. Clone or Download the Repository

Download the repository and open the frontend project folder in a terminal.

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

### 4. Open the Application

Visit:

http://localhost:5173

The frontend communicates with the TeamForge backend, which runs locally on port `8081`.

## Backend Integration

TeamForge uses REST APIs for:

- Authentication
- Candidate management
- Skill management and verification
- Project management
- Project skill requirements
- Team assignments
- Candidate matching
- Capability gap analysis
- Team recommendations
- Automatic team formation
- Team replacement analysis

Protected API requests use JWT authentication.

**Note:** The backend must be configured and started separately.

## Build for Production

To generate a production build:

```bash
npm run build
```

The generated files are placed in the `dist` directory.

## Future Enhancements

- Advanced team optimization algorithms
- Additional reporting and analytics
- Project performance tracking
- Cloud deployment
- Exportable team analysis reports
- Integration with external skill assessment systems

## Project Information

**Project Name:** TeamForge

**Project Type:** Full Stack Java Application

**Frontend:** React + Vite

**Backend:** Java Spring Boot

**Database:** MySQL

**Purpose:** Constraint-aware skill-based team formation and project capability analysis.

## License

This project was developed for academic and educational purposes.