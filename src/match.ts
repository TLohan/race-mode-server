import { Player } from './player';
import { Board } from './board';
import request = require('request');
import { identity } from 'rxjs';
import { MatchService } from './match.service';

export class Match {

    playerOne: Player;
    playerTwo: Player;
    
    matchSocket: SocketIO.Namespace;

    inPlay: boolean;
    roundNo = 0;
    isFinished = false;

    board: Board;

    constructor(playerOne: Player, playerTwo: Player, matchSocket: SocketIO.Namespace, private matchService: MatchService) {
        console.log('match created');
        this.playerOne = playerOne;
        this.playerTwo = playerTwo;
        this.matchSocket = matchSocket;
        
        this.inPlay = false;
        this.listen();
        
        this.playerOne.socket.emit('setMatchId', this.namespaceId);
        this.playerTwo.socket.emit('setMatchId', this.namespaceId);

    }

    get namespaceId(): string {
        return this.matchSocket ? this.matchSocket.name : null;
    }

    listen() {
        console.log('\nListening on Match Socket....');
        this.matchSocket.on('connect', (playerSocket) => {
            const playerId = playerSocket.id.split('#')[1];
            console.log('Player joined match. ID: ', playerId);

            const player = this.identifyPlayer(playerId);
            player.connectedToMatch = true;
            const otherPlayer = this.identifyOtherPlayer(playerId);

            if (player.connectedToMatch && otherPlayer.connectedToMatch) {
                console.log('\nBoth players have joined.');

                this.beginMatch();

            } else {
                console.log('\nBoth players not have not joined yet.');
            }

            playerSocket.on('updateProgress', (progress: number) => {
                player.progress = progress;
                otherPlayer.socket.emit('updateOpponentProgress', progress);
            });

            playerSocket.on('updateRevealsRemaining', (reveals: number) => {
                player.revealsRemaining = reveals;
                otherPlayer.socket.emit('updateOpponentRevealsRemaining', reveals);
            });

            playerSocket.on('requestReplay', () => {
                player.socket.emit('matchReady', false);
                player.socket.emit('waitingForOpponent', true);
                player.acceptedReplay = true;
                player.connectedToMatch = true;
                if (player.acceptedReplay && otherPlayer.acceptedReplay) {
                    this.beginMatch();
                }
            });

            playerSocket.on('declineReplay', () => {
                console.log('declined replay');
                player.declinedReplay = true;
                // this.matchService.addPlayerToQueueSource.next(otherPlayer);
            });

            
            playerSocket.on('disconnect', () => {
                console.log('player disconnected from match');
                player.connectedToMatch = false;
                this.playerDisconnected(playerId);
            });

            playerSocket.on('finishedRace', () => {
                console.log('match Finished');
                player.socket.emit('finishedRace', [player.progress, otherPlayer.progress]);
                otherPlayer.socket.emit('finishedRace', [otherPlayer.progress, player.progress]);
            });
        });

    }

    playerDisconnected(playerId: string) {
        const disconnectedPlayer = this.identifyPlayer(playerId);
        const otherPlayer = this.identifyOtherPlayer(playerId);
        this.inPlay = false;
        this.isFinished = true;
        otherPlayer.socket.emit('otherPlayerDisconnected');
        this.matchSocket.emit('matchReady', false);
    }

    beginMatch():void {
        console.log('starting match');
        this.isFinished = false;
        this.inPlay = true;
        this.matchSocket.emit('matchReady', true);
        this.roundNo++;

        this.playerOne.reset();
        this.playerTwo.reset();

       request('http://localhost:60844/api/xwords/play/random', { json: true }, (err, response, body) => {
            if (err) { console.log(err); }
            this.board = body;
            this.sendBoard();
       });
    }

    sendBoard(): void {
        console.log('sending board: ', this.board.id);
        this.matchSocket.emit('setBoard', this.board);
    }

    endMatch() {
        // end the match
        console.log('Match ended. ID: ', this.namespaceId);
        this.matchSocket.emit('matchReady', false);
    }

    identifyPlayer(playerId: string): Player {
        if (this.playerOne.identifier === playerId) {
            return this.playerOne;
        }

        if  (this.playerTwo.identifier === playerId) {
            return this.playerTwo;
        }
        return null;
    }

    identifyOtherPlayer(playerId: string): Player {
        if (this.playerOne.identifier === playerId) {
            return this.playerTwo;
        }

        if  (this.playerTwo.identifier === playerId) {
            return this.playerOne;
        }
        return null;
    }

}
