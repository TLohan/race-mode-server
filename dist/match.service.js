"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var MatchService = /** @class */ (function () {
    function MatchService() {
        this.newMatchSource = new rxjs_1.Subject();
        this.newMatchTriggered = this.newMatchSource.asObservable();
        this.addPlayerToQueueSource = new rxjs_1.Subject();
        this.addPlayerToQueue = this.addPlayerToQueueSource.asObservable();
    }
    ;
    return MatchService;
}());
exports.MatchService = MatchService;
