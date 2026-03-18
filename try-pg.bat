@echo off
set PSQL=C:\Progra~1\PostgreSQL\17\bin\psql.exe

for %%p in (postgres admin 123456 password 1234 root kavabanga "") do (
  set PGPASSWORD=%%p
  %PSQL% -U postgres -w -c "SELECT 1" >nul 2>&1
  if not errorlevel 1 (
    echo SUCCESS: password is [%%p]
    goto :found
  )
)
echo None of the common passwords worked.
echo Please run manually: psql -U postgres
goto :end

:found
%PSQL% -U postgres -c "CREATE DATABASE kavabanga;" 2>&1
%PSQL% -U postgres -c "CREATE DATABASE kavabanga_test;" 2>&1
echo Databases created!

:end
pause
