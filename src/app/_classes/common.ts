export const enum MessageType {
    connection = 0,
    game,
    players,
    cards
 };

 export const enum MessageHeader {
    disconnection = 10,
    // Game messages   
    initgame = 110,
    refreshgame,
    // players messages
    joinedas = 120,
    playerjoined,
    playerleft,
    // Cards messages ... 
    refreshcards = 130
};