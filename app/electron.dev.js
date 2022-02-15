const { app, BrowserWindow, Menu } = require('electron');
const fs = require('fs');
const url = require('url');
const preferences = require('./preferences');
const { autoUpdater, UpdateDownloadedEvent } = require('electron-updater');
const logger = require('electron-log');
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
                devTools: true,            
            },

        });

        win.webContents.openDevTools();

        win.maximize();

        // and load the app.
        win.loadURL(url.format({
            pathname: 'localhost:4200',
            protocol: 'http:',
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

          autoUpdater.on('update-available', (info) => {
            logger.log('update available');
            win.webContents.send('update_available', info.version);
        });
        autoUpdater.on('update-downloaded', (info) => {
            logger.log('update downloaded');
            win.webContents.send('update_downloaded', info.releaseNotes);
        }); 

        win.webContents.session.setCertificateVerifyProc((request, callback) => {
            callback(0);
        })           

        require('dns').lookup(require('os').hostname(), function (err, add, fam) {
            preferences.value('server.ip', add);
          })

        server.start();

        win.webContents.once('dom-ready', () => {
            console.log('sending version');
            win.webContents.send('app_version', app.getVersion());
            win.webContents.send('server_status', server.running());
            console.log('sent version');
        });

        setInterval(() =>{
            console.log('sending status');
            win.webContents.send('server_status', server.running());
            console.log('sent status');
            autoUpdater.checkForUpdatesAndNotify();
        }, 60000)

        logger.log('ds', preferences.dataStore);


     
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
                win.webContents.send('raw_preferences');
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


