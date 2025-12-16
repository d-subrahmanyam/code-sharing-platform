# Docker Scripts

This directory contains helper scripts for managing Docker containers for the Code Sharing Platform.

## Available Scripts

### restart-docker.sh (Bash/Linux/Mac)

Restarts all Docker containers with detailed console logging.

**Usage:**
```bash
chmod +x restart-docker.sh
./restart-docker.sh
```

**Features:**
- Stops all running containers gracefully
- Starts containers in correct order
- Waits for services to initialize
- Performs health checks on frontend and backend
- Generates detailed logs in `docker-restart.log`
- Color-coded console output for easy reading

**Output:**
- Colored console logs with timestamps
- Service status verification
- Health check results
- Logs saved to `../docker-restart.log`

### restart-docker.ps1 (PowerShell)

PowerShell version for Windows environments.

**Usage:**
```powershell
# On first run, may need to allow script execution:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then run:
.\restart-docker.ps1
```

**Features:**
- All features of the Bash version
- Cross-platform compatibility (Windows, macOS, Linux)
- PowerShell-style error handling
- Optional `-NoLogs` flag to skip file logging

**Options:**
```powershell
.\restart-docker.ps1 -NoLogs  # Run without logging to file
```

## Log Files

Both scripts generate logs to:
```
./docker-restart.log
```

This file contains detailed information about each restart attempt, including:
- Timestamp of each operation
- Container status changes
- Health check results
- Any warnings or errors

## Troubleshooting

### Containers won't start
1. Check Docker is running: `docker ps`
2. Check available disk space
3. Check logs: `cat docker-restart.log` (Linux/Mac) or `Get-Content docker-restart.log` (PowerShell)

### Port already in use
- Default ports: 80 (frontend), 8080 (backend), 5432 (postgres), 27017 (mongodb)
- Check what's using these ports and stop the service, or modify `docker-compose.yml`

### Services not healthy after restart
- Wait a few more seconds (especially PostgreSQL)
- Check container logs: `docker-compose logs <service-name>`

## Manual Operations

### Stop all containers
```bash
docker-compose down
```

### Start all containers
```bash
docker-compose up -d
```

### View container logs
```bash
docker-compose logs -f <service-name>
```

### Rebuild images
```bash
docker-compose build --no-cache
```
