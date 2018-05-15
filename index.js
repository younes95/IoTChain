var server = require('./server');
var Miner = require('./libs/mining');
var fs = require('fs'); 
var shortid = require('shortid');
var crypto = require("crypto");
var eccrypto = require("eccrypto");
// Import genesis block
var block = require('./libs/genesis');

// Create a new miner and start to mine
var miner = new Miner();
var RpcUtils = require('./utils');
var RPCMessage = require('./server/message');

// Import transaction classes
Transaction = require('./transaction/transaction');
TransactionConfig = require('./transaction/transaction_config');
TransactionRequest= require('./transaction/transaction_request');
TransactionInfo = require('./transaction/transaction_info');
TransactionAction = require('./transaction/transaction_action');
Token = require('./transaction/token');


var onmessage = function(payload) {
   
    data=JSON.parse(payload.data);
    message=data.message;
    var obj = {
                table: []
            };
     var objToSend = {
                table: []
            };

     //Receiving new Node info
    if(message.type == 2){
        console.log('Broadcast success !! ');/*
        var NodeReceived=message.Node;
        var fileAdresses=__dirname+'/tmp/node/adresses.json';
        console.log('Nouveau noeud reçu '+ NodeReceived.Key.publicKey);
        var dataAdresses= fs.readFileSync(fileAdresses,'utf8');
        var objAdresses={
            table : []
        };
        var jsonAdresses;

        // Save the node address        
        if(NodeReceived.length != 0){
            
            if(dataAdresses.length != 0){
                var objAdresses = JSON.parse(dataAdresses);    
            }
            var objReceived = NodeReceived;
            var bool = false;
                
            for(var i=0;i<objAdresses.table.length;i++){
                if(objAdresses.table[i].Node.adr == objReceived.adr) bool=true ;  
            }
                if(bool == false){
                    console.log('Nouveau noeud inseré');
                    objAdresses.table.push({Node: objReceived}); 
                    var jsonAdresses = JSON.stringify(objAdresses);
                    fs.writeFileSync(fileAdresses, jsonAdresses, 'utf8');
            }
        }

        // Save the access right of the node

        var fileAccess=__dirname+'/tmp/node/list.json';
        var listAccess=message.AccessList;
        var dataAccess=fs.readFileSync(fileAccess,'utf8');
        console.log(listAccess);
        if(dataAccess.length != 0 ){
           // fs.writeFileSync(fileAccess, '', 'utf8');
            var objAccess = JSON.parse(dataAccess);
            bool=false;
            if(listAccess.indexOf("miner") != -1){
                for(i=0;i<objAccess.table[0].miner.ressources.length;i++){
                    if(objAccess.table[0].miner.ressources[i] == NodeReceived.Key.publicKey) bool=true;
                }
                if(bool==false){
                    objAccess.table[0].miner.ressources.push(NodeReceived.Key.publicKey);
                }
            }
            
            bool=false; 
            if(listAccess.indexOf("user") != -1){
                for(i=0;i<objAccess.table[0].user.ressources.length;i++){
                    if(objAccess.table[0].user.ressources[i] == NodeReceived.Key.publicKey) bool=true;
                }
                if(bool==false){
                    objAccess.table[0].user.ressources.push(NodeReceived.Key.publicKey);
                    bool=true;  
                }
            }

            bool=false; 
            if(listAccess.indexOf("ressource") != -1){
                
                for(i=0;i<objAccess.table[0].ressource.ressources.length;i++){
                    if(objAccess.table[0].ressource.ressources[i] == NodeReceived.Key.publicKey) bool=true;
                }
                if(bool==false){
                    objAccess.table[0].ressource.ressources.push(NodeReceived.Key.publicKey);
                    bool=true;  
                }
            }
            var jsonAccess = JSON.stringify(objAccess);
            fs.writeFileSync(fileAccess, jsonAccess, 'utf8');
        }*/
    }

    // Receiving new Block
    if(message.type == 5){
        var file = __dirname + '/tmp/node/blocs/data.json';
        var blocks= message.blocs;
        
        // Save the newest blocks
        
        data= fs.readFileSync(file, 'utf8');
        var objReceived=null;
        if(data.length == 0){
            obj.table.push({Block : block});
            var json = JSON.stringify(obj);
            fs.writeFileSync(file, json, 'utf8');
        }else{
            obj = JSON.parse(data);
            objReceived=JSON.parse(blocks);
            var i=0;

            for(i=0;i<objReceived.table.length;i++){
                obj.table.push({Block : objReceived.table[i].Block});
            }
           
            var json = JSON.stringify(obj);
            fs.writeFileSync(file, json, 'utf8'); 
        }
    }
    
    // Receiving a request to synchronize
    if(message.type == 6){
       
        var fileAdresses = __dirname + '/tmp/node/adresses.json';
        var fileAccess = __dirname + '/tmp/node/list.json';
        // Test if the node exist
        var bool = existNode(message.publicKey,message.mac,fileAdresses);
       
            if(bool == true){
               
                // Get the Blockchain and send it to the node
                
                var jsonToSend=null;
                var file = __dirname + '/tmp/node/blocs/data.json';
                data=fs.readFileSync(file, 'utf8');
                if(data.length == 0){
                    data=null;
                }else{
                    var i=0;
                    obj = JSON.parse(data);
                    send=false;
                    
                    if(message.lastHash == null) send=true;
                    
                    for(i=0;i<obj.table.length;i++){
                        
                        if(send == true ){
                            objToSend.table.push({Block : obj.table[i].Block});

                        }
                        if(obj.table[i].Block.hash == message.lastHash && send == false) send = true;
                    }

                    jsonToSend = JSON.stringify(objToSend);
                }

                // Get the adresses list

                var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
                if(dataAdresses.length!=0){
                    var objAdresses= JSON.parse(dataAdresses);
                }else{
                    var objAdresses='';
                }

                // Get the access list

                var dataAccess=fs.readFileSync(fileAccess,'utf8');
                if(dataAccess.length!=0){
                    var objAccess= JSON.parse(dataAccess);
                }else{
                    var objAccess='';
                }

                var packetBlocs = {
                        from: {
                                address: server.host,
                                port: server.port,
                                id: server.id
                            },
                            message: { type: 7, blocs : jsonToSend, adresses : objAdresses, accesslist : objAccess} 
                        };
                                
                server.sendMessage({address: message.host, port: message.port},packetBlocs);
            }
    } 

    // Receiving the Blockchain
    if(message.type == 7){
       console.log('received');
        var file = __dirname + '/tmp/node/blocs/data.json';
        var fileAdresses = __dirname + '/tmp/node/adresses.json';
        var fileConfig = __dirname + '/tmp/node/config.json';
        var fileAccess = __dirname + '/tmp/node/list.json';
        var blocks= message.blocs;
        
        // Save the newest blocks
        
        data= fs.readFileSync(file, 'utf8');
        console.log('Block received '+blocks);
        var objReceived=null;
        if(data.length == 0){
            obj.table.push({Block : block});
            var json = JSON.stringify(obj);
            fs.writeFileSync(file, json, 'utf8');
        }else{
            obj = JSON.parse(data);
            objReceived=JSON.parse(blocks);
            var i=0;

            for(i=0;i<objReceived.table.length;i++){
                obj.table.push({Block : objReceived.table[i].Block});
            }
           
            var json = JSON.stringify(obj);
            fs.writeFileSync(file, json, 'utf8'); 
        }

        // Save the addresses
        var dataReceived=message.adresses;
        var dataAdresses= fs.readFileSync(fileAdresses,'utf8');
        var dataConfig = fs.readFileSync(fileConfig,'utf8');
        var objConfig = JSON.parse(dataConfig);
        var objAdresses={
            table : []
        };
        var jsonAdresses;
                
        if(dataReceived.length != 0){
            
            if(dataAdresses.length != 0){
                var objAdresses = JSON.parse(dataAdresses);    
            }
            var objReceived = dataReceived;

            for(var i=0;i<objReceived.table.length;i++){
                var bool = false;
                for(var j=0;j<objAdresses.table.length;j++){
                   if(objAdresses.table[j].Node.adr == objReceived.table[i].Node.adr) bool=true ;  
                }
                if(bool == false){
                    objAdresses.table.push({Node: objReceived.table[i].Node}); 
                    var jsonAdresses = JSON.stringify(objAdresses);
                    fs.writeFileSync(fileAdresses, jsonAdresses, 'utf8');
                }
                
            }
        }

        // Save the access list
        var listAccess = {
            table : []
        };
        var listAccessReceived=message.accesslist;
        k=0;
        if(listAccessReceived.length != 0){
            for(i=0;i<listAccessReceived.table[0].Node.length;i++){
                for(j=0;j<listAccessReceived.table[0].Node[i].accesslist.length;j++){
                    listAccess.table.push({
                    requester : listAccessReceived.table[0].Node[i].adr,
                    requested : listAccessReceived.table[0].Node[i].accesslist[j].ressource,
                    rights : listAccessReceived.table[0].Node[i].accesslist[j].rights,
                    conditions  : listAccessReceived.table[0].Node[i].accesslist[j].conditions,
                    obligations : listAccessReceived.table[0].Node[i].accesslist[j].obligations
                    });
                }
            }
        }

        saveAccessRight(fileAccess,listAccess.table);
        
        /*
        // Broadcast the adress to all the node of the network 
        
        var packet = {
                    from: {
                        address: server.host,
                        port: server.port,
                        id: server.id
                        },
                    message: { type: 2, Node : objConfig.table[0], AccessList : listAccess} 
        };
                       
        for(var i=0;i<objAdresses.table.length;i++){
            console.log('Send to '+objAdresses.table[i].Node.host);
            server.sendMessage({address: objAdresses.table[i].Node.host, port: objAdresses.table[i].Node.port},packet);
        }*/
    }    

    // Receiving new Transaction
    if(message.type == 8){
        // Insert in the BC
    }

    // Receiving transaction to validate
    if(message.type == 10){
    }

    // Receiving request token access
    if(message.type == 11){

        transactionRequest = message.transaction;
        requested=transactionRequest.transaction.requested;
        requester=transactionRequest.transaction.requester;

        // Search in the list of access rights

        var fileAccess = __dirname + '/tmp/node/list.json';
        var fileAdresses= __dirname + '/tmp/node/adresses.json';
        dataAccess= fs.readFileSync(fileAccess, 'utf8');
        var Accessbool = false;
        var bool = false;
        if(dataAccess.length!=0){

            //Search the role of the requested

            var objAccess = JSON.parse(dataAccess);
            dataAdresses= fs.readFileSync(fileAdresses, 'utf8');
            if(dataAdresses.length != 0){
                objAdresses=JSON.parse(dataAdresses);
                for(i=0;i<objAdresses.table.length;i++){
                    if(objAdresses.table[i].Node.adr == requester){
                        roleRequester=objAdresses.table[i].Node.role;
                        bool = true;
                    }
                }
            }
            
            //Search if the requested has the permission
            if(bool == true){
                if(roleRequester.desc == 'user'){
                    for(i=0;i<objAccess.table[0].user.ressources.length;i++){
                        if(objAccess.table[0].user.ressources[i] == requested) Accessbool=true;
                    }    
                }

                if(roleRequester.desc == 'miner'){
                    for(i=0;i<objAccess.table[0].miner.ressources.length;i++){
                        if(objAccess.table[0].miner.ressources[i] == requested) Accessbool=true;
                    }    
                }

                if(roleRequester.desc == 'ressource'){
                    for(i=0;i<objAccess.table[0].ressource.ressources.length;i++){
                        if(objAccess.table[0].ressource.ressources[i] == requested) Accessbool=true;
                    }    
                }
            }
                
        }
        console.log('Accessbool : '+Accessbool);
        
        if(Accessbool == true){
            //Generate a token
            var token = new Token();
            action='ACCESS'
            token.new(action,3600); 
            console.log(token.show());

            //Generate a transaction action
            transaction= new Transaction();
            transaction.new(requested,requester);
            transactionAction = new TransactionAction();
            transactionAction.new(transaction,action,token);
            console.log(transactionAction.show());

            //Broadcast it for validation
            if(dataAdresses.length != 0){
                objAdresses=JSON.parse(dataAdresses);
                for(i=0;i<objAdresses.table.length;i++){
                    var packet = {
                        from: {
                            address: server.host,
                            port: server.port,
                            id: server.id
                            },
                        message: { type: 10, transaction: transactionAction} 
                    };
                         
                    server.sendMessage({address: objAdresses.table[i].Node.host, port: objAdresses.table[i].Node.port},packet);
                }
            }
        }    
    }
};

function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

var onstart = function(node) {
    
    console.log('----- Genesis Block -----');
    console.log( JSON.stringify(block) );

    console.log('----- Start mining -----');

    var jsonfile = require('jsonfile');
    var file = __dirname+'/tmp/node/blocs/data.json';
    var fileConfig= __dirname+'/tmp/node/config.json'
    var i=0;
    var obj = {
        table: []
        };
    var objConfig = {
        table: []
        };

    var dataConfig=fs.readFileSync(fileConfig, 'utf8');

    if(dataConfig.length == 0){
        // Generate keypair for the node  
        var privateKey = crypto.randomBytes(32);
        var publicKey = eccrypto.getPublic(privateKey);

        var Key= { publicKey: toHexString(publicKey), privateKey: toHexString(privateKey) };
        var Server= { host: server.host, port: ''+server.port+'', mac : 'AIDJELJFNDEUZLMD' };
        var role = { desc: 'miner' };
    
        // Fill in the file config of the node
        objConfig.table.push({ Server: Server , Key: Key, Role: role});
        var jsonConfig = JSON.stringify(objConfig);
        fs.writeFileSync(fileConfig, jsonConfig, 'utf8');
    }else{
        // Recuperate the file config of the node
        objConfig = JSON.parse(dataConfig);
        var key= {
            publicKey : objConfig.table[0].Key.publicKey
        };
    }

    // Broadcast to all nodes of the network
 

    // Store the genesis block in the file          
    var data=fs.readFileSync(file, 'utf8');

    if(data.length == 0){
        obj.table.push({Block : block});
        var json = JSON.stringify(obj);
        fs.writeFileSync(file, json, 'utf8');
    }

var str = "message to sign";
// Always hash you message to sign!
var msg = crypto.createHash("sha256").update(str).digest();
receiveNewNode();
/*eccrypto.sign(privateKey, msg).then(function(sig) {
  console.log("Signature in DER format:", toHexString(sig));
  eccrypto.verify(publicKey, msg, sig).then(function() {
    console.log("Signature is OK");
  }).catch(function() {
    console.log("Signature is BAD");
  });
});*/
                  
               
};

