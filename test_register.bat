@echo off
curl.exe -s -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d @register.json