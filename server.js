 
var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  fs = require('fs'),
  mysql = require('mysql'),
  connectionsArray = [],
  connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Uskudar8@',
    database: 'idealdesk1',
    port: 3306
  }),
  POLLING_INTERVAL = 3000,
  POLLING_INTERVAL1 = 3000,
  pollingTimer;

// If there is an error connecting to the database
connection.connect(function(err) {
  // connected! (unless `err` is set)
  if (err) {
    console.log(err);
  }
});
// creating the server ( localhost:8000 )
app.listen(8000);
// on server started we can load our client.html page
function handler(req, res) {
  fs.readFile(__dirname + '/client.php', function(err, data) {
    if (err) {
      console.log(err);
      res.writeHead(500);
      return res.end('Error loading client.html');
    }
    res.writeHead(200);
    res.end(data);
  });  
}

/*
 *
 * HERE IT IS THE COOL PART
 * This function loops on itself since there are sockets connected to the page
 * sending the result of the database query after a constant interval
 *
 */

var pollingLoop = function() {

  // Doing the database query
    var query = connection.query('SELECT Round(Sum(CASE WHEN Month(created)= 1 THEN total ELSE 0 END),2) AS Jan, Round(Sum(CASE WHEN Month(created)= 2 THEN total ELSE 0 END),2) AS Feb, Round(Sum(CASE WHEN Month(created)= 3 THEN total ELSE 0 END),2) AS Mar, Round(Sum(CASE WHEN Month(created)= 4 THEN total ELSE 0 END),2) AS Apr, Round(Sum(CASE WHEN Month(created)= 5 THEN total ELSE 0 END),2) AS May, Round(Sum(CASE WHEN Month(created)= 6 THEN total ELSE 0 END),2) AS Jun, Round(Sum(CASE WHEN Month(created)= 7 THEN total ELSE 0 END),2) AS Jul, Round(Sum(CASE WHEN Month(created)= 8 THEN total ELSE 0 END),2) AS Aug, Round(Sum(CASE WHEN Month(created)= 9 THEN total ELSE 0 END),2) AS Sep, Round(Sum(CASE WHEN Month(created)=10 THEN total ELSE 0 END),2) AS Oct, Round(Sum(CASE WHEN Month(created)=11 THEN total ELSE 0 END),2) AS Nov, Round(Sum(CASE WHEN Month(created)=12 THEN total ELSE 0 END),2) AS `Dec` FROM 2salesorder WHERE status= "Sale" AND deleted = 0  AND DATE_FORMAT(created,\'%Y\')=2016'),
    users = []; // this array will contain the result of our db query
  // setting the query listeners
  query
    .on('error', function(err) {
      // Handle error, and 'end' event will be emitted after this as well
      console.log(err);
      updateSockets(err);
    })
    .on('result', function(user) {
      // it fills our array looping on each user row inside the db

     users.push(user);
     //console.log(users);
    })
    .on('end', function() {
      // loop on itself only if there are sockets still connected
      if (connectionsArray.length) {

        pollingTimer1 = setTimeout(pollingLoop, POLLING_INTERVAL1);

        updateSockets({
          users: users
        });
      } else {

        console.log('The server timer was stopped because there are no more socket connections on the app')

      }
    });
};

var pollingLoop1 = function() {

  // Doing the database query
   var query = connection.query('SELECT Round(Sum(CASE WHEN Month(created)= 1 THEN total ELSE 0 END),2) AS Jan, Round(Sum(CASE WHEN Month(created)= 2 THEN total ELSE 0 END),2) AS Feb, Round(Sum(CASE WHEN Month(created)= 3 THEN total ELSE 0 END),2) AS Mar, Round(Sum(CASE WHEN Month(created)= 4 THEN total ELSE 0 END),2) AS Apr, Round(Sum(CASE WHEN Month(created)= 5 THEN total ELSE 0 END),2) AS May, Round(Sum(CASE WHEN Month(created)= 6 THEN total ELSE 0 END),2) AS Jun, Round(Sum(CASE WHEN Month(created)= 7 THEN total ELSE 0 END),2) AS Jul, Round(Sum(CASE WHEN Month(created)= 8 THEN total ELSE 0 END),2) AS Aug, Round(Sum(CASE WHEN Month(created)= 9 THEN total ELSE 0 END),2) AS Sep, Round(Sum(CASE WHEN Month(created)=10 THEN total ELSE 0 END),2) AS Oct, Round(Sum(CASE WHEN Month(created)=11 THEN total ELSE 0 END),2) AS Nov, Round(Sum(CASE WHEN Month(created)=12 THEN total ELSE 0 END),2) AS `Dec` FROM 2salesorder WHERE status= "Sale" AND deleted = 0  AND DATE_FORMAT(created,\'%Y\')=2017'),
    users = []; // this array will contain the result of our db query
  // setting the query listeners
  query
    .on('error', function(err) {
      // Handle error, and 'end' event will be emitted after this as well
      console.log(err);
      updateSockets1(err);
    })
    .on('result', function(user) {
      // it fills our array looping on each user row inside the db

     users.push(user);
     //console.log(users);
    })
    .on('end', function() {
      // loop on itself only if there are sockets still connected
      if (connectionsArray.length) {
        pollingTimer1 = setTimeout(pollingLoop1, POLLING_INTERVAL1);
        updateSockets1({
          users: users
        });
      } else {
        console.log('The server timer was stopped because there are no more socket connections on the app')
            }
    });
};



// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function(socket) {


  console.log('Number of connections:' + connectionsArray.length);
  // starting the loop only if at least there is one user connected
  if (!connectionsArray.length) {
    pollingLoop();
    pollingLoop1();
    //pollingLoop2();
  }

  socket.on('disconnect', function() {
    var socketIndex = connectionsArray.indexOf(socket);
    console.log('socketID = %s got disconnected', socketIndex);
    if (~socketIndex) {
      connectionsArray.splice(socketIndex, 1);
    }
  });

  console.log('A new socket is connected!');
  connectionsArray.push(socket);

});

var updateSockets = function(data) {
  // adding the time of the last update
  data.time = new Date();
  console.log('Pushing new data to the clients connected on 1st row( connections amount = %s ) - %s', connectionsArray.length , data.time);
  // sending new data to all the sockets connected
  connectionsArray.forEach(function(tmpSocket) {
    tmpSocket.volatile.emit('notification', data);
  });
  
};

var updateSockets1 = function(data) {
  // adding the time of the last update
  //data.time = new Date();
  console.log('Pushing new data to the clients connected on 2nd row ( connections amount = %s ) ', connectionsArray.length );
  // sending new data to all the sockets connected
  connectionsArray.forEach(function(tmpSocket) {
    tmpSocket.volatile.emit('notification1', data);
  });
  
};

console.log('Please use your browser to navigate to http://localhost:8000');
  



