
# MS Data Viewer - Docker Deployment

## Quick Start with Docker Compose

1. Clone the repository
2. Run the application:
   ```bash
   docker-compose up -d
   ```

## EasyPanel Deployment

### Option 1: Using Docker Compose Template

1. Create a new service in EasyPanel
2. Select "Docker Compose" template
3. Upload or paste the `docker-compose.yml` content
4. Set environment variables if needed
5. Deploy

### Option 2: Manual Service Creation

1. **Create Web Service:**
   - Service Name: `ms-data-viewer-web`
   - Source: Docker Image or Build from Git
   - Port: 80
   - Build Command: `docker build -t ms-viewer .`

2. **Create MS Server Service:**
   - Service Name: `ms-data-viewer-server`
   - Source: Docker Image or Build from Git
   - Port: 8080
   - Build Command: `docker build -t ms-server ./server`

### Environment Variables

For production deployment, you may want to set:

```env
NODE_ENV=production
PYTHONUNBUFFERED=1
```

### Health Checks

The MS server includes a health check that verifies the WebSocket server is running.

### Scaling

- Web service can be scaled horizontally
- MS server should typically run as a single instance

## Development

To run locally:

```bash
# Development mode
npm run dev

# Or with Docker
docker-compose up
```

## Ports

- Web Application: Port 80
- MS WebSocket Server: Port 8080

## Notes

- The application includes a fallback to mock data if the WebSocket server is unavailable
- Supabase authentication is configured and ready for production use
- The Python server generates realistic mass spectrometry data for demonstration
