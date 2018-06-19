var server = require('./server');
var Miner = require('./libs/mining');
var fs = require('fs'); 
var shortid = require('shortid');
var crypto = require("crypto");
var eccrypto = require("eccrypto");
var elliptic = require("elliptic");
var EC = elliptic.ec;

 var requestTmp = ''; 
 var send = false;
 var nbReq=0;
const fileResponse = __dirname+'/tmp/node/sendResponse.json';

// Import genesis block
var block = require('./libs/genesis');
var Block = require('./libs/block');
// Create a new miner and start to mine
var miner = new Miner();
var RpcUtils = require('./utils');
var RPCMessage = require('./server/message');

var textEncoding = require('text-encoding'); 
var TextDecoder = textEncoding.TextDecoder;
var TextEncoder = textEncoding.TextEncoder;
const BN = require('bn.js');
const asn =require('asn1.js');

const EcdsaDerSig = asn.define('ECPrivateKey', function() {
    return this.seq().obj(
        this.key('r').int(),
        this.key('s').int()
    );
});

// Import transaction classes
Transaction = require('./transaction/transaction');
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
        var fileConfig = __dirname + '/tmp/node/config.json';
        // Test if the node exist
        var bool = existNode(message.publicKey,message.mac,message.role,fileAdresses);
       
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
                nodeInfo=get_node_info(fileConfig);
                var packetBlocs = {
                        from: {
                                address: nodeInfo.Server.IP,
                                port: nodeInfo.Server.port,
                                id: server.id
                            },
                            message: { type: 7,host: nodeInfo.Server.IP, port: nodeInfo.Server.port, blocs : jsonToSend, adresses : objAdresses, accesslist : objAccess} 
                        };
                                
                server.sendMessage({address: message.host, port: message.port},packetBlocs);
            }
    } 

    // Receiving the Blockchain
    if(message.type == 7){
       console.log('received Blockchain');
        var file = __dirname + '/tmp/node/blocs/data.json';
        var fileAdresses = __dirname + '/tmp/node/adresses.json';
        var fileConfig = __dirname + '/tmp/node/config.json';
        var fileAccess = __dirname + '/tmp/node/list.json';
        var blocks= message.blocs;
        
        // Save the newest blocks
        
        data= fs.readFileSync(file, 'utf8');
        var objReceived=null;
        if(data.length == 0){
            obj.table.push(blocks);
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
        console.log('Receive request');
        var request=message.request;
        var fileAccess = __dirname+'/tmp/node/list.json';
        var fileAdresses = __dirname+'/tmp/node/adresses.json';
        var fileConfig = __dirname+'/tmp/node/config.json';
        var fileTmp = __dirname+'/tmp/node/tmp.json';
        var fileMiner = __dirname+'/tmp/node/miner.json';
        
        var shaMsg = crypto.createHash("sha256").update(JSON.stringify(message.request)).digest();
        var publicKey = new Buffer(message.publicKey,'hex');
        var signature = new Buffer(message.signature,'hex');
        var ec = new EC("secp256k1");
        const asn1signature = concatSigToAsn1Sig(signature);
        var isValid = ec.verify(shaMsg, asn1signature, publicKey);

        var nodeInfo=get_node_info(fileConfig);
        boolAccess=QueryPermission(fileAccess,fileAdresses,request.requester,request.requested,request.action,request.conditions,request.obligations);
        
        //if(minerTurn(fileMiner) == true){

            console.time("Transaction generated, validated and inserted");
   
            var transaction_request = new TransactionRequest();
            if(boolAccess == true){
                var token = new Token();
                token.new(request.requested,request.requester,request.action,3600);
            }else{
                var token=null;
            }
            transaction_request.new(request.requested,request.requester,request.action,token);  
            tmp = {
                Transaction : transaction_request,
                nb_node : get_nb_miner(fileAdresses),
                nb_agree: 0,
                nb_reject: 0,
                tabProof : []
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
            if(boolAccess == true){
                console.log('Has access, broadcast to miner to validate transaction : '+transaction_request.hash);
            }
            broadcast_transaction(fileAdresses,transaction_request,'request',get_publicKey_node(fileConfig),fileConfig,message.request);
          //  console.log(tmp);
//        }
        if(boolAccess == false){
            console.log('Access refused');
            var dataResponse=fs.readFileSync(fileResponse, 'utf8');
            if(dataResponse.length != 0 ){
                var objResponse = JSON.parse(dataResponse);
                requestTmpFile = objResponse.requestTmp;
                sendFile = objResponse.send;
                if(sendFile == false){
                requestTmp='Access refused';
                send = true;
                var objResponse = {
                    requestTmp : requestTmp,
                    send : send
                }
                var jsonResponse = JSON.stringify(objResponse);
                fs.writeFileSync(fileResponse, jsonResponse, 'utf8');
                }  
            }
        }
    }

    //Receiving response (BC access list and addresses) and generate keypair
    if(message.type == 9){
        console.log('received Blockchain');

        var str = message.response+''+JSON.stringify(message.blocs)+''+JSON.stringify(message.adresses)+''+JSON.stringify(message.accesslist);
        var shaMsg = crypto.createHash("sha256").update(str).digest();
        var publicKey = new Buffer(message.publicKey,'hex');
        var signature = new Buffer(message.signature,'hex');
        var ec = new EC("secp256k1");
        const asn1signature = concatSigToAsn1Sig(signature);
        var isValid = ec.verify(shaMsg, asn1signature, publicKey);
        if(isValid){
            var file = __dirname + '/tmp/node/blocs/data.json';
            var fileAdresses = __dirname + '/tmp/node/adresses.json';
            var fileConfig = __dirname + '/tmp/node/config.json';
            var fileAccess = __dirname + '/tmp/node/list.json';
            var blocks= message.blocs;
            // Generate keypair
            var dataConfig=fs.readFileSync(fileConfig, 'utf8');

            if(dataConfig.length != 0){
                objConfig = JSON.parse(dataConfig);

                // Generate keypair for the node  
                var privateKey = crypto.randomBytes(32);
                var publicKey = eccrypto.getPublic(privateKey);

                objConfig.table[0].Key.publicKey = toHexString(publicKey);
                objConfig.table[0].Key.privateKey = toHexString(privateKey);
            
                // Fill in the file config of the node

                var jsonConfig = JSON.stringify(objConfig);
                fs.writeFileSync(fileConfig, jsonConfig, 'utf8');
            }
            // Save the newest blocks
            
            data= fs.readFileSync(file, 'utf8');
            var objReceived=null;
            if(data.length == 0){
                obj.table.push(blocks.table[0]);
                var json = JSON.stringify(obj);
                fs.writeFileSync(file, json, 'utf8');
            }else{
                obj = JSON.parse(data);
                objReceived=blocks;
                var i=0;

                for(i=0;i<objReceived.table.length;i++){
                    bool = false;
                    for(j=0;j<obj.table.length;j++){
                        if(obj.table[j].Block.hash == objReceived.table[i].Block.hash){
                            bool = true;
                        }
                    }
                    if(bool = false){
                        obj.table.push({Block : objReceived.table[i].Block});   
                    }
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
            var listAccessToSend = {
                table : []
            };
            var listAccessReceived=message.accesslist;
            
            if(listAccessReceived.length != 0){
                for(i=0;i<listAccessReceived.table.length;i++){

                    for(j=0;j<listAccessReceived.table[i].Node.accesslist.length;j++){
                        if(listAccessReceived.table[i].Node.adr == objConfig.table[0].Server.MAC){
                            
                            if(listAccessReceived.table[i].Node.accesslist[j].ressource == objConfig.table[0].Server.MAC){
                                var ressource = objConfig.table[0].Key.publicKey;
                            }else{
                                var ressource = listAccessReceived.table[i].Node.accesslist[j].ressource;
                            }
                            
                            listAccess.table.push({
                                requester : objConfig.table[0].Key.publicKey,
                                requested : ressource,
                                rights : listAccessReceived.table[i].Node.accesslist[j].rights,
                                conditions  : listAccessReceived.table[i].Node.accesslist[j].conditions,
                                obligations : listAccessReceived.table[i].Node.accesslist[j].obligations,
                                trust : listAccessReceived.table[i].Node.accesslist[j].trust
                            });
                        }else{
                            if(listAccessReceived.table[i].Node.accesslist[j].ressource == objConfig.table[0].Server.MAC){
                                var ressource = objConfig.table[0].Key.publicKey;
                            }else{
                                var ressource = listAccessReceived.table[i].Node.accesslist[j].ressource;
                            }

                            listAccess.table.push({
                                requester : listAccessReceived.table[i].Node.adr,
                                requested : ressource,
                                rights : listAccessReceived.table[i].Node.accesslist[j].rights,
                                conditions  : listAccessReceived.table[i].Node.accesslist[j].conditions,
                                obligations : listAccessReceived.table[i].Node.accesslist[j].obligations,
                                trust : listAccessReceived.table[i].Node.accesslist[j].trust
                            });
                        }
                    }
                    for(l=0;l<listAccess.table.length;l++){
                        listAccessToSend.table.push(listAccess.table[l]); 
                    }
                    saveAccessRight(fileAccess,listAccessToSend.table);
                    var listAccessToSend = {
                        table : []
                    };
                    var listAccess = {
                        table : []
                    };
                    
                }
            }
          

            // Send keypair generated and MAC to update
            macadr = objConfig.table[0].Server.MAC;
            publicKey = objConfig.table[0].Key.publicKey;
            update_adresses(publicKey,macadr,fileAdresses);
          //  update_access_list(publicKey,mac,fileAdresses)
            console.log(objConfig.table);
            broadcast_publicKey(fileAdresses,publicKey,macadr,fileConfig);
        }else{
            console.log('Non valid signature');
        }

    }

    // Receiving transaction to validate
    if(message.type == 10){
        transaction=message.transaction;

        var shaMsg = crypto.createHash("sha256").update(JSON.stringify(transaction)).digest();
        var publicKey = new Buffer(message.publicKey,'hex');
        var signature = new Buffer(message.signature,'hex');
        var ec = new EC("secp256k1");
        const asn1signature = concatSigToAsn1Sig(signature);
        var isValid = ec.verify(shaMsg, asn1signature, publicKey);
      
        if(isValid){
            var fileAccess = __dirname+'/tmp/node/list.json';
            var fileData = __dirname+'/tmp/node/blocs/data.json';
            var fileAdresses = __dirname+'/tmp/node/adresses.json';
            var fileConfig = __dirname+'/tmp/node/config.json';
            var fileTmp = __dirname+'/tmp/node/tmp.json';
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
            console.log('Transaction received : '+transaction.hash);
            var jsonTmp = JSON.stringify(objTmp);
            fs.writeFileSync(fileTmp, jsonTmp, 'utf8');
        
            var boolTransactionValid = false;
            if(message.typeTransaction == 'request') boolTransactionValid = verify_transaction_request(transaction,fileAccess,fileAdresses,fileData);
            else boolTransactionValid = verify_transaction_use(transaction,fileAccess,fileAdresses,fileData);
                
                console.log('Transaction validity : '+boolTransactionValid+' Know send response to miner');
                nodeInfo=get_node_info(fileConfig);
                
            var str = boolTransactionValid+''+get_publicKey_node(fileConfig)+''+transaction.hash;
            var privateKey = new Buffer(nodeInfo.Key.privateKey,'hex');
            var ec = new EC("secp256k1");
            var shaMsg = crypto.createHash("sha256").update(str).digest();
            var mySign = ec.sign(shaMsg, privateKey, {canonical: true});
            var signature = asn1SigSigToConcatSig(mySign);

                var packet = {
                        from: {
                            address: nodeInfo.Server.IP,
                            port: nodeInfo.Server.port,
                            id: server.id
                        },
                    message: { type: 12, host: nodeInfo.Server.IP, port: nodeInfo.Server.port, publicKey: get_publicKey_node(fileConfig), transactionHash : transaction.hash, typeTransaction : message.typeTransaction, response : boolTransactionValid, shaMsg : shaMsg, signature : signature, request : message.request } 
                };
                server.sendMessage({address: message.host, port: message.port},packet);
        }else{
            console.log('Non valid signature');
        }
    } 

    // Receiving publicKey 
    if(message.type == 11){
        console.log('Receiving publicKey');
        var keyPublic= message.publicKey;
        var shaMsg = new Buffer(message.shaMsg,'hex');
        var publicKey = new Buffer(message.publicKey,'hex');
        var signature = new Buffer(message.signature,'hex');
        var ec = new EC("secp256k1");
        const asn1signature = concatSigToAsn1Sig(signature);
        var isValid = ec.verify(shaMsg, asn1signature, publicKey)
    
        if(isValid){
            var fileAdresses = __dirname + '/tmp/node/adresses.json';
            var fileAccess = __dirname + '/tmp/node/list.json';
            var fileMiner = __dirname+'/tmp/node/miner.json';
            
            mac = message.mac;
            //Update access list
            update_access_list(keyPublic,mac,fileAccess);
            //Update adresses list
            update_adresses(keyPublic,mac,fileAdresses);
            console.log(mac);
            data = get_node_info_by_adr(keyPublic,fileAdresses);
            
            if(data.table[0].role == 'miner'){

                var dataMiner=fs.readFileSync(fileMiner,'utf8');
                if(dataMiner.length != 0 ){
                    var objMiner = JSON.parse(dataMiner);
                    objMiner.table[0].tabAdr.push(keyPublic);
                    var jsonMiner = JSON.stringify(objMiner);
                    fs.writeFileSync(fileMiner, jsonMiner, 'utf8');
                }
            }
        }else{
            console.log('Non valid signature');
        }
    }

    // Receiving response to request validation transaction 
    if(message.type == 12){

        hash=message.transactionHash;

        var fileTmp = __dirname+'/tmp/node/tmp.json';
        var fileAdresses = __dirname+'/tmp/node/adresses.json';
        var fileConfig = __dirname+'/tmp/node/config.json';
        var fileData = __dirname+'/tmp/node/blocs/data.json';
        var dataTmp=fs.readFileSync(fileTmp, 'utf8');

        if(existNode(message.publicKey,fileAdresses) && existTmpHash(message.transactionHash,fileTmp)){
            var str = message.response+''+message.publicKey+''+message.transactionHash;
            var shaMsg = crypto.createHash("sha256").update(str).digest();
            var publicKey = new Buffer(message.publicKey,'hex');
            var signature = new Buffer(message.signature,'hex');
            var ec = new EC("secp256k1");
            const asn1signature = concatSigToAsn1Sig(signature);
            var isValid = ec.verify(shaMsg, asn1signature, publicKey);
            if(isValid){
                if(dataTmp.length != 0){
                    objTmp=JSON.parse(dataTmp);
                    var i=0;
                    var bool = false;
                    while(i<Object.keys(objTmp.table).length && bool == false){
                        
                        if(objTmp.table[i].Transaction.hash == hash){
                            if(message.response == true ){
                                objTmp.table[i].nb_agree++ ;  
                                objTmp.table[i].tabProof.push(toHexString(signature));
                            } 
                            if(message.response == false ){
                                objTmp.table[i].nb_reject++ ;
                                objTmp.table[i].tabProof.push(toHexString(signature));
                            } 
                            if(objTmp.table[i].nb_node/2 <= objTmp.table[i].nb_agree){
                                console.log('Transaction success ... Broadcast response to miner');
                                bool = true;
                                var insertTx=insert_Transaction(objTmp.table[i].Transaction,fileData);
                                // Inform the two node that the access is granted
                               // if(objTmp.table[i].Transaction.token != null){
                                    console.log(get_node_info_by_adr(message.request.requested,fileAdresses).table)
                                    console.log(get_node_info_by_adr(message.request.requested,fileAdresses).table[0].MAC);
                                    var cli_mac=get_node_info_by_adr(message.request.requested,fileAdresses).table[0].MAC;
                                    var bool = false;
                                    var i=0;
                                    var objFound;
                                    console.log(cli_mac);
                                    console.log(Object.keys(mqttserver.clients).length);
                                    while(i < Object.keys(mqttserver.clients).length && bool == false){

                                       if(Object.keys(mqttserver.clients)[i] == cli_mac){
                                            objFound = mqttserver.clients[Object.keys(mqttserver.clients)[i]];
                                            console.log('found');
                                            bool = true;
                                        }
                                        i++;
                                    }
                                    console.log(objFound);
                                    var cli=mqttserver.clients.filter(function(item){
                                        return (item==cli_mac);
                                    });

                                    mqttserver.publish({topic: message.request.type, payload: message.request.value},JSON.parse(cli));
                              //  }
                                /*****/
                                console.timeEnd("Transaction generated, validated and inserted");
                                broadcast_response(fileAdresses,objTmp.table[i].Transaction.hash,get_publicKey_node(fileConfig),'valid',fileConfig,insertTx,objTmp.table[i].tabProof,value);
                                
                            }
                            if(objTmp.table[i].nb_node/2 <= objTmp.table[i].nb_reject){
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
            }else{
                console.log('Non valid signature');
            }
        }
    }
    
    // Receiving request to insert Transaction
    if(message.type == 13){
        hash=message.transactionHash;
        var str = message.response+''+JSON.stringify(message.block)+''+message.transactionHash+''+JSON.stringify(message.tabProof);
        var shaMsg = crypto.createHash("sha256").update(str).digest();
        var publicKey = new Buffer(message.publicKey,'hex');
        var signature = new Buffer(message.signature,'hex');
        var ec = new EC("secp256k1");
        const asn1signature = concatSigToAsn1Sig(signature);
        var isValid = ec.verify(shaMsg, asn1signature, publicKey);
        
        if(isValid){
            var fileTmp = __dirname+'/tmp/node/tmp.json';
            var fileData = __dirname+'/tmp/node/blocs/data.json';
            var dataTmp=fs.readFileSync(fileTmp, 'utf8');

            if(dataTmp.length != 0){
                objTmp=JSON.parse(dataTmp);
                for(i=0;i<Object.keys(objTmp.table).length;i++){
                    if(objTmp.table[i].Transaction.hash == hash && message.response == 'valid'){
                        console.log('Insert Transaction : '+objTmp.table[i].Transaction.hash);
                        
                        var dataResponse=fs.readFileSync(fileResponse, 'utf8');
                                               
                        if(dataResponse.length != 0 ){
                            var objResponse = JSON.parse(dataResponse);
                            requestTmpFile = objResponse.requestTmp;
                            sendFile = objResponse.send;
                            if(sendFile == false){
                            requestTmp=message.value;
                            send = true;
                            var objResponse = {
                                requestTmp : requestTmp,
                                send : send
                            }

                            var jsonResponse = JSON.stringify(objResponse);
                            fs.writeFileSync(fileResponse, jsonResponse, 'utf8');
                            }  
                        }
                        insert_Transaction(objTmp.table[i].Transaction,fileData,message.block);
                    }
                    // Delete the transaction from the tmp file
                    objTmp.table.splice(i,1);
                }
                var jsonTmp = JSON.stringify(objTmp);
                fs.writeFileSync(fileTmp, jsonTmp, 'utf8');
            }
        }else{
            console.log('Non valid signature');
        }
           
    }

    //Receive request to modify/delete access rights
    if(message.type == 14){
        var fileAccess= __dirname+'/tmp/node/list.json';
        
        if(message.typeAction == 'UPDATE'){
            var str = message.typeAction+''+message.requester+''+message.requested+''+message.action+''+message.condition+''+message.obligation+''+message.trust;
            var shaMsg = crypto.createHash("sha256").update(str).digest();
            var publicKey = new Buffer(message.publicKey,'hex');
            var signature = new Buffer(message.signature,'hex');
            var ec = new EC("secp256k1");
            const asn1signature = concatSigToAsn1Sig(signature);
            var isValid = ec.verify(shaMsg, asn1signature, publicKey);
            if(isValid){
                update_access_rights(message.requester,message.requested,message.action,message.condition,message.obligation,message.trust,fileAccess);
            }else{
                console.log('Non valid signature');
            }
        }

        if(message.typeAction == 'DELETE'){
            var str = message.typeAction+''+message.requester+''+message.requested+''+message.action+''+message.condition+''+message.obligation+''+message.trust;
            var shaMsg = crypto.createHash("sha256").update(str).digest();
            var publicKey = new Buffer(message.publicKey,'hex');
            var signature = new Buffer(message.signature,'hex');
            var ec = new EC("secp256k1");
            const asn1signature = concatSigToAsn1Sig(signature);
            var isValid = ec.verify(shaMsg, asn1signature, publicKey);
            if(isValid){
                delete_access_rights(message.requester,message.requested,message.action,message.condition,message.obligation,fileAccess);
            }else{
                console.log('Non valid signature');
            }
        }

        if(message.typeAction == 'ADD'){
            var str = message.typeAction+''+JSON.stringify(message.listAccess);
            var shaMsg = crypto.createHash("sha256").update(str).digest();
            var publicKey = new Buffer(message.publicKey,'hex');
            var signature = new Buffer(message.signature,'hex');
            var ec = new EC("secp256k1");
            const asn1signature = concatSigToAsn1Sig(signature);
            var isValid = ec.verify(shaMsg, asn1signature, publicKey);
            if(isValid){
                add_access_rights(fileAccess,message.listAccess);
            }else{
                console.log('Non valid signature');
            }
        }   

        console.log('Access rights modified');                 
    }

    // Test signature
    if(message.type == 15){
        
         console.log('Transaction received : 10dc457b861ccc684affdf08b965ac6adfbda4a60ff30b4a97bd28a02c8e94c3');
            var shaMsg = new Buffer(message.shaMsg,'hex');
            var publicKey = new Buffer(message.publicKey,'hex');
            var signature = new Buffer(message.signature,'hex');
            var ec = new EC("secp256k1");
            const asn1signature = concatSigToAsn1Sig(signature);
            var isValid = ec.verify(shaMsg, asn1signature, publicKey);
            if(isValid){
            }else{
                console.log('Signature non valide, transaction : 10dc457b861ccc684affdf08b965ac6adfbda4a60ff30b4a97bd28a02c8e94c3 non validée');
            }
            console.log(isValid);
    }

    // Receive turn to become the elected miner
    if(message.type == 16){

        var shaMsg = new Buffer(message.shaMsg,'hex');
        var publicKey = new Buffer(message.publicKey,'hex');
        var signature = new Buffer(message.signature,'hex');
        var ec = new EC("secp256k1");
        const asn1signature = concatSigToAsn1Sig(signature);
        var isValid = ec.verify(shaMsg, asn1signature, publicKey);
        
        if(isValid){

            fileMiner = __dirname+'/tmp/node/miner.json';
            fileConfig = __dirname+'/tmp/node/config.json';
            fileAdresses = __dirname+'/tmp/node/adresses.json';
            fileMiner = __dirname+'/tmp/node/miner.json';

            var dataMiner=fs.readFileSync(fileMiner,'utf8');
            if(dataMiner.length != 0 ){
                var objMiner = JSON.parse(dataMiner);
                objMiner.table[0].myTurn = true;
            }else{
                objMiner = {
                    table : []
                };
                objMiner.table.push({adr : get_publicKey_node(fileConfig), myTurn : true, tabAdr : message.tabAdr});
            }
            var jsonMiner = JSON.stringify(objMiner);
            fs.writeFileSync(fileMiner, jsonMiner, 'utf8');

            setInterval(function() {
                switch_elected_miner(fileMiner,fileConfig,fileAdresses);
            }, 15000);
        }else{
            console.log('Non valid signature');
        }
    }   
};


var onstart = function(node) {
    

    var config = require('./config.js');
    var block = new Block(config.genesis);

    console.log('----- Genesis Block -----');
    console.log( JSON.stringify(block) );

    console.log('----- Start mining -----');

    var jsonfile = require('jsonfile');
    var file = __dirname+'/tmp/node/blocs/data.json';
    var fileConfig= __dirname+'/tmp/node/config.json';
    var fileAccess= __dirname+'/tmp/node/list.json';
    var fileTmp= __dirname+'/tmp/node/tmp.json';
    var fileAdresses = __dirname+'/tmp/node/adresses.json';
    var fileMiner = __dirname+'/tmp/node/miner.json';
    var fileData = __dirname+'/tmp/node/blocs/data.json';
    var i=0;
    var obj = {
        table: []
        };
    var objConfig = {
        table: []
        };


    /*console.time("Transaction generated, validated and inserted");
   
    console.timeEnd("Transaction generated, validated and inserted");

    console.time("Access ressource");
   
    console.timeEnd("Access ressource");    

    console.time("Adding new node");
   
    console.timeEnd("Adding new node"); */   

                start_elected_miner(fileMiner,fileConfig,fileAdresses);
        setInterval(function() {
                switch_elected_miner(fileMiner,fileConfig,fileAdresses);
            }, 15000);

        /*console.log('Generation de clé ...')
        var privateKey = crypto.randomBytes(32);
        var publicKey = eccrypto.getPublic(privateKey);

        console.time("Temps pour générer une paire de clé : ");

        console.log('Clé privé : '+toHexString(privateKey));

        console.log('Clé publique : '+toHexString(publicKey));
        
        console.timeEnd("Temps pour générer une paire de clé : ");  */
            
        //}
       
        
            
        

        /*var privateKey = crypto.randomBytes(32);
        var publicKey = eccrypto.getPublic(privateKey);
        var obj = [];
        obj.push({pk : toHexString(publicKey), sk : toHexString(privateKey)});
        var json= JSON.stringify(obj);
        fs.writeFileSync(fileTmp, json, 'utf8');*/

    // Generate and store key pair
    /*var dataConfig=fs.readFileSync(fileConfig, 'utf8');

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
            publicKey : objConfig.table[0].Key.publicKey,
            privateKey : objConfig.table[0].Key.privateKey,
        };
    }*/

    

    /*
    var transaction_request = new TransactionRequest();
        var token = new Token();
        token.new('ACCESS',3600);
        transaction_request.new('1','04be933d70f2916f75bd4133454d832976769a2f781cab5f84931b026b43c165584bbe7b62dc0a448489fea1c9e82970fb8ba06cb03a775399b1d9eb39b9ce6604','ACCESS',token);           
        
        console.log('Transaction Hash : '+transaction_request.hash);
        */

           /* var fileAccess= __dirname+'/tmp/node/list.json';
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
                
                broadcast_transaction(fileAdresses,transaction_use,'use',get_publicKey_node(fileConfig),fileConfig);
            }      */

          /*  transaction = new TransactionRequest();
            token = new Token();
            transaction.hash="a31df7dbcbc1edd1561e7f6cfd0620c709f1829c7d08a3460bc3b32afdf217f7";
            transaction.requested = "5869fff00fcd560bb0f237c3516a79cc969e79bec2558b05866d7b83a56db9e7dc142f681dea04f57099aa914a942f800386179f8c5359857f2a3065cc6cf30e70";
            transaction.requester= "3546ccc00fcd560bb0f237c3516a79cc969e79bec2558b05866d7b83a56db9e7dc142f681dea04f57099aa914a942f800386179f8c5359857f2a3065cc6cf30e70";
            transaction.timestamp=1528292454832;
            transaction.action="CONFIG";
            token.hash="dd7282652ff7c9262b591fb0271880dd463efc669a88dd9ed2852d2f320bcda7";
            token.timestamp=1526650593630;
            token.requested = "5869fff00fcd560bb0f237c3516a79cc969e79bec2558b05866d7b83a56db9e7dc142f681dea04f57099aa914a942f800386179f8c5359857f2a3065cc6cf30e70";
            token.requester = "3546ccc00fcd560bb0f237c3516a79cc969e79bec2558b05866d7b83a56db9e7dc142f681dea04f57099aa914a942f800386179f8c5359857f2a3065cc6cf30e70";
            token.validity=3600;
            token.action="CONFIG";
            transaction.token=token;

        
            nodeInfo = get_node_info(fileConfig);
            var str = JSON.stringify(transaction);
            var keyPublic =  new Buffer(nodeInfo.Key.publicKey,'hex');;
            var privateKey = new Buffer(nodeInfo.Key.privateKey,'hex');
            var ec = new EC("secp256k1");
            var shaMsg = crypto.createHash("sha256").update(str).digest();
            var mySign = ec.sign(shaMsg, privateKey, {canonical: true});
            var signature = asn1SigSigToConcatSig(mySign);
            
                var packet = {
                    from: {
                        address: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port,
                        id: server.id
                        },
                    message: { type: 10, host: nodeInfo.Server.IP, port: nodeInfo.Server.port, publicKey: nodeInfo.Key.publicKey, transaction : transaction, typeTransaction : 'request', shaMsg: shaMsg, signature : signature } 
                };
                server.sendMessage({address: '192.168.43.198', port: 8000},packet);*/
    /*var fileMiner= __dirname+'/tmp/node/miner.json';
    var dataMiner=fs.readFileSync(fileMiner, 'utf8');
        if(data.length == 0){
            obj.table.push({Block : block});
            var json = JSON.stringify(obj);
            fs.writeFileSync(file, json, 'utf8');
    }*/
    receiveNewNode(9000);
                
};

function receiveNewNode(port){
    var express = require('express');
    var bodyParser = require('body-parser');
   // var cors = require('cors');
    var app = express();

    app.use(function(request, response, next) {
      response.header("Access-Control-Allow-Origin", "*");
      response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    app.use(bodyParser.urlencoded({ extended: true })); 
    app.use(express.static('public'));
    app.use(bodyParser.json());
    
    var router = express.Router();

    
    app.all('/newNode', function(req, res) {

        objReceived=req.body;
        var arp = require('node-arp');
        arp.getMAC(objReceived.ipadr, function(err, mac) {
            
            res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
            console.log('New Node');

            var fileAdresses = __dirname+'/tmp/node/adresses.json';
            var fileConfig = __dirname+'/tmp/node/config.json';  
            var fileAccess=__dirname+'/tmp/node/list.json';  
            var fileMiner=__dirname+'/tmp/node/miner.json';      
            var file = __dirname + '/tmp/node/blocs/data.json';
            objReceived=req.body;
            
            // Test if the node exist
            
            
            var bool=existNodeMacAdr(mac,fileAdresses);
            
            var response = 'FAIL';
            console.log(mac);
            if(bool == false) {
                //node doesn't exist , save it
                port=objReceived.port;
                host=objReceived.ipadr;
                ip=objReceived.ipadr;
                role=objReceived.role;
                var trust;
                if(role == 'miner') trust = 0;
                if(role == 'ressource') trust = 3;
                if(role == 'user') trust = 5;
                
                saveNodeMacAdr(ip,port,mac,host,role,trust,fileAdresses);

                // Save access rights of the new node
                var listAccess=objReceived.listAccess;     
                if(listAccess != null){
                    saveAccessRight(fileAccess,listAccess);   
                }

                var dataConfig=fs.readFileSync(fileConfig, 'utf8');
                objConfig = JSON.parse(dataConfig);
                
                response='SUCCESS';
                if(role == 'miner'){// && minerTurn(fileMiner) == true){ // is the selected miner
                    
                    // Get the Blockchain 
                    
                    var jsonToSend=null;
                    data=fs.readFileSync(file, 'utf8');
                    if(data.length != 0){
                        obj = JSON.parse(data);
                    }else{
                        obj = '';    
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
                    var nodeInfo=get_node_info(fileConfig);

                    var str = response+''+JSON.stringify(obj)+''+JSON.stringify(objAdresses)+''+JSON.stringify(objAccess);
                    var keyPublic =  new Buffer(nodeInfo.Key.publicKey,'hex');;
                    var privateKey = new Buffer(nodeInfo.Key.privateKey,'hex');
                    var ec = new EC("secp256k1");
                    var shaMsg = crypto.createHash("sha256").update(str).digest();
                    var mySign = ec.sign(shaMsg, privateKey, {canonical: true});
                    var signature = asn1SigSigToConcatSig(mySign);

                    // Send to the node addresses, access list and BC
                    var packet = {
                        from: {
                            address: nodeInfo.Server.IP,
                            port: nodeInfo.Server.port ,
                            id: server.id
                            },
                        message: { type: 9, host: nodeInfo.Server.IP, port: nodeInfo.Server.port, publicKey: nodeInfo.Key.publicKey, response : response, blocs : obj, adresses : objAdresses, accesslist : objAccess, shaMsg : shaMsg, signature: signature } 
                    };
                    server.sendMessage({address: ip, port: port},packet);
                }

                if(role == 'user'&& minerTurn(fileMiner) == true){
                    console.log('Config node user');
                    // Generate keypair for the node  
                    var privateKey = crypto.randomBytes(32);
                    var publicKey = eccrypto.getPublic(privateKey);
                    update_adresses(publicKey,mac,fileAdresses);

                    broadcast_publicKey(fileAdresses,publicKey,mac,fileConfig);
                }

            }
            res.send({'response' : response });
           
        }); 
    });


    app.all('/configNode', function(req, res) {

        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
        console.log('Config Node');
        // Save in the config file

   
        var file = __dirname+'/tmp/node/blocs/data.json';
        var fileConfig = __dirname+'/tmp/node/config.json';
        var fileAdresses = __dirname+'/tmp/node/adresses.json';
        var fileMiner= __dirname+'/tmp/node/miner.json';
        objReceived=req.body;
        var jsonfile = require('jsonfile');
        var arp = require('node-arp');
        console.log(req.body.ipadr);

        if(process.platform === 'win32'){
            var adrMac = require('os').networkInterfaces()['Wi-Fi'][0].address;
        }else{
            var adrMac = require('os').networkInterfaces().wlan0[0].mac;   
        }
  
            var trust;
            if(req.body.role == 'miner') trust = 0;
            if(req.body.role == 'ressource') trust = 3;
            if(req.body.role == 'user') trust = 5;
            
            
           
            configNode(req.body.ipadr,adrMac,req.body.role,req.body.port,trust,fileConfig);
            if(req.body.first == 'true'){
                var config = require('./config.js');
                var block = new Block(config.genesis);
                var obj = {
                    table: []
                };
                // Store the genesis block in the file 
                var data=fs.readFileSync(file, 'utf8');
                if(data.length == 0){
                    obj.table.push({Block : block});
                    var json = JSON.stringify(obj);
                    fs.writeFileSync(file, json, 'utf8');
                }
                
                // Generate keypair for the node  
                var privateKey = crypto.randomBytes(32);
                var publicKey = eccrypto.getPublic(privateKey);
                // Generate keypair
                var dataConfig=fs.readFileSync(fileConfig, 'utf8');
                if(dataConfig.length != 0){
                    objConfig = JSON.parse(dataConfig);

                    objConfig.table[0].Key.publicKey = toHexString(publicKey);
                    objConfig.table[0].Key.privateKey = toHexString(privateKey);
                
                    // Fill in the file config of the node

                    var jsonConfig = JSON.stringify(objConfig);
                    fs.writeFileSync(fileConfig, jsonConfig, 'utf8');
                }
                saveNode(toHexString(publicKey),req.body.ipadr,req.body.port,adrMac,req.body.ipadr,req.body.role,trust,fileAdresses);
                
                var dataMiner=fs.readFileSync(fileMiner, 'utf8');
                objMiner = {
                    table : []
                }
                var tabAdr = [];
                tabAdr.push(toHexString(publicKey));
                objMiner.table.push({adr : toHexString(publicKey), myTurn : true, tabAdr : tabAdr});
                var jsonMiner = JSON.stringify(objMiner);
                fs.writeFileSync(fileMiner, jsonMiner, 'utf8');
                setInterval(function() {
                    switch_elected_miner(fileMiner,fileConfig,fileAdresses);
                }, 15000);
            }else{

                saveNodeMacAdr(req.body.ipadr,req.body.port,adrMac,req.body.ipadr,req.body.role,trust,fileAdresses);
            }

            console.log(adrMac); 
            res.send({statut : 'SUCCESS'});
        
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
            
            broadcast_transaction(fileAdresses,transaction_use,'use',get_publicKey_node(fileConfig),fileConfig,'');
    });

    app.post('/getAllNode',function(req, res){
        var fileAdresses = __dirname+'/tmp/node/adresses.json';
        var fileAccess = __dirname+'/tmp/node/list.json';
        console.log('Received request to send User');
        var ipRequest = getClientIp(req).slice(getClientIp(req).lastIndexOf(':')+1);
   
        if (get_node_info_by_ip(ipRequest,fileAdresses).table.length>0){
        var util = require('util');
        
        var nodes = [];
        nodes=get_all_node(fileAdresses);
        var adresses = [];
        for(var i=0;i<nodes.length;i++){
            var accesslist = get_node_accesslist(nodes[i].Node.adr,nodes[i].Node.MAC,fileAccess);
            //console.log(accesslist);
            adresses.push({Node : nodes[i].Node, accesslist : accesslist});
        }
        //console.log(adresses);
      //  adresses['Node']['accesslist']=get_node_accesslist(publicKey,mac,fileAccess);
        res.send(adresses);
                }
                else
                {
                    res.send("Permission non accordée");
                    console.log("ip :",ipRequest," Non autorisé pour cette action");
                }
    });

    app.post('/updateAccessRights',function(req, res){
        console.log('Received request to update Access control');
        
        var fileAdresses = __dirname+'/tmp/node/adresses.json';
        var fileAccess = __dirname+'/tmp/node/list.json';
        var fileConfig = __dirname+'/tmp/node/config.json';
        update_access_rights(req.body.requester,req.body.requested,req.body.action,req.body.condition,req.body.obligation,req.body.trust,fileAccess);
        response='SUCCESS';
        broadcast_access_rights('UPDATE',req.body.requester,req.body.requested,req.body.action,req.body.condition,req.body.obligation,req.body.trust,'',fileAdresses,fileConfig);
        res.send(response);
    });

    app.post('/deleteAccessRights',function(req, res){
        console.log('Received request to delete Access rights');
        var fileAdresses = __dirname+'/tmp/node/adresses.json';
        var fileAccess = __dirname+'/tmp/node/list.json';
        var fileConfig = __dirname+'/tmp/node/config.json';
        delete_access_rights(req.body.requester,req.body.requested,req.body.action,req.body.condition,req.body.obligation,fileAccess)
        response='SUCCESS';
        broadcast_access_rights('DELETE',req.body.requester,req.body.requested,req.body.action,req.body.condition,req.body.obligation,'','',fileAdresses,fileConfig);
        res.send(response);
    });

    app.post('/addAccessRights',function(req, res){
        console.log('Received request to add Access rights');
        
        var fileAdresses = __dirname+'/tmp/node/adresses.json';
        var fileAccess = __dirname+'/tmp/node/list.json';
        var fileConfig = __dirname+'/tmp/node/config.json';
        // Save access rights
        var listAccess=req.body.listAccess;     
        add_access_rights(fileAccess,listAccess);
        response='SUCCESS';
        broadcast_access_rights('ADD','','','','','','',listAccess,fileAdresses,fileConfig);
        res.send(response);
    });

    app.post('/accessRessource',function(req,res){
        console.log('Received request to access ressource');
        
        var fileConfig = __dirname+'/tmp/node/config.json';
        var fileAdresses = __dirname+'/tmp/node/adresses.json';
        nbReq ++;
        var objResponse = {
            requestTmp : '',
            send : false
        }

        var jsonResponse = JSON.stringify(objResponse);
        fs.writeFileSync(fileResponse, jsonResponse, 'utf8');

         var ipRequest = getClientIp(req).slice(getClientIp(req).lastIndexOf(':')+1);
        
        console.log("nodeinfo :",get_node_info_by_ip(ipRequest,fileAdresses));
        request = {
            ip : getClientIp(req),
            requester : get_node_info_by_ip(ipRequest,fileAdresses).table[0].adr,
            requested : req.body.requested,
            action : req.body.action,
            type : req.body.type,
            value : req.body.value,
            //conditions : '',
            //obligations : '',
            };
      
        console.log(request);
       

        var objResponse = {
            requestTmp : requestTmp,
            send : send
        }

        var jsonResponse = JSON.stringify(objResponse);
        fs.writeFileSync(fileResponse, jsonResponse, 'utf8');
            
            var refreshIntervalId = setInterval(function() {
                var dataResponse=fs.readFileSync(fileResponse, 'utf8');
               
                if(dataResponse.length != 0 ){
                    var objResponse = JSON.parse(dataResponse);
                    requestTmpFile = objResponse.requestTmp;
                    sendFile = objResponse.send;
                    if(sendFile == true && requestTmpFile !=''){
                        console.log('Send to User the value');
                        res.json(requestTmpFile);
                        requestTmp='';  
                        send = false;
                        var objResponse = {
                            requestTmp : requestTmp,
                            send : send
                        }

                        var jsonResponse = JSON.stringify(objResponse);
                        fs.writeFileSync(fileResponse, jsonResponse, 'utf8');
                        clearInterval(refreshIntervalId);
                       // res.end();
                    }   
                        
                        
                }
                       
            }, 20);


        // Broadcast request to execute Action
        broadcast_request(fileAdresses,get_publicKey_node(fileConfig),request,fileConfig);

    });
    function getClientIp(req) {
        var ipAddress;
        // The request may be forwarded from local web server.
        var forwardedIpsStr = req.header('x-forwarded-for'); 
        if (forwardedIpsStr) {
          // 'x-forwarded-for' header may return multiple IP addresses in
          // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
          // the first one
          var forwardedIps = forwardedIpsStr.split(',');
          ipAddress = forwardedIps[0];
        }
        if (!ipAddress) {
          // If request was not forwarded
          ipAddress = req.connection.remoteAddress;
        }
        return ipAddress;
      };
        app.post('/getBlockchain',function(req,res){
            res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
            console.log('Received request to send BC');
            var jsonToSend=null;
            var fileData = __dirname+'/tmp/node/blocs/data.json';
            data=fs.readFileSync(fileData, 'utf8');
            var objdata = '';
            if(data.length != 0){
                objdata = JSON.parse(data);
            }
            res.send(JSON.stringify(objdata));
        });

        app.post('/receiveValue',function(req,res){
            res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
            console.log('Received request to send BC');
            requestTmp = 'This is the value';
        });

        app.listen(port, function() {
        });
}

function existTmpHash(hash,fileTmp){

    var dataTmp=fs.readFileSync(fileTmp, 'utf8');
    if(dataTmp.length != 0){
        objTmp=JSON.parse(dataTmp);
        var i=0;
        while(i<Object.keys(objTmp.table).length){
            if(objTmp.table[i].Transaction.hash == hash) return true;
            i++;
        }
    }
    return false;
}

function start_elected_miner(fileMiner,fileConfig,fileAdresses){

 var dataMiner=fs.readFileSync(fileMiner,'utf8');
    
    if(dataMiner.length != 0 ){
        var objMiner = JSON.parse(dataMiner);
        if(objMiner.table[0].myTurn == false){
            if(objMiner.table[0].tabAdr.length != 0){
                nodeInfoSender = get_node_info(fileConfig);
                if(objMiner.table[0].tabAdr[objMiner.table[0].tabAdr.length-1] == nodeInfoSender.Key.publicKey){
                    objMiner.table[0].myTurn == true;
                    objMiner.table[0].tabAdr.push(objMiner.table[0].tabAdr[objMiner.table[0].tabAdr.length-1]);
                    objMiner.table[0].tabAdr.splice(objMiner.table[0].tabAdr.length-1,1);
                    var jsonMiner = JSON.stringify(objMiner);
                    fs.writeFileSync(fileMiner, jsonMiner, 'utf8');
                }
            }
        }
    }

}

function switch_elected_miner(fileMiner,fileConfig,fileAdresses){
    var dataMiner=fs.readFileSync(fileMiner,'utf8');
    
    if(dataMiner.length != 0 ){
        var objMiner = JSON.parse(dataMiner);
        if(objMiner.table[0].myTurn == true){
            if(objMiner.table[0].tabAdr.length != 0){
                
                objMiner.table[0].myTurn=false;
                nodeInfoSender = get_node_info(fileConfig);
                objMiner.table[0].tabAdr.push(objMiner.table[0].tabAdr[0]);
                objMiner.table[0].tabAdr.splice(0,1);
                
                nodeInfoReceiver = get_node_info_by_adr(objMiner.table[0].tabAdr[0],fileAdresses);
                var jsonMiner = JSON.stringify(objMiner);
                fs.writeFileSync(fileMiner, jsonMiner, 'utf8');

                var str = JSON.stringify(objMiner.table[0].tabAdr);
                var publicKey = new Buffer(nodeInfoSender.Key.publicKey,'hex');
                var privateKey = new Buffer(nodeInfoSender.Key.privateKey,'hex');
                var ec = new EC("secp256k1");
                var shaMsg = crypto.createHash("sha256").update(str).digest();
                var mySign = ec.sign(shaMsg, privateKey, {canonical: true});
                var signature = asn1SigSigToConcatSig(mySign);
                var packet = {
                    from: {
                        address: nodeInfoSender.Server.IP,
                        port: nodeInfoSender.Server.port,
                        id: server.id
                    },
                message: { type: 16, host: nodeInfoSender.Server.IP, port: nodeInfoSender.Server.port, tabAdr : objMiner.table[0].tabAdr, publicKey: publicKey, shaMsg: shaMsg, signature: signature} 
                };
                server.sendMessage({address: nodeInfoReceiver.table[0].ip, port: nodeInfoReceiver.table[0].port},packet);
            }
        }
    }
}

function get_node_info_by_adr(adr,fileAdresses){
    var objAdresses = {
        table: []
        };
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    var data = {
        table : []
    } 
    
    if(dataAdresses.length != 0 ){
        objAdresses = JSON.parse(dataAdresses);
        for(i=0;i<Object.keys(objAdresses.table).length;i++){
            //Test adress mac and public key if exist
            if(objAdresses.table[i].Node.adr == adr){
                data.table.push({ ip : objAdresses.table[i].Node.IP, port : objAdresses.table[i].Node.port, role : objAdresses.table[i].Node.role})
            } 
        }
    }
    return data;
}

function get_node_info_by_ip(ip,fileAdresses){
    var objAdresses = {
        table: []
        };
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    var data = {
        table : []
    } 
    
    if(dataAdresses.length != 0 ){
        objAdresses = JSON.parse(dataAdresses);
        for(i=0;i<Object.keys(objAdresses.table).length;i++){
            //Test adress mac and public key if exist
            if(objAdresses.table[i].Node.IP == ip){
                data.table.push({ adr : objAdresses.table[i].Node.adr, port : objAdresses.table[i].Node.port, role : objAdresses.table[i].Node.role})
            } 
        }
    }
    return data;
}

function minerTurn(fileMiner){
    var dataMiner=fs.readFileSync(fileMiner,'utf8');
    if(dataMiner.length != 0){
        objMiner = JSON.parse(dataMiner);
        return objMiner.table[0].myTurn;
    }
    return false;
}

function saveAccessRight(fileAccess,listAccess){
    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };

    if(dataAccess.length != 0 ){
               var objAccess = JSON.parse(dataAccess);
                precHash = objAccess.table[0].Node.adr; 
                for(i=0;i<objAccess.table.length;i++){
                   var boolNode = false;
                    if(objAccess.table[i].Node.adr == objReceived.publicKey){
                        boolNode = true;
                        for(j=0;j<listAccess.length;j++){
                            boolAccess = false;
                            for(k=0;k<objAccess.table[i].Node.accesslist.length;k++){
                                if(listAccess[j].requested == objAccess.table[i].Node.accesslist[k].ressource && listAccess[j].rights == objAccess.table[i].Node.accesslist[k].rights) boolAccess = true;
                            }
                            //Access rights doesn't exist, save it !!
                            if(boolAccess == false){
                                objAccess.table[i].Node.accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations });
                            }
                        }
                    }
                }
                // Node doesn't exist, save all the rights !
                if(boolNode == false){
                    for(j=0;j<listAccess.length;j++){
                        if(j == 0) {
                            var accesslist = [];
                            accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations});
                            objAccess.table.push({Node : { adr:listAccess[j].requester, accesslist : accesslist}});
                        }else{
                            
                            objAccess.table[objAccess.table.length-1].Node.accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations });
                            
                        }
                    }
                }
                var jsonAccess = JSON.stringify(objAccess);
                fs.writeFileSync(fileAccess, jsonAccess, 'utf8');   
    }else{
                for(j=0;j<listAccess.length;j++){
                    if(j == 0) {
                        var accesslist= [];
                        accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations });
                        objAccess.table.push({ Node : { adr:listAccess[j].requester, accesslist : accesslist} });
                    }else{
                        objAccess.table[objAccess.table.length-1].Node.accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations });
                    }
                }
                  
                var jsonAccess = JSON.stringify(objAccess);
                fs.writeFileSync(fileAccess, jsonAccess, 'utf8');
    }
}

