import * as path from 'path';
import * as Koa from 'koa';
import * as serve from 'koa-static';
import * as views from 'koa-views';
import * as WebSocket from 'ws';
// import * as opn from 'opn';

const host = 'localhost';
const wsProtocol = 'ws';
const wsPort = 3001;
const staticFolder = path.dirname(require.resolve('@testring/recorder-app'));

const app = new Koa();

app.use(serve(staticFolder));

app.use(views(
    path.resolve(__dirname, '../static/'),
    { extension: 'hbs', map: {hbs: 'handlebars' } },
));

app.use(async (ctx) => {
    await ctx.render('index', {
        host,
        wsProtocol,
        wsPort,
    });
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

// opn('http://localhost:3000');

