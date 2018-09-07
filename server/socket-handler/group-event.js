
export default class GroupsEvent {
    static initialize(socket) {
        socket.on('rooms', function(requestData, callback) {
        switch (requestData.action) {
            case 'join':
                const roomName = requestData.data.roomName;
                if (roomName === undefined) {
                    return;
                }
                if (!rooms[roomName]) {
                    rooms[roomName] = [];
                }
                let isExisted = false;
                for (const item of rooms[roomName]) {
                    if (item === socket.user.username) {
                        isExisted = true;
                        break;
                    }
                }
                if (!isExisted) {
                    rooms[roomName].push(socket.user.username)
                }
                socket.join(requestData.data.roomName);
                socket.broadcast.to(roomName).emit('rooms', {
                    action: 'join',
                    data: {
                        members: rooms[roomName]
                    }
                });
                return callback(null, rooms[roomName]);

        }
    });
    }
}
