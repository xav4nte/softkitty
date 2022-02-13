const { XMLParser, XMLBuilder, XMLValidator} = require("fast-xml-parser");
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 8088, host: '0.0.0.0' });
const preferences = require('./preferences');

let listeningPort = preferences.value('server.listeningport');
const options = {
    ignoreAttributes : false,
    attributeNamePrefix : "@_",
    alwaysCreateTextNode: true
};
const parser = new XMLParser(options);


var udp = require('dgram');
let connections = [];
let isRunning = false;

wss.on('connection', (ws) => {
  connections.push(ws);
  ws.send(JSON.stringify({'connected': 'true'}));

});

let server = null;

function running(){
  if (!server || !isRunning){
    return false;
  }

  return true;
}
function stop(){
  if (!server){
    return;
  }

  console.log('Stopping server...');
  server.close();
  isRunning = false;
}
function start(){
  // creating a udp server
  console.log('Starting server...');
  server = udp.createSocket('udp4');
  isRunning = true;

// emits when any error occurs
server.on('error',function(error){
  console.log('Error: ' + error);
  server.close();
  isRunning = false;
});

  // emits on new datagram msg
  server.on('message', (msg,info) => {
      let jObj = parser.parse(msg.toString());

    var props = jObj['log4j:event']['log4j:properties']['log4j:data'];
    let process = null;
    let host = null;
    let message = null;
    let level = null;
    let timestamp = null;
    let exception = null;
    props.forEach(prop => {
      switch(prop['@_name']){
        case 'message':
          message = prop['@_value'];
          break;
        case 'process':
          process = prop['@_value'];
          break;
        case 'log4jmachinename':
          host = prop['@_value'];
          break;
        case 'level':
          level = prop['@_value'];
          break;
        case 'exception':
          exception = prop['@_value'];
          break;
        case 'timestamp':
          timestamp = prop['@_value'];
          break;
        }

    });

    if (connections && connections.length){
      connections.forEach((ws) =>{
        ws.send(JSON.stringify({process, host, message, level, exception, timestamp}));
      })
    }
    
  });

  //emits when socket is ready and listening for datagram msgs
  server.on('listening',function(){
    var address = server.address();
    var port = address.port;
    var family = address.family;
    var ipaddr = address.address;
    console.log('Server is listening at port ' + port);
    console.log('Server ip :' + ipaddr);
    console.log('Server is IP4/IP6 : ' + family);
    isRunning = true;
  });

  //emits after the socket is closed using socket.close();
  server.on('close',function(){
    console.log('Socket is closed !');
  });

  server.bind(listeningPort);
}

preferences.on('save', (preferences) => {
  listeningPort = preferences.server.listeningport;
  console.log(listeningPort);
	stop();
	start();
});

module.exports = {start, stop, running};