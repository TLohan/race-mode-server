import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';
import * as path from 'path';

import { Queue } from './queue';
import { Player } from './player';
import { Match } from './match';
import { MatchService } from './match.service';

export class RaceModeServer {

    public static readonly PORT: string | number = process.env.PORT || 3000;

    private app: express.Application;
    private server: Server;
    private io: SocketIO.Server;
    private port: string | number;

    get numUsersOnline(): number {
        return this.queue.getQueue().length;
    }

    matchService = new MatchService();

    private matches: Match[] = [];
    private queue: Queue;


    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();

        this.queue = new Queue(this.matchService);
        this.matchService.newMatchTriggered.subscribe(players => {
            console.log('new match triggered');
            const namespaceUrl = this.generateId(8);
            const namespace = this.io.of(`/${namespaceUrl}`);
            const match = new Match(players[0], players[1], namespace, this.matchService);
            this.matches.push(match);
        });

        this.matchService.addPlayerToQueue.subscribe(player => {
            console.log('re adding player to queue');
            this.queue.push(player);
        });
    }

    private createApp(): void {
        this.app = express();
        this.app.set('view engine', 'ejs');
    
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private config(): void {
        this.port = process.env.PORT || RaceModeServer.PORT
    }

    private sockets(): void {
        this.io = socketIo(this.server);
    }

    private listen(): void {
        this.server.listen(this.port, () => {
            console.log(`Running server on port ${this.port}.\n`);
        });

        this.io.on('connect', (playerSocket: socketIo.Socket) => {
            console.log('Client Joined:', playerSocket.id);

            playerSocket.emit('connected', true);
            
            this.queue.push(new Player(playerSocket));
            this.updateAboutNumberOfPlayersInQueue();
            console.log('Num users online:', this.numUsersOnline);

            playerSocket.on('rejoinQueue', () => {
                this.queue.push(new Player(playerSocket));
                this.updateAboutNumberOfPlayersInQueue();
            });
            
            playerSocket.on('disconnect', () => {
                console.log('\nClient disconnected from Server. ID:', playerSocket.id);

                this.updateAboutNumberOfPlayersInQueue();
                console.log('Num users online:', this.numUsersOnline);
                this.queue.remove(playerSocket.id);
                // delete this.io.nsps[this.findMatch(playerSocket).matchSocket.name];
            });

        });

        this.app.get('/', (req, res) => {
            res.render(path.join(__dirname+'/index.ejs'), {
                matches: this.matches.filter(m => !m.isFinished),
                numUsersOnline: this.numUsersOnline,
                finishedMatches: this.matches.filter(m => m.isFinished),
                queue: this.queue.getQueue()
            });
        });
    }
    
    findMatch(playerSocket: socketIo.Socket): Match {
        const match = this.matches.find(match => {
            return (match.playerOne.socket === playerSocket || match.playerTwo.socket === playerSocket)
        });
        return match;
    }

    public getApp(): express.Application {
        return this.app;
    }

    updateAboutNumberOfPlayersInQueue() {
        this.io.emit('usersOnline', this.numUsersOnline);
    }

    generateId(length: number = 8): string {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

        let id = '';
        for (let i = 0; i < length; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    }

}


