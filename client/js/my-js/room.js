const token = localStorage.getItem('token');
if (!token) {
	window.location.href='login.html';
} 
const socket = io('http://localhost:3030?token=' + token);
const urlString = window.location.href;
const url = new URL(urlString);
const roomName = url.searchParams.get('room');
$('#roomName').append(roomName);
socket.on('rooms', function (responseData) {
	switch(responseData.action) {
		case 'userDisconnect':
			appendUsernameToChat(responseData.data.members);
			break;
		case 'join':
			appendUsernameToChat(responseData.data.members);
			break;
	}
});
socket.on('messages', function (responseData, true) {
	switch (responseData.action) {
		case 'create':
			appendMessageToBox(responseData);
			break;
		case 'seen':
			console.log(responseData.data.membersSeen);
		case 'typing':
			console.log(responseData.data.someBodyTyping);
	}
});
socket.emit('rooms', {
	action: 'join',
	data: {
		roomName
	}
}, function(error, responseData) {
	if (error) {
		console.log(error);
	} else {
		console.log(responseData);
		appendUsernameToChat(responseData);
	}
});
$('#btn-sign-out').click(function () {
	localStorage.removeItem('token');
	window.location.href='login.html';
});

function appendUsernameToChat(usernameArray) {
	$('#list-user').empty();
	for (const username of usernameArray) {
		$('#list-user').append(`
			<li class="clearfix">
	          <div class="about">
	            <div class="name">${username}</div>
	            <div class="status">
	              <i class="fa fa-circle online"></i> online
	            </div>
	          </div>
	        </li>
		`);
	}
}
$('#btn-send'). click(function() {
	const message = $('textarea#message-to-send').val();
	socket.emit('messages', {
		action: 'create',
		data: {
			body: message,
			type: 'text',
			roomName,
		}
	}, function (error, responseData) {
		if (error) {
			return alert('have error');
		}
		appendMessageToBox(responseData, false);
	}); 
})
function appendMessageToBox (responseData, isOther) {
	let wrapMessageClassName = 'message-data align-right';
	let messageClassName = 'message other-message float-right'
	const messageTemplate = `
          <li class="clearfix">
            <div class="${wrapMessageClassName}">
              <span class="message-data-time" >10:14 AM, Today</span> &nbsp; &nbsp;
              <span class="message-data-name" >${responseData.data.senderName}</span> <i class="fa fa-circle me"></i>
              
            </div>
            <div class="${messageClassName}">
              ${responseData.data.body}
            </div>
          </li>
		`
	if (responseData.data.senderName === localStorage.getItem('username')) {
		$('.chat-history ul').append(messageTemplate);
	} else {
		wrapMessageClassName = 'message-data';
    	messageClassName = 'message my-message float-right';
    	$('.chat-history ul').append(messageTemplate);
	}
}
$('#message-to-send'). focus(function() {
	socket.emit('message', {
		action: 'seen',
		data: {
			roomName,
		}
	},
	 function (error, responseData) {
		if (error) {
			return alert('have error');
		}
		
	}); 
})
$('#message-to-send'). keypress(function() {
	socket.emit('message', {
		action: 'typing',
		data: {
			roomName,
		}
	},
	 function (error, responseData) {
		if (error) {
			return alert('have error');
		}
		
	}); 
})