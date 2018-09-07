import Authentication from '../middlewares'
import GroupEvent from './group-event';
import MessageEvent from './message-event';

export default class SocketInitialization {

    static connect (io) {
        io
            .use(async (socket, next) => {
                try {
                    await Authentication.authenticateSocket(socket);
                    next();
                } catch (e) {
                    return next(e);
                }
            })
            .on('connection', function (socket) {
                console.log('-----------Socket connect-----------');
                GroupEvent.initialize(socket);
                MessageEvent.initialize(socket);
                socket.on('disconnect', function () {
                    console.log('--------soket disconnect--------')
                });
            });

    }
}
