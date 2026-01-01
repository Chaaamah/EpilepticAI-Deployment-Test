# EpilepticAI-web

Frontend for the EpilepticAI project. This repository contains the web UI and a Docker Compose setup to build and run the frontend container.

## Prerequisites

- Docker
- Docker Compose (if your Docker installation does not include it)
- (Optional, for local development) Node.js and npm
  
## Quick start (recommended)

Run the frontend using Docker Compose from the repository root:

```bash
docker-compose up --build
```

The service maps port 3000 in the container to port 3101 on the host by default. Open http://localhost:3101.

Docker Compose file:
c:\Users\microsoft\OneDrive\Desktop\Studies\3ACI\Projet_Logiciel\EpilepticAI-web\docker-compose.yml

## Local development

If you prefer to run locally without Docker:

1. Install dependencies:
   - npm: `npm install`
   - 
2. Start the development server:
   - npm: `npm run dev`

The dev server typically runs on port 3000 (adjust environment/ports as needed).

## Build (production)

To build a production image with Docker:

```bash
docker build -t epilpticai_frontend .
```

Or with Docker Compose:

```bash
docker-compose build
docker-compose up -d
```

## Contributing

- Fork the repo, create a branch per feature/fix, and open a pull request.
- Keep changes small and focused. Add brief PR descriptions and any testing notes.

