"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Player = /** @class */ (function () {
    function Player(playerSocket) {
        this.acceptedReplay = false;
        this.declinedReplay = false;
        this.socket = playerSocket;
        this.progress = 0;
    }
    Object.defineProperty(Player.prototype, "identifier", {
        get: function () {
            return this.socket ? this.socket.id : undefined;
        },
        enumerable: true,
        configurable: true
    });
    Player.prototype.reset = function () {
        this.progress = 0;
        this.revealsRemaining = 3;
        this.acceptedReplay = false;
        this.declinedReplay = false;
    };
    return Player;
}());
exports.Player = Player;
