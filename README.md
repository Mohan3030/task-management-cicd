# Task Management System – CI/CD on AWS

A full-stack Task Management application built with React, Node.js, Express, and PostgreSQL, with an automated CI/CD pipeline using GitHub Actions and AWS.

**Live Application:** https://mytaskman.duckdns.org

## Overview

This project demonstrates an end-to-end software development and deployment workflow:

- Build a full-stack application with a REST API.
- Containerize services using Docker.
- Run automated linting, builds, and tests through GitHub Actions.
- Push Docker images to Amazon ECR.
- Deploy automatically to AWS EC2 using GitHub Actions, OIDC, and AWS Systems Manager.
- Configure HTTPS using Let's Encrypt.
- Perform automated database backups and test database restoration.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Nginx |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | AWS EC2, ECR, IAM, SSM |
| Security | GitHub OIDC, HTTPS, Let's Encrypt |
| Backup | PostgreSQL pg_dump, cron |

## Application Features

- Create, view, update, and delete tasks.
- Manage task statuses: PENDING, IN_PROGRESS, COMPLETED.
- Assign priorities: LOW, MEDIUM, HIGH.
- RESTful backend API.
- PostgreSQL database persistence.
- Health-check endpoint with database connectivity status.

## Architecture

The application follows a three-tier architecture:

1. **Frontend:** React application served through Nginx.
2. **Backend:** Express REST API handling application logic.
3. **Database:** PostgreSQL storing task information.

Nginx serves the frontend, terminates HTTPS, and proxies API requests to the backend. The backend communicates with PostgreSQL over the internal Docker network.

## CI/CD Pipeline

GitHub Actions automates the integration and deployment process.

### Continuous Integration

Triggered on pushes and pull requests to the main branch.

- Install frontend and backend dependencies.
- Run lint checks.
- Build the frontend.
- Run frontend tests.
- Run backend tests using PostgreSQL.
- Validate database migrations.

**Current test coverage:** 22 automated tests (10 frontend and 12 backend).

### Continuous Deployment

Triggered by pushes to the main branch or manual workflow execution.

1. Authenticate with AWS using GitHub OIDC.
2. Build frontend and backend Docker images.
3. Push images to Amazon ECR.
4. Connect to EC2 through AWS Systems Manager.
5. Pull the new images and deploy using Docker Compose.
6. Run an application health check.
7. Restore the previous deployment configuration if deployment fails.

## AWS Infrastructure

The application is deployed on AWS in the Mumbai region (`ap-south-1`).

- **EC2:** Ubuntu 24.04 LTS on a `t4g.small` instance.
- **ECR:** Stores backend and frontend Docker images.
- **IAM:** Uses restricted roles and policies for deployment and image access.
- **SSM:** Enables deployment commands without exposing SSH to GitHub Actions.
- **Security Group:** Allows public HTTP/HTTPS traffic and restricts SSH access.
- **HTTPS:** Let's Encrypt SSL certificate with automated renewal.

## Database Backup and Recovery

- Automated PostgreSQL backups using `pg_dump`.
- Daily scheduled backup through cron.
- Backup files stored with restricted permissions.
- Automatic cleanup of backups older than the retention period.
- Database restoration tested using a separate temporary database.

**Note:** Current backups are stored on the EC2 instance. They protect against certain database-level failures but are not an off-instance disaster-recovery solution.

## Local Development

### Prerequisites

- Git
- Docker
- Docker Compose

### Run the application

```bash
git clone https://github.com/Mohan3030/task-management-cicd.git
cd task-management-cicd
```

Create your local environment file using the example:

```bash
cp .env.example .env
```

Configure the required environment variables in `.env`, then start the application:

```bash
docker compose up --build -d
```

Access the application:

- Frontend: http://localhost:8080
- Backend API: http://localhost:5001
- Health check: http://localhost:5001/api/health

Stop local services:

```bash
docker compose down
```

## Documentation

Detailed technical documentation is available in the `docs/` directory.

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | Application architecture and component interactions |
| [CI/CD Pipeline](docs/cicd-pipeline.md) | GitHub Actions, OIDC, ECR, and automated deployment |
| [AWS Infrastructure](docs/aws-infrastructure.md) | AWS resources, IAM, networking, and security |
| [Deployment and Backup](docs/deployment-and-backup.md) | Deployment, rollback, SSL, backup, and recovery |

## Repository Structure

```text
task-management-cicd/
├── frontend/
├── backend/
├── deploy/
│   └── deploy.sh
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── docs/
│   ├── architecture.md
│   ├── cicd-pipeline.md
│   ├── aws-infrastructure.md
│   └── deployment-and-backup.md
├── compose.yaml
├── .env.example
└── README.md
```

## Key Engineering Practices

- Automated CI/CD using GitHub Actions.
- Docker-based application deployment.
- AWS IAM least-privilege access.
- GitHub OIDC authentication instead of long-lived AWS credentials in GitHub.
- Private communication between application services.
- HTTPS and security headers.
- Non-root backend container execution.
- Database backups and tested restoration.
- Health checks and deployment rollback procedures.

## Future Improvements

- Off-instance backup storage.
- Centralized monitoring and alerting.
- Automated security and dependency scanning.
- Infrastructure as Code using Terraform.

---

**Author:** Mohan K  
**Repository:** https://github.com/Mohan3030/task-management-cicd  
**Live Application:** https://mytaskman.duckdns.org