function receiveNewNode(){
    var express = require('express');
    var bodyParser = require('body-parser');
    var app = express();
    app.use(bodyParser.urlencoded({ extended: true })); 
    app.use(express.static('public'));
    app.use(bodyParser.json());
    app.use(function(request, response, next) {
      response.header("Access-Control-Allow-Origin", "*");
      response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });
    
    app.all('/newNode', function(req, res) {
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
        console.log('New Node');
        var fileConfig = __dirname+'/tmp/node/config.json';
        var jsonfile = require('jsonfile');
        publicKey=configNode(req.body.ipadr,req.body.macadr,req.body.role,fileConfig);
        res.send({'publicKey' : publicKey, 'MAC': req.body.macadr, 'IP': req.body.ipadr, 'role': req.body.role });

    });
    app.post('/addnewNode', function(req, res) {
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
        console.log('Add New Node');
        var fileAdresses = __dirname+'/tmp/node/adresses.json';        
        var fileConfig = __dirname+'/tmp/node/config.json';
        objReceived=req.body;
        
        // Test if the node exist
        var bool=existNode(objReceived.publicKey,objReceived.mac,fileAdresses);
       
        var statut = 'FAIL';

        if(bool == false) {
            //node doesn't exist , save it
            port=8001;
            host='localhost';
            saveNode(objReceived.publicKey,objReceived.ip,port,objReceived.mac,host,objReceived.role,fileAdresses);

            // Save access rights of the new node
            var fileAccess=__dirname+'/tmp/node/list.json';
            var listAccess=objReceived.listAccess;     

            saveAccessRight(fileAccess,listAccess);
            var dataConfig=fs.readFileSync(fileConfig, 'utf8');
            objConfig = JSON.parse(dataConfig);
            
            if(objReceived.publicKey == objConfig.table[0].Key.publicKey) statut = 'ME';
            else statut = 'SUCCESS';
        }

         res.send({'statut' : statut});
    
    });

    app.post('/successnewNode', function(req, res) {
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
        console.log('Success New Node');
        var file = __dirname+'/tmp/node/config.json';
        var jsonfile = require('jsonfile');
        var obj = {
            table: []
            };
        
        var data=fs.readFileSync(file, 'utf8');
        obj = JSON.parse(data);
        
         if( obj.table[0].Role.desc == "miner"){
            //Get the last hash of blockchain in this node

            var file = __dirname+'/tmp/node/blocs/data.json';
            var lastHash=null;
            var data=fs.readFileSync(file, 'utf8');
                        
            if(data.length != 0){
                obj = JSON.parse(data);
                lastHash=obj.table[obj.table.length-1].Block.hash;
            }

            //Send request to synchronize
            var packet = {
                    from: {
                        address: obj.table[0].Server.host,
                        port: obj.table[0].Server.port,
                        id: server.id
                        },
                    message: { type: 6, host: server.host, port: server.port, publicKey: obj.table[0].Key.publicKey, role: obj.table[0].Role.desc, mac : obj.table[0].Server.MAC ,lastHash : lastHash} 
            };
                        
            server.sendMessage({address: '127.0.0.1', port: 8000},packet);
        }
        res.send({'statut' : 'OK'});
    
    });
    port=9002;
    app.listen(port, function() {
    });

}

