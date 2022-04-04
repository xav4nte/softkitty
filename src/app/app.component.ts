import { Component, OnInit } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { catchError, switchAll } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { IpcService } from './ipc.service';
import { HttpClient  } from '@angular/common/http';
import { IpcRendererEvent } from 'electron';
import * as moment from 'moment';
import { 
  SETTING_LEVELS,
  SETTING_HOSTS,
  SETTING_REVERSE,
  SETTING_REGEXINCLUDE,
  SETTING_REGEXES,
  SETTING_FONTFAMILY,
  SETTING_FONTSIZE
 } from './constants.js'

declare var $: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'log-client';
  private _socket: WebSocketSubject<any>;
  private _messagesSubject = new Subject();
  private _preferences = null;

  public messages = this._messagesSubject.pipe(switchAll(), catchError(e => { throw e }));
  public incrementer = 1;
  public logs: ILog[] = [];
  public allLogs = [];
  public currentLog = null
  public hosts = [];
  public levels = [];
  public autoReload = true;
  public filterString = '';
  public reverse = true;
  public regexInclude = true;
  public regexes = [];
  public ipAddress = null;
  public listeningPort = 9999;
  public serverAddress = '';
  public appVersion = '0.0.0';
  public serverRunning = true;
  
  public generalSettings = {
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: '16px'
  }

  constructor(private _ipc: IpcService){
    this.connect();
    this._preferences = _ipc.send('getPreferences');

    this.levels = this._preferences[SETTING_LEVELS] || [];
    this.hosts = this._preferences[SETTING_HOSTS] || [];
    this.reverse = this._preferences[SETTING_REVERSE] ?? true;
    this.regexInclude = this._preferences[SETTING_REGEXINCLUDE] ?? true;
    this.regexes = this._preferences[SETTING_REGEXES] || [];
    this.generalSettings.fontFamily = this._preferences[SETTING_FONTFAMILY];
    this.generalSettings.fontSize = this._preferences[SETTING_FONTFAMILY];

    this.listeningPort = this._preferences.server.listeningport || 9999;
    this.ipAddress = this._preferences.server.ip || '127.0.0.1';

    this.serverAddress = 'udp://' + this.ipAddress + ':' + this.listeningPort;
    _ipc.on('preferencesUpdated', (e, preferences) => {
      this.listeningPort = preferences.server.listeningport;
      this.serverAddress = 'udp://' + this.ipAddress + ':' + this.listeningPort;
      this.generalSettings.fontFamily = preferences.general.fontfamily;
      this.generalSettings.fontSize = preferences.general.fontsize;
    });
  }

  ngOnInit(): void {
    const notification = document.getElementById('notification');
    const message = document.getElementById('message');
    const restartButton = document.getElementById('restart-button');
    $('#json-preferences-content').html(JSON.stringify(this._preferences, null, 2))

    this._ipc.on('update_available', (x, version) => {
      this._ipc.removeAllListeners('update_available');
      console.log('update_available', version);
      message.innerText = 'A new update (' + version + ') is available. Downloading now...';
      notification.classList.remove('hidden');
    });
    this._ipc.on('update_downloaded', (x, releaseNotes) => {
      this._ipc.removeAllListeners('update_downloaded');
      console.log('update_downloaded', releaseNotes);
      message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?\n' + releaseNotes;
      restartButton.classList.remove('hidden');
      notification.classList.remove('hidden');
    });
    
    this._ipc.on('app_version', (event: IpcRendererEvent, version) => {
      this.appVersion = version;
    });

    this._ipc.on('raw_preferences', (event: IpcRendererEvent) => {
      console.log('got event')
      $('#rawPreferencesModal').modal('show');
    });
    
    this._ipc.on('server_status', (event: IpcRendererEvent, status: boolean) => {
      this.log('Got server status: ' + status);
      this.serverRunning = status;
    });



    $('body').on('keyup', (e) =>{
      console.log(e);
      if ($('.modal:visible').length > 0){
        return;
      }
      if (e.originalEvent.ctrlKey){
        return;
      }
      this.keyboardShortcuts(e.originalEvent.code);
    })
  }

  keyboardShortcuts(key){
    switch(key){
      case 'KeyC':
        $('#menu').collapse('toggle');
        break;
      case 'KeyS':
        $('#filtermodal').modal('show');
        break;
      case 'KeyR':
        $('#regexmodal').modal('show');
        break;
      }

  }
  closeNotification() {
    const notification = document.getElementById('notification');
    notification.classList.add('hidden');
  }
  restartApp() {
    this._ipc.send('restart_app');
  }

  //#region view methods
  public enabledRegexes(){
    return this.regexes.filter((r) =>{
      return r.enabled;
    }).length;
  }

  public enabledHosts(){
    return this.hosts.filter((r) =>{
      return r.enabled;
    }).length;
  }

  public enabledProcesses(){
    let enabledHosts = this.hosts.filter((r) =>{
      return r.enabled;
    });

    let count = 0;
    enabledHosts.forEach((host) =>{
      count += host.processes.filter((p) =>{
        return p.enabled && !p.disabled;
      }).length;
    })

    return count;
  }

  public closeRawConfig(): void{
    $('#json-preferences').hide();
  }

  public saveRawConfig(): void{
    // todo: error handling
    let config = JSON.parse($('#json-preferences-content').text());
    if (config){
      this._ipc.send('setPreferences', config);
    }
  }

  public toggleAutoReload(): void{
    this.autoReload = !this.autoReload;
  }

  private saveSettings(name: string, value: any){
    this._preferences[name] = value;
    this._ipc.send('setPreferences', this._preferences);
  }

  public toggleLevel(level: any): void{
    level.enabled = !level.enabled;
    this.saveSettings(SETTING_LEVELS, this.levels);
  }

  public toggleReverse(): void{
    this.reverse = !this.reverse;
    this.saveSettings(SETTING_REVERSE, this.reverse);
  }

  public changeColor(level: any, data: any): void{
    level.color = data;
    this.saveSettings(SETTING_LEVELS, this.levels);
  }

  public toggleHost(host: any,event: Event): void{
    let element = $(event.target as Element).closest('h4').next();
    host.enabled = !host.enabled;
    host.processes.forEach(p =>{
      p.disabled = !host.enabled;
    })

    if (host.enabled){
      element.show();
    }else{
      element.hide();
    }
    this.saveSettings(SETTING_HOSTS, this.hosts);
  }

  public toggleProcess(process: any): void{
    process.enabled = !process.enabled;
    this.saveSettings(SETTING_HOSTS, this.hosts);
  }

  public clear(): void{
    this.currentLog = null;
    this.logs = [];
  }

  public toggleRegexInclude(): void{
    this.regexInclude = !this.regexInclude;
    this.saveSettings(SETTING_REGEXINCLUDE, this.regexInclude);
  }
  public addRegex(): void{
    let value = $('#regex').val();
    this.regexes.push({enabled: true, regex: value});
    this.saveSettings(SETTING_REGEXES, this.regexes);
  }

  public removeRegex(regex): void{
    this.regexes.splice(this.regexes.indexOf(regex), 1);
    this.saveSettings(SETTING_REGEXES, this.regexes);
  }

  public toggleRegex(regex): void{
    regex.enabled = !regex.enabled;
    this.saveSettings(SETTING_REGEXES, this.regexes);
  }

  public clearFilter(): void{
    $('#filter').val('');
    this.filterString = '';
    this.logs = this.allLogs;
  }

  public filter(event): void{
    this.filterString = event.target.value;
    if (!this.filterString.length){
      this.logs = this.allLogs;
    }
    this.logs = this.allLogs.filter(log =>{
      return log.message.toString().toLowerCase().indexOf(this.filterString.toLowerCase()) > -1;
    });
    
  }
  //#endregion
  
  // Connect to websocket and start listening
  private connect(): void {
    if (!this._socket || this._socket.closed) {
      this._socket = this.getNewWebSocket();

      this._socket.subscribe((msg: ILog) =>{
        this.addLog(msg);
      });
    }
  }

  // recieve log
  private addLog(msg: ILog){
    if (!this.autoReload) return;

    if (!msg.host || !msg.process){
      return;
    }

    let level = this.levels.find((l) =>{
      return l.name.toLowerCase() === msg.level.toLowerCase();
    });


    if (!level){
      let color = '#ffffff';
      switch(msg.level){
        case 'DEBUG':
          color = '#ffffe0';
          break;
        case 'INFO':
          color = '#ADD8E6';
          break;
        case 'WARNING':
          color = '#FFA500';
          break;
        case 'ERROR':
          color = '#ff4500';
          break;
      }
      level = {name: msg.level, enabled: true, color};
      this.levels.push(level);
    }


    let host: any = this.hosts.find((h) =>{
      return h.host === msg.host;
    });

    if (!host){
      host = {host: msg.host, enabled: true, processes: [{name: msg.process, enabled: true}]};
      this.hosts.push(host);
    }else{
      if (!host.enabled){
        return;
      }
      let process = host.processes.filter((process) =>{
        return process.name === msg.process;
      })
      if (!process.length){
        host.processes.push({name: msg.process, enabled: host.enabled, disabled: false});
        host.processes = host.processes.sort((a, b) =>{
          return a.name > b.name ? 1 : -1;
        })
      }
    }

    var process = host.processes.find((p) =>{
      return p.name.trim() == msg.process.trim();
    });

    if (!process.enabled || !level.enabled){
      return;
    }

    if (this.regexInclude && this.regexes.length){
      let isOk = false;
      this.regexes.forEach((regex) =>{
        if (regex.enabled){
          let re = new RegExp(regex.regex);
          if (re.test(msg.message)){
            isOk = true;
          }  
        }
      });
      if (!isOk){
        return;
      }
    }

    if (!this.regexInclude && this.regexes.length){
      let isOk = true;
      this.regexes.forEach((regex) =>{
        if (regex.enabled){
          let re = new RegExp(regex.regex);
          if (re.test(msg.message)){
            isOk = false;
          }

        }

      });
      if (!isOk){
        return;
      }

    }

    msg.id = this.incrementer;
    msg.exception = $('<div>').html(msg.exception).text();
    msg.levelObject = level;
    msg.message = $('<div>').html(msg.message).text();
    if (!this.filterString || (msg.message && msg.message.toString().toLowerCase().indexOf(this.filterString.toLowerCase()) > -1)){
      if (this.logs.length > 1000){
        this.logs.shift();
      }
      this.logs.push(msg);  
      if (!this.reverse){
        $('.top-panel').get(0).scrollTo(0,$('.top-panel').get(0).scrollHeight);
      }
    }

    if (this.allLogs.length > 1000){
      this.allLogs.shift();
    }

    this.allLogs.push(msg);
    this.incrementer++;
  }
  
  private getNewWebSocket() {
    return webSocket('ws://127.0.0.1:8088/');
  }
  sendMessage(msg: any) {
    this._socket.next(msg);
  }
  close() {
    this._socket.complete(); 
  }  

  details(id: number){
    this.currentLog = null;
    let log = this.logs.find((log) =>{  
      return log.id == id;
    });

    if (log){      
      this.currentLog = log;

      window.setTimeout(() =>{
        //$('#stacktrace').netStack();
      }, 500)
    }

  }

  log(msg: string){
    // let level = this.levels.filter((lvl) =>{
    //   lvl.name == 'INFO'
    // });
    // this.addLog({
    //   host: 'OmniLog',
    //   level: 'INFO',
    //   process: 'OmniLog',
    //   message: msg,
    //   timestamp: moment().format('hh:mm:ss'),
    //   levelObject: level
    // })
  }
}

export interface ILog{
  exception?: string;
  host: string;
  id?: number;
  level: string;
  message: string;
  process: string;
  timestamp: string;
  levelObject?: any;
}

