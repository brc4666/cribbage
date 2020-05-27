class AConnection {
    socket;
    name;
    connected;
    ingame;
    constructor(socket) {
      this.socket = socket;
      this.name = socket.name;
      this.connected = true;
      this.ingame = false;
    }
  }
  
class AllConnections {
  connections;

  constructor() { 
    this.connections = [];
  }

  connectionsCount() {
    return this.connections.length;
  }

  findConnection(name) {
    for (let i=0; i< this.connections.length; i++) {
      if (name===this.connections[i].name) {
        return i;
      }
    }
    return -1; 
  }
    
  AddConnection( socket ) {
    this.connections.push( new AConnection( socket ) );
    return this.connections.length;
  }
  
  RemoveConnection( name ) {
    var index = this.findConnection( name );
    if (index > -1) {
      this.connections.splice(index, 1);
    }
  }

  joinGame( name ) {
    for (let i=0; i< this.connections.length; i++) {
      if (name===this.connections[i].name) {
        this.connections[i].ingame = true;
        break;
      }
    }
  }

  dumpConnections( title ) {
    console.log('   ' + title);
    console.log('       Number of connections=' +  this.connections.length);
    for (let i=0; i <  this.connections.length; i++) {
      console.log( '          Player ' + i + ':' +  this.connections[i].name);
    }
  };

}
  
module.exports = AllConnections;