// replace these values with those generated in your TokBox Account
var apiKey = "46043582";
var sessionId = "2_MX40NjA0MzU4Mn5-MTUxNjQ3OTM1OTgzOH4zKzFGQVFTa08xN0dKODU3OGFZNlIrWGl-fg";
var token = "T1==cGFydG5lcl9pZD00NjA0MzU4MiZzaWc9MDAzYjVjYmI1MDVjZmNkZjZlODc0NGM4YjQ5ODZmY2JjMTI3N2VmYTpzZXNzaW9uX2lkPTJfTVg0ME5qQTBNelU0TW41LU1UVXhOalEzT1RNMU9UZ3pPSDR6S3pGR1FWRlRhMDh4TjBkS09EVTNPR0ZaTmxJcldHbC1mZyZjcmVhdGVfdGltZT0xNTE2NDc5MzgwJm5vbmNlPTAuMzU5NjA0OTk4NTAxMTQyNyZyb2xlPW1vZGVyYXRvciZleHBpcmVfdGltZT0xNTE3MDg0MTgxJmluaXRpYWxfbGF5b3V0X2NsYXNzX2xpc3Q9"

//sessionId = <%= sessionId %>;
//token = <%= token %>;

console.log('my teacher token: ' + token)

// (optional) add server code here
initializeSession();

// Handling all of our errors here by alerting them
function handleError(error) {
    if (error) {
        alert(error.message);
    }
}

var students = {};

function initializeSession() {
    var session = OT.initSession(apiKey, sessionId);

    // Subscribe to a newly created stream
    session.on({
        streamCreated: function (event) {
            students[event.stream.connection.connectionId] = event.stream;
            console.log('students[stream]', students); //remove
        },
        signal: function (event) {
            console.log('signal event', event); //remove
            console.log('connectionId', event.from.connectionId); //remove
            if (event.data === 'raiseHand') {
                var r = confirm("Accept student's question?");
                if (r == true) {
                    session.subscribe(students[event.from.connectionId], 'subscriber', {
                        width: '360px',
                        height: '240px'
                    });
                }
            }
        }
    });

    // Create a publisher
    var publisher = OT.initPublisher('publisher', {
        width: '360px',
        height: '240px'
    }, handleError);

    // Connect to the session
    session.connect(token, function (error) {
        // If the connection is successful, publish to the session
        if (error) {
            handleError(error);
        } else {
            session.publish(publisher, handleError);
        }
    });
}