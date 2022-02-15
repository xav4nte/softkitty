const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const { autoUpdater } = require('electron-updater');
const logger = require('electron-log');
const preferences = require('./preferences');
const server = require('./server');

let win;

const createWindow = () => {
    // set timeout to render the window not until the Angular 
    // compiler is ready to show the project
    setTimeout(() => {
        // Create the browser window.
        win = new BrowserWindow({
            icon: './src/assets/o.ico',
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                
            },

        });

        win.maximize();

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

        win.once('ready-to-show', () => {
            autoUpdater.checkForUpdatesAndNotify();
          });

          autoUpdater.on('update-available', () => {
            logger.log('update available');
            win.webContents.send('update_available');
        });
        autoUpdater.on('update-downloaded', () => {
            logger.log('update downloaded');
            win.webContents.send('update_downloaded');
        });  

        win.webContents.session.setCertificateVerifyProc((request, callback) => {
            callback(0);
        })          
          
        require('dns').lookup(require('os').hostname(), function (err, add, fam) {
            console.log('addr: ' + add);
            preferences.value('server.ip', add);
          })


        win.webContents.once('dom-ready', () => {
            win.webContents.send('app_version', app.getVersion());
        });

        setInterval(() =>{
            win.webContents.send('server_status', server.running());
        }, 5000);        

        server.start();
    }, 10000); 


}

var menu = Menu.buildFromTemplate([
    {
        label: 'Menu',
        submenu: [
            {label:'Preferences', click(){
                preferences.show();

            }},
            {label:'Preferences (JSON)', click(){
                console.log('sending event')
                app.emit('raw_preferences');
                BrowserWindow.getAllWindows[0].webContents.send('raw_preferences');
                ipcMain.emit('raw_preferences');
            }},
            {role:'quit'},
            {label: 'Check For Updates', click(){
                autoUpdater.checkForUpdatesAndNotify();
            }}
        ],
        
    },
    {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ]
      },  
    //   {
    //       label: 'Log reciever',
    //       submenu:[
    //           {
    //             label: 'Start server', click(){
    //                 server.start();
    //             }
    //         },
    //         {
    //             label: 'Stop server', click(){
    //                 server.stop();
    //             }
    //         }            
    //       ]
    //   }  
])
Menu.setApplicationMenu(menu);

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


ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
  });