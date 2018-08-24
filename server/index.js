'use strict';

import Express from 'express';
import BodyParser from 'body-parser';
import Cors from 'cors';
import FS from 'fs-extra';
import Http from 'http';
import Path from 'path';
import JWTHelper from "./helpers/jwt-helper";

const app = Express();
global.__rootDir = __dirname.replace('/server', '');

app
    .use(Cors())
    .use(BodyParser.json())
    .use(BodyParser.urlencoded({extended: true}))
    .use(Express.static(Path.resolve(__dirname, '..', 'public'), {maxAge: 31557600000}))
	.set('views', Path.join(__dirname, '..', 'public', 'views'))
	.set('view engine', 'ejs');

const routePath = `${__dirname}/routes/`;
FS.readdirSync(routePath).forEach((file) => {
    require(`${routePath}${file}`)(app);
});

const server = Http.createServer(app).listen(3030, () => {
    console.log(`App listening on 3030!`);
});
const io = require('socket.io')(server);

const rooms = {};

io
    .use(async (socket, next) => { //use to authencation user
        try {
            const token = socket.handshake.query.token;
            const data = await JWTHelper.verify(token);
            socket.user = data;
            next();
        } catch (e) {
            console.log(e);
            return next(e);
        }
    })
    .on('connection', function (socket) {
        socket.on('rooms', function(requestData, callback) {
            switch (requestData.action) {
                case 'join':
                    const roomName = requestData.data.roomName;
                    if (roomName === undefined) {
                        return;
                    }
                    if (!rooms[roomName]) {
                        rooms[roomName] = {};
                        rooms[roomName]['members'] = [];
                        rooms[roomName]['membersSeen'] = [];
                    }
                    let isExisted = false;
                    for (const item of rooms[roomName]['members']) {
                        if (item === socket.user.username) {
                            isExisted = true;
                            break;
                        }
                    }
                    if (!isExisted) {
                        rooms[roomName]['members'].push(socket.user.username)
                    }
                    socket.join(requestData.data.roomName);
                    socket.broadcast.to(roomName).emit('rooms', {
                        action: 'join',
                        data: {
                            members: rooms[roomName]['members']
                        }
                    });
                    return callback(null, rooms[roomName]['members']);
                    break;
            }
        });

        socket.on('messages', function (requestData, callback) {
            console.log(requestData);
            const {body, type, roomName} = requestData.data;
            switch (requestData.action) {
                case 'create':
                    socket.broadcast.to(roomName).emit('messages', {
                        action: 'create',
                        data: {
                            body,
                            type,
                            senderName: socket.user.username
                        }
                    });
                    return callback(null, {
                        body,
                        type,
                        senderName: socket.user.username
                    });
                case 'seen':
                    for (let i = 0 ; i< rooms[roomName]['membersSeen'].length; i++) {
                        if (rooms[roomName]['membersSeen'][i] === socket.user.username) {
                            return callback(null, {
                                data: {
                                    isSeen: true
                                }
                            });
                        }
                    }
                    socket.broadcast.to(roomName).emit('messages', {
                        action: 'seen',
                        data: {
                            membersSeen: rooms[roomName]['membersSeen']
                        }
                    });
                    return callback(null, {
                        data: {
                            isSeen: true
                        }
                    });
                case 'typing':
                    socket.broadcast.to(roomName).emit('messages', {
                        action: 'typing',
                        data: {
                            someBodyTyping : true,
                        }
                    });
                    return callback(null, {
                        data: {
                            isTyping: true,
                        }
                    });

            }
        });
        socket.on('disconnect', function () {
            for (const roomName in rooms) {
                for (let i = 0; i < rooms[roomName]['members'].length; i++) {
                    if (rooms[roomName]['members'][i] === socket.user.username) {
                        rooms[roomName]['members'].splice(i, 1);
                        socket.broadcast.to(roomName).emit('rooms', {
                            action: 'userDisconnect',
                            data: {
                                members: rooms[roomName]['members']
                            }
                        })
                    }
                }
            }
        });
    });