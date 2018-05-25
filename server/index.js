/**
 *
 * The MIT License (MIT)
 *
 * http://block0.org
 *
 * Copyright (c) 2016-present Jollen
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

'use strict';

/**
 * WebSocket server framework
 */
var WebsocketBroker = require("./broker")
    , WebsocketRouter = require("./router")
    , WebsocketRequestHandlers = require("./requestHandlers")
    , dl  = require('delivery');

var jsonfile = require('jsonfile');


/**
 * RPC node
 */
var Node = require('./node');

var RpcMessage = require('./message');

/**
 * RPC utils
 */
var RpcUtils = require('../utils');
var serialize = JSON.stringify;
var deserialize = JSON.parse;
var fs=require('fs');

/**
 * Miscutils
 */
var merge = require('utils-merge');
var uuid = require('uuid');
var util = require('util');
var WebSocketClient = require('websocket').client;

/**
 * WebSocket URL Router
 */
var wsHandlers = {
    "/node/([A-Za-z0-9-]+)/receive": WebsocketRequestHandlers.receive
};

/*
 * Constructor - bind a Chord node
 *
 * @param {Object} Chord server
 */
function Server() {
    
    var fs = require('fs'); 
    var file = __dirname+'/../config.json';
    var data=fs.readFileSync(file, 'utf8');
    var obj = JSON.parse(data);

    this.port = process.env.PORT || obj.table[0].Server.port;
    this.host = process.env.HOST || obj.table[0].Server.ip;

    // initliaze the public attributes
    this.nodes = {};

    // initialize the private attributes
    this._options = {};

    // Create a unique ID for the new node.
    var id = RpcUtils.hash(uuid.v4());

    // Create a new Chord node with the ID
    var node = new Node(id, this);

    // The Node instances
    this.node = this.nodes[id] = node;
    this.last_node = id;
};

/**
 * The server event handlers
 */
Server.prototype.onData = function(payload) {
    // Parse the data received from Chord node (WebSocket client)
    var packet = deserialize(payload.data);

    if(typeof(packet.message.bloc) != "undefined"){
        return this._options.onmessage(payload);
    }
    // Request URI
    var pathname = payload.pathname;

    // Event callbacks
    if (typeof this._options.onmessage === 'function' && packet.message.type === RpcMessage.NEW_NODE) {
        return this._options.onmessage(payload);
    }

    if (typeof this._options.onmessage === 'function' && packet.message.type === RpcMessage.MESSAGE) {
        return this._options.onmessage(payload);
    }

    if (typeof this._options.onmessage === 'function' && packet.message.type === RpcMessage.SYNCHRONISATION) {
        return this._options.onmessage(payload);
       
    }

    if (typeof this._options.onmessage === 'function' && packet.message.type === RpcMessage.RECEIVEBLOCKCHAIN) {
       return this._options.onmessage(payload); 
    }
    
    if (typeof this._options.onmessage === 'function' && packet.message.type === RpcMessage.REQUESTTOKEN) {
       return this._options.onmessage(payload); 
    }

    if (typeof this._options.onmessage === 'function' && packet.message.type === RpcMessage.VALIDATION) {
       return this._options.onmessage(payload); 
    }

    if (typeof this._options.onmessage === 'function' && packet.message.type === RpcMessage.REQUESTACCESS) {
       return this._options.onmessage(payload); 
    }

    if (typeof this._options.onmessage === 'function' && packet.message.type === RpcMessage.RECEIVETRANSACTION) {
       return this._options.onmessage(payload); 
    }

    if (typeof this._options.onmessage === 'function' && packet.message.type === RpcMessage.RESPONSEVALIDATIONTRANSACTION) {
       return this._options.onmessage(payload); 
    }

    if (typeof this._options.onmessage === 'function' && packet.message.type === RpcMessage.INSERTRANSACTION) {
       return this._options.onmessage(payload); 
    } 

    if (typeof this._options.onmessage === 'function' && packet.message.type === RpcMessage.UPDATEACCESSRIGHTS) {
       return this._options.onmessage(payload); 
    }

    if (typeof this._options.onmessage === 'function' && packet.message.type === RpcMessage.SIGNEDMESSAGE) {
       return this._options.onmessage(payload); 
    }

    if (typeof this._options.onmessage === 'function' && packet.message.type === RpcMessage.ELECTEDMINER) {
       return this._options.onmessage(payload); 
    }
   
    /*
     * Format of 'packet'.
     *
     *  { message: { type: 0, id: '77c44c4f7bd4044129babdf235d943ff25a1d5f0' },
     *  from: { id: '77c44c4f7bd4044129babdf235d943ff25a1d5f0' } }
     */

    // Get last node's instance by ID
    var to = this.nodes[this.last_node];

    // Forward the message
    if (packet.to) {
        // Forward this message to the node ID
        to = this.nodes[packet.to];
    }

    // Get node instance by ID
    if (to) {
        to.dispatch(packet.from, packet.message);
    }
};

/**
 * Start a Websocket server.
 *
 * @return {None}
 * @api public
 */
Server.prototype.start = function(options) {
    var options = options || {};

    for (var prop in options) {
        if (options.hasOwnProperty(prop)
            && typeof(this._options[prop]) === 'undefined') {
            this._options[prop] = options[prop];
        }
    }

    // Prepare to start Websocket server
    var server = new WebsocketBroker({
        port: this.port,
        host: this.host
    });

    var router = new WebsocketRouter();

    // Start the protocol layer.
    server.on('data', this.onData.bind(this));

    // Join existing node
    if (typeof options.join === 'object') {
        this.node.join(options.join);
    }

    server.start(router.route, wsHandlers);
    // Event callbacks
    if (typeof this._options.onstart === 'function') {
        this._options.onstart(this.node);
    }
};

/**
 * Send a RPC message.
 *
 * @param {Object} { address: '127.0.0.1', port: 8000 }
 * @param {Object} { type: 2, id: 'b283326930a8b2baded20bb1cf5b6358' }
 * @return {None}
 * @api public
 */
var connections = [];

Server.prototype.sendMessage = function(to, packet) {
    var uri = util.format('ws://%s:%s/node/%s/receive', to.address, to.port, packet.message.id);
    var host = util.format('ws://%s:%s', to.address, to.port);
    var payload = {
        message: packet.message,
        from: packet.from
    };
    var connection = connections[host] || null;

    if (RpcUtils.DebugServer)
        console.info('send to ' + uri);

    if (connection) {
        if (connection.connected) {
            connection.sendUTF(JSON.stringify(payload));
        } else {
            delete connections[host];
        }

        return 0;
    }

    var client = new WebSocketClient();

    client.on('connect', function(connection) {
        if (connection.connected) {
            connection.sendUTF(JSON.stringify(payload));
            connections[host] = connection;
        } else {
            delete connections[host];
        }
    });

    client.connect(uri, '');
};


/**
 * Create the server instance and connect to a subsequent Chord node
 */
var server = new Server();

function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

/**
 * Export the server.
 */
module.exports = server;
