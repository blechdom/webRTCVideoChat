const express = require('express')
var io = require('socket.io')
    ({
        path: '/webrtc',
        pingInterval: 60000,
        pingTimeout: 25000
    })

const app = express()
const port = 8080
app.use(express.static(__dirname + '/build'))

app.get('/', (req, res, next) => {

    res.sendFile(__dirname + '/build/index.html')
})

app.get('/callcut', (req, res) => {
    res.sendFile(__dirname + '/build/callcut.html')
})


// import packages
const https = require('https');
const fs = require('fs');

// const server = https.createServer({
//     key: fs.readFileSync('/etc/letsencrypt/live/jepreventivescreening.com/privkey.pem'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/jepreventivescreening.com/fullchain.pem'),
// }, app);

// server.listen(port, () => {
//     console.log('HTTPS Server running on port ' + port);
// });
const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`))


io.listen(server)

const peers = io.of('/webrtcPeer')

// keep a reference of all socket connections
let connectedPeers = new Map()
//keping a reference of all the connections and there passstrings
let socketidpassstring = new Map()

peers.on('connection', socket => {
    //doctor notification
    checkfordoctornotification = (passstring, data) => {
        var comparepassstring = passstring.split("-")[1]
        for (const [socketID, socket] of connectedPeers.entries()) {
            console.log("checkfordoctornotification");
            var tempstring = socketidpassstring.get(socketID)
            if (tempstring !== undefined) {
                var passString = tempstring.split('-')[1];
                var role = tempstring.split('-')[0];
                // don't send to self
                console.log("comparepassstring" + comparepassstring);
                console.log("passString" + passString);

                console.log("socketID" + socketID);
                console.log("data.socketID" + data.socketID);

                console.log("tempstring" + tempstring);

                if ((socketID !== data.socketID) && (comparepassstring == passString)) {
                    console.log("ENTERED");
                    //find the doctor specified or the patient specified
                    console.log(socketID);
                    socket.emit('notifydoctorforpatient', data)
                    //notify patient for the doctor notification
                }
            } else {
                // notify patient that doctor is not arrived
                console.log("found undefined, everything fine notification not sent to any one ");
            }

        }
    }

    console.log(socket.id)
    // console.log(socket);
    socket.emit('connection-success', {
        success: {
            socket_id: socket.id,
        }
    })

    connectedPeers.set(socket.id, socket)

    socket.on('passString', (data) => {
        console.log("passstring_______________");
        console.log(data.socketID);
        socketidpassstring.set(socket.id, data.passstring)
        console.log(socketidpassstring);
        checkfordoctornotification(data.passstring, data)
    })

    socket.on('disconnect', () => {
        console.log('A USER JUST DISCONNECTED')
        console.log('REMAINING USERS')
        connectedPeers.delete(socket.id)
        socketidpassstring.delete(socket.id)
        console.log(socketidpassstring);
    })

    socket.on('offerOrAnswer', (data) => {
        console.log("offer or answer");
        // send to the other peer(s) if any
        for (const [socketID, socket] of connectedPeers.entries()) {
            console.log("OFFERORANSWER");
            var tempstring = socketidpassstring.get(socketID)
            if (tempstring !== undefined) {
                console.log("not found undefined");
                var passString = socketidpassstring.get(socketID).split('-')[1];
                // don't send to self
                if ((socketID !== data.socketID) && (passString == data.passstring.split('-')[1])) {
                    console.log("sent offer to peer_____________________________________________________________");
                    //find the doctor specified or the patient specified
                    console.log(socketID);
                    socket.emit('offerOrAnswer', data.payload)
                }
            } else {
                console.log("found undefined");
            }
        };
    });


    socket.on('candidate', (data) => {
        // send candidate to the other peer(s) if any
        console.log("mitted candiate");
        for (const [socketID, socket] of connectedPeers.entries()) {
            // don't send to self
            if (socketID !== data.socketID) {
                console.log(socketID, data.payload)
                socket.emit('candidate', data.payload)
            }
        }
    });

})
