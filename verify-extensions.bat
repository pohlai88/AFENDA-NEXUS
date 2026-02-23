@echo off
echo Verifying VS Code extensions for AFENDA-NEXUS project...
echo.

echo Checking required extensions:
echo.

echo 1. Prettier - Code formatter...
code --list-extensions | findstr "esbenp.prettier-vscode" >nul
if %errorlevel%==0 echo    ✅ INSTALLED
if %errorlevel%==1 echo    ❌ MISSING

echo 2. ESLint...
code --list-extensions | findstr "dbaeumer.vscode-eslint" >nul
if %errorlevel%==0 echo    ✅ INSTALLED
if %errorlevel%==1 echo    ❌ MISSING

echo 3. TypeScript Importer...
code --list-extensions | findstr "ms-vscode.vscode-typescript-next" >nul
if %errorlevel%==0 echo    ✅ INSTALLED
if %errorlevel%==1 echo    ❌ MISSING

echo 4. Tailwind CSS IntelliSense...
code --list-extensions | findstr "bradlc.vscode-tailwindcss" >nul
if %errorlevel%==0 echo    ✅ INSTALLED
if %errorlevel%==1 echo    ❌ MISSING

echo 5. YAML Language Support...
code --list-extensions | findstr "redhat.vscode-yaml" >nul
if %errorlevel%==0 echo    ✅ INSTALLED
if %errorlevel%==1 echo    ❌ MISSING

echo.
echo Verification complete!
echo.
echo Next steps:
echo 1. Restart VS Code if you just installed extensions
echo 2. Open a YAML or Markdown file to test auto-formatting
echo 3. Check that files format on save automatically
pause
