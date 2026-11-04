@echo off
cd "C:\Users\Sena\autofix\autofix-backend-fastapi"
call .venv\Scripts\activate
python -m pytest -q
echo.
echo Press any key to continue...
pause >nul