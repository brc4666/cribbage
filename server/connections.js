class AConnection {
    socket;
    assocplayer;
    constructor(socket, name) {
      this.socket = socket;
      this.assocplayer = name;
    }
  }
  
  class AllConnections {
    connections;
    players;
  
    constructor() { 
      this.connections = [];
      this.players = [];
    }
  
    Players() {
      return this.players;
    }
    
    AddConnection( socket, name ) {
      this.connections.push( new AConnection( socket, name) );
      this.players.push( name );
      return this.connections.length;
    }
  
    AddPlayer( name ) {
      this.players.push( name );
      return this.allPlayers.length;
    }
  
    RemovePlayer ( name ) {
      if (name!="") {
        var index = this.players.indexOf( name );
        this.players.splice(index, 1);
        return this.players.length;
      }
    }
  
    FindPlayerName( socket ) {
      for (i=0; i< this.connections.length; i++) {
        if (socket===this.connections[i].socket) {
          return this.connections[i].assocplayer;
        }
      }
      return "";
    }
  
    RemoveConnection( socket ) {
      var index = this.connections.indexOf(socket);
      var playerindex = this.players.indexOf( socket.name );
      this.players.splice(playerindex, 1);
      this.connections.splice(index, 1);
    }
  }
  
module.exports = AllConnections;