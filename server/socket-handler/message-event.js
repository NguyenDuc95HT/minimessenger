export default class MessageEvent {
    static initialize(socket) {
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
            for (let i = 0 ; i< rooms[roomName].length; i++) {
                if (rooms[roomName][i] === socket.user.username) {
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
                    isTyping : true,
                }
            });
            return callback(null, {
                data: {
                    isTyping: true,
                }
            });
            break;

    }
});
    }
}

