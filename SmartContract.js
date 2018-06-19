
'use strict';
   var server = require('./server');
        var Miner = require('./libs/mining');
        var fs = require('fs'); 
        var shortid = require('shortid');
        var crypto = require("crypto");
        var eccrypto = require("eccrypto");
        var elliptic = require("elliptic");
        var EC = elliptic.ec;

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


function SmartContract() {
 
 
};


SmartContract.prototype.existTmpHash = function(hash,fileTmp){

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

SmartContract.prototype.switch_elected_miner = function(fileMiner,fileConfig,fileAdresses){
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

SmartContract.prototype.get_node_info_by_adr =function(adr,fileAdresses){
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

SmartContract.prototype.minerTurn = function (fileMiner){
    var dataMiner=fs.readFileSync(fileMiner,'utf8');
    if(dataMiner.length != 0){
        objMiner = JSON.parse(dataMiner);
        return objMiner.table[0].myTurn;
    }
    return false;
}

SmartContract.prototype.saveAccessRight = function (fileAccess,listAccess){
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

SmartContract.prototype.saveNode = function (publicKey,ip,port,mac,host,role,trust,fileAdresses){
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

SmartContract.prototype.existNode = function (publicKey,mac,role,fileAdresses){
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

SmartContract.prototype.configNode = function (ip,mac,role,port,trust,fileConfig){
    var obj = {
            table: []
        };
       
    obj.table.push({Server :{host : 'localhost',port : port, IP : ip, MAC : mac }, Key : {publicKey : '',privateKey : ''}, Role : {desc : role}});
    var jsonConfig = JSON.stringify(obj);
    fs.writeFileSync(fileConfig, jsonConfig, 'utf8');
}

SmartContract.prototype.get_node_info = function (fileConfig){
    var dataConfig=fs.readFileSync(fileConfig, 'utf8');
    var objConfig = JSON.parse(dataConfig);
    if(dataConfig.length != 0){
        return objConfig.table[0];
    }
    return false;
}

SmartContract.prototype.getTrustByAdr = function (fileAdresses,adr){
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

SmartContract.prototype.QueryPermission = function (fileAccess,fileAdresses,requester,requested,action,conditions,obligations){

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

SmartContract.prototype.get_nb_miner = function (fileAdresses){
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

SmartContract.prototype.get_all_node = function (fileAdresses){
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

SmartContract.prototype.broadcast_transaction = function (fileAdresses,transaction,type,publicKey,fileConfig){
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

SmartContract.prototype.broadcast_response = function (fileAdresses,transactionHash,publicKey,response,fileConfig,block,tabProof){
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

SmartContract.prototype.broadcast_request = function (fileAdresses,publicKey,request,fileConfig){
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

SmartContract.prototype.get_publicKey_node = function (fileConfig){
    var dataConfig=fs.readFileSync(fileConfig, 'utf8');
    var objConfig = JSON.parse(dataConfig);
    if(dataConfig.length != 0){
        return objConfig.table[0].Key.publicKey;
    }
    return false;
}

SmartContract.prototype.verify_transaction_request = function (transaction,fileAccess,fileAdresses,fileData){
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

SmartContract.prototype.verify_transaction_use = function (transaction,fileAccess,fileAdresses,fileData){
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

SmartContract.prototype.existTransaction = function (hash,fileData){
    
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

SmartContract.prototype.existNode = function (nodeAdr,fileAdresses){
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

SmartContract.prototype.insert_Transaction = function (transaction,fileData,blockN){
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

SmartContract.prototype.check_efficiency = function (transaction,fileAdresses,fileData,fileAccess){

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

SmartContract.prototype.saveNodeMacAdr = function (ip,port,mac,host,role,trust,fileAdresses){
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

SmartContract.prototype.existNodeMacAdr = function (mac,fileAdresses){
    var objAdresses = {
        table: []
        };
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    if(dataAdresses.length != 0 ){
        objAdresses = JSON.parse(dataAdresses);

        for(var i=0;i<Object.keys(objAdresses.table).length;i++){
            // Test if node exist
            if(objAdresses.table[i].Node.MAC == mac) return true;
        }
    }
    return false;
}

SmartContract.prototype.broadcast_publicKey = function (fileAdresses,publicKey,macadr,fileConfig){
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
                        message: { type: 11, host: nodeInfo.Server.IP, port: nodeInfo.Server.port, publicKey: publicKey, public : nodeInfo.Key.publicKey, mac : macadr, signature : signature, shaMsg : shaMsg } 
                    };
                    server.sendMessage({address: objAdresses.table[i].Node.IP, port: objAdresses.table[i].Node.port},packet);
                }
            }
        }
    }

SmartContract.prototype.update_adresses = function (publicKey,mac,fileAdresses){
    var objAdresses = {
        table: []
        };
       // console.log('update_adresses : '+publicKey+' MAC : '+mac);
    var dataAdresses=fs.readFileSync(fileAdresses, 'utf8');
    
    if(dataAdresses.length != 0 ){
        objAdresses = JSON.parse(dataAdresses);
        for(var i=0;i<objAdresses.table.length;i++){
            if(objAdresses.table[i].Node.MAC == mac ){
                objAdresses.table[i].Node.adr = publicKey;
            }
        }
        var jsonAdresses = JSON.stringify(objAdresses);
        fs.writeFileSync(fileAdresses, jsonAdresses, 'utf8');
    }
}

SmartContract.prototype.update_access_list = function (publicKey,mac,fileAccess){
    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };

    if(dataAccess.length != 0 ){
        var objAccess = JSON.parse(dataAccess);
            
        for(var i=0;i<objAccess.table.length;i++){
            if(objAccess.table[i].Node.adr == mac) objAccess.table[i].Node.adr = publicKey;
                for(k=0;k<objAccess.table[i].Node.accesslist.length;k++){
                    if(objAccess.table[i].Node.accesslist[k].ressource == mac) objAccess.table[i].Node.accesslist[k].ressource = publicKey; 
                }
        }
        var jsonAccess = JSON.stringify(objAccess);
        fs.writeFileSync(fileAccess, jsonAccess, 'utf8');   
    }
}

SmartContract.prototype.get_node_accesslist = function (publicKey,mac,fileAccess){
    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };

    if(dataAccess.length != 0 ){
        var objAccess = JSON.parse(dataAccess);
        for(var i=0;i<objAccess.table.length;i++){
            if(objAccess.table[i].Node.adr == mac || objAccess.table[i].Node.adr == publicKey){
                return objAccess.table[i].Node.accesslist;
            }
                
        }  
    }
    return null;
}

SmartContract.prototype.update_access_rights = function(requester,requested,action,condition,obligation,trust,fileAccess){
    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };

    if(dataAccess.length != 0 ){
        var objAccess = JSON.parse(dataAccess);
            
        for(var i=0;i<objAccess.table.length;i++){
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

SmartContract.prototype.delete_access_rights = function(requester,requested,action,condition,obligation,fileAccess){
    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };

    if(dataAccess.length != 0 ){
        var objAccess = JSON.parse(dataAccess);
            
        for(var i=0;i<objAccess.table.length;i++){
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

SmartContract.prototype.add_access_rights = function(fileAccess,listAccess){
    var dataAccess=fs.readFileSync(fileAccess,'utf8');
    var objAccess= {
        table: []
    };

    if(dataAccess.length != 0 ){
               var objAccess = JSON.parse(dataAccess);
                precHash = objAccess.table[0].Node.adr; 
                var boolNode = false;
                var boolAccess = false;
                for(var i=0;i<objAccess.table.length;i++){
                    
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

SmartContract.prototype.broadcast_access_rights = function(type,requester,requested,action,condition,obligation,trust,listAccess,fileAdresses,fileConfig){
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

SmartContract.prototype.existToken = function(hash,fileData){
    
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

SmartContract.prototype.toHexString = function(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

SmartContract.prototype.toStringHex = function(string){
    var myBuffer = [];
    var str = string;
    var buffer = new Buffer(str, 'utf16le');
    for (var i = 0; i < buffer.length; i++) {
        myBuffer.push(buffer[i]);
    }

     return myBuffer;
}

SmartContract.prototype.asn1SigSigToConcatSig = function(asn1SigBuffer) {
    return Buffer.concat([
        asn1SigBuffer.r.toArrayLike(Buffer, 'be', 32),
        asn1SigBuffer.s.toArrayLike(Buffer, 'be', 32)
    ]);
}

SmartContract.prototype.concatSigToAsn1Sig = function (concatSigBuffer) {
    const r = new BN(concatSigBuffer.slice(0, 32).toString('hex'), 16, 'be');
    const s = new BN(concatSigBuffer.slice(32).toString('hex'), 16, 'be');
    return EcdsaDerSig.encode({r, s}, 'der');
}

var smartcontract =  new SmartContract();

/**
 * Export the smartcontract.
 */
module.exports = smartcontract;