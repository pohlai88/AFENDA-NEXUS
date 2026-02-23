@echo off
echo Installing VS Code extensions for AFENDA-NEXUS project...
echo.

echo 1. Installing Prettier - Code formatter...
code --install-extension esbenp.prettier-vscode

echo 2. Installing ESLint...
code --install-extension dbaeumer.vscode-eslint

echo 3. Installing TypeScript Importer...
code --install-extension ms-vscode.vscode-typescript-next

echo 4. Installing Tailwind CSS IntelliSense...
code --install-extension bradlc.vscode-tailwindcss

echo 5. Installing JSON Tools...
code --install-extension ms-vscode.vscode-json

echo.
echo All extensions installed successfully!
echo Please restart VS Code to ensure all extensions are loaded properly.
pause
