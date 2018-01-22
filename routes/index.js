var express = require('express');
var router = express.Router();
var path = require('path');
var _ = require('lodash');

var apiKey = process.env.TOKBOX_API_KEY;
var secret = process.env.TOKBOX_SECRET;

if (!apiKey || !secret) {
  console.error('=========================================================================================================');
  console.error('');
  console.error('Missing TOKBOX_API_KEY or TOKBOX_SECRET');
  console.error('Find the appropriate values for these by logging into your TokBox Dashboard at: https://tokbox.com/account/#/');
  console.error('Then add them to ', path.resolve('.env'), 'or as environment variables');
  console.error('');
  console.error('=========================================================================================================');
  process.exit();
}

var OpenTok = require('opentok');
var opentok = new OpenTok(apiKey, secret);

// replace these values with those generated in your TokBox Account
//var apiKey = "46043582";
//var sessionId = "2_MX40NjA0MzU4Mn5-MTUxNjQ3OTM1OTgzOH4zKzFGQVFTa08xN0dKODU3OGFZNlIrWGl-fg";
//var token = "T1==cGFydG5lcl9pZD00NjA0MzU4MiZzaWc9MDAzYjVjYmI1MDVjZmNkZjZlODc0NGM4YjQ5ODZmY2JjMTI3N2VmYTpzZXNzaW9uX2lkPTJfTVg0ME5qQTBNelU0TW41LU1UVXhOalEzT1RNMU9UZ3pPSDR6S3pGR1FWRlRhMDh4TjBkS09EVTNPR0ZaTmxJcldHbC1mZyZjcmVhdGVfdGltZT0xNTE2NDc5MzgwJm5vbmNlPTAuMzU5NjA0OTk4NTAxMTQyNyZyb2xlPW1vZGVyYXRvciZleHBpcmVfdGltZT0xNTE3MDg0MTgxJmluaXRpYWxfbGF5b3V0X2NsYXNzX2xpc3Q9";


// IMPORTANT: roomToSessionIdDictionary is a variable that associates room names with unique
// unique sesssion IDs. However, since this is stored in memory, restarting your server will
// reset these values if you want to have a room-to-session association in your production
// application you should consider a more persistent storage

var roomToSessionIdDictionary = {};
var classToSessionIdDictionary = {};
var liveVideos = [];

// returns the room name, given a session ID that was associated with it
function findRoomFromSessionId(sessionId) {
  return _.findKey(roomToSessionIdDictionary, function (value) { return value === sessionId; });
}

var count = 0;

router.get('/', function (req, res) {
  res.render('joinRoom', {
    title: 'ExplaNation',
    liveList: liveVideos,
  });
});

router.get('/aboutus', function (req, res) {
  res.render('aboutus');
});

//create a random string for the class name
router.get('/createname', function (req, res) {
  var newstring = '/classroom/';

  //create a random string
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++)
    newstring += possible.charAt(Math.floor(Math.random() * possible.length));

  //newstring += "astring";

  //redirect to create classroom in form /classroom/:classname
  res.redirect(newstring);

});

// create a route that points to a classroom's view
router.get('/classroom/:classname', function (req, res) {
  var className = req.params.classname;
  var sessionId;
  var token;

  // if the room name is associated with a session ID, fetch that
  if (classToSessionIdDictionary[className]) {
    console.log('classroom exists');
    sessionId = classToSessionIdDictionary[className];

    // generate token
    token = opentok.generateToken(sessionId);
    console.log('id: ' + sessionId);

    res.render('student', {
      name: className,
      sessionId: classToSessionIdDictionary[className],
      token: token
    });

    //    res.render('classroom', {
    //      name: className,
    //      sessionId: classToSessionIdDictionary[className],
    //      token: token
    //    });
  }
  // if this is the first time the room is being accessed, create a new session ID
  else {
    console.log('new classroom');
    opentok.createSession({ mediaMode: 'routed' }, function (err, session) {
      if (err) {
        console.log(err);
        res.status(500).send({ error: 'createSession error:' + err });
        return;
      }

      // now that the room name has a session associated wit it, store it in memory
      // IMPORTANT: Because this is stored in memory, restarting your server will reset these values
      // if you want to store a room-to-session association in your production application
      // you should use a more persistent storage for them
      classToSessionIdDictionary[className] = session.sessionId;

      // generate token
      //token = opentok.generateToken({ role: 'moderator' }, session.sessionId);
      token = opentok.generateToken(session.sessionId);

      console.log('token sending: ' + token);

      //push name onto livevideos list
      liveVideos.push({ name: className, link: "/classroom/" + className });
      console.log("videos: " + liveVideos);


      res.render('classroom', {
        name: className,
        sessionId: classToSessionIdDictionary[className],
        token: token
      });

    });
  }

});


