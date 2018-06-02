var mosca = require('mosca');

var pubsubSettings = {
    /* For AMQP */
    type: 'amqp',
    json: false,
    amqp: require('amqp'),
    exchange: 'amq.topic'
};

var moscaSetting = {
    interfaces: [
        { type: "mqtt", port: 1883 },
        { type: "http", port: 3000, bundle: true }
    ],
    stats: false,
    onQoS2publish: 'noack', // can set to 'disconnect', or to 'dropToQoS1' if using a client which will eat puback for QOS 2; e.g. mqtt.js

    logger: { name: 'IoTChainServer', level: 'debug' },

    persistence: { factory: mosca.persistence.Redis, url: 'localhost:6379', ttl: { subscriptions: 1000 * 60 * 10, packets: 1000 * 60 * 10 } },

    backend: pubsubSettings,
};

var authenticate = function (client, username, password, callback) {
    if (username == "test" && password.toString() == "test")
        callback(null, true);
    else
        callback(null, false);
}

var authorizePublish = function (client, topic, payload, callback) {
    var auth = true;
    // set auth to :
    //  true to allow 
    //  false to deny and disconnect
    //  'ignore' to puback but not publish msg.
    callback(null, auth);
}

var authorizeSubscribe = function (client, topic, callback) {
    var auth = true;
    // set auth to :
    //  true to allow
    //  false to deny 
    callback(null, auth);
}

var server = new mosca.Server(moscaSetting);

server.on('ready', setup);

function setup() {
    server.authenticate = authenticate;
    server.authorizePublish = authorizePublish;
    server.authorizeSubscribe = authorizeSubscribe;
    
    console.log('IoTChain server is up and running.');
}

server.on("error", function (err) {
    console.log(err);
});

server.on('clientConnected', function (client) {
    console.log('Client Connected \t:= ', client.id);
});

server.on('published', function (packet, client) {
    console.log("Published :=", packet);
});

server.on('subscribed', function (topic, client) {
    console.log("Subscribed :=", client.packet);
});

server.on('unsubscribed', function (topic, client) {
    console.log('unsubscribed := ', topic);
});

server.on('clientDisconnecting', function (client) {
    console.log('clientDisconnecting := ', client.id);
});

server.on('clientDisconnected', function (client) {
    console.log('Client Disconnected     := ', client.id);
});