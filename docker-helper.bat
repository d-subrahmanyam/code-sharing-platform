@echo off
REM Docker Compose Helper Script for Windows
REM Quick commands for managing the Code Sharing Platform containers

setlocal enabledelayedexpansion

if "%1%"=="" goto :help
if "%1%"=="help" goto :help

if "%1%"=="up" goto :up
if "%1%"=="down" goto :down
if "%1%"=="logs" goto :logs
if "%1%"=="logs-backend" goto :logs_backend
if "%1%"=="logs-frontend" goto :logs_frontend
if "%1%"=="ps" goto :ps
if "%1%"=="build" goto :build
if "%1%"=="rebuild" goto :rebuild
if "%1%"=="clean" goto :clean
if "%1%"=="psql" goto :psql
if "%1%"=="mongo" goto :mongo
if "%1%"=="shell-backend" goto :shell_backend
if "%1%"=="shell-frontend" goto :shell_frontend
if "%1%"=="health" goto :health
if "%1%"=="restart" goto :restart
if "%1%"=="stats" goto :stats

:help
cls
echo.
echo Code Sharing Platform - Docker Helper for Windows
echo.
echo Usage: docker-helper.bat [command]
echo.
echo Commands:
echo   up                 Start all services
echo   down               Stop all services
echo   logs               View logs (all services)
echo   logs-backend       View backend logs
echo   logs-frontend      View frontend logs
echo   ps                 Show container status
echo   build              Build all images
echo   rebuild            Rebuild and start fresh
echo   clean              Remove all containers, volumes, and images
echo   psql               Open PostgreSQL CLI
echo   mongo              Open MongoDB CLI
echo   shell-backend      Open backend shell
echo   shell-frontend     Open frontend shell
echo   health             Show service health status
echo   restart            Restart all services
echo   stats              Show resource usage
echo   help               Show this help message
echo.
goto :end

:up
cls
echo Starting Services...
docker-compose up -d
echo.
echo Services started!
echo.
echo Access the application at:
echo   Frontend: http://localhost
echo   Backend: http://localhost:8080/api
echo   GraphQL: http://localhost:8080/api/graphiql
echo.
goto :end

:down
cls
echo Stopping Services...
docker-compose down
echo Services stopped!
goto :end

:logs
cls
docker-compose logs -f
goto :end

:logs_backend
cls
docker-compose logs -f backend
goto :end

:logs_frontend
cls
docker-compose logs -f frontend
goto :end

:ps
cls
docker-compose ps
goto :end

:build
cls
echo Building Images...
docker-compose build
echo Images built!
goto :end

:rebuild
cls
echo Rebuilding and Starting...
docker-compose down -v
docker-compose up -d --build
echo Services rebuilt and started!
goto :end

:clean
cls
echo Cleaning Up...
docker-compose down -v --rmi all
echo All containers, volumes, and images removed!
goto :end

:psql
cls
docker-compose exec postgres psql -U postgres -d code_sharing_platform
goto :end

:mongo
cls
docker-compose exec mongodb mongosh
goto :end

:shell_backend
cls
docker-compose exec backend sh
goto :end

:shell_frontend
cls
docker-compose exec frontend sh
goto :end

:health
cls
echo Service Health Status:
docker-compose ps --format "table {{.Service}}\t{{.Status}}"
goto :end

:restart
cls
echo Restarting Services...
docker-compose restart
echo Services restarted!
goto :end

:stats
cls
docker-compose stats
goto :end

:end
