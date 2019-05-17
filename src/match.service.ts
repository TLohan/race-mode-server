import { Subject } from "rxjs";
import { Player } from "./player";

export class MatchService {

    newMatchSource = new Subject<Player[]>();
    newMatchTriggered = this.newMatchSource.asObservable();

    addPlayerToQueueSource = new Subject<Player>();
    addPlayerToQueue = this.addPlayerToQueueSource.asObservable();

    constructor() { };

}