const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express')
const socketio = require('@feathersjs/socketio')

//A messages service that allows to create new
//and return all existing messages

class MessageService{
    constructor() {
        this.messages = []
    }
    async find () {
        //Just return all our messages
        return this.messages;
    }
    async create (data) {
        //The new message is the data merged with a unique identifier
        //using the messages length since it changes whenever we add one
        const message = {
            id: this.messages.length,
            text: data.text
        }

        //Add new message to the list
        this.messages.push(message);

        return message;
    }
}

// Creates an ExpressJS compatible Feathers application
const app = express(feathers());

// Parse HTTP JSON bodies
app.use(express.json());
// Parse URL-encoded params
app.use(express.urlencoded({ extended: true }));
// Host static files from the current folder
app.use(express.static(__dirname));
// Add REST API support 
app.configure(express.rest());
// Configure Socket.io real-time APIs
app.configure(socketio());
// Register a in-memory messages service
app.use('/messages', new MessageService());
// Register a nicer error handler than the default Express one
app.use(express.errorHandler());

// Add any new real-time connection to the `everybody` channel
app.on('connection', connection => 
app.channel('everybody').join(connection)
);
// Public all events to the 'everybody' channel
app.publish(data => app.channel('everybody'));

// Start the server
app.listen(3030).on('listening', () => 
console.log('Feathers server listening on localhost:3030')
);

// For good measure let's create a message
// So our API doesn't look so empty
app.service('messages').create({
    text: 'Hello world from the server'
});

// Register the message service on the Feathers application
app.use('messages', new MessageService());

// Log every time a new message has been created
app.service('messages').on('created', message => {
    console.log('A new message has been created', message);
});

// A function that creates new messages and then logs
// all existing messages
const main = async () => {
    //Create a new message on our message service
    await app.service('messages').create({
        text: 'Hello Feathers'
    });

    await app.service('messages').create({
        text: 'Hello again'
    })

    // Find all existing messages
    const messages = await app.service('messages').find();

    console.log('All messages', messages);
}

main();