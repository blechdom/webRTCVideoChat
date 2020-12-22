# webRtcVideoChat
A Peer to Peer Video chat application using webRTC Node.js and Socket.Io With React.

-A Peer to peer Video chat application using webRTC and socket.Io.
-User only needs to enter the meeting id which can be string of any character which is unique in the system.
-User can Mute Audio / Video and Hang up call.
-No need of any app or extension to be downloaded.
-Scalable fast and reliable.
-Deigned to  handle multiple requests at same time.
-Using React.js to handle client side.
-Using Node.js server which is maintaining the peers and socket connections.

Three steps to up and go live.
```
        npm install
        npm run build
        npm start
```
Go to http://localhost:8080
User One or Caller would have a meeting prefix with 'C-[RANDOM ID]' (For ex - 'C-abcd34df' or 'C-GJJFH' etc)
User Two or Receaver would have a meeting prefix with 'R-[RANDOM ID AS YOU LIKE]' (For ex - 'R-abcd34df' or 'R-GJJFH' etc)

NOTE : The suffix of both the client would have to be same in order to connect i.e meeting id would be same except the Prefixes whic R and C respectiveley
