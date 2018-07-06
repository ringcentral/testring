import * as Koa from 'koa';
import * as WebSocket from 'ws';
import * as opn from 'opn';

const app = new Koa();

app.use(async ctx => {
    ctx.body = 'Hello World';
});

app.listen(3000);

const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message); // eslint-disable-line

        ws.send('got it');
    });

    ws.send('HI!');
});

opn('http://localhost:3000');