function saveAccessRight(fileAccess,listAccess){
    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };

    if(dataAccess.length != 0 ){
               var objAccess = JSON.parse(dataAccess);
            
                for(i=0;i<objAccess.table[0].Node.length;i++){
                   var boolNode = false;
                    if(objAccess.table[0].Node[i].adr == objReceived.publicKey){
                        boolNode = true;
                        for(j=0;j<listAccess.length;j++){
                            boolAccess = false;
                            for(k=0;k<objAccess.table[0].Node[i].accesslist.length;k++){
                                if(listAccess[j].requested == objAccess.table[0].Node[i].accesslist[k].ressource && listAccess[j].rights == objAccess.table[0].Node[i].accesslist[k].rights) boolAccess = true;
                            }
                            if(boolAccess == false)
                              objAccess.table[0].Node[i].accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations });
                        }
                    }
                }
                if(boolNode == false){
                    for(j=0;j<listAccess.length;j++){
                        if(j == 0) {
                            var accesslist = [];
                            accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations});
                            objAccess.table[0].Node.push({ adr:listAccess[j].requester, accesslist : accesslist});
                        }else{
                            objAccess.table[0].Node[objAccess.table[0].Node.length].accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations });
                        }
                    }
                }
                var jsonAccess = JSON.stringify(objAccess);
                fs.writeFileSync(fileAccess, jsonAccess, 'utf8');   
    }else{
                for(j=0;j<listAccess.length;j++){
                    if(j == 0) {
                        var Node = [];
                        var accesslist= [];
                        accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations });
                        Node.push({ adr:listAccess[j].requester, accesslist : accesslist });
                        objAccess.table.push({ Node : Node });
                        console.log(objAccess.table);
                    }else{
                        objAccess.table[0].Node[0].accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations });
                    }
                }
                  
                var jsonAccess = JSON.stringify(objAccess);
                fs.writeFileSync(fileAccess, jsonAccess, 'utf8');
    }
}

