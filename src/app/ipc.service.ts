import { Injectable } from '@angular/core';
import { IpcRenderer } from 'electron';

@Injectable()
export class IpcService {
  private _ipc: IpcRenderer | undefined = void 0;

  constructor() {
    if (window.require) {
      try {
        this._ipc = window.require('electron').ipcRenderer;
      } catch (e) {
        throw e;
      }
    } else {
      console.warn('Electron\'s IPC was not loaded');
    }
  }

  public on(channel: string, listener: any): void {
    if (!this._ipc) {
      return;
    }
    this._ipc.on(channel, listener);
  }

  public removeAllListeners(channel: string): void {
    if (!this._ipc) {
      return;
    }
    this._ipc.removeAllListeners(channel);
  }

  public send(channel: string, ...args): any {
    if (!this._ipc) {
      return;
    }

    console.log('sending', channel);
    return this._ipc.sendSync(channel, ...args);
  }

}