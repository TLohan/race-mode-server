"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Queue = /** @class */ (function () {
    function Queue(matchService) {
        this.matchService = matchService;
        this._queue = [];
    }
    Queue.prototype.push = function (player) {
        if (this.checkForDuplicate) {
            console.log('Added player to match', player.socket.id);
            this._queue.push(player);
        }
        if (this._queue.length > 1) {
            this.initiateMatch();
        }
    };
    Queue.prototype.draftPlayers = function () {
        var players = [this._queue[0], this._queue[1]];
        if (this._queue.length > 2) {
            this._queue = this._queue.slice(2);
        }
        else {
            this._queue = [];
        }
        return players;
    };
    Queue.prototype.checkForDuplicate = function (player) {
        return this._queue.every(function (p) {
            return p.identifier !== player.identifier;
        });
    };
    Queue.prototype.remove = function (playerSocketId) {
        console.log('removing player. QL: ', this._queue.length);
        this._queue = this._queue.filter(function (p) {
            return p.socket.id !== playerSocketId;
        });
        console.log('removed player. QL: ', this._queue.length);
    };
    Queue.prototype.getQueue = function () {
        return this._queue;
    };
    Queue.prototype.initiateMatch = function () {
        console.log('started match');
        var players = this.draftPlayers();
        this.matchService.newMatchSource.next(players);
    };
    return Queue;
}());
exports.Queue = Queue;
