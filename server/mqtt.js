var mosca = require('mosca');

var moscaSetting = {
    interfaces: [
        { type: "mqtt", port: 1883 },
        { type: "http", port: 3000, bundle: true }
    ],
    stats: false,
    onQoS2publish: 'noack', // can set to 'disconnect', or to 'dropToQoS1' if using a client which will eat puback for QOS 2; e.g. mqtt.js

    logger: { name: 'IoTChain MQTT Server', level: 'debug' }
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
var mqttserver = new mosca.Server(moscaSetting);

 mqttserver.on('ready', setup);

function setup() {
    mqttserver.authenticate = authenticate;
    mqttserver.authorizePublish = authorizePublish;
    mqttserver.authorizeSubscribe = authorizeSubscribe;
    
    console.log('IoTChain server is up and running.');
}

mqttserver.on("error", function (err) {
    console.log(err);
});

mqttserver.on('clientConnected', function (client) {
    console.log('Client Connected \t:= ', client.id);
});

mqttserver.on('published', function (packet, client) {
    console.log("Published :=", packet);
});

mqttserver.on('subscribed', function (topic, client) {
    console.log("Subscribed :=", client.packet);
});

mqttserver.on('unsubscribed', function (topic, client) {
    console.log('unsubscribed := ', topic);
});

mqttserver.on('clientDisconnecting', function (client) {
    console.log('clientDisconnecting := ', client.id);
});

mqttserver.on('clientDisconnected', function (client) {
    console.log('Client Disconnected     := ', client.id);
});