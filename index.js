var server = require('./server');
var Miner = require('./libs/mining');
var fs = require('fs'); 
var shortid = require('shortid');
var crypto = require("crypto");
var eccrypto = require("eccrypto");
// Import genesis block
var block = require('./libs/genesis');
var Block = require('./libs/block');
// Create a new miner and start to mine
var miner = new Miner();
var RpcUtils = require('./utils');
var RPCMessage = require('./server/message');

// Import transaction classes
TransactionRequest= require('./transaction/transaction_request');
TransactionUse = require('./transaction/transaction_use');
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

    // Receiving request to execute action
    if(message.type == 8){
        
        var request=message.request;
        var fileAccess = __dirname+'/tmp/node/list.json';
        var fileAdresses = __dirname+'/tmp/node/adresses.json';
        var fileConfig = __dirname+'/tmp/node/config.json';
        var fileTmp = __dirname+'/tmp/node/tmp.json';

        boolAccess=QueryPermission(fileAccess,request.requester,request.requested,request.action,request.conditions,request.obligations);
        
        if(boolAccess == true){
            var transaction_request = new TransactionRequest();
            var token = new Token();
            token.new(request.action,3600);
            transaction_request.new(request.requested,request.requester,request.action,token);  
            console.log(transaction_request.show());
            tmp = {
                Transaction : transaction_request,
                nb_node : get_nb_miner(fileAdresses),
                nb_agree: 0,
                nb_reject: 0
            };
            var dataTmp=fs.readFileSync(fileTmp, 'utf8');

            if(dataTmp.length != 0){
                objTmp=JSON.parse(dataTmp);
            }else{
                var objTmp={
                    table: []
                };
               
            }

            objTmp.table.push(tmp); 
            var jsonTmp = JSON.stringify(objTmp);
            fs.writeFileSync(fileTmp, jsonTmp, 'utf8');
            console.log('Has access, broadcast to miner to validate transaction : '+transaction_request.hash);
            broadcast_transaction(fileAdresses,transaction_request,'request',get_publicKey_node(fileConfig));
            
        }
    }

    // Receiving transaction to validate
    if(message.type == 10){
        transaction=message.transaction;

        var fileAccess = __dirname+'/tmp/node1/list.json';
        var fileData = __dirname+'/tmp/node1/blocs/data.json';
        var fileAdresses = __dirname+'/tmp/node1/adresses.json';
        var fileConfig = __dirname+'/tmp/node1/config.json';
        var fileTmp = __dirname+'/tmp/node1/tmp.json';
        var dataTmp=fs.readFileSync(fileTmp, 'utf8');
        var tmp = {
                Transaction : transaction,
            };
            
        if(dataTmp.length != 0){
            objTmp=JSON.parse(dataTmp);
        }else{
            var objTmp={
                table: []
            };
        }
        objTmp.table.push(tmp); 
        console.log('Transaction received : ');
        console.log(transaction);
        var jsonTmp = JSON.stringify(objTmp);
        fs.writeFileSync(fileTmp, jsonTmp, 'utf8');
    
        var boolTransactionValid = false;
        if(message.typeTransaction == 'request') boolTransactionValid = verify_transaction_request(transaction,fileAccess,fileAdresses,fileData);
        else boolTransactionValid = verify_transaction_use(transaction,fileAccess,fileAdresses,fileData);
            
            console.log('Transaction validity : '+boolTransactionValid+' Know send response to miner');

            var packet = {
                    from: {
                        address: server.host,
                        port: server.port ,
                        id: server.id
                    },
                message: { type: 12, host: server.host, port: server.port, publicKey: get_publicKey_node(fileConfig), transactionHash : transaction.hash, typeTransaction : message.typeTransaction, response : boolTransactionValid  } 
            };
            server.sendMessage({address: message.host, port: message.port},packet);
    } 

    // Receiving response to request validation transaction 
    if(message.type == 12){

        hash=message.transactionHash;
        var fileTmp = __dirname+'/tmp/node/tmp.json';
        var fileAdresses = __dirname+'/tmp/node/adresses.json';
        var fileConfig = __dirname+'/tmp/node/config.json';
        var fileData = __dirname+'/tmp/node/blocs/data.json';
        var dataTmp=fs.readFileSync(fileTmp, 'utf8');

        if(dataTmp.length != 0){
            objTmp=JSON.parse(dataTmp);
            var i=0;
            var bool = false;
            while(i<Object.keys(objTmp.table).length && bool == false){
                
                if(objTmp.table[i].Transaction.hash == hash){
                    if(message.response == true ) objTmp.table[i].nb_agree++ ;
                    if(message.response == false ) objTmp.table[i].nb_reject++ ;
                    if(objTmp.table[i].nb_node/2 < objTmp.table[i].nb_agree){
                        console.log('Transaction success ... Broadcast response to miner');
                        bool = true;
                        insert_Transaction(objTmp.table[i].Transaction,fileData);
                        broadcast_response(fileAdresses,objTmp.table[i].Transaction.hash,get_publicKey_node(fileConfig),'valid');
                         // Inform the two node that the access is granted
                        console.log(objTmp.table[i].Transaction.requester+' can '+objTmp.table[i].Transaction.action+' '+objTmp.table[i].Transaction.requested);
                    }
                    if(objTmp.table[i].nb_node/2 < objTmp.table[i].nb_reject){
                        console.log('Transaction rejected ... Don\'t Broadcast response to miner');
                        bool = true;
                       // broadcast_response(fileAdresses,objTmp.table[i].tmp.Transaction.hash,get_publicKey_node(fileConfig),'novalid');
                    }
                    if(bool == true)  objTmp.table.splice(i,1);
                }
                i++;
            }
            var jsonTmp = JSON.stringify(objTmp);
            fs.writeFileSync(fileTmp, jsonTmp, 'utf8');
        }
    }
    // Receive response to insert Transaction
    if(message.type == 13){
        hash=message.transactionHash;
        var fileTmp = __dirname+'/tmp/node/tmp.json';
        var fileData = __dirname+'/tmp/node/blocs/data.json';
        var dataTmp=fs.readFileSync(fileTmp, 'utf8');
        console.log('reveiced response to insert');
        if(dataTmp.length != 0){
            objTmp=JSON.parse(dataTmp);
            for(i=0;i<Object.keys(objTmp.table).length;i++){
                if(objTmp.table[i].Transaction.hash == hash && message.response == 'valid'){
                    console.log('Insert Transaction : '+objTmp.table[i].Transaction.hash);
                    insert_Transaction(objTmp.table[i].Transaction,fileData);
                }
                // Delete the transaction from the tmp file
                objTmp.table.splice(i,1);
            }
            var jsonTmp = JSON.stringify(objTmp);
            fs.writeFileSync(fileTmp, jsonTmp, 'utf8');
        }
    }
};

function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

var onstart = function(node) {
    

    var config = require('./config.js');
    var block = new Block(config.genesis);

    console.log('----- Genesis Block -----');
    console.log( JSON.stringify(block) );

    console.log('----- Start mining -----');

    var jsonfile = require('jsonfile');
    var file = __dirname+'/tmp/node/blocs/data.json';
    var fileConfig= __dirname+'/tmp/node/config.json'
    var fileAccess= __dirname+'/tmp/node/list.json';
    var fileTmp= __dirname+'/tmp/node/tmp.json';
    var fileAdresses = __dirname+'/tmp/node/adresses.json';
    var fileData = __dirname+'/tmp/node/blocs/data.json';
    var i=0;
    var obj = {
        table: []
        };
    var objConfig = {
        table: []
        };

    // Generate and store key pair
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

    console.log(get_all_node(fileAdresses));
/*
var transaction_request = new TransactionRequest();
    var token = new Token();
    token.new('ACCESS',3600);
    transaction_request.new('1','04be933d70f2916f75bd4133454d832976769a2f781cab5f84931b026b43c165584bbe7b62dc0a448489fea1c9e82970fb8ba06cb03a775399b1d9eb39b9ce6604','ACCESS',token);           
    
    console.log('Transaction Hash : '+transaction_request.hash);
    */

    /*    var fileAccess= __dirname+'/tmp/node/list.json';
        var fileTmp= __dirname+'/tmp/node/tmp.json';
        var fileConfig= __dirname+'/tmp/node/config.json';
        var fileAdresses = __dirname+'/tmp/node/adresses.json';
        var fileData = __dirname+'/tmp/node/blocs/data.json';

        transaction = new TransactionRequest();
        token = new Token();
        transaction.hash="a1f63ad106be7b721f56dc2b4554721452806fae1a0590c075fc412106979e54";
        transaction.requested = '1';
        transaction.requester= "04be933d70f2916f75bd4133454d832976769a2f781cab5f84931b026b43c165584bbe7b62dc0a448489fea1c9e82970fb8ba06cb03a775399b1d9eb39b9ce6604";
        transaction.timestamp=1526650593631;
        transaction.action="ACCESS";
        token.hash="c5d7a4e3693c789ceb7fe28122f656ab49699ce19e5a02afb267a4db28197bcf";
        token.timestamp=1526650593630;
        token.validity=3600;
        token.action="ACCESS";
        transaction.token=token;

        console.log(transaction.hash);

        var boolefficiency = check_efficiency(transaction,fileAdresses,fileData,fileAccess);
        
        if(boolefficiency == true){
            transaction_use = new TransactionUse();
            transaction_use.new(transaction.requested,transaction.requester,transaction.timestamp,transaction.action,token);
        
            // Broadcast transaction to validate 

            tmp = {
                    Transaction : transaction_use,
                    nb_node : get_nb_miner(fileAdresses),
                    nb_agree: 0,
                    nb_reject: 0
                };
            var dataTmp=fs.readFileSync(fileTmp, 'utf8');

            if(dataTmp.length != 0){
                objTmp=JSON.parse(dataTmp);
            }else{
                var objTmp={
                    table: []
                };
               
            }
            objTmp.table.push(tmp); 
            var jsonTmp = JSON.stringify(objTmp);
            fs.writeFileSync(fileTmp, jsonTmp, 'utf8');
            
            broadcast_transaction(fileAdresses,transaction_use,'use',get_publicKey_node(fileConfig));
        }       */
    
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

        var fileAdresses = __dirname+'/tmp/node/adresses.json';        
        var fileConfig = __dirname+'/tmp/node/config.json';
        objReceived=req.body;
        
        // Test if the node exist
        var bool=existNodeMacAdr(objReceived.macadr,fileAdresses);
       
        var statut = 'FAIL';

        if(bool == false) {
            //node doesn't exist , save it
            port=objReceived.port;
            host=objReceived.ipadr;
            ip=objReceived.ipadr;
            mac=objReceived.macadr;
            role=objReceived.role;
            saveNodeMacAdr(ip,port,mac,host,role,fileAdresses);

            // Save access rights of the new node
            var fileAccess=__dirname+'/tmp/node/list.json';
            var listAccess=objReceived.listAccess;     

            saveAccessRight(fileAccess,listAccess);
            var dataConfig=fs.readFileSync(fileConfig, 'utf8');
            objConfig = JSON.parse(dataConfig);
            
            /*if(objReceived.publicKey == objConfig.table[0].Key.publicKey) statut = 'ME';
            else statut = 'SUCCESS';*/
            response='SUCCESS';
            var packet = {
                from: {
                    address: server.host,
                    port: server.port ,
                    id: server.id
                    },
                message: { type: 9, host: server.host, port: server.port, response : response } 
            };
            server.sendMessage({address: ip, port: port},packet);
           
        }

        // Save in the config file
       /* var fileConfig = __dirname+'/tmp/node/config.json';
        var jsonfile = require('jsonfile');
        publicKey=configNode(req.body.ipadr,req.body.macadr,req.body.role,fileConfig);
        */res.send({'publicKey' : publicKey, 'MAC': req.body.macadr, 'IP': req.body.ipadr, 'role': req.body.role });
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

    app.post('/generateUse',function(req, res){
        transaction=req.body;
        console.log('Received request to generate Transaction Use');
        
        var fileAccess= __dirname+'/tmp/node/list.json';
        var fileTmp= __dirname+'/tmp/node/tmp.json';
        var fileConfig= __dirname+'/tmp/node/config.json';
        var fileAdresses = __dirname+'/tmp/node/adresses.json';
        var fileData = __dirname+'/tmp/node/blocs/data.json';

        check_efficiency(transaction,fileAdresses,fileData,fileAccess);
        transaction_use = new TransactionUse();
        transaction_use.new(transaction.requested,transaction.requester,transaction.timestamp,transaction.action,transaction.token);
    
        // Broadcast transaction to validate 

        tmp = {
                Transaction : transaction_use,
                nb_node : get_nb_miner(fileAdresses),
                nb_agree: 0,
                nb_reject: 0
            };
            var dataTmp=fs.readFileSync(fileTmp, 'utf8');

            if(dataTmp.length != 0){
                objTmp=JSON.parse(dataTmp);
            }else{
                var objTmp={
                    table: []
                };
               
            }
            objTmp.table.push(tmp); 
            var jsonTmp = JSON.stringify(objTmp);
            fs.writeFileSync(fileTmp, jsonTmp, 'utf8');
            
            broadcast_transaction(fileAdresses,transaction_use,'use',get_publicKey_node(fileConfig));
    });

    app.post('/getAllNode',function(req, res){
        console.log('Received request to send User');
        
        var fileAdresses = __dirname+'/tmp/node/adresses.json';
        adresses=get_all_node(fileAdresses);
        res.send(adresses);
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

function QueryPermission(fileAccess,requester,requested,action,conditions,obligations){

    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };
    var boolAccess = false;
    if(dataAccess.length != 0 ){
        var objAccess = JSON.parse(dataAccess);
        for(i=0;i<objAccess.table[0].Node.length;i++){
            var boolNode = false;
            if(objAccess.table[0].Node[i].adr == requester){
                for(k=0;k<objAccess.table[0].Node[i].accesslist.length;k++){
                    if(requested == objAccess.table[0].Node[i].accesslist[k].ressource && action == objAccess.table[0].Node[i].accesslist[k].rights) boolAccess = true;
                }
            }
        }
    }

    return boolAccess
}

function get_nb_miner(fileAdresses){
    var objAdresses = {
        table: []
        };
    var nb=0;
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    var bool= false;
    if(dataAdresses.length != 0 ){
        objAdresses = JSON.parse(dataAdresses);

        for(i=0;i<Object.keys(objAdresses.table).length;i++){
            //Test if node is miner
            if(objAdresses.table[i].Node.role == 'miner') nb++;
        }
    }
    return nb;
}

function get_all_node(fileAdresses){
    var objAdresses = {
        table: []
        };
    var nb=0;
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    var adresses = [];
    var bool= false;
    if(dataAdresses.length != 0 ){
        objAdresses = JSON.parse(dataAdresses);
        for(i=0;i<objAdresses.table.length;i++){
            adresses[i]=objAdresses.table[i];
        }
    }
    return adresses;
}

function broadcast_transaction(fileAdresses,transaction,type,publicKey){
    var objAdresses = {
        table: []
        };

    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    var bool= false;
    if(dataAdresses.length != 0 ){
        objAdresses = JSON.parse(dataAdresses);

        for(i=0;i<Object.keys(objAdresses.table).length;i++){
            //Test if node is miner
            if(objAdresses.table[i].Node.role == 'miner'){
                var packet = {
                    from: {
                        address: server.host,
                        port: server.port ,
                        id: server.id
                        },
                    message: { type: 10, host: server.host, port: server.port, publicKey: publicKey, transaction : transaction, typeTransaction : type } 
                };
                server.sendMessage({address: objAdresses.table[i].Node.IP, port: objAdresses.table[i].Node.port},packet);
            }
        }
    }
}

function broadcast_response(fileAdresses,transactionHash,publicKey,response){
    var objAdresses = {
        table: []
        };

    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    var bool= false;
    if(dataAdresses.length != 0 ){
        objAdresses = JSON.parse(dataAdresses);

        for(i=0;i<Object.keys(objAdresses.table).length;i++){
            //Test if node is miner
            if(objAdresses.table[i].Node.role == 'miner'){
                var packet = {
                    from: {
                        address: server.host,
                        port: server.port ,
                        id: server.id
                        },
                    message: { type: 13, host: server.host, port: server.port, publicKey: publicKey, transactionHash : transactionHash, response : response } 
                };
                server.sendMessage({address: objAdresses.table[i].Node.IP, port: objAdresses.table[i].Node.port},packet);
            }
        }
    }
}

function get_publicKey_node(fileConfig){
    var dataConfig=fs.readFileSync(fileConfig, 'utf8');
    var objConfig = JSON.parse(dataConfig);
    if(dataConfig.length != 0){
        return objConfig.table[0].Key.publicKey;
    }
    return false;
}

function verify_transaction_request(transaction,fileAccess,fileAdresses,fileData){
    var objAdresses = {
        table: []
        };
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    var dataAccess=fs.readFileSync(fileAccess, 'utf8');
    var token=new Token();
    var transaction_request= new TransactionRequest();

    var boolToken=token.verify(transaction.token.hash,transaction.token.action,transaction.token.validity,transaction.token.timestamp);
    if(boolToken == false) return false;

    var boolTransaction=transaction_request.verify(transaction.hash,transaction.requested,transaction.requester,transaction.action,transaction.timestamp,transaction.token);  
    if(boolTransaction == false) return false;   

    var boolExistTransaction=existTransaction(transaction.hash,fileData);
    if(boolExistTransaction == true) return false;

    var boolExistRequested=existNode(transaction.requested,fileAdresses);
    if(boolExistRequested == false) return false;

    var boolExistRequester=existNode(transaction.requester,fileAdresses);
    if(boolExistRequester == false) return false;

    var boolPermission=QueryPermission(fileAccess,transaction.requester,transaction.requested,transaction.action,'conditions','obligations');
    if(boolPermission == false) return false;

    return true;
}

function verify_transaction_use(transaction,fileAccess,fileAdresses,fileData){
    var objAdresses = {
        table: []
        };
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    var dataAccess=fs.readFileSync(fileAccess, 'utf8');
    var token=new Token();
    var transaction_use= new TransactionUse();

    var boolToken=token.verify(transaction.token.hash,transaction.token.action,transaction.token.validity,transaction.token.timestamp);
     console.log('Bool Token : '+boolToken);
    if(boolToken == false) return false;
   
    
    var boolTransaction=transaction_use.verify(transaction.hash,transaction.requested,transaction.requester,transaction.action,transaction.timestamp,transaction.token);  
    console.log('Bool Transaction : '+boolTransaction);
    if(boolTransaction == false) return false;   
    

    var boolExistTransaction=existTransaction(transaction.hash,fileData);
    console.log('Bool Exist Transaction : '+boolExistTransaction);
    if(boolExistTransaction == true) return false;
    
    
    /*var boolExistRequested=existNode(transaction.requested,fileAdresses);
    console.log('Bool Exist Requested : '+boolExistRequested);
    if(boolExistRequested == false) return false;
    */

    var boolExistRequester=existNode(transaction.requester,fileAdresses);
    console.log('Bool Exist requester : '+boolExistRequester);
    if(boolExistRequester == false) return false;
    

    var boolPermission=QueryPermission(fileAccess,transaction.requester,transaction.requested,transaction.action,'conditions','obligations');
    console.log('Bool Permission : '+boolPermission);
    if(boolPermission == false) return false;
    

    return true;
}

function existTransaction(hash,fileData){
    
    // Verify if transactions exist
    
    var data=fs.readFileSync(fileData, 'utf8');
    boolExist= false;
    if(data.length != 0){
        obj = JSON.parse(data);
        i=0; 
        while(i<Object.keys(obj.table).length && boolExist == false){
            var block=new Block();
            var objTree = obj.table[obj.table.length-1].Block._tree;
            var tabTree = Object.keys(objTree).map(function(key) {
              return [objTree[key]];
            });
            block.new(obj.table[i].Block.hash,obj.table[i].Block.previousHash,obj.table[i].Block.timestamp,obj.table[i].Block.merkleRoot,obj.table[i].Block.difficulty,obj.table[i].Block.txs,obj.table[i].Block.nonce,obj.table[i].Block.no,tabTree,obj.table[i].Block.numberMax);
            boolExist=block.transactionsExist(hash); 
            i++;
        }

    }
    return boolExist;
}

function existNode(nodeAdr,fileAdresses){
    var objAdresses = {
        table: []
        };
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    if(dataAdresses.length != 0 ){
        objAdresses = JSON.parse(dataAdresses);

        for(i=0;i<Object.keys(objAdresses.table).length;i++){
            // Test if node exist
            if(objAdresses.table[i].Node.adr == nodeAdr) return true;
        }
    }
    return false;
}

function insert_Transaction(transaction,fileData){
    var data=fs.readFileSync(fileData, 'utf8');
     console.log('Insert transaction'+transaction.hash);  
    if(data.length != 0){
        obj = JSON.parse(data);
        block=new Block();
        var objTree = obj.table[obj.table.length-1].Block._tree;
        var tabTree = Object.keys(objTree).map(function(key) {
          return [objTree[key]];
        });
        //obj.table[obj.table.length-1].Block._tree
        block.new(obj.table[obj.table.length-1].Block.hash,obj.table[obj.table.length-1].Block.previousHash,obj.table[obj.table.length-1].Block.timestamp,obj.table[obj.table.length-1].Block.merkleRoot,obj.table[obj.table.length-1].Block.difficulty,obj.table[obj.table.length-1].Block.txs,obj.table[obj.table.length-1].Block.nonce,obj.table[obj.table.length-1].Block.no,tabTree,obj.table[obj.table.length-1].Block.numberMax);
        //block.setTransactions() = obj.table[obj.table.length-1].Block;
        if(block.getNumberOfTransactions() >= block.getNumberMax()){
            //Generate new Block
            miner.setPreviousBlock(block);
            miner.generateHash();
            blockNew = miner.getNewBlock();

            var tx=blockNew.getTransactions();
            tx.push(transaction);
            blockNew.setTransactions(tx);
            blockNew.previousHash=block.hash;
            obj.table[obj.table.length-1].Block=block;
            obj.table.push({Block : blockNew});
        }else{
            var tx=block.getTransactions();
            tx.push(transaction);
            block.setTransactions(tx);
            obj.table[obj.table.length-1].Block=block;
        }
        var json = JSON.stringify(obj);
        fs.writeFileSync(fileData, json, 'utf8');
    }
}

function check_efficiency(transaction,fileAdresses,fileData,fileAccess){

    boolExistTransaction = existTransaction(transaction.hash,fileData);
    console.log('Exist Transaction : '+boolExistTransaction);
    if(boolExistTransaction == false) return false;

   /* boolExistToken = existToken(token,fileData);
    console.log('Exist Token : '+boolExistToken);
    if(boolExistToken == false) return false;
    */
    boolHasPermission = QueryPermission(fileAccess,transaction.requester,transaction.requested,transaction.action,transaction.conditions,transaction.obligations);
    console.log('Has Permission : '+boolHasPermission);
    if(boolHasPermission == false) return false;

    var token=new Token();
    var transaction_request= new TransactionRequest();

    var boolToken=token.verify(transaction.token.hash,transaction.token.action,transaction.token.validity,transaction.token.timestamp);
    console.log('Bool Token : '+boolToken);
    if(boolToken == false) return false;
   
    
    var boolTransaction=transaction_request.verify(transaction.hash,transaction.requested,transaction.requester,transaction.action,transaction.timestamp,transaction.token);  
    console.log('Bool Transaction : '+boolTransaction);
    if(boolTransaction == false) return false;   
    
    /*var boolExistRequested=existNode(transaction.requested,fileAdresses);
    console.log('Bool Exist Requested : '+boolExistRequested);
    if(boolExistRequested == false) return false;
    */

    var boolExistRequester=existNode(transaction.requester,fileAdresses);
    console.log('Bool Exist requester : '+boolExistRequester);
    if(boolExistRequester == false) return false;

    return true;
}

function saveNodeMacAdr(ip,port,mac,host,role,fileAdresses){
    var objAdresses = {
        table: []
        };
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    if(dataAdresses.length != 0){
        var objAdresses = JSON.parse(dataAdresses);    
    }
    objAdresses.table.push({Node: { adr : '', IP : ip, port : port, MAC : mac, host : host, role : role } }); 
    var jsonAdresses = JSON.stringify(objAdresses);
    fs.writeFileSync(fileAdresses, jsonAdresses, 'utf8');
}

function existNodeMacAdr(mac,fileAdresses){
      var objAdresses = {
        table: []
        };
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    if(dataAdresses.length != 0 ){
        objAdresses = JSON.parse(dataAdresses);

        for(i=0;i<Object.keys(objAdresses.table).length;i++){
            // Test if node exist
            if(objAdresses.table[i].Node.MAC == mac) return true;
        }
    }
    return false;
}

/**
 * Create a mining node.
 */
server.start({
    onstart: onstart,
	onmessage: onmessage,
});
