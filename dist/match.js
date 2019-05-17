"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var Match = /** @class */ (function () {
    function Match(playerOne, playerTwo, matchSocket, matchService) {
        this.matchService = matchService;
        this.roundNo = 0;
        this.isFinished = false;
        console.log('match created');
        this.playerOne = playerOne;
        this.playerTwo = playerTwo;
        this.matchSocket = matchSocket;
        this.inPlay = false;
        this.listen();
        this.playerOne.socket.emit('setMatchId', this.namespaceId);
        this.playerTwo.socket.emit('setMatchId', this.namespaceId);
    }
    Object.defineProperty(Match.prototype, "namespaceId", {
        get: function () {
            return this.matchSocket ? this.matchSocket.name : null;
        },
        enumerable: true,
        configurable: true
    });
    Match.prototype.listen = function () {
        var _this = this;
        console.log('\nListening on Match Socket....');
        this.matchSocket.on('connect', function (playerSocket) {
            var playerId = playerSocket.id.split('#')[1];
            console.log('Player joined match. ID: ', playerId);
            var player = _this.identifyPlayer(playerId);
            player.connectedToMatch = true;
            var otherPlayer = _this.identifyOtherPlayer(playerId);
            if (player.connectedToMatch && otherPlayer.connectedToMatch) {
                console.log('\nBoth players have joined.');
                _this.beginMatch();
            }
            else {
                console.log('\nBoth players not have not joined yet.');
            }
            playerSocket.on('updateProgress', function (progress) {
                player.progress = progress;
                otherPlayer.socket.emit('updateOpponentProgress', progress);
            });
            playerSocket.on('updateRevealsRemaining', function (reveals) {
                player.revealsRemaining = reveals;
                otherPlayer.socket.emit('updateOpponentRevealsRemaining', reveals);
            });
            playerSocket.on('requestReplay', function () {
                player.socket.emit('matchReady', false);
                player.socket.emit('waitingForOpponent', true);
                player.acceptedReplay = true;
                player.connectedToMatch = true;
                if (player.acceptedReplay && otherPlayer.acceptedReplay) {
                    _this.beginMatch();
                }
            });
            playerSocket.on('declineReplay', function () {
                console.log('declined replay');
                player.declinedReplay = true;
                // this.matchService.addPlayerToQueueSource.next(otherPlayer);
            });
            playerSocket.on('disconnect', function () {
                console.log('player disconnected from match');
                player.connectedToMatch = false;
                _this.playerDisconnected(playerId);
            });
            playerSocket.on('finishedRace', function () {
                console.log('match Finished');
                player.socket.emit('finishedRace', [player.progress, otherPlayer.progress]);
                otherPlayer.socket.emit('finishedRace', [otherPlayer.progress, player.progress]);
            });
        });
    };
    Match.prototype.playerDisconnected = function (playerId) {
        var disconnectedPlayer = this.identifyPlayer(playerId);
        var otherPlayer = this.identifyOtherPlayer(playerId);
        this.inPlay = false;
        this.isFinished = true;
        otherPlayer.socket.emit('otherPlayerDisconnected');
        this.matchSocket.emit('matchReady', false);
    };
    Match.prototype.beginMatch = function () {
        var _this = this;
        console.log('starting match');
        this.isFinished = false;
        this.inPlay = true;
        this.matchSocket.emit('matchReady', true);
        this.roundNo++;
        this.playerOne.reset();
        this.playerTwo.reset();
        request('http://localhost:60844/api/xwords/play/random', { json: true }, function (err, response, body) {
            if (err) {
                console.log(err);
            }
            _this.board = body;
            _this.sendBoard();
        });
    };
    Match.prototype.sendBoard = function () {
        console.log('sending board: ', this.board.id);
        this.matchSocket.emit('setBoard', this.board);
    };
    Match.prototype.endMatch = function () {
        // end the match
        console.log('Match ended. ID: ', this.namespaceId);
        this.matchSocket.emit('matchReady', false);
    };
    Match.prototype.identifyPlayer = function (playerId) {
        if (this.playerOne.identifier === playerId) {
            return this.playerOne;
        }
        if (this.playerTwo.identifier === playerId) {
            return this.playerTwo;
        }
        return null;
    };
    Match.prototype.identifyOtherPlayer = function (playerId) {
        if (this.playerOne.identifier === playerId) {
            return this.playerTwo;
        }
        if (this.playerTwo.identifier === playerId) {
            return this.playerOne;
        }
        return null;
    };
    return Match;
}());
exports.Match = Match;
