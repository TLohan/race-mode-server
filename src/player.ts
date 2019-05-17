import { Match } from "./match";

export class Player {

    socket: SocketIO.Socket;
    progress: number;
    ready: boolean;
    revealsRemaining: number;
    match: Match;
    connectedToMatch: boolean;
    acceptedReplay = false;
    declinedReplay = false;

    get identifier(): string {
        return this.socket ? this.socket.id : undefined;
    }
    
    constructor(playerSocket: SocketIO.Socket) {
        this.socket = playerSocket;
        this.progress = 0;
    }

    reset() {
        this.progress = 0;
        this.revealsRemaining = 3;
        this.acceptedReplay = false;
        this.declinedReplay = false;
    }

}