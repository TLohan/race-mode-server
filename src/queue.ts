import { Player } from "./player";
import { Subject } from 'rxjs';
import { Match } from "./match";
import { MatchService } from "./match.service";

export class Queue {

    private _queue: Player[] = [];


    constructor(private matchService: MatchService) {

    }

    public push(player: Player) {
        if (this.checkForDuplicate) {
            console.log('Added player to match', player.socket.id);
            this._queue.push(player);
        }
        if (this._queue.length > 1) {
            this.initiateMatch();
        }
    }

    draftPlayers(): Player[] {
        const players = [this._queue[0], this._queue[1]];
        if (this._queue.length > 2) {
            this._queue = this._queue.slice(2);
        } else {
            this._queue = [];
        }
        return players;
    }

    private checkForDuplicate(player: Player) {
        return this._queue.every(p => {
            return p.identifier !== player.identifier;
        });
    }

    remove(playerSocketId: string) {
        console.log('removing player. QL: ', this._queue.length);
        this._queue = this._queue.filter(p => {
            return p.socket.id !== playerSocketId;
        });
        console.log('removed player. QL: ', this._queue.length);
    }

    public getQueue(): Player[] {
        return this._queue;
    }

    private initiateMatch(): void {
        console.log('started match');
        const players = this.draftPlayers();
        this.matchService.newMatchSource.next(players);
    }
}