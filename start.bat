@echo off
setlocal

if exist node_modules (
    echo node_modules encontrado. Executando ts-node...
    npx ts-node src/index.ts
) else (
    echo node_modules não encontrado. Instalando dependências...
    npm install
    echo Executando ts-node...
    npx ts-node src/index.ts
)

endlocal
