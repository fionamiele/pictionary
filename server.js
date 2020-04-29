'use strict';

const express = require('express');
const socketIO = require('socket.io');

const port = process.env.PORT || 3000;

const index = '/pictionary.html';

const server = express()
  .use((req, res) => res.sendFile(index, { root: __dirname }))
  .listen(port, () => console.log('Listening on port', port));


const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('A new client joined the server');
  onConnection(socket);
});

let users = [];
// qui dessine en ce mmt, valeur par défaut nulle
let currentPlayer = null;
let timeout;
let words = ['apple', 'banana', 'coco'];

function onConnection (socket) {
  socket.on('username', (username) => {
    console.log('Client name : ', username);
    socket.username = username;

    if(users.length === 0) {
      currentPlayer = socket;
      timeout = clearTimeout(timeout);
      // 20000 millisec
      users.push(socket);
      switchPlayer();
    }else{
      users.push(socket);
    }
    sendUsers();
  });

  // socket est celui qui est connecté (utilisateur qui vient fe la fct onconnection)

  socket.on('line', (data) => {
    socket.broadcast.emit('line', data);
  });

  socket.on('disconnect', () => {
    users = users.filter((user) => {
      // ça veut dire : est-ce que le socket n'est pas égal à socket
      return user !== socket;
    });
    sendUsers();
    if (users.length === 0) {
      timeout = clearTimeout(timeout);
    }
  });
}

function sendUsers () {
  io.emit('users', users.map((user) => {
    return {
      username: user.username,
      active: user === currentPlayer
    };
  }))
}

function switchPlayer () {
  // si plus pers ne joue on arrête
  if(users.length === 0) return;

  // passer au joueur suivant (chacun son tour)
  const indexCurrentPlayer = users.indexOf(currentPlayer);
  // ds un tableau de 3 valeurs c 0 1 2 et pas 1 2 3 c pr ça le calcul
  // exemple
  // users = [a, b, c]
  // currentPlayer = a
  currentPlayer = users[(indexCurrentPlayer + 1) % (users.length)];
  // currentPlayer = users[3 % 3] -> users [0] -> a



  sendUsers();
  timeout = setTimeout(switchPlayer, 20000);

  // mot aleatoire a recuperer dans le tableau le calcul c pr avoir une valeur ronde et pas 1.9999999...
  currentPlayer.emit('word', words[Math.floor(words.length * Math.random())]);
  io.emit('clear');
}
