// replace these values with those generated in your TokBox Account
var apiKey = "46043582";
var sessionId = "2_MX40NjA0MzU4Mn5-MTUxNjQ3OTM1OTgzOH4zKzFGQVFTa08xN0dKODU3OGFZNlIrWGl-fg";
var token = "T1==cGFydG5lcl9pZD00NjA0MzU4MiZzaWc9MDAzYjVjYmI1MDVjZmNkZjZlODc0NGM4YjQ5ODZmY2JjMTI3N2VmYTpzZXNzaW9uX2lkPTJfTVg0ME5qQTBNelU0TW41LU1UVXhOalEzT1RNMU9UZ3pPSDR6S3pGR1FWRlRhMDh4TjBkS09EVTNPR0ZaTmxJcldHbC1mZyZjcmVhdGVfdGltZT0xNTE2NDc5MzgwJm5vbmNlPTAuMzU5NjA0OTk4NTAxMTQyNyZyb2xlPW1vZGVyYXRvciZleHBpcmVfdGltZT0xNTE3MDg0MTgxJmluaXRpYWxfbGF5b3V0X2NsYXNzX2xpc3Q9";

// (optional) add server code here

// Handling all of our errors here by alerting them
function handleError(error) {
    if (error) {
        alert(error.message);
    }
}

    var session = OT.initSession(apiKey, sessionId);
    console.log('session', session); //remove
    // Subscribe to a newly created stream
    session.on('streamCreated', function(event) {
        session.subscribe(event.stream, 'subscriber', {
        width: '360px',
        height: '240px'
        }, handleError);
    });

    // Connect to the session
    session.connect(token, function (error) {
        // If the connection is successful, publish to the session
        if (error) {
            handleError(error);
        }
    });

function enterTex() {
           var msgTxt = document.getElementById('msgTxt');
             session.signal({
                type: 'msg',
                 data: msgTxt.value
             }, function signalCallback(error) {
             if (error) {
                 console.error('Error sending signal:', error.name, error.message);
             } else {
                msgTxt.value = '';

             }
            });
}

  session.on('signal:msg', function signalCallback(event) {
    var msgHistory = document.getElementById('history');
    var msg = document.createElement('p');
    msg.textContent = event.data;
    msg.className = event.from.connectionId === session.connection.connectionId ? 'mine' : 'theirs';
    msgHistory.appendChild(msg);
    msg.scrollIntoView();
  }); 
