const electron = require('electron');
const { contextBridge } = electron;
const { ipcRenderer } = electron;

document.onreadystatechange = function () {
    console.log('ready')
    if (document.readyState == "complete") {
      const $ = require('jquery');
      // Do things with $
    }
  }

  contextBridge.exposeInMainWorld('api', {
    showPreferences: () => {
  
      ipcRenderer.send('showPreferences');
  
    },
    getPreferences: () => ipcRenderer.sendSync('getPreferences'),
    onPreferencesChanged: handler => {
  
      onPreferencesChangedHandler = handler;
  
    },
  }); 