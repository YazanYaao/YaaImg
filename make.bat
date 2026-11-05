@echo off
setlocal

set TARGET=%1
if "%TARGET%"=="" set TARGET=help

if /i "%TARGET%"=="help" goto help
if /i "%TARGET%"=="build" goto build
if /i "%TARGET%"=="up" goto up
if /i "%TARGET%"=="down" goto down
if /i "%TARGET%"=="logs" goto logs
if /i "%TARGET%"=="restart" goto restart
if /i "%TARGET%"=="shell" goto shell
if /i "%TARGET%"=="health" goto health
if /i "%TARGET%"=="clean" goto clean
if /i "%TARGET%"=="dev" goto dev
if /i "%TARGET%"=="dev-backend" goto dev_backend
if /i "%TARGET%"=="dev-frontend" goto dev_frontend
if /i "%TARGET%"=="lint" goto lint
if /i "%TARGET%"=="test" goto test
if /i "%TARGET%"=="db-link" goto db_link
if /i "%TARGET%"=="db-push" goto db_push
if /i "%TARGET%"=="db-reset" goto db_reset
if /i "%TARGET%"=="db-studio" goto db_studio

echo Unknown target: %TARGET%
goto help

:help
echo ========================================================================
echo   YaaImg Project - Make Commands (Windows)
echo ========================================================================
echo   Docker Commands:
echo     make build        - Build Docker images
echo     make up           - Build and start all containers in background
echo     make down         - Stop and remove containers
echo     make logs         - Tail real-time container logs
echo     make restart      - Restart containers
echo     make shell        - Open a shell inside the backend API container
echo     make health       - Check backend API and container health
echo     make clean        - Stop containers and remove images/volumes
echo.
echo   Local Development:
echo     make dev          - Show instructions for local dev
echo     make dev-backend  - Run ASP.NET Core backend locally (:5000)
echo     make dev-frontend - Run Next.js frontend locally (:3000)
echo.
echo   Quality ^& Testing:
echo     make lint         - Run linters for backend and frontend
echo     make test         - Run backend unit/integration tests
echo.
echo   Database (Supabase):
echo     make db-link      - Link project to Supabase Cloud
echo     make db-push      - Push all migrations to Supabase Cloud
echo     make db-reset     - Reset and re-apply local database migrations
echo     make db-studio    - Show Supabase Dashboard URL
echo ========================================================================
goto end

:build
docker compose build
goto end

:up
docker compose up --build -d
goto end

:down
docker compose down
goto end

:logs
docker compose logs -f
goto end

:restart
docker compose restart
goto end

:shell
docker exec -it yaaimg-api sh
goto end

:health
echo === API Health ===
curl -s http://localhost:5000/health
echo.
echo === Container Status ===
docker compose ps
goto end

:clean
docker compose down --rmi all --volumes --remove-orphans
goto end

:dev
echo ============================================
echo   YaaImg Local Development
echo ============================================
echo   Terminal 1 - Backend:
echo     cd apps/api/src/YaaImg.Api ^&^& dotnet run
echo     -^> http://localhost:5000/swagger
echo     -^> http://localhost:5000/health
echo.
echo   Terminal 2 - Frontend:
echo     cd apps/web ^&^& npm run dev
echo     -^> http://localhost:3000
echo.
echo   Database Dashboard:
echo     -^> https://supabase.com/dashboard/project/ftsefelopcyvncxdeilf
echo ============================================
goto end

:dev_backend
cd apps\api\src\YaaImg.Api && dotnet run
goto end

:dev_frontend
cd apps\web && npm run dev
goto end

:lint
echo === Linting Backend ===
cd apps\api\src && dotnet build --no-restore -warnaserror
echo.
echo === Linting Frontend ===
cd apps\web && npx next lint
goto end

:test
cd apps\api\src && dotnet test
goto end

:db_link
npx supabase link --project-ref ftsefelopcyvncxdeilf
goto end

:db_push
npx supabase db push
goto end

:db_reset
npx supabase db reset
goto end

:db_studio
echo Opening Supabase Dashboard...
echo -> https://supabase.com/dashboard/project/ftsefelopcyvncxdeilf
goto end

:end
