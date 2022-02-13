const { app, Menu } = require('electron')
const server = require('./server');
const preferences = require('./preferences');
const { autoUpdater } = require('electron-updater');

const isMac = process.platform === 'darwin'
var menu = Menu.buildFromTemplate([
    {
        label: 'Menu',
        submenu: [
            {label:'Preferences', click(){
                preferences.show();

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
// const template = [
//   // { role: 'appMenu' }
//   ...(isMac ? [{
//     label: app.name,
//     submenu: [
//       { role: 'about' },
//       { type: 'separator' },
//       { role: 'services' },
//       { type: 'separator' },
//       { role: 'hide' },
//       { role: 'hideOthers' },
//       { role: 'unhide' },
//       { type: 'separator' },
//       { role: 'quit' }
//     ]
//   }] : []),
//   // { role: 'fileMenu' }
//   {
//     label: 'File',
//     submenu: [
//       isMac ? { role: 'close' } : { role: 'quit' }
//     ]
//   },
//   // { role: 'editMenu' }
//   {
//     label: 'Edit',
//     submenu: [
//       { role: 'undo' },
//       { role: 'redo' },
//       { type: 'separator' },
//       { role: 'cut' },
//       { role: 'copy' },
//       { role: 'paste' },
//       ...(isMac ? [
//         { role: 'pasteAndMatchStyle' },
//         { role: 'delete' },
//         { role: 'selectAll' },
//         { type: 'separator' },
//         {
//           label: 'Speech',
//           submenu: [
//             { role: 'startSpeaking' },
//             { role: 'stopSpeaking' }
//           ]
//         }
//       ] : [
//         { role: 'delete' },
//         { type: 'separator' },
//         { role: 'selectAll' }
//       ])
//     ]
//   },
//   // { role: 'viewMenu' }
//   {
//     label: 'View',
//     submenu: [
//       { role: 'reload' },
//       { role: 'forceReload' },
//       { role: 'toggleDevTools' },
//       { type: 'separator' },
//       { role: 'resetZoom' },
//       { role: 'zoomIn' },
//       { role: 'zoomOut' },
//       { type: 'separator' },
//       { role: 'togglefullscreen' },
//       { role: 'test' }
//     ]
//   },
//   // { role: 'windowMenu' }
//   {
//     label: 'Window',
//     submenu: [
//       { role: 'minimize' },
//       { role: 'zoom' },
//       ...(isMac ? [
//         { type: 'separator' },
//         { role: 'front' },
//         { type: 'separator' },
//         { role: 'window' }
//       ] : [
//         { role: 'close' }
//       ])
//     ]
//   },
//   {
//     role: 'help',
//     submenu: [
//       {
//         label: 'Learn More',
//         click: async () => {
//           const { shell } = require('electron')
//           await shell.openExternal('https://electronjs.org')
//         }
//       }
//     ]
//   }
// ]

// const menu = Menu.buildFromTemplate(template)
// Menu.setApplicationMenu(menu)