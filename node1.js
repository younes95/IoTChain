var server = require('./server');
var Miner = require('./libs/mining');
var fs = require('fs'); 
var shortid = require('shortid');
var crypto = require("crypto");
var eccrypto = require("eccrypto");
var elliptic = require("elliptic");
var EC = elliptic.ec;
const BN = require('bn.js');
const asn =require('asn1.js');

const EcdsaDerSig = asn.define('ECPrivateKey', function() {
    return this.seq().obj(
        this.key('r').int(),
        this.key('s').int()
    );
});

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

// Import transaction classes
Transaction = require('./transaction/transaction');
TransactionRequest= require('./transaction/transaction_request');
TransactionUse = require('./transaction/transaction_use');
Token = require('./transaction/token');


var onmessage = function(payload) {
    
    // Initialize attributes

    data=JSON.parse(payload.data);
    message=data.message;
    var obj = {
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
        var file = __dirname + '/tmp/node1/blocs/data.json';
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
       
        var fileAdresses = __dirname + '/tmp/node1/adresses.json';
        var fileAccess = __dirname + '/tmp/node1/list.json';
        var fileConfig = __dirname + '/tmp/node1/config.json';
        // Test if the node exist
        var bool = existNode(message.publicKey,message.mac,message.role,fileAdresses);
       
            if(bool == true){
               
                // Get the Blockchain and send it to the node
                
                var jsonToSend=null;
                var file = __dirname + '/tmp/node1/blocs/data.json';
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
        var file = __dirname + '/tmp/node1/blocs/data.json';
        var fileAdresses = __dirname + '/tmp/node1/adresses.json';
        var fileConfig = __dirname + '/tmp/node1/config.json';
        var fileAccess = __dirname + '/tmp/node1/list.json';
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
        var request=message.request;
        var fileAccess = __dirname+'/tmp/node1/list.json';
        var fileAdresses = __dirname+'/tmp/node1/adresses.json';
        var fileConfig = __dirname+'/tmp/node1/config.json';
        var fileTmp = __dirname+'/tmp/node1/tmp.json';
        var fileMiner = __dirname+'/tmp/node1/miner.json';
        
        var shaMsg = crypto.createHash("sha256").update(JSON.stringify(message.request)).digest();
        var publicKey = new Buffer(message.publicKey,'hex');
        var signature = new Buffer(message.signature,'hex');
        var ec = new EC("secp256k1");
        const asn1signature = concatSigToAsn1Sig(signature);
        var isValid = ec.verify(shaMsg, asn1signature, publicKey);

        var nodeInfo=get_node_info(fileConfig);
        boolAccess=QueryPermission(fileAccess,fileAdresses,request.requester,request.requested,request.action,request.conditions,request.obligations);
        
        if(minerTurn(fileMiner) == true){
            var transaction_request = new TransactionRequest();
            if(boolAccess == true){
                var token = new Token();
                token.new(request.action,3600);
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
            broadcast_transaction(fileAdresses,transaction_request,'request',get_publicKey_node(fileConfig),fileConfig);
          //  console.log(tmp);
        }
        if(boolAccess == false){
            console.log('Access refused');
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
            var file = __dirname + '/tmp/node1/blocs/data.json';
            var fileAdresses = __dirname + '/tmp/node1/adresses.json';
            var fileConfig = __dirname + '/tmp/node1/config.json';
            var fileAccess = __dirname + '/tmp/node1/list.json';
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
                    message: { type: 12, host: nodeInfo.Server.IP, port: nodeInfo.Server.port, publicKey: get_publicKey_node(fileConfig), transactionHash : transaction.hash, typeTransaction : message.typeTransaction, response : boolTransactionValid, shaMsg : shaMsg, signature : signature } 
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
            var fileAdresses = __dirname + '/tmp/node1/adresses.json';
            var fileAccess = __dirname + '/tmp/node1/list.json';
            var fileMiner = __dirname+'/tmp/node1/miner.json';
            
            mac = message.mac;
            //Update access list
            update_access_list(keyPublic,mac,fileAccess);
            //Update adresses list
            update_adresses(keyPublic,mac,fileAdresses);
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

        var fileTmp = __dirname+'/tmp/node1/tmp.json';
        var fileAdresses = __dirname+'/tmp/node1/adresses.json';
        var fileConfig = __dirname+'/tmp/node1/config.json';
        var fileData = __dirname+'/tmp/node1/blocs/data.json';
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
                                broadcast_response(fileAdresses,objTmp.table[i].Transaction.hash,get_publicKey_node(fileConfig),'valid',fileConfig,insertTx,objTmp.table[i].tabProof);
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
            var fileTmp = __dirname+'/tmp/node1/tmp.json';
            var fileData = __dirname+'/tmp/node1/blocs/data.json';
            var dataTmp=fs.readFileSync(fileTmp, 'utf8');

            if(dataTmp.length != 0){
                objTmp=JSON.parse(dataTmp);
                for(i=0;i<Object.keys(objTmp.table).length;i++){
                    if(objTmp.table[i].Transaction.hash == hash && message.response == 'valid'){
                        console.log('Insert Transaction : '+objTmp.table[i].Transaction.hash);
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
        var fileAccess= __dirname+'/tmp/node1/list.json';
        
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
            var shaMsg = new Buffer(message.shaMsg,'hex');
            var publicKey = new Buffer(message.publicKey,'hex');
            var signature = new Buffer(message.signature,'hex');
            var ec = new EC("secp256k1");
            const asn1signature = concatSigToAsn1Sig(signature);
            var isValid = ec.verify(shaMsg, asn1signature, publicKey)
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

            fileMiner = __dirname+'/tmp/node1/miner.json';
            fileConfig = __dirname+'/tmp/node1/config.json';
            fileAdresses = __dirname+'/tmp/node1/adresses.json';
            fileMiner = __dirname+'/tmp/node1/miner.json';

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

    var fileConfig = __dirname+'/tmp/node1/config.json';
    var jsonfile = require('jsonfile');
    var objConfig = {
        table: []
        };
    
    var dataConfig=fs.readFileSync(fileConfig, 'utf8');
                
    // Keypair part
    if(dataConfig.length != 0){
       /* // Generate keypair for the node  
        var privateKey = crypto.randomBytes(32);
        var publicKey = eccrypto.getPublic(privateKey);

        var Key= { publicKey: toHexString(publicKey), privateKey: toHexString(privateKey) };
        var Server= { host: server.host, port: server.port,  IP: '', MAC: '' };
        var role = { desc: 'user' };
    
        // Fill in the file config of the node
        objConfig.table.push({ Server: Server , Key: Key, Role: role});
        var jsonConfig = JSON.stringify(objConfig);
        fs.writeFileSync(fileConfig, json, 'utf8');*/
        
        // Recuperate the file config of the node
        objConfig = JSON.parse(dataConfig);
        var key= {
            publicKey : objConfig.table[0].Key.publicKey
        };
        var role= objConfig.table[0].Role;
    }
   /* 
    var fileAccess=__dirname+'/tmp/node1/list.json';
    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    
    var file = __dirname+'/tmp/node1/blocs/data.json';
    var lastHash=null;
    var data=fs.readFileSync(file, 'utf8');
                
   *//* if(data.length != 0){
        obj = JSON.parse(data);
        lastHash=obj.table[obj.table.length-1].Block.hash;
    }*/
   

        var fileAccess= __dirname+'/tmp/node1/list.json';
        var fileTmp= __dirname+'/tmp/node1/tmp.json';
        var fileConfig= __dirname+'/tmp/node1/config.json';
        var fileAdresses = __dirname+'/tmp/node1/adresses.json';
        var fileMiner = __dirname+'/tmp/node1/miner.json';
        var fileData = __dirname+'/tmp/node1/blocs/data.json';

       setInterval(function() {
            switch_elected_miner(fileMiner,fileConfig,fileAdresses);
            }, 15000);

       
    receiveNewNode(9001);
};

function receiveNewNode(port){
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

        var fileAdresses = __dirname+'/tmp/node1/adresses.json';
        var fileConfig = __dirname+'/tmp/node1/config.json';  
        var fileAccess=__dirname+'/tmp/node1/list.json';  
        var fileMiner=__dirname+'/tmp/node1/miner.json';      
        var file = __dirname + '/tmp/node1/blocs/data.json';
        objReceived=req.body;
        
        // Test if the node exist
        var bool=existNodeMacAdr(objReceived.macadr,fileAdresses);
       
        var response = 'FAIL';

        if(bool == false) {
            //node doesn't exist , save it
            port=objReceived.port;
            host=objReceived.ipadr;
            ip=objReceived.ipadr;
            mac=objReceived.macadr;
            role=objReceived.role;
            trust = objReceived.trust;

            saveNodeMacAdr(ip,port,mac,host,role,trust,fileAdresses);

            // Save access rights of the new node
            var listAccess=objReceived.listAccess;     
            if(listAccess != null){
                saveAccessRight(fileAccess,listAccess);   
            }

            var dataConfig=fs.readFileSync(fileConfig, 'utf8');
            objConfig = JSON.parse(dataConfig);
            
            response='SUCCESS';
            if(role == 'miner' && minerTurn(fileMiner) == true){ // is the selected miner
                
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
                    message: { type: 9, host: nodeInfo.Server.IP, port: nodeInfo.Server.port, response : response, blocs : obj, adresses : objAdresses, accesslist : objAccess } 
                };
                server.sendMessage({address: ip, port: port},packet);
            }

        }
        res.send({'response' : response });
    });
    
    app.all('/configNode', function(req, res) {
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
        console.log('Config Node');
        // Save in the config file
        var fileConfig = __dirname+'/tmp/node1/config.json';
        var fileAdresses = __dirname+'/tmp/node1/adresses.json';
        var fileMiner= __dirname+'/tmp/node1/miner.json';
        objReceived=req.body;
        var jsonfile = require('jsonfile');
        configNode(req.body.ipadr,req.body.macadr,req.body.role,req.body.port,fileConfig);
        if(req.body.first == 'true'){
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
            saveNode(toHexString(publicKey),req.body.ipadr,req.body.port,req.body.macadr,req.body.ipadr,req.body.role,fileAdresses);
            
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
            saveNodeMacAdr(req.body.ipadr,req.body.port,req.body.macadr,req.body.ipadr,req.body.role,req.body.trust,fileAdresses);
        }

        
        res.send({statut : 'SUCCESS'});
    });

    app.post('/addnewNode', function(req, res) {
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
        console.log('Add New Node');
        var fileAdresses = __dirname+'/tmp/node1/adresses.json';
        var fileConfig = __dirname+'/tmp/node1/config.json';
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
            var fileAccess=__dirname+'/tmp/node1/list.json';
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
        var file = __dirname+'/tmp/node1/config.json';
        var jsonfile = require('jsonfile');
        var obj = {
            table: []
            };
        
        var data=fs.readFileSync(file, 'utf8');
        obj = JSON.parse(data);
        
        if( obj.table[0].Role.desc == "miner"){
            //Get the last hash of blockchain in this node

            var file = __dirname+'/tmp/node1/blocs/data.json';
            var lastHash=null;
            var data=fs.readFileSync(file, 'utf8');
                        
            if(data.length != 0){
                objData = JSON.parse(data);
                lastHash=obj.table[objData.table.length-1].Block.hash;
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
        
        var fileAccess= __dirname+'/tmp/node1/list.json';
        var fileTmp= __dirname+'/tmp/node1/tmp.json';
        var fileConfig= __dirname+'/tmp/node1/config.json';
        var fileAdresses = __dirname+'/tmp/node1/adresses.json';
        var fileData = __dirname+'/tmp/node1/blocs/data.json';

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
            
            broadcast_transaction(fileAdresses,transaction_use,'use',get_publicKey_node(fileConfig),fileConfig);
    });

    app.post('/getAllNode',function(req, res){
        console.log('Received request to send User');
        
        var fileAdresses = __dirname+'/tmp/node1/adresses.json';
        var fileAccess = __dirname+'/tmp/node1/list.json';
        var nodes = [];
        nodes=get_all_node(fileAdresses);
        var adresses = [];
        for(var i=0;i<nodes.length;i++){
            var accesslist = get_node_accesslist(nodes[i].Node.adr,nodes[i].Node.MAC,fileAccess);
            //console.log(accesslist);
            adresses.push({Node : nodes[i].Node, accesslist : accesslist});
        }
        //console.log(adresses);
        //adresses['Node']['accesslist']=get_node_accesslist(publicKey,mac,fileAccess);
        res.send(adresses);
    });

    app.post('/updateAccessRights',function(req, res){
        console.log('Received request to update Access control');
        
        var fileAdresses = __dirname+'/tmp/node1/adresses.json';
        var fileAccess = __dirname+'/tmp/node1/list.json';
        var fileConfig = __dirname+'/tmp/node1/config.json';
        update_access_rights(req.body.requester,req.body.requested,req.body.action,req.body.condition,req.body.obligation,req.body.trust,fileAccess);
        response='SUCCESS';
        broadcast_access_rights('UPDATE',req.body.requester,req.body.requested,req.body.action,req.body.condition,req.body.obligation,req.body.trust,'',fileAdresses,fileConfig);
        res.send(response);
    });

    app.post('/deleteAccessRights',function(req, res){
        console.log('Received request to delete Access rights');
        var fileAdresses = __dirname+'/tmp/node1/adresses.json';
        var fileAccess = __dirname+'/tmp/node1/list.json';
        var fileConfig = __dirname+'/tmp/node1/config.json';
        delete_access_rights(req.body.requester,req.body.requested,req.body.action,req.body.condition,req.body.obligation,fileAccess)
        response='SUCCESS';
        broadcast_access_rights('DELETE',req.body.requester,req.body.requested,req.body.action,req.body.condition,req.body.obligation,'','',fileAdresses,fileConfig);
        res.send({response});
    });

    app.post('/addAccessRights',function(req, res){
        console.log('Received request to add Access rights');
        
        var fileAdresses = __dirname+'/tmp/node1/adresses.json';
        var fileAccess = __dirname+'/tmp/node1/list.json';
        var fileConfig = __dirname+'/tmp/node1/config.json';
        // Save access rights
        var listAccess=req.body.listAccess;     
        add_access_rights(fileAccess,listAccess);
        response='SUCCESS';
        broadcast_access_rights('ADD','','','','','','',listAccess,fileAdresses,fileConfig);
        res.send(response);
    });

    app.post('/accessRessource',function(req,res){
        console.log('Received request to access ressource');
        
        var fileConfig = __dirname+'/tmp/node1/config.json';
        var fileAdresses = __dirname+'/tmp/node1/adresses.json';
        
        request = {
                requester :req.body.requester,
                requested : req.body.requested,
                action : req.body.action,
                conditions : '',
                obligations : '',
            }
        // Broadcast request to execute Action
        broadcast_request(fileAdresses,get_publicKey_node(fileConfig),request,fileConfig);
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

/*function configNode(ip,mac,role,fileConfig){
    var objConfig = {
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
}*/

function configNode(ip,mac,role,port,fileConfig){
    var obj = {
            table: []
        };
       
    obj.table.push({Server :{host : 'localhost',port : port, IP : ip, MAC : mac }, Key : {publicKey : '',privateKey : ''}, Role : {desc : role}});
    var jsonConfig = JSON.stringify(obj);
    fs.writeFileSync(fileConfig, jsonConfig, 'utf8');
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

function broadcast_transaction(fileAdresses,transaction,type,publicKey,fileConfig){
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
            if(objAdresses.table[i].Node.role == 'miner' && objAdresses.table[i].Node.adr != publicKey){
                
                var packet = {
                    from: {
                        address: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port,
                        id: server.id
                        },
                    message: { type: 10, host: nodeInfo.Server.IP, port: nodeInfo.Server.port, publicKey: nodeInfo.Key.publicKey, transaction : transaction, typeTransaction : type, shaMsg: shaMsg, signature : signature } 
                };
                server.sendMessage({address: objAdresses.table[i].Node.IP, port: objAdresses.table[i].Node.port},packet);
            }
        }
    }
}

function broadcast_response(fileAdresses,transactionHash,publicKey,response,fileConfig,block,tabProof){
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
                    message: { type: 13, host: nodeInfo.Server.IP, port: nodeInfo.Server.port, publicKey: nodeInfo.Key.publicKey, transactionHash : transactionHash, response : response, block : block, tabProof : tabProof, shaMsg : shaMsg, signature : signature } 
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

function get_node_info(fileConfig){
    var dataConfig=fs.readFileSync(fileConfig, 'utf8');
    var objConfig = JSON.parse(dataConfig);
    if(dataConfig.length != 0){
        return objConfig.table[0];
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
        var boolToken=token.verify(transaction.token.hash,transaction.token.action,transaction.token.validity,transaction.token.timestamp);
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
        var boolToken=token.verify(transaction.token.hash,transaction.token.action,transaction.token.validity,transaction.token.timestamp);
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
        i=0; 
        while(i<Object.keys(obj.table).length && boolExist == false){
            var block=new Block();
            var index=obj.table.length-1;
            var objTree = obj.table[index].Block._tree;
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
        var boolToken=token.verify(transaction.token.hash,transaction.token.action,transaction.token.validity,transaction.token.timestamp);
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

function get_node_accesslist(publicKey,mac,fileAccess){
    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };

    if(dataAccess.length != 0 ){
        var objAccess = JSON.parse(dataAccess);
            
        for(i=0;i<objAccess.table.length;i++){
            if(objAccess.table[i].Node.adr == mac || objAccess.table[i].Node.adr == publicKey)
                return objAccess.table[i].Node.accesslist;
        }  
    }
    return null;
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
    
    // Verify if token exist
    
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
 * Create a new miner node and join a peer node.
 */
server.start({
    onstart: onstart,
    onmessage: onmessage,
    join: {
        address: 'localhost',
        port: 8000
    }
});
