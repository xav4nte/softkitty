const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

const preferences = require('./preferences');
const menu = require('./menu');

const server = require('./server');
let win;
require('update-electron-app')({
    repo: 'jontemalm/omnilog',
    logger: require('electron-log')
});

const createWindow = () => {
    // set timeout to render the window not until the Angular 
    // compiler is ready to show the project
    setTimeout(() => {
        // Create the browser window.
        win = new BrowserWindow({
            icon: './src/assets/o.ico',
            preload: path.join(__dirname, "preload.js"),
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                
            },

        });

        win.maximize();

        // and load the app.
        // win.loadURL(url.format({
        //     pathname: 'localhost:4200',
        //     protocol: 'http:',
        //     slashes: true
        // }));
        let pathIndex = '../app/index.html';

        if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
           // Path when running electron in local folder
          pathIndex = '../dist/index.html';
        }        
        win.loadURL(url.format({
            pathname: path.join(__dirname, pathIndex),
            protocol: 'file:',  
            slashes: true
          }));        

        // Emitted when the window is closed.
        win.on('closed', () => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            server.stop();
            win = null;
        });

        require('dns').lookup(require('os').hostname(), function (err, add, fam) {
            console.log('addr: ' + add);
            preferences.value('server.ip', add);
          })

        server.start();
    }, 10000); 
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});