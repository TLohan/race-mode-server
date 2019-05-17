"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("http");
var express = require("express");
var socketIo = require("socket.io");
var path = require("path");
var queue_1 = require("./queue");
var player_1 = require("./player");
var match_1 = require("./match");
var match_service_1 = require("./match.service");
var RaceModeServer = /** @class */ (function () {
    function RaceModeServer() {
        var _this = this;
        this.matchService = new match_service_1.MatchService();
        this.matches = [];
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
        this.queue = new queue_1.Queue(this.matchService);
        this.matchService.newMatchTriggered.subscribe(function (players) {
            console.log('new match triggered');
            var namespaceUrl = _this.generateId(8);
            var namespace = _this.io.of("/" + namespaceUrl);
            var match = new match_1.Match(players[0], players[1], namespace, _this.matchService);
            _this.matches.push(match);
        });
        this.matchService.addPlayerToQueue.subscribe(function (player) {
            console.log('re adding player to queue');
            _this.queue.push(player);
        });
    }
    Object.defineProperty(RaceModeServer.prototype, "numUsersOnline", {
        get: function () {
            return this.queue.getQueue().length;
        },
        enumerable: true,
        configurable: true
    });
    RaceModeServer.prototype.createApp = function () {
        this.app = express();
        this.app.set('view engine', 'ejs');
    };
    RaceModeServer.prototype.createServer = function () {
        this.server = http_1.createServer(this.app);
    };
    RaceModeServer.prototype.config = function () {
        this.port = process.env.PORT || RaceModeServer.PORT;
    };
    RaceModeServer.prototype.sockets = function () {
        this.io = socketIo(this.server);
    };
    RaceModeServer.prototype.listen = function () {
        var _this = this;
        this.server.listen(this.port, function () {
            console.log("Running server on port " + _this.port + ".\n");
        });
        this.io.on('connect', function (playerSocket) {
            console.log('Client Joined:', playerSocket.id);
            playerSocket.emit('connected', true);
            _this.queue.push(new player_1.Player(playerSocket));
            _this.updateAboutNumberOfPlayersInQueue();
            console.log('Num users online:', _this.numUsersOnline);
            playerSocket.on('rejoinQueue', function () {
                _this.queue.push(new player_1.Player(playerSocket));
                _this.updateAboutNumberOfPlayersInQueue();
            });
            playerSocket.on('disconnect', function () {
                console.log('\nClient disconnected from Server. ID:', playerSocket.id);
                _this.updateAboutNumberOfPlayersInQueue();
                console.log('Num users online:', _this.numUsersOnline);
                _this.queue.remove(playerSocket.id);
                // delete this.io.nsps[this.findMatch(playerSocket).matchSocket.name];
            });
        });
        this.app.get('/', function (req, res) {
            res.render(path.join(__dirname + '/index.ejs'), {
                matches: _this.matches.filter(function (m) { return !m.isFinished; }),
                numUsersOnline: _this.numUsersOnline,
                finishedMatches: _this.matches.filter(function (m) { return m.isFinished; }),
                queue: _this.queue.getQueue()
            });
        });
    };
    RaceModeServer.prototype.findMatch = function (playerSocket) {
        var match = this.matches.find(function (match) {
            return (match.playerOne.socket === playerSocket || match.playerTwo.socket === playerSocket);
        });
        return match;
    };
    RaceModeServer.prototype.getApp = function () {
        return this.app;
    };
    RaceModeServer.prototype.updateAboutNumberOfPlayersInQueue = function () {
        this.io.emit('usersOnline', this.numUsersOnline);
    };
    RaceModeServer.prototype.generateId = function (length) {
        if (length === void 0) { length = 8; }
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
        var id = '';
        for (var i = 0; i < length; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    };
    RaceModeServer.PORT = process.env.PORT || 3000;
    return RaceModeServer;
}());
exports.RaceModeServer = RaceModeServer;
