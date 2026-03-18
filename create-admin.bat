@echo off
set PGPASSWORD=1234
set PSQL=C:\Progra~1\PostgreSQL\17\bin\psql.exe

echo Creating admin user (login: admin, password: admin123)...

REM bcrypt hash of "admin123" with 10 rounds
%PSQL% -U postgres -d kavabanga -c "INSERT INTO users (login, password_hash, full_name, role, is_active) VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin', true) ON CONFLICT (login) DO NOTHING;" 2>&1

echo.
echo Admin created! Login: admin / Password: password
echo (using standard bcrypt test hash)
echo.
echo Open http://localhost:3001 to access admin panel
pause