function saveNode(publicKey,ip,port,mac,host,role,fileAdresses){
    var objAdresses = {
        table: []
        };
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    if(dataAdresses.length != 0){
        var objAdresses = JSON.parse(dataAdresses);    
    }
    objAdresses.table.push({Node: { adr : publicKey, IP : ip, port : port, MAC : mac, host : host, role : role } }); 
    var jsonAdresses = JSON.stringify(objAdresses);
    fs.writeFileSync(fileAdresses, jsonAdresses, 'utf8');
}

function existNode(publicKey,mac,fileAdresses){
    var objAdresses = {
        table: []
        };
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    var bool= false;
    if(dataAdresses.length != 0 ){
        objAdresses = JSON.parse(dataAdresses);

        for(i=0;i<Object.keys(objAdresses.table).length;i++){
            //Test adress mac and public key if exist
            if(objAdresses.table[i].Node.adr == publicKey) bool=true;
            if(objAdresses.table[i].Node.MAC == mac) bool=true;
        }
    }
    return bool;
}

function configNode(ip,mac,role,fileConfig){
    var obj = {
            table: []
        };
        
    var dataConfig=fs.readFileSync(fileConfig, 'utf8');
    objConfig = JSON.parse(dataConfig);
    var Key= {
        publicKey : objConfig.table[0].Key.publicKey
    };
    objConfig.table[0].Server.IP = ip;
    objConfig.table[0].Server.MAC = mac;
    objConfig.table[0].Role.desc = role;
    var jsonConfig = JSON.stringify(objConfig);
    fs.writeFileSync(fileConfig, jsonConfig, 'utf8');

    return Key.publicKey;
}

/**
 * Create a mining node.
 */
server.start({
    onstart: onstart,
	onmessage: onmessage,
});