/**
 * GET /session redirects to /room/session
 */
router.get('/session', function (req, res) {
  res.redirect('/room/session');
});




/**
 * GET /room/:name
 */
router.get('/room/:name', function (req, res) {
  var roomName = req.params.name;
  var sessionId;
  var token;
  console.log('attempting to create a session associated with the room: ' + roomName);

  // if the room name is associated with a session ID, fetch that
  if (roomToSessionIdDictionary[roomName]) {
    sessionId = roomToSessionIdDictionary[roomName];

    // generate token
    token = opentok.generateToken(sessionId);
    res.setHeader('Content-Type', 'application/json');
    res.send({
      apiKey: apiKey,
      sessionId: sessionId,
      token: token
    });
  }
  // if this is the first time the room is being accessed, create a new session ID
  else {
    opentok.createSession({ mediaMode: 'routed' }, function (err, session) {
      if (err) {
        console.log(err);
        res.status(500).send({ error: 'createSession error:' + err });
        return;
      }

      // now that the room name has a session associated wit it, store it in memory
      // IMPORTANT: Because this is stored in memory, restarting your server will reset these values
      // if you want to store a room-to-session association in your production application
      // you should use a more persistent storage for them
      roomToSessionIdDictionary[roomName] = session.sessionId;

      // generate token
      token = opentok.generateToken(session.sessionId);
      res.setHeader('Content-Type', 'application/json');
      res.send({
        apiKey: apiKey,
        sessionId: session.sessionId,
        token: token
      });
    });
  }
});

/**
 * POST /archive/start
 */
router.post('/archive/start', function (req, res) {
  var json = req.body;
  var sessionId = json.sessionId;
  opentok.startArchive(sessionId, { name: findRoomFromSessionId(sessionId) }, function (err, archive) {
    if (err) {
      console.error('error in startArchive');
      console.error(err);
      res.status(500).send({ error: 'startArchive error:' + err });
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(archive);
  });
});

/**
 * POST /archive/:archiveId/stop
 */
router.post('/archive/:archiveId/stop', function (req, res) {
  var archiveId = req.params.archiveId;
  console.log('attempting to stop archive: ' + archiveId);
  opentok.stopArchive(archiveId, function (err, archive) {
    if (err) {
      console.error('error in stopArchive');
      console.error(err);
      res.status(500).send({ error: 'stopArchive error:' + err });
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(archive);
  });
});

/**
 * GET /archive/:archiveId/view
 */
router.get('/archive/:archiveId/view', function (req, res) {
  var archiveId = req.params.archiveId;
  console.log('attempting to view archive: ' + archiveId);
  opentok.getArchive(archiveId, function (err, archive) {
    if (err) {
      console.error('error in getArchive');
      console.error(err);
      res.status(500).send({ error: 'getArchive error:' + err });
      return;
    }

    if (archive.status === 'available') {
      res.redirect(archive.url);
    } else {
      res.render('view', { title: 'Archiving Pending' });
    }
  });
});

/**
 * GET /archive/:archiveId
 */
router.get('/archive/:archiveId', function (req, res) {
  var archiveId = req.params.archiveId;

  // fetch archive
  console.log('attempting to fetch archive: ' + archiveId);
  opentok.getArchive(archiveId, function (err, archive) {
    if (err) {
      console.error('error in getArchive');
      console.error(err);
      res.status(500).send({ error: 'getArchive error:' + err });
      return;
    }

    // extract as a JSON object
    res.setHeader('Content-Type', 'application/json');
    res.send(archive);
  });
});

/**
 * GET /archive
 */
router.get('/archive', function (req, res) {
  var options = {};
  if (req.query.count) {
    options.count = req.query.count;
  }
  if (req.query.offset) {
    options.offset = req.query.offset;
  }

  // list archives
  console.log('attempting to list archives');
  opentok.listArchives(options, function (err, archives) {
    if (err) {
      console.error('error in listArchives');
      console.error(err);
      res.status(500).send({ error: 'infoArchive error:' + err });
      return;
    }

    // extract as a JSON object
    res.setHeader('Content-Type', 'application/json');
    res.send(archives);
  });
});

module.exports = router;