function saveNode(publicKey,ip,port,mac,host,role,trust,fileAdresses){
    var objAdresses = {
        table: []
        };
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    if(dataAdresses.length != 0){
        var objAdresses = JSON.parse(dataAdresses);    
    }
    objAdresses.table.push({Node: { adr : publicKey, IP : ip, port : port, MAC : mac, host : host, role : role, trust : trust } }); 
    var jsonAdresses = JSON.stringify(objAdresses);
    fs.writeFileSync(fileAdresses, jsonAdresses, 'utf8');
}

function existNode(publicKey,mac,role,fileAdresses){
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
            if(objAdresses.table[i].Node.role != role) bool=false;
        }
    }
    return bool;
}

function configNode(ip,mac,role,port,trust,fileConfig){
    var obj = {
            table: []
        };
       console.log(mac);
    obj.table.push({Server :{host : 'localhost',port : port, IP : ip, MAC : mac }, Key : {publicKey : '',privateKey : ''}, Role : {desc : role}});
    var jsonConfig = JSON.stringify(obj);
    fs.writeFileSync(fileConfig, jsonConfig, 'utf8');
}

function get_node_info(fileConfig){
    var dataConfig=fs.readFileSync(fileConfig, 'utf8');
    var objConfig = JSON.parse(dataConfig);
    if(dataConfig.length != 0){
        return objConfig.table[0];
    }
    return false;
}

function getTrustByAdr(fileAdresses,adr){
    var dataAdresses=fs.readFileSync(fileAdresses,'utf8');
    var objAdresses= {
        table: []
    };
    if(dataAdresses.length != 0 ){
        var objAdresses = JSON.parse(dataAdresses);
        for(i=0;i<objAdresses.table.length;i++){
            if(objAdresses.table[i].Node.adr == adr){
               return objAdresses.table[i].Node.trust;
            }
        }
    }
    return null;
}

function QueryPermission(fileAccess,fileAdresses,requester,requested,action,conditions,obligations){

    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };
    var boolAccess = false;
    trustRequester = getTrustByAdr(fileAdresses,requester);
    trustRequested = getTrustByAdr(fileAdresses,requested);
    
    if(dataAccess.length != 0 ){
        var objAccess = JSON.parse(dataAccess);
        for(i=0;i<objAccess.table.length;i++){
            var boolNode = false;
            if(objAccess.table[i].Node.adr == requester){
                for(k=0;k<objAccess.table[i].Node.accesslist.length;k++){
                    if(requested == objAccess.table[i].Node.accesslist[k].ressource && action == objAccess.table[i].Node.accesslist[k].rights && trustRequested >= objAccess.table[i].Node.accesslist[k].trust) boolAccess = true;
                    
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

function broadcast_transaction(fileAdresses,transaction,type,publicKey,fileConfig,request){
    var objAdresses = {
        table: []
        };

    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    var bool= false;
    if(dataAdresses.length != 0 ){
        objAdresses = JSON.parse(dataAdresses);

        for(i=0;i<Object.keys(objAdresses.table).length;i++){
            nodeInfo = get_node_info(fileConfig);
            var str = JSON.stringify(transaction);
            var keyPublic =  new Buffer(nodeInfo.Key.publicKey,'hex');;
            var privateKey = new Buffer(nodeInfo.Key.privateKey,'hex');
            var ec = new EC("secp256k1");
            var shaMsg = crypto.createHash("sha256").update(str).digest();
            var mySign = ec.sign(shaMsg, privateKey, {canonical: true});
            var signature = asn1SigSigToConcatSig(mySign);
            
            //Test if node is miner
            if(objAdresses.table[i].Node.role == 'miner'){// && objAdresses.table[i].Node.adr != publicKey){
                
                var packet = {
                    from: {
                        address: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port,
                        id: server.id
                        },
                    message: { type: 10, host: nodeInfo.Server.IP, port: nodeInfo.Server.port, publicKey: nodeInfo.Key.publicKey, transaction : transaction, typeTransaction : type, shaMsg: shaMsg, signature : signature, request : request } 
                };
                server.sendMessage({address: objAdresses.table[i].Node.IP, port: objAdresses.table[i].Node.port},packet);
            }
        }
    }
}

function broadcast_response(fileAdresses,transactionHash,publicKey,response,fileConfig,block,tabProof,value){
    var objAdresses = {
        table: []
        };

    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    var bool= false;
    if(dataAdresses.length != 0 ){
        objAdresses = JSON.parse(dataAdresses);

        for(i=0;i<Object.keys(objAdresses.table).length;i++){
            //Test if node is miner
            if(objAdresses.table[i].Node.role == 'miner' && objAdresses.table[i].Node.adr != publicKey){
                nodeInfo = get_node_info(fileConfig);

                var str = response+''+JSON.stringify(block)+''+transactionHash+''+JSON.stringify(tabProof);
                var keyPublic =  new Buffer(nodeInfo.Key.publicKey,'hex');;
                var privateKey = new Buffer(nodeInfo.Key.privateKey,'hex');
                var ec = new EC("secp256k1");
                var shaMsg = crypto.createHash("sha256").update(str).digest();
                var mySign = ec.sign(shaMsg, privateKey, {canonical: true});
                var signature = asn1SigSigToConcatSig(mySign);

                var packet = {
                    from: {
                        address: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port,
                        id: server.id
                        },
                    message: { type: 13, host: nodeInfo.Server.IP, port: nodeInfo.Server.port, publicKey: nodeInfo.Key.publicKey, transactionHash : transactionHash, response : response, block : block, tabProof : tabProof, shaMsg : shaMsg, signature : signature, value : value } 
                };
                server.sendMessage({address: objAdresses.table[i].Node.IP, port: objAdresses.table[i].Node.port},packet);
            }
        }
    }
}

function broadcast_request(fileAdresses,publicKey,request,fileConfig){
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
                nodeInfo = get_node_info(fileConfig);

                var str = JSON.stringify(request);
                var keyPublic =  new Buffer(nodeInfo.Key.publicKey,'hex');
                var privateKey = new Buffer(nodeInfo.Key.privateKey,'hex');
                var ec = new EC("secp256k1");
                var shaMsg = crypto.createHash("sha256").update(str).digest();
                var mySign = ec.sign(shaMsg, privateKey, {canonical: true});
                var signature = asn1SigSigToConcatSig(mySign);

                var packet = {
                    from: {
                        address: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port,
                        id: server.id
                        },
                    message: { type: 8, host: nodeInfo.Server.IP, port: nodeInfo.Server.port, publicKey: get_publicKey_node(fileConfig), request : request, shaMsg : shaMsg, signature: signature } 
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

    if(transaction.token != null){
        var boolToken=token.verify(transaction.token.requested,transaction.token.requester,transaction.token.hash,transaction.token.action,transaction.token.validity,transaction.token.timestamp);
        console.log('Bool Token : '+boolToken);
        if(boolToken == false) return false;    
    }
    
    var boolTransaction=transaction_request.verify(transaction.hash,transaction.requested,transaction.requester,transaction.action,transaction.timestamp,transaction.token);  
    console.log('Bool Transaction : '+boolTransaction);
    if(boolTransaction == false) return false;   
    

    var boolExistTransaction=existTransaction(transaction.hash,fileData);
    console.log('Bool Exist Transaction : '+boolExistTransaction);
    if(boolExistTransaction == true) return false;
    
    
    var boolExistRequested=existNode(transaction.requested,fileAdresses);
    console.log('Bool Exist Requested : '+boolExistRequested);
    if(boolExistRequested == false) return false;
    

    var boolExistRequester=existNode(transaction.requester,fileAdresses);
    console.log('Bool Exist requester : '+boolExistRequester);
    if(boolExistRequester == false) return false;
    

    var boolPermission=QueryPermission(fileAccess,fileAdresses,transaction.requester,transaction.requested,transaction.action,'conditions','obligations');
    console.log('Bool Permission : '+boolPermission);
    if(boolPermission == false && transaction.token != null) return false;
    

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

     if(transaction.token != null){
        var boolToken=token.verify(transaction.token.requested,transaction.token.requester,transaction.token.hash,transaction.token.action,transaction.token.validity,transaction.token.timestamp);
        console.log('Bool Token : '+boolToken);
        if(boolToken == false) return false;    
    }
    
    
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
        var j = 0; 
        
        while(j<Object.keys(obj.table).length && boolExist == false){
            var block=new Block();
            var index=obj.table.length-1;
            var objTree = obj.table[index].Block._tree;
            var tabTree = Object.keys(objTree).map(function(key) {
              return [objTree[key]];
            });
           // console.log('Block '+i+' : ');
            //console.log(obj.table[i].Block.txs.length)
            block.new(obj.table[j].Block.hash,obj.table[j].Block.previousHash,obj.table[j].Block.timestamp,obj.table[j].Block.merkleRoot,obj.table[j].Block.difficulty,obj.table[j].Block.txs,obj.table[j].Block.nonce,obj.table[j].Block.no,tabTree,obj.table[j].Block.numberMax);
            boolExist=block.transactionsExist(hash); 
            j++;
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

function insert_Transaction(transaction,fileData,blockN){
    var data=fs.readFileSync(fileData, 'utf8');
    console.log('Insert transaction : '+transaction.hash); 
    var blockNew = null;
    if(existTransaction(transaction.hash,fileData) == false){
        if(blockN != null){
            if(data.length != 0){
                obj = JSON.parse(data);
                obj.table.push({Block : blockN});
            }else{
                var obj = {
                    table : []
                };
                obj.table.push({Block : blockN});
            }
            var json = JSON.stringify(obj);
            fs.writeFileSync(fileData, json, 'utf8');
        }else{
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
    }
    return blockNew;        
}

function check_efficiency(transaction,fileAdresses,fileData,fileAccess){

    boolExistTransaction = existTransaction(transaction.hash,fileData);
    console.log('Exist Transaction : '+boolExistTransaction);
    if(boolExistTransaction == false) return false;

     boolExistToken = existToken(transaction.token.hash,fileData);
    console.log('Exist Token : '+boolExistToken);
    if(boolExistToken == false) return false;
    

    boolHasPermission = QueryPermission(fileAccess,fileAdresses,transaction.requester,transaction.requested,transaction.action,transaction.conditions,transaction.obligations);
    console.log('Has Permission : '+boolHasPermission);
    if(boolHasPermission == false) return false;

    var token=new Token();
    var transaction_request= new TransactionRequest();

    if(transaction.token != null){
        var boolToken=token.verify(transaction.token.requested,transaction.token.requester,transaction.token.hash,transaction.token.action,transaction.token.validity,transaction.token.timestamp);
        console.log('Bool Token : '+boolToken);
        if(boolToken == false) return false;    
    }
    
   
    
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

function saveNodeMacAdr(ip,port,mac,host,role,trust,fileAdresses){
    var objAdresses = {
        table: []
        };
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    if(dataAdresses.length != 0){
        var objAdresses = JSON.parse(dataAdresses);    
    }
    objAdresses.table.push({Node: { adr : '', IP : ip, port : port, MAC : mac, host : host, role : role, trust : trust } }); 
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

function broadcast_publicKey(fileAdresses,publicKey,macadr,fileConfig){
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
                nodeInfo=get_node_info(fileConfig);
                var str = publicKey+''+macadr;
                var privateKey = new Buffer(nodeInfo.Key.privateKey,'hex');
                var ec = new EC("secp256k1");
                var shaMsg = crypto.createHash("sha256").update(str).digest();
                var mySign = ec.sign(shaMsg, privateKey, {canonical: true});
                var signature = asn1SigSigToConcatSig(mySign);
                
                var packet = {
                    from: {
                        address: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port ,
                        id: server.id
                        },
                    message: { type: 11, host: nodeInfo.Server.IP, port: nodeInfo.Server.port, publicKey: nodeInfo.Key.publicKey, mac : macadr, signature : signature, shaMsg : shaMsg } 
                };
                server.sendMessage({address: objAdresses.table[i].Node.IP, port: objAdresses.table[i].Node.port},packet);
            }
        }
    }
}

function update_adresses(publicKey,mac,fileAdresses){
    var objAdresses = {
        table: []
        };
       // console.log('update_adresses : '+publicKey+' MAC : '+mac);
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    
    if(dataAdresses.length != 0 ){
        objAdresses = JSON.parse(dataAdresses);
        for(i=0;i<objAdresses.table.length;i++){
            if(objAdresses.table[i].Node.MAC == mac ){
                objAdresses.table[i].Node.adr = publicKey;
            }
        }
        var jsonAdresses = JSON.stringify(objAdresses);
        fs.writeFileSync(fileAdresses, jsonAdresses, 'utf8');
    }
}

function update_access_list(publicKey,mac,fileAccess){
    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };

    if(dataAccess.length != 0 ){
        var objAccess = JSON.parse(dataAccess);
            
        for(i=0;i<objAccess.table.length;i++){
            if(objAccess.table[i].Node.adr == mac) objAccess.table[i].Node.adr = publicKey;
                for(k=0;k<objAccess.table[i].Node.accesslist.length;k++){
                    if(objAccess.table[i].Node.accesslist[k].ressource == mac) objAccess.table[i].Node.accesslist[k].ressource = publicKey; 
                }
        }
        var jsonAccess = JSON.stringify(objAccess);
        fs.writeFileSync(fileAccess, jsonAccess, 'utf8');   
    }
}

function get_node_accesslist(publicKey,mac,fileAccess){
    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };

    if(dataAccess.length != 0 ){
        var objAccess = JSON.parse(dataAccess);
        for(i=0;i<objAccess.table.length;i++){
            if(objAccess.table[i].Node.adr == mac || objAccess.table[i].Node.adr == publicKey){
                return objAccess.table[i].Node.accesslist;
            }
                
        }  
    }
    return null;
}

function update_access_rights(requester,requested,action,condition,obligation,trust,fileAccess){
    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };

    if(dataAccess.length != 0 ){
        var objAccess = JSON.parse(dataAccess);
            
        for(i=0;i<objAccess.table.length;i++){
            if(objAccess.table[i].Node.adr == requester){
                for(k=0;k<objAccess.table[i].Node.accesslist.length;k++){
                    if(objAccess.table[i].Node.accesslist[k].ressource == requested && objAccess.table[i].Node.accesslist[k].rights == action){
                      objAccess.table[i].Node.accesslist[k].conditions = condition;   
                      objAccess.table[i].Node.accesslist[k].obligations = obligation;
                      objAccess.table[i].Node.accesslist[k].trust = trust;
                    } 
                }
            }
        }
        var jsonAccess = JSON.stringify(objAccess);
        fs.writeFileSync(fileAccess, jsonAccess, 'utf8');   
    }
}

function delete_access_rights(requester,requested,action,condition,obligation,fileAccess){
    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };

    if(dataAccess.length != 0 ){
        var objAccess = JSON.parse(dataAccess);
            
        for(i=0;i<objAccess.table.length;i++){
            if(objAccess.table[i].Node.adr == requester){
                for(k=0;k<objAccess.table[i].Node.accesslist.length;k++){
                    if(objAccess.table[i].Node.accesslist[k].ressource == requested && objAccess.table[i].Node.accesslist[k].rights == action){
                        objAccess.table[i].Node.accesslist.splice(k,1);
                    } 
                }
            }
        }
        var jsonAccess = JSON.stringify(objAccess);
        fs.writeFileSync(fileAccess, jsonAccess, 'utf8');   
    }
}

function add_access_rights(fileAccess,listAccess){
    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };

    if(dataAccess.length != 0 ){
               var objAccess = JSON.parse(dataAccess);
                precHash = objAccess.table[0].Node.adr; 
                var boolNode = false;
                var boolAccess = false;
                for(i=0;i<objAccess.table.length;i++){
                    
                        for(j=0;j<listAccess.length;j++){
                            if(objAccess.table[i].Node.adr == listAccess[j].requested){
                                boolNode = true;
                                boolAccess = false;
                                for(k=0;k<objAccess.table[i].Node.accesslist.length;k++){
                                    if(listAccess[j].requested == objAccess.table[i].Node.accesslist[k].ressource && listAccess[j].rights == objAccess.table[i].Node.accesslist[k].rights) boolAccess = true;
                                }

                                //Access rights doesn't exist, save it !!
                                if(boolAccess == false){
                                    objAccess.table[i].Node.accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations, trust : listAccess[j].trust });
                                }
                            }
                        }
                }
                
                console.log('Bool Node : '+boolNode+', boolAccess : '+boolAccess);
                // Node doesn't exist, save all the rights !
                if(boolNode == false){
                    for(j=0;j<listAccess.length;j++){
                        if(j == 0) {
                            var accesslist = [];
                            accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations, trust : listAccess[j].trust});
                            objAccess.table.push({Node : { adr:listAccess[j].requester, accesslist : accesslist}});
                        }else{
                            
                            objAccess.table[objAccess.table.length-1].Node.accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations, trust : listAccess[j].trust});
                            
                        }
                    }
                }
                var jsonAccess = JSON.stringify(objAccess);
                fs.writeFileSync(fileAccess, jsonAccess, 'utf8');   
    }else{
                for(j=0;j<listAccess.length;j++){
                    if(j == 0) {
                        var accesslist= [];
                        accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations, trust : listAccess[j].trust});
                        objAccess.table.push({ Node : { adr:listAccess[j].requester, accesslist : accesslist} });
                    }else{
                        objAccess.table[objAccess.table.length-1].Node.accesslist.push({ressource : listAccess[j].requested, rights : listAccess[j].rights, conditions : listAccess[j].conditions, obligations : listAccess[j].obligations, trust : listAccess[j].trust});
                    }
                }
                  
                var jsonAccess = JSON.stringify(objAccess);
                fs.writeFileSync(fileAccess, jsonAccess, 'utf8');
    }
}

function broadcast_access_rights(type,requester,requested,action,condition,obligation,trust,listAccess,fileAdresses,fileConfig){
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
                if(type == 'ADD'){
                    nodeInfo=get_node_info(fileConfig);

                    var str = type+''+JSON.stringify(listAccess);
                    var keyPublic =  new Buffer(nodeInfo.Key.publicKey,'hex');
                    var privateKey = new Buffer(nodeInfo.Key.privateKey,'hex');
                    var ec = new EC("secp256k1");
                    var shaMsg = crypto.createHash("sha256").update(str).digest();
                    var mySign = ec.sign(shaMsg, privateKey, {canonical: true});
                    var signature = asn1SigSigToConcatSig(mySign);
                    const asn1signature = concatSigToAsn1Sig(signature);
                    
                    var packet = {
                    from: {
                       address: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port ,
                        id: server.id
                        },
                    message: { type: 14, host: nodeInfo.Server.IP, port: nodeInfo.Server.port, publicKey : nodeInfo.Key.publicKey, typeAction: type, listAccess : listAccess, shaMsg: shaMsg, signature: signature } 
                    };
                }else{
                    nodeInfo=get_node_info(fileConfig);
                    var str = type+''+requester+''+requested+''+action+''+condition+''+obligation+''+trust;
                    var keyPublic =  new Buffer(nodeInfo.Key.publicKey,'hex');
                    var privateKey = new Buffer(nodeInfo.Key.privateKey,'hex');
                    var ec = new EC("secp256k1");
                    var shaMsg = crypto.createHash("sha256").update(str).digest();
                    var mySign = ec.sign(shaMsg, privateKey, {canonical: true});
                    var signature = asn1SigSigToConcatSig(mySign);
                    
                    var packet = {
                    from: {
                        address: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port ,
                        id: server.id
                        },
                    message: { type: 14, host: nodeInfo.Server.IP, port: nodeInfo.Server.port, publicKey : nodeInfo.Key.publicKey, typeAction: type, requester : requester, requested : requested, action : action, condition : condition, obligation : obligation, trust : trust, shaMsg : shaMsg, signature : signature } 
                    };    
                }
                server.sendMessage({address: objAdresses.table[i].Node.IP, port: objAdresses.table[i].Node.port},packet);
            }
        }
    }
}

function existToken(hash,fileData){
    
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
            boolExist=block.tokenExist(hash); 
            i++;
        }

    }
    return boolExist;
}

function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

function toStringHex(string){
    var myBuffer = [];
    var str = string;
    var buffer = new Buffer(str, 'utf16le');
    for (var i = 0; i < buffer.length; i++) {
        myBuffer.push(buffer[i]);
    }

     return myBuffer;
}

function asn1SigSigToConcatSig(asn1SigBuffer) {
    return Buffer.concat([
        asn1SigBuffer.r.toArrayLike(Buffer, 'be', 32),
        asn1SigBuffer.s.toArrayLike(Buffer, 'be', 32)
    ]);
}

function concatSigToAsn1Sig(concatSigBuffer) {
    const r = new BN(concatSigBuffer.slice(0, 32).toString('hex'), 16, 'be');
    const s = new BN(concatSigBuffer.slice(32).toString('hex'), 16, 'be');
    return EcdsaDerSig.encode({r, s}, 'der');
}

/**
 * Create a mining node.
 */
server.start({
    onstart: onstart,
    onmessage: onmessage,
})
/*--------------------------------------------------------*/
/*------------------MQTT BROKER SETUP---------------------*/
/*--------------------------------------------------------*/
var mosca = require('mosca');
var smartContract = require('./SmartContract');
var moscaSetting = {
    interfaces: [
        { type: "mqtt", port: 1883 },
        { type: "http", port: 3000, bundle: true }
    ],
    stats: false,
    onQoS2publish: 'noack', // can set to 'disconnect', or to 'dropToQoS1' if using a client which will eat puback for QOS 2; e.g. mqtt.js

    logger: { name: 'IoTChain MQTT Server' /*, level: 'debug'*/ }
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
    console.log("Checking if Node ",client.id," exist !?");
    if (smartContract.existNodeMacAdr(client.id,__dirname+'/tmp/node/adresses.json')){
        console.log("Node ",client.id," exist");
        //mqttserver.publish({topic:"REQUEST_USE", payload:'foo'}, client);
    }else{
        //mqttserver.publish({topic:"MINERS", payload:'foo'}, client);
        console.log("Node ",client.id," not exist");
        //mqttserver.disconnect(client);
    } 
});

mqttserver.on('published', function (packet, client) {
    //console.log("Published :=", packet);
    if (packet.topic=="INFO"){
    console.log('Client \t:= ', client.id,' @ ',packet.payload, " Address updated");
    smartContract.update_adresses(smartContract.toHexString(packet.payload),client.id,__dirname+'/tmp/node/adresses.json');
    smartContract.broadcast_publicKey(__dirname+'/tmp/node/adresses.json',smartContract.toHexString(packet.payload),client.id,__dirname+'/tmp/node/config.json')
    }
    if (packet.topic=="Temp"){
                                value=packet.payload;
                                /******/
                                
                                var dataResponse=fs.readFileSync(fileResponse, 'utf8');

                                if(dataResponse.length != 0 ){
                                    var objResponse = JSON.parse(dataResponse);
                                    requestTmpFile = objResponse.requestTmp;
                                    sendFile = objResponse.send;
                                    if(sendFile == false){
                                    requestTmp=value;
                                    send = true;
                                    var objResponse = {
                                        requestTmp : requestTmp,
                                        send : send
                                    }

                                    var jsonResponse = JSON.stringify(objResponse);
                                    fs.writeFileSync(fileResponse, jsonResponse, 'utf8');
                                    }  
                                }
    }
});
function unicodeStringToTypedArray(s) {
    var escstr = encodeURIComponent(s);
    var binstr = escstr.replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    });
    var ua = new Uint8Array(binstr.length);
    Array.prototype.forEach.call(binstr, function (ch, i) {
        ua[i] = ch.charCodeAt(0);
    });
    return ua;
}
mqttserver.on('subscribed', function (topic, client) {
    
    if (topic=="MINERS"){
        mqttserver.publish({topic:"MINERS", payload:'foo'}, client);
    }

    console.log(client.id," Subscribed in ", topic," topic");
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
