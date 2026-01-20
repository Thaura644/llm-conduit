const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let nextProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#050608',
    });

    const url = app.isPackaged
        ? 'http://localhost:3000'
        : 'http://localhost:3000';

    mainWindow.loadURL(url);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startNextServer() {
    if (app.isPackaged) {
        const serverPath = path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js');
        nextProcess = spawn('node', [serverPath], {
            cwd: path.join(process.resourcesPath, 'app', '.next', 'standalone'),
            env: { ...process.env, PORT: '3000', NODE_ENV: 'production' }
        });
    } else {
        // In dev mode, we assume the dev server is started via concurrently
    }
}

app.on('ready', () => {
    startNextServer();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
    if (nextProcess) nextProcess.kill();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Secure IPC Handlers
ipcMain.handle('get-app-data-path', () => app.getPath('userData'));

ipcMain.handle('read-file', async (event, filePath) => {
    return fs.readFileSync(filePath, 'utf-8');
});

ipcMain.handle('write-file', async (event, filePath, content) => {
    fs.writeFileSync(filePath, content);
    return true;
});
