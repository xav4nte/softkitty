import { Component } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { catchError, tap, switchAll } from 'rxjs/operators';
import { EMPTY, observable, Subject } from 'rxjs';
import { IpcService } from './ipc.service';
//import * as server from '../server.js';
import { HttpClient  } from '@angular/common/http';

//import * as settings from 'electron-app-settings';
// import { ipcMain } from 'electron';
// const preferences = ipcMain.sendSync('getPreferences');

const SETTING_LEVELS = 'log.levels';
const SETTING_HOSTS = 'log.hosts';
const SETTING_REVERSE = 'log.reverse';
const SETTING_REGEXINCLUDE = 'log.regexinclude';
const SETTING_REGEXES = 'log.regexes';
//const SETTING_FONTSIZE = 'log.fontsize';
const SETTING_FONTFAMILY = 'general.fontfamily';
const SETTING_FONTSIZE = 'general.fontsize';

declare var $: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'log-client';
  private socket$: WebSocketSubject<any>;
  private messagesSubject$ = new Subject();
  public messages$ = this.messagesSubject$.pipe(switchAll(), catchError(e => { throw e }));
  public incrementer = 1;
  public logs = [];
  public allLogs = [];
  public currentLog = null
  public hosts = [];
  public levels = [];
  public autoReload = true;
  public filterString = '';
  public reverse = true;
  private _reverseInterval = null;
  private preferences = null;
  public regexInclude = true;
  public regexes = [];
  private fontSize = .8;
  public ipAddress = null;
  public listeningPort = 9999;
  public serverAddress = '';
  public generalSettings = {
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: '16px'
  }
  constructor(private _ipc: IpcService, private http:HttpClient){

    this.connect();
    this.init();
    this.preferences = _ipc.send('getPreferences');

    this.levels = this.preferences[SETTING_LEVELS] || [];
    this.hosts = this.preferences[SETTING_HOSTS] || [];
    this.reverse = this.preferences[SETTING_REVERSE] ?? true;
    this.regexInclude = this.preferences[SETTING_REGEXINCLUDE] ?? true;
    this.regexes = this.preferences[SETTING_REGEXES] || [];
    this.fontSize = this.preferences[SETTING_FONTSIZE] || .8;
    this.generalSettings.fontFamily = this.preferences[SETTING_FONTFAMILY];
    this.generalSettings.fontSize = this.preferences[SETTING_FONTFAMILY];

    console.log(this.preferences);
    this.listeningPort = this.preferences.server.listeningport || 9999;
    this.ipAddress = this.preferences.server.ip || '127.0.0.1';

    this.serverAddress = 'udp://' + this.ipAddress + ':' + this.listeningPort;
    _ipc.on('preferencesUpdated', (e, preferences) => {
      this.listeningPort = preferences.server.listeningport;
      this.serverAddress = 'udp://' + this.ipAddress + ':' + this.listeningPort;
      this.generalSettings.fontFamily = preferences.general.fontfamily;
      this.generalSettings.fontSize = preferences.general.fontsize;
    });

    
    //server.start();
  }

  public init(): void{
// window.setTimeout(() =>{
//   $('.main-content').css('font-size', this.fontSize + 'rem');

// }, 500);


  }

  public increaseFont():void{
    // if (this.fontSize > 1.4){
    //   return;
    // }
    // this.fontSize = this.fontSize +.1;
    // $('.main-content').css('font-size', this.fontSize + 'rem');
    // this.saveSettings(SETTING_FONTSIZE, this.fontSize);
  }

  public decreaseFont():void{
    // console.log(this.fontSize)
    // if (this.fontSize < 0.6){
    //   return;
    // }
    // this.fontSize = this.fontSize -.1;
    // $('.main-content').css('font-size', this.fontSize + 'rem');
    // this.saveSettings(SETTING_FONTSIZE, this.fontSize);
  }

  public toggleAutoReload(): void{
    this.autoReload = !this.autoReload;
  }

  private saveSettings(name: string, value: any){
    this.preferences[name] = value;
    this._ipc.send('setPreferences', this.preferences);
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

  public toggleHost(host: any): void{
    host.enabled = !host.enabled;
    host.processes.forEach(p =>{
      p.disabled = !host.enabled;
    })
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
    this.regexes.push(value);
    this.saveSettings(SETTING_REGEXES, this.regexes);
  }

  public removeRegex(regex): void{
    this.regexes.splice(this.regexes.indexOf(regex), 1);
    this.saveSettings(SETTING_REGEXES, this.regexes);
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
  
  public connect(): void {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket();

      this.socket$.subscribe((msg) =>{
        if (!this.autoReload) return;

        msg.id = this.incrementer;
        msg.exception = $('<div>').html(msg.exception).text();
        // if (msg.exception){
        //   msg.exception = msg.exception.replace(/   /g, '\n');
        // }

        if (!msg.host || !msg.process){
          return;
        }

        let level = this.levels.find((l) =>{
          return l.name === msg.level;
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


        //var process = processes.length ? processes[0] : {name: msg.process, enabled: true};

        if (!process.enabled || !level.enabled){
          return;
        }
        console.log(msg);

        if (this.regexInclude && this.regexes.length){
          let isOk = false;
          this.regexes.forEach((regex) =>{
            let re = new RegExp(regex);
            if (re.test(msg.message)){
              isOk = true;
            }
          });
          if (!isOk){
            return;
          }
        }

        if (!this.regexInclude && this.regexes.length){
          let isOk = true;
          this.regexes.forEach((regex) =>{
            let re = new RegExp(regex);
            if (re.test(msg.message)){
              isOk = false;
            }

          });
          if (!isOk){
            return;
          }

        }

        msg.levelObject = level;

        if (!this.filterString || (msg.message && msg.message.toString().toLowerCase().indexOf(this.filterString.toLowerCase()) > -1)){
          console.log('matching filter');
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

      });
    }
  }
  
  private getNewWebSocket() {
    return webSocket('ws://127.0.0.1:8088/');
  }
  sendMessage(msg: any) {
    this.socket$.next(msg);
  }
  close() {
    this.socket$.complete(); 
  }  

  details(id: number){
    this.currentLog = null;
    let log = this.logs.find((log) =>{  
      return log.id == id;
    });

    if (log){      
      console.log('showing id ', id);
      this.currentLog = log;

      window.setTimeout(() =>{
        //$('#stacktrace').netStack();
      }, 500)
    }

  }
}
