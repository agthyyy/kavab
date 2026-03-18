@echo off
set PSQL=C:\Progra~1\PostgreSQL\17\bin\psql.exe

echo Trying to connect to PostgreSQL...
echo Please enter your postgres user password when prompted.
echo.

%PSQL% -U postgres -c "CREATE DATABASE kavabanga;" 2>&1
if %errorlevel% neq 0 (
  echo.
  echo If database already exists, that is OK.
  echo If authentication failed - run this manually:
  echo   psql -U postgres -c "CREATE DATABASE kavabanga;"
)

echo.
echo Done!
pause
