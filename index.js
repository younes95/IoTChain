var server = require("./server");
var Miner = require("./libs/mining");
var fs = require("fs");
var shortid = require("shortid");
var crypto = require("crypto");
var eccrypto = require("eccrypto");
var elliptic = require("elliptic");
var EC = elliptic.ec;

var requestTmp = "";
var send = false;
var nbReq = 0;
const fileResponse = __dirname + "/tmp/node/sendResponse.json";

// Import genesis block
var block = require("./libs/genesis");
var Block = require("./libs/block");
// Create a new miner and start to mine
var miner = new Miner();
var RpcUtils = require("./utils");
var RPCMessage = require("./server/message");

// Import utils
var accessUtils = require("./utils/access");
var nodeUtils = require("./utils/node");

var textEncoding = require("text-encoding");
var TextDecoder = textEncoding.TextDecoder;
var TextEncoder = textEncoding.TextEncoder;
const BN = require("bn.js");
const asn = require("asn1.js");

const EcdsaDerSig = asn.define("ECPrivateKey", function () {
    return this.seq().obj(this.key("r").int(), this.key("s").int());
});

// Import transaction classes
Transaction = require("./transaction/transaction");
TransactionRequest = require("./transaction/transaction_request");
TransactionUse = require("./transaction/transaction_use");
Token = require("./transaction/token");

var onmessage = function (payload) {
    data = JSON.parse(payload.data);
    message = data.message;
    var obj = {
        table: [],
    };
    var objToSend = {
        table: [],
    };

    //Receiving new Node info
    if (message.type == 2) {
        console.log("Broadcast success !! ");
    }

    // Receiving new Block
    if (message.type == 5) {
        var file = __dirname + "/tmp/node/blocs/data.json";
        var blocks = message.blocs;

        // Save the newest blocks

        data = fs.readFileSync(file, "utf8");
        var objReceived = null;
        if (data.length == 0) {
            obj.table.push({ Block: block });
            var json = JSON.stringify(obj);
            fs.writeFileSync(file, json, "utf8");
        } else {
            obj = JSON.parse(data);
            objReceived = JSON.parse(blocks);
            var i = 0;

            for (i = 0; i < objReceived.table.length; i++) {
                obj.table.push({ Block: objReceived.table[i].Block });
            }

            var json = JSON.stringify(obj);
            fs.writeFileSync(file, json, "utf8");
        }
    }

    // Receiving a request to synchronize
    if (message.type == 6) {
        var fileAdresses = __dirname + "/tmp/node/adresses.json";
        var fileAccess = __dirname + "/tmp/node/list.json";
        var fileConfig = __dirname + "/tmp/node/config.json";
        // Test if the node exist
        var bool = existNode(
            message.publicKey,
            message.mac,
            message.role,
            fileAdresses
        );

        if (bool == true) {
            // Get the Blockchain and send it to the node

            var jsonToSend = null;
            var file = __dirname + "/tmp/node/blocs/data.json";
            data = fs.readFileSync(file, "utf8");
            if (data.length == 0) {
                data = null;
            } else {
                var i = 0;
                obj = JSON.parse(data);
                send = false;

                if (message.lastHash == null) send = true;

                for (i = 0; i < obj.table.length; i++) {
                    if (send == true) {
                        objToSend.table.push({ Block: obj.table[i].Block });
                    }
                    if (
                        obj.table[i].Block.hash == message.lastHash &&
                        send == false
                    )
                        send = true;
                }

                jsonToSend = JSON.stringify(objToSend);
            }

            // Get the adresses list

            var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
            if (dataAdresses.length != 0) {
                var objAdresses = JSON.parse(dataAdresses);
            } else {
                var objAdresses = "";
            }

            // Get the access list

            var dataAccess = fs.readFileSync(fileAccess, "utf8");
            if (dataAccess.length != 0) {
                var objAccess = JSON.parse(dataAccess);
            } else {
                var objAccess = "";
            }
            nodeInfo = get_node_info(fileConfig);
            var packetBlocs = {
                from: {
                    address: nodeInfo.Server.IP,
                    port: nodeInfo.Server.port,
                    id: server.id,
                },
                message: {
                    type: 7,
                    host: nodeInfo.Server.IP,
                    port: nodeInfo.Server.port,
                    blocs: jsonToSend,
                    adresses: objAdresses,
                    accesslist: objAccess,
                },
            };

            server.sendMessage(
                { address: message.host, port: message.port },
                packetBlocs
            );
        }
    }

    // Receiving the Blockchain
    if (message.type == 7) {
        console.log("received Blockchain");
        var file = __dirname + "/tmp/node/blocs/data.json";
        var fileAdresses = __dirname + "/tmp/node/adresses.json";
        var fileConfig = __dirname + "/tmp/node/config.json";
        var fileAccess = __dirname + "/tmp/node/list.json";
        var blocks = message.blocs;

        // Save the newest blocks

        data = fs.readFileSync(file, "utf8");
        var objReceived = null;
        if (data.length == 0) {
            obj.table.push(blocks);
            var json = JSON.stringify(obj);
            fs.writeFileSync(file, json, "utf8");
        } else {
            obj = JSON.parse(data);
            objReceived = JSON.parse(blocks);
            var i = 0;

            for (i = 0; i < objReceived.table.length; i++) {
                obj.table.push({ Block: objReceived.table[i].Block });
            }

            var json = JSON.stringify(obj);
            fs.writeFileSync(file, json, "utf8");
        }

        // Save the addresses
        var dataReceived = message.adresses;
        var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
        var dataConfig = fs.readFileSync(fileConfig, "utf8");
        var objConfig = JSON.parse(dataConfig);
        var objAdresses = {
            table: [],
        };
        var jsonAdresses;

        if (dataReceived.length != 0) {
            if (dataAdresses.length != 0) {
                var objAdresses = JSON.parse(dataAdresses);
            }
            var objReceived = dataReceived;

            for (var i = 0; i < objReceived.table.length; i++) {
                var bool = false;
                for (var j = 0; j < objAdresses.table.length; j++) {
                    if (
                        objAdresses.table[j].Node.adr ==
                        objReceived.table[i].Node.adr
                    )
                        bool = true;
                }
                if (bool == false) {
                    objAdresses.table.push({ Node: objReceived.table[i].Node });
                    var jsonAdresses = JSON.stringify(objAdresses);
                    fs.writeFileSync(fileAdresses, jsonAdresses, "utf8");
                }
            }
        }

        // Save the access list
        var listAccess = {
            table: [],
        };
        var listAccessReceived = message.accesslist;
        k = 0;
        if (listAccessReceived.length != 0) {
            for (i = 0; i < listAccessReceived.table[0].Node.length; i++) {
                for (
                    j = 0;
                    j < listAccessReceived.table[0].Node[i].accesslist.length;
                    j++
                ) {
                    listAccess.table.push({
                        requester: listAccessReceived.table[0].Node[i].adr,
                        requested:
                            listAccessReceived.table[0].Node[i].accesslist[j]
                                .ressource,
                        rights:
                            listAccessReceived.table[0].Node[i].accesslist[j]
                                .rights,
                        conditions:
                            listAccessReceived.table[0].Node[i].accesslist[j]
                                .conditions,
                        obligations:
                            listAccessReceived.table[0].Node[i].accesslist[j]
                                .obligations,
                    });
                }
            }
        }

        accessUtils.save(fileAccess, listAccess.table);

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
    if (message.type == 8) {
        console.log("Received request");
        var request = message.request;
        var fileAccess = __dirname + "/tmp/node/list.json";
        var fileAdresses = __dirname + "/tmp/node/adresses.json";
        var fileConfig = __dirname + "/tmp/node/config.json";
        var fileTmp = __dirname + "/tmp/node/tmp.json";
        var fileMiner = __dirname + "/tmp/node/miner.json";

        var shaMsg = crypto
            .createHash("sha256")
            .update(JSON.stringify(message.request))
            .digest();
        var publicKey = new Buffer(message.publicKey, "hex");
        var signature = new Buffer(message.signature, "hex");
        var ec = new EC("secp256k1");
        const asn1signature = concatSigToAsn1Sig(signature);
        var isValid = ec.verify(shaMsg, asn1signature, publicKey);

        var nodeInfo = get_node_info(fileConfig);
        boolAccess = QueryPermission(
            fileAccess,
            fileAdresses,
            request.requester,
            request.requested,
            request.action,
            request.conditions,
            request.obligations
        );

        if (process.platform === "win32") {
            var adrMacTurn = require("os").networkInterfaces()["Wi-Fi"][0]
                .address;
        } else {
            var adrMacTurn = require("os").networkInterfaces().wlan0[0].mac;
        }
        if (adrMacTurn == "b8:27:eb:86:51:88") {
            console.time("Transaction generated, validated and inserted");

            var transaction_request = new TransactionRequest();
            if (boolAccess == true) {
                var token = new Token();
                token.new(
                    request.requested,
                    request.requester,
                    request.action,
                    3600
                );
            } else {
                var token = null;
            }
            transaction_request.new(
                request.requested,
                request.requester,
                request.action,
                token
            );
            tmp = {
                Transaction: transaction_request,
                nb_node: get_nb_miner(fileAdresses),
                nb_agree: 0,
                nb_reject: 0,
                tabProof: [],
            };
            var dataTmp = fs.readFileSync(fileTmp, "utf8");

            if (dataTmp.length != 0) {
                objTmp = JSON.parse(dataTmp);
            } else {
                var objTmp = {
                    table: [],
                };
            }
            objTmp.table.push(tmp);
            var jsonTmp = JSON.stringify(objTmp);
            fs.writeFileSync(fileTmp, jsonTmp, "utf8");
            if (boolAccess == true) {
                console.log(
                    "Has access, broadcast to miner to validate transaction : " +
                        transaction_request.hash
                );
            }
            broadcast_transaction(
                fileAdresses,
                transaction_request,
                "request",
                get_publicKey_node(fileConfig),
                fileConfig,
                message.request
            );
            //  console.log(tmp);
        }
        if (boolAccess == false) {
            console.log("Access refused");
            var dataResponse = fs.readFileSync(fileResponse, "utf8");
            if (dataResponse.length != 0) {
                var objResponse = JSON.parse(dataResponse);
                requestTmpFile = objResponse.requestTmp;
                sendFile = objResponse.send;
                if (sendFile == false) {
                    requestTmp = "Access refused";
                    send = true;
                    var objResponse = {
                        requestTmp: requestTmp,
                        send: send,
                    };
                    var jsonResponse = JSON.stringify(objResponse);
                    fs.writeFileSync(fileResponse, jsonResponse, "utf8");
                }
            }
        }
    }

    //Receiving response (BC access list and addresses) and generate keypair
    if (message.type == 9) {
        console.log("received Blockchain");

        var str =
            message.response +
            "" +
            JSON.stringify(message.blocs) +
            "" +
            JSON.stringify(message.adresses) +
            "" +
            JSON.stringify(message.accesslist);
        var shaMsg = crypto.createHash("sha256").update(str).digest();
        var publicKey = new Buffer(message.publicKey, "hex");
        var signature = new Buffer(message.signature, "hex");
        var ec = new EC("secp256k1");
        const asn1signature = concatSigToAsn1Sig(signature);
        var isValid = ec.verify(shaMsg, asn1signature, publicKey);
        if (isValid) {
            var file = __dirname + "/tmp/node/blocs/data.json";
            var fileAdresses = __dirname + "/tmp/node/adresses.json";
            var fileConfig = __dirname + "/tmp/node/config.json";
            var fileAccess = __dirname + "/tmp/node/list.json";
            var blocks = message.blocs;
            // Generate keypair
            var dataConfig = fs.readFileSync(fileConfig, "utf8");

            if (dataConfig.length != 0) {
                objConfig = JSON.parse(dataConfig);

                // Generate keypair for the node
                var privateKey = crypto.randomBytes(32);
                var publicKey = eccrypto.getPublic(privateKey);

                objConfig.table[0].Key.publicKey = toHexString(publicKey);
                objConfig.table[0].Key.privateKey = toHexString(privateKey);

                // Fill in the file config of the node

                var jsonConfig = JSON.stringify(objConfig);
                fs.writeFileSync(fileConfig, jsonConfig, "utf8");
            }
            // Save the newest blocks

            data = fs.readFileSync(file, "utf8");
            var objReceived = null;
            if (data.length == 0) {
                obj.table.push(blocks.table[0]);
                var json = JSON.stringify(obj);
                fs.writeFileSync(file, json, "utf8");
            } else {
                obj = JSON.parse(data);
                objReceived = blocks;
                var i = 0;

                for (i = 0; i < objReceived.table.length; i++) {
                    bool = false;
                    for (j = 0; j < obj.table.length; j++) {
                        if (
                            obj.table[j].Block.hash ==
                            objReceived.table[i].Block.hash
                        ) {
                            bool = true;
                        }
                    }
                    if ((bool = false)) {
                        obj.table.push({ Block: objReceived.table[i].Block });
                    }
                }

                var json = JSON.stringify(obj);
                fs.writeFileSync(file, json, "utf8");
            }

            // Save the addresses
            var dataReceived = message.adresses;
            var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
            var dataConfig = fs.readFileSync(fileConfig, "utf8");
            var objConfig = JSON.parse(dataConfig);
            var objAdresses = {
                table: [],
            };
            var jsonAdresses;

            if (dataReceived.length != 0) {
                if (dataAdresses.length != 0) {
                    var objAdresses = JSON.parse(dataAdresses);
                }
                var objReceived = dataReceived;

                for (var i = 0; i < objReceived.table.length; i++) {
                    var bool = false;
                    for (var j = 0; j < objAdresses.table.length; j++) {
                        if (
                            objAdresses.table[j].Node.adr ==
                            objReceived.table[i].Node.adr
                        )
                            bool = true;
                    }
                    if (bool == false) {
                        objAdresses.table.push({
                            Node: objReceived.table[i].Node,
                        });
                        var jsonAdresses = JSON.stringify(objAdresses);
                        fs.writeFileSync(fileAdresses, jsonAdresses, "utf8");
                    }
                }
            }

            // Save the access list
            var listAccess = {
                table: [],
            };
            var listAccessToSend = {
                table: [],
            };
            var listAccessReceived = message.accesslist;

            if (listAccessReceived.length != 0) {
                for (i = 0; i < listAccessReceived.table.length; i++) {
                    for (
                        j = 0;
                        j < listAccessReceived.table[i].Node.accesslist.length;
                        j++
                    ) {
                        if (
                            listAccessReceived.table[i].Node.adr ==
                            objConfig.table[0].Server.MAC
                        ) {
                            if (
                                listAccessReceived.table[i].Node.accesslist[j]
                                    .ressource == objConfig.table[0].Server.MAC
                            ) {
                                var ressource =
                                    objConfig.table[0].Key.publicKey;
                            } else {
                                var ressource =
                                    listAccessReceived.table[i].Node.accesslist[
                                        j
                                    ].ressource;
                            }

                            listAccess.table.push({
                                requester: objConfig.table[0].Key.publicKey,
                                requested: ressource,
                                rights:
                                    listAccessReceived.table[i].Node.accesslist[
                                        j
                                    ].rights,
                                conditions:
                                    listAccessReceived.table[i].Node.accesslist[
                                        j
                                    ].conditions,
                                obligations:
                                    listAccessReceived.table[i].Node.accesslist[
                                        j
                                    ].obligations,
                                trust:
                                    listAccessReceived.table[i].Node.accesslist[
                                        j
                                    ].trust,
                            });
                        } else {
                            if (
                                listAccessReceived.table[i].Node.accesslist[j]
                                    .ressource == objConfig.table[0].Server.MAC
                            ) {
                                var ressource =
                                    objConfig.table[0].Key.publicKey;
                            } else {
                                var ressource =
                                    listAccessReceived.table[i].Node.accesslist[
                                        j
                                    ].ressource;
                            }

                            listAccess.table.push({
                                requester: listAccessReceived.table[i].Node.adr,
                                requested: ressource,
                                rights:
                                    listAccessReceived.table[i].Node.accesslist[
                                        j
                                    ].rights,
                                conditions:
                                    listAccessReceived.table[i].Node.accesslist[
                                        j
                                    ].conditions,
                                obligations:
                                    listAccessReceived.table[i].Node.accesslist[
                                        j
                                    ].obligations,
                                trust:
                                    listAccessReceived.table[i].Node.accesslist[
                                        j
                                    ].trust,
                            });
                        }
                    }
                    for (l = 0; l < listAccess.table.length; l++) {
                        listAccessToSend.table.push(listAccess.table[l]);
                    }
                    accessUtils.save(fileAccess, listAccessToSend.table);
                    var listAccessToSend = {
                        table: [],
                    };
                    var listAccess = {
                        table: [],
                    };
                }
            }

            // Send keypair generated and MAC to update
            macadr = objConfig.table[0].Server.MAC;
            publicKey = objConfig.table[0].Key.publicKey;
            update_adresses(publicKey, macadr, fileAdresses);
            //  update_access_list(publicKey,mac,fileAdresses)
            //  console.log(objConfig.table);
            broadcast_publicKey(fileAdresses, publicKey, macadr, fileConfig);
        } else {
            console.log("Non valid signature");
        }
    }

    // Receiving transaction to validate
    if (message.type == 10) {
        transaction = message.transaction;

        var shaMsg = crypto
            .createHash("sha256")
            .update(JSON.stringify(transaction))
            .digest();
        var publicKey = new Buffer(message.publicKey, "hex");
        var signature = new Buffer(message.signature, "hex");
        var ec = new EC("secp256k1");
        const asn1signature = concatSigToAsn1Sig(signature);
        var isValid = ec.verify(shaMsg, asn1signature, publicKey);

        if (isValid) {
            var fileAccess = __dirname + "/tmp/node/list.json";
            var fileData = __dirname + "/tmp/node/blocs/data.json";
            var fileAdresses = __dirname + "/tmp/node/adresses.json";
            var fileConfig = __dirname + "/tmp/node/config.json";
            var fileTmp = __dirname + "/tmp/node/tmp.json";
            var dataTmp = fs.readFileSync(fileTmp, "utf8");
            var tmp = {
                Transaction: transaction,
            };

            if (dataTmp.length != 0) {
                objTmp = JSON.parse(dataTmp);
            } else {
                var objTmp = {
                    table: [],
                };
            }
            objTmp.table.push(tmp);
            console.log("Transaction received : " + transaction.hash);
            var jsonTmp = JSON.stringify(objTmp);
            fs.writeFileSync(fileTmp, jsonTmp, "utf8");

            var boolTransactionValid = false;
            if (message.typeTransaction == "request")
                boolTransactionValid = verify_transaction_request(
                    transaction,
                    fileAccess,
                    fileAdresses,
                    fileData
                );
            else
                boolTransactionValid = verify_transaction_use(
                    transaction,
                    fileAccess,
                    fileAdresses,
                    fileData
                );

            console.log(
                "Transaction validity : " +
                    boolTransactionValid +
                    " Know send response to miner"
            );
            nodeInfo = get_node_info(fileConfig);

            var str =
                boolTransactionValid +
                "" +
                get_publicKey_node(fileConfig) +
                "" +
                transaction.hash;
            var privateKey = new Buffer(nodeInfo.Key.privateKey, "hex");
            var ec = new EC("secp256k1");
            var shaMsg = crypto.createHash("sha256").update(str).digest();
            var mySign = ec.sign(shaMsg, privateKey, { canonical: true });
            var signature = asn1SigSigToConcatSig(mySign);

            var packet = {
                from: {
                    address: nodeInfo.Server.IP,
                    port: nodeInfo.Server.port,
                    id: server.id,
                },
                message: {
                    type: 12,
                    host: nodeInfo.Server.IP,
                    port: nodeInfo.Server.port,
                    publicKey: get_publicKey_node(fileConfig),
                    transactionHash: transaction.hash,
                    typeTransaction: message.typeTransaction,
                    response: boolTransactionValid,
                    shaMsg: shaMsg,
                    signature: signature,
                    request: message.request,
                },
            };
            server.sendMessage(
                { address: message.host, port: message.port },
                packet
            );
        } else {
            console.log("Non valid signature");
        }
    }

    // Receiving publicKey
    if (message.type == 11) {
        console.log("Received publicKey");
        var keyPublic = message.publicKey;
        var shaMsg = new Buffer(message.shaMsg, "hex");
        var public = new Buffer(message.public, "hex");

        var signature = new Buffer(message.signature, "hex");
        var ec = new EC("secp256k1");
        const asn1signature = concatSigToAsn1Sig(signature);
        var isValid = ec.verify(shaMsg, asn1signature, public);

        if (isValid) {
            var fileAdresses = __dirname + "/tmp/node/adresses.json";
            var fileAccess = __dirname + "/tmp/node/list.json";
            var fileMiner = __dirname + "/tmp/node/miner.json";
            mac = message.mac;
            //Update access list
            update_access_list(keyPublic, mac, fileAccess, fileAdresses);
            //Update adresses list
            update_adresses(keyPublic, mac, fileAdresses);
            data = nodeUtils.getInfoByAdr(keyPublic, fileAdresses);

            if (data.table[0].role == "miner") {
                var dataMiner = fs.readFileSync(fileMiner, "utf8");
                if (dataMiner.length != 0) {
                    var objMiner = JSON.parse(dataMiner);
                    objMiner.table[0].tabAdr.push(keyPublic);
                    var jsonMiner = JSON.stringify(objMiner);
                    fs.writeFileSync(fileMiner, jsonMiner, "utf8");
                }
            }
        } else {
            console.log("Non valid signature");
        }
    }

    // Receiving response to request validation transaction
    if (message.type == 12) {
        hash = message.transactionHash;

        var fileTmp = __dirname + "/tmp/node/tmp.json";
        var fileAdresses = __dirname + "/tmp/node/adresses.json";
        var fileConfig = __dirname + "/tmp/node/config.json";
        var fileData = __dirname + "/tmp/node/blocs/data.json";
        var dataTmp = fs.readFileSync(fileTmp, "utf8");

        if (
            existNode(message.publicKey, fileAdresses) &&
            existTmpHash(message.transactionHash, fileTmp)
        ) {
            var str =
                message.response +
                "" +
                message.publicKey +
                "" +
                message.transactionHash;
            var shaMsg = crypto.createHash("sha256").update(str).digest();
            var publicKey = new Buffer(message.publicKey, "hex");
            var signature = new Buffer(message.signature, "hex");
            var ec = new EC("secp256k1");
            const asn1signature = concatSigToAsn1Sig(signature);
            var isValid = ec.verify(shaMsg, asn1signature, publicKey);
            if (isValid) {
                if (dataTmp.length != 0) {
                    objTmp = JSON.parse(dataTmp);
                    var i = 0;
                    var bool = false;
                    while (
                        i < Object.keys(objTmp.table).length &&
                        bool == false
                    ) {
                        if (objTmp.table[i].Transaction.hash == hash) {
                            if (message.response == true) {
                                objTmp.table[i].nb_agree++;
                                objTmp.table[i].tabProof.push(
                                    toHexString(signature)
                                );
                            }
                            if (message.response == false) {
                                objTmp.table[i].nb_reject++;
                                objTmp.table[i].tabProof.push(
                                    toHexString(signature)
                                );
                            }
                            if (
                                objTmp.table[i].nb_node / 2 <=
                                objTmp.table[i].nb_agree
                            ) {
                                console.log(
                                    "Transaction success ... Broadcast response to miner"
                                );
                                bool = true;
                                var insertTx = insert_Transaction(
                                    objTmp.table[i].Transaction,
                                    fileData
                                );
                                // Inform the two node that the access is granted
                                if (objTmp.table[i].Transaction.token != null) {
                                    var cli_mac = nodeUtils.getInfoByAdr(
                                        message.request.requested,
                                        fileAdresses
                                    ).table[0].mac;
                                    var bool = false;
                                    var j = 0;
                                    var objFound;
                                    while (
                                        i <
                                            Object.keys(mqttserver.clients)
                                                .length &&
                                        bool == false
                                    ) {
                                        if (
                                            Object.keys(mqttserver.clients)[
                                                j
                                            ] == cli_mac
                                        ) {
                                            objFound =
                                                mqttserver.clients[
                                                    Object.keys(
                                                        mqttserver.clients
                                                    )[j]
                                                ];
                                            bool = true;
                                        }
                                        j++;
                                    }
                                    mqttserver.publish(
                                        {
                                            topic: message.request.type,
                                            payload: message.request.value,
                                        },
                                        objFound
                                    );
                                }
                                /*****/
                                console.timeEnd(
                                    "Transaction generated, validated and inserted"
                                );
                                broadcast_response(
                                    fileAdresses,
                                    objTmp.table[i].Transaction.hash,
                                    get_publicKey_node(fileConfig),
                                    "valid",
                                    fileConfig,
                                    insertTx,
                                    objTmp.table[i].tabProof
                                );
                            }
                            if (
                                objTmp.table[i].nb_node / 2 <=
                                objTmp.table[i].nb_reject
                            ) {
                                console.log(
                                    "Transaction rejected ... Don't Broadcast response to miner"
                                );
                                bool = true;
                                // broadcast_response(fileAdresses,objTmp.table[i].tmp.Transaction.hash,get_publicKey_node(fileConfig),'novalid');
                            }
                            if (bool == true) objTmp.table.splice(i, 1);
                        }
                        i++;
                    }
                    var jsonTmp = JSON.stringify(objTmp);
                    fs.writeFileSync(fileTmp, jsonTmp, "utf8");
                }
            } else {
                console.log("Non valid signature");
            }
        }
    }

    // Receiving request to insert Transaction
    if (message.type == 13) {
        hash = message.transactionHash;
        var str =
            message.response +
            "" +
            JSON.stringify(message.block) +
            "" +
            message.transactionHash +
            "" +
            JSON.stringify(message.tabProof);
        var shaMsg = crypto.createHash("sha256").update(str).digest();
        var publicKey = new Buffer(message.publicKey, "hex");
        var signature = new Buffer(message.signature, "hex");
        var ec = new EC("secp256k1");
        const asn1signature = concatSigToAsn1Sig(signature);
        var isValid = ec.verify(shaMsg, asn1signature, publicKey);

        if (isValid) {
            var fileTmp = __dirname + "/tmp/node/tmp.json";
            var fileData = __dirname + "/tmp/node/blocs/data.json";
            var dataTmp = fs.readFileSync(fileTmp, "utf8");

            if (dataTmp.length != 0) {
                objTmp = JSON.parse(dataTmp);
                for (i = 0; i < Object.keys(objTmp.table).length; i++) {
                    if (
                        objTmp.table[i].Transaction.hash == hash &&
                        message.response == "valid"
                    ) {
                        insert_Transaction(
                            objTmp.table[i].Transaction,
                            fileData,
                            message.block
                        );
                    }
                    // Delete the transaction from the tmp file
                    objTmp.table.splice(i, 1);
                }
                var jsonTmp = JSON.stringify(objTmp);
                fs.writeFileSync(fileTmp, jsonTmp, "utf8");
            }
        } else {
            console.log("Non valid signature");
        }
    }

    //Receive request to modify/delete access rights
    if (message.type == 14) {
        var fileAccess = __dirname + "/tmp/node/list.json";

        if (message.typeAction == "UPDATE") {
            var str =
                message.typeAction +
                "" +
                message.requester +
                "" +
                message.requested +
                "" +
                message.action +
                "" +
                message.condition +
                "" +
                message.obligation +
                "" +
                message.trust;
            var shaMsg = crypto.createHash("sha256").update(str).digest();
            var publicKey = new Buffer(message.publicKey, "hex");
            var signature = new Buffer(message.signature, "hex");
            var ec = new EC("secp256k1");
            const asn1signature = concatSigToAsn1Sig(signature);
            var isValid = ec.verify(shaMsg, asn1signature, publicKey);
            if (isValid) {
                accessUtils.update(
                    message.requester,
                    message.requested,
                    message.action,
                    message.condition,
                    message.obligation,
                    message.trust,
                    fileAccess
                );
            } else {
                console.log("Non valid signature");
            }
        }

        if (message.typeAction == "DELETE") {
            var str =
                message.typeAction +
                "" +
                message.requester +
                "" +
                message.requested +
                "" +
                message.action +
                "" +
                message.condition +
                "" +
                message.obligation +
                "" +
                message.trust;
            var shaMsg = crypto.createHash("sha256").update(str).digest();
            var publicKey = new Buffer(message.publicKey, "hex");
            var signature = new Buffer(message.signature, "hex");
            var ec = new EC("secp256k1");
            const asn1signature = concatSigToAsn1Sig(signature);
            var isValid = ec.verify(shaMsg, asn1signature, publicKey);
            if (isValid) {
                accessUtils.delete(
                    message.requester,
                    message.requested,
                    message.action,
                    message.condition,
                    message.obligation,
                    fileAccess
                );
            } else {
                console.log("Non valid signature");
            }
        }

        if (message.typeAction == "ADD") {
            var str =
                message.typeAction + "" + JSON.stringify(message.listAccess);
            var shaMsg = crypto.createHash("sha256").update(str).digest();
            var publicKey = new Buffer(message.publicKey, "hex");
            var signature = new Buffer(message.signature, "hex");
            var ec = new EC("secp256k1");
            const asn1signature = concatSigToAsn1Sig(signature);
            var isValid = ec.verify(shaMsg, asn1signature, publicKey);
            if (isValid) {
                accessUtils.add(fileAccess, message.listAccess);
            } else {
                console.log("Non valid signature");
            }
        }

        console.log("Access rights modified");
    }

    // Test signature
    if (message.type == 15) {
        console.log(
            "Transaction received : 10dc457b861ccc684affdf08b965ac6adfbda4a60ff30b4a97bd28a02c8e94c3"
        );
        var shaMsg = new Buffer(message.shaMsg, "hex");
        var publicKey = new Buffer(message.publicKey, "hex");
        var signature = new Buffer(message.signature, "hex");
        var ec = new EC("secp256k1");
        const asn1signature = concatSigToAsn1Sig(signature);
        var isValid = ec.verify(shaMsg, asn1signature, publicKey);
        if (isValid) {
        } else {
            console.log(
                "Signature non valide, transaction : 10dc457b861ccc684affdf08b965ac6adfbda4a60ff30b4a97bd28a02c8e94c3 non validée"
            );
        }
        console.log(isValid);
    }

    // Receive turn to become the elected miner
    if (message.type == 16) {
        var shaMsg = new Buffer(message.shaMsg, "hex");
        var publicKey = new Buffer(message.publicKey, "hex");
        var signature = new Buffer(message.signature, "hex");
        var ec = new EC("secp256k1");
        const asn1signature = concatSigToAsn1Sig(signature);
        var isValid = ec.verify(shaMsg, asn1signature, publicKey);

        if (isValid) {
            fileMiner = __dirname + "/tmp/node/miner.json";
            fileConfig = __dirname + "/tmp/node/config.json";
            fileAdresses = __dirname + "/tmp/node/adresses.json";
            fileMiner = __dirname + "/tmp/node/miner.json";

            var dataMiner = fs.readFileSync(fileMiner, "utf8");
            if (dataMiner.length != 0) {
                var objMiner = JSON.parse(dataMiner);
                objMiner.table[0].myTurn = true;
            } else {
                objMiner = {
                    table: [],
                };
                objMiner.table.push({
                    adr: get_publicKey_node(fileConfig),
                    myTurn: true,
                    tabAdr: message.tabAdr,
                });
            }
            var jsonMiner = JSON.stringify(objMiner);
            fs.writeFileSync(fileMiner, jsonMiner, "utf8");
            /*
            setInterval(function() {
                switch_elected_miner(fileMiner,fileConfig,fileAdresses);
            }, 15000);*/
        } else {
            console.log("Non valid signature");
        }
    }

    // Receive the broadcated value from miner (ressource)
    if (message.type == 17) {
        var dataResponse = fs.readFileSync(fileResponse, "utf8");

        if (dataResponse.length != 0) {
            var objResponse = JSON.parse(dataResponse);
            requestTmpFile = objResponse.requestTmp;
            sendFile = objResponse.send;
            if (sendFile == false) {
                requestTmp = message.value;
                send = true;
                var objResponse = {
                    requestTmp: requestTmp,
                    send: send,
                };

                var jsonResponse = JSON.stringify(objResponse);
                fs.writeFileSync(fileResponse, jsonResponse, "utf8");
            }
        }
    }
};

var onstart = function (node) {
    var config = require("./config.js");
    var block = new Block(config.genesis);

    console.log("----- Genesis Block -----");
    console.log(JSON.stringify(block));

    //  console.log('----- Start mining -----');

    var jsonfile = require("jsonfile");
    var file = __dirname + "/tmp/node/blocs/data.json";
    var fileConfig = __dirname + "/tmp/node/config.json";
    var fileAccess = __dirname + "/tmp/node/list.json";
    var fileTmp = __dirname + "/tmp/node/tmp.json";
    var fileAdresses = __dirname + "/tmp/node/adresses.json";
    var fileMiner = __dirname + "/tmp/node/miner.json";
    var fileData = __dirname + "/tmp/node/blocs/data.json";
    var i = 0;
    var obj = {
        table: [],
    };
    var objConfig = {
        table: [],
    };

    fs.writeFileSync(fileTmp, "", "utf8");
    receiveNewNode(9000);
};

function receiveNewNode(port) {
    var routes = require("./routes");
    var express = require("express");
    var bodyParser = require("body-parser");
    var app = express();

    app.use(function (request, response, next) {
        response.header("Access-Control-Allow-Origin", "*");
        response.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
        response.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept"
        );
        next();
    });

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.static("public"));
    app.use(bodyParser.json());
    app.use("/", routes);

    app.listen(port, function () {});
}

function existTmpHash(hash, fileTmp) {
    var dataTmp = fs.readFileSync(fileTmp, "utf8");
    if (dataTmp.length != 0) {
        objTmp = JSON.parse(dataTmp);
        var i = 0;
        while (i < Object.keys(objTmp.table).length) {
            if (objTmp.table[i].Transaction.hash == hash) return true;
            i++;
        }
    }
    return false;
}

function start_elected_miner(fileMiner, fileConfig, fileAdresses) {
    var dataMiner = fs.readFileSync(fileMiner, "utf8");

    if (dataMiner.length != 0) {
        var objMiner = JSON.parse(dataMiner);
        if (objMiner.table[0].myTurn == false) {
            if (objMiner.table[0].tabAdr.length != 0) {
                nodeInfoSender = get_node_info(fileConfig);
                if (
                    objMiner.table[0].tabAdr[
                        objMiner.table[0].tabAdr.length - 1
                    ] == nodeInfoSender.Key.publicKey
                ) {
                    objMiner.table[0].myTurn == true;
                    objMiner.table[0].tabAdr.push(
                        objMiner.table[0].tabAdr[
                            objMiner.table[0].tabAdr.length - 1
                        ]
                    );
                    objMiner.table[0].tabAdr.splice(
                        objMiner.table[0].tabAdr.length - 1,
                        1
                    );
                    var jsonMiner = JSON.stringify(objMiner);
                    fs.writeFileSync(fileMiner, jsonMiner, "utf8");
                }
            }
        }
    }
}

function switch_elected_miner(fileMiner, fileConfig, fileAdresses) {
    var dataMiner = fs.readFileSync(fileMiner, "utf8");

    if (dataMiner.length != 0) {
        var objMiner = JSON.parse(dataMiner);
        if (objMiner.table[0].myTurn == true) {
            if (objMiner.table[0].tabAdr.length != 0) {
                objMiner.table[0].myTurn = false;
                nodeInfoSender = get_node_info(fileConfig);
                objMiner.table[0].tabAdr.push(objMiner.table[0].tabAdr[0]);
                objMiner.table[0].tabAdr.splice(0, 1);

                nodeInfoReceiver = nodeUtils.getInfoByAdr(
                    objMiner.table[0].tabAdr[0],
                    fileAdresses
                );
                var jsonMiner = JSON.stringify(objMiner);
                fs.writeFileSync(fileMiner, jsonMiner, "utf8");

                var str = JSON.stringify(objMiner.table[0].tabAdr);
                var publicKey = new Buffer(nodeInfoSender.Key.publicKey, "hex");
                var privateKey = new Buffer(
                    nodeInfoSender.Key.privateKey,
                    "hex"
                );
                var ec = new EC("secp256k1");
                var shaMsg = crypto.createHash("sha256").update(str).digest();
                var mySign = ec.sign(shaMsg, privateKey, { canonical: true });
                var signature = asn1SigSigToConcatSig(mySign);
                var packet = {
                    from: {
                        address: nodeInfoSender.Server.IP,
                        port: nodeInfoSender.Server.port,
                        id: server.id,
                    },
                    message: {
                        type: 16,
                        host: nodeInfoSender.Server.IP,
                        port: nodeInfoSender.Server.port,
                        tabAdr: objMiner.table[0].tabAdr,
                        publicKey: publicKey,
                        shaMsg: shaMsg,
                        signature: signature,
                    },
                };
                server.sendMessage(
                    {
                        address: nodeInfoReceiver.table[0].ip,
                        port: nodeInfoReceiver.table[0].port,
                    },
                    packet
                );
            }
        }
    }
}

function get_node_info_by_ip(ip, fileAdresses) {
    var objAdresses = {
        table: [],
    };
    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    var data = {
        table: [],
    };

    if (dataAdresses.length != 0) {
        objAdresses = JSON.parse(dataAdresses);
        for (i = 0; i < Object.keys(objAdresses.table).length; i++) {
            //Test adress mac and public key if exist
            if (objAdresses.table[i].Node.IP == ip) {
                data.table.push({
                    adr: objAdresses.table[i].Node.adr,
                    port: objAdresses.table[i].Node.port,
                    role: objAdresses.table[i].Node.role,
                });
            }
        }
    }
    return data;
}

function minerTurn(fileMiner) {
    var dataMiner = fs.readFileSync(fileMiner, "utf8");
    if (dataMiner.length != 0) {
        objMiner = JSON.parse(dataMiner);
        return objMiner.table[0].myTurn;
    }
    return false;
}

function saveNode(publicKey, ip, port, mac, host, role, trust, fileAdresses) {
    var objAdresses = {
        table: [],
    };
    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    if (dataAdresses.length != 0) {
        var objAdresses = JSON.parse(dataAdresses);
    }
    objAdresses.table.push({
        Node: {
            adr: publicKey,
            IP: ip,
            port: port,
            MAC: mac,
            host: host,
            role: role,
            trust: trust,
        },
    });
    var jsonAdresses = JSON.stringify(objAdresses);
    fs.writeFileSync(fileAdresses, jsonAdresses, "utf8");
}

function existNode(publicKey, mac, role, fileAdresses) {
    var objAdresses = {
        table: [],
    };
    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    var bool = false;
    if (dataAdresses.length != 0) {
        objAdresses = JSON.parse(dataAdresses);

        for (i = 0; i < Object.keys(objAdresses.table).length; i++) {
            //Test adress mac and public key if exist
            if (objAdresses.table[i].Node.adr == publicKey) bool = true;
            if (objAdresses.table[i].Node.MAC == mac) bool = true;
            if (objAdresses.table[i].Node.role != role) bool = false;
        }
    }
    return bool;
}

function configNode(ip, mac, role, port, trust, fileConfig) {
    var obj = {
        table: [],
    };
    obj.table.push({
        Server: { host: "localhost", port: port, IP: ip, MAC: mac },
        Key: { publicKey: "", privateKey: "" },
        Role: { desc: role },
    });
    var jsonConfig = JSON.stringify(obj);
    fs.writeFileSync(fileConfig, jsonConfig, "utf8");
}

function get_node_info(fileConfig) {
    var dataConfig = fs.readFileSync(fileConfig, "utf8");
    var objConfig = JSON.parse(dataConfig);
    if (dataConfig.length != 0) {
        return objConfig.table[0];
    }
    return false;
}

function getTrustByAdr(fileAdresses, adr) {
    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    var objAdresses = {
        table: [],
    };
    if (dataAdresses.length != 0) {
        var objAdresses = JSON.parse(dataAdresses);
        for (i = 0; i < objAdresses.table.length; i++) {
            if (objAdresses.table[i].Node.adr == adr) {
                return objAdresses.table[i].Node.trust;
            }
        }
    }
    return null;
}

function QueryPermission(
    fileAccess,
    fileAdresses,
    requester,
    requested,
    action,
    conditions,
    obligations
) {
    var dataAccess = fs.readFileSync(fileAccess, "utf8");
    var objAccess = {
        table: [],
    };
    var boolAccess = false;
    trustRequester = getTrustByAdr(fileAdresses, requester);
    trustRequested = getTrustByAdr(fileAdresses, requested);

    if (dataAccess.length != 0) {
        var objAccess = JSON.parse(dataAccess);
        for (i = 0; i < objAccess.table.length; i++) {
            var boolNode = false;
            if (objAccess.table[i].Node.adr == requester) {
                for (
                    k = 0;
                    k < objAccess.table[i].Node.accesslist.length;
                    k++
                ) {
                    if (
                        requested ==
                            objAccess.table[i].Node.accesslist[k].ressource &&
                        action ==
                            objAccess.table[i].Node.accesslist[k].rights &&
                        trustRequested >=
                            objAccess.table[i].Node.accesslist[k].trust
                    )
                        boolAccess = true;
                }
            }
        }
    }

    return boolAccess;
}

function get_nb_miner(fileAdresses) {
    var objAdresses = {
        table: [],
    };
    var nb = 0;
    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    var bool = false;
    if (dataAdresses.length != 0) {
        objAdresses = JSON.parse(dataAdresses);

        for (i = 0; i < Object.keys(objAdresses.table).length; i++) {
            //Test if node is miner
            if (objAdresses.table[i].Node.role == "miner") nb++;
        }
    }
    return nb;
}

function get_all_node(fileAdresses) {
    var objAdresses = {
        table: [],
    };
    var nb = 0;
    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    var adresses = [];
    var bool = false;
    if (dataAdresses.length != 0) {
        objAdresses = JSON.parse(dataAdresses);
        for (i = 0; i < objAdresses.table.length; i++) {
            adresses[i] = objAdresses.table[i];
        }
    }
    return adresses;
}

function broadcast_transaction(
    fileAdresses,
    transaction,
    type,
    publicKey,
    fileConfig,
    request
) {
    var objAdresses = {
        table: [],
    };

    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    var bool = false;
    if (dataAdresses.length != 0) {
        objAdresses = JSON.parse(dataAdresses);
        var i = 0;
        for (i = 0; i < Object.keys(objAdresses.table).length; i++) {
            nodeInfo = get_node_info(fileConfig);
            var str = JSON.stringify(transaction);
            var keyPublic = new Buffer(nodeInfo.Key.publicKey, "hex");
            var privateKey = new Buffer(nodeInfo.Key.privateKey, "hex");
            var ec = new EC("secp256k1");
            var shaMsg = crypto.createHash("sha256").update(str).digest();
            var mySign = ec.sign(shaMsg, privateKey, { canonical: true });
            var signature = asn1SigSigToConcatSig(mySign);

            //Test if node is miner
            if (objAdresses.table[i].Node.role == "miner") {
                if (
                    get_nb_miner(fileAdresses) == 1 ||
                    objAdresses.table[i].Node.adr != publicKey
                ) {
                    var packet = {
                        from: {
                            address: nodeInfo.Server.IP,
                            port: nodeInfo.Server.port,
                            id: server.id,
                        },
                        message: {
                            type: 10,
                            host: nodeInfo.Server.IP,
                            port: nodeInfo.Server.port,
                            publicKey: nodeInfo.Key.publicKey,
                            transaction: transaction,
                            typeTransaction: type,
                            shaMsg: shaMsg,
                            signature: signature,
                            request: request,
                        },
                    };
                    server.sendMessage(
                        {
                            address: objAdresses.table[i].Node.IP,
                            port: objAdresses.table[i].Node.port,
                        },
                        packet
                    );
                }
            }
        }
    }
}

function broadcast_response(
    fileAdresses,
    transactionHash,
    publicKey,
    response,
    fileConfig,
    block,
    tabProof
) {
    var objAdresses = {
        table: [],
    };

    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    var bool = false;
    if (dataAdresses.length != 0) {
        objAdresses = JSON.parse(dataAdresses);

        for (i = 0; i < Object.keys(objAdresses.table).length; i++) {
            //Test if node is miner
            if (
                objAdresses.table[i].Node.role == "miner" &&
                objAdresses.table[i].Node.adr != publicKey
            ) {
                nodeInfo = get_node_info(fileConfig);

                var str =
                    response +
                    "" +
                    JSON.stringify(block) +
                    "" +
                    transactionHash +
                    "" +
                    JSON.stringify(tabProof);
                var keyPublic = new Buffer(nodeInfo.Key.publicKey, "hex");
                var privateKey = new Buffer(nodeInfo.Key.privateKey, "hex");
                var ec = new EC("secp256k1");
                var shaMsg = crypto.createHash("sha256").update(str).digest();
                var mySign = ec.sign(shaMsg, privateKey, { canonical: true });
                var signature = asn1SigSigToConcatSig(mySign);

                var packet = {
                    from: {
                        address: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port,
                        id: server.id,
                    },
                    message: {
                        type: 13,
                        host: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port,
                        publicKey: nodeInfo.Key.publicKey,
                        transactionHash: transactionHash,
                        response: response,
                        block: block,
                        tabProof: tabProof,
                        shaMsg: shaMsg,
                        signature: signature,
                    },
                };
                server.sendMessage(
                    {
                        address: objAdresses.table[i].Node.IP,
                        port: objAdresses.table[i].Node.port,
                    },
                    packet
                );
            }
        }
    }
}

function broadcast_request(fileAdresses, publicKey, request, fileConfig) {
    var objAdresses = {
        table: [],
    };

    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    var bool = false;
    if (dataAdresses.length != 0) {
        objAdresses = JSON.parse(dataAdresses);

        for (i = 0; i < Object.keys(objAdresses.table).length; i++) {
            //Test if node is miner
            if (objAdresses.table[i].Node.role == "miner") {
                nodeInfo = get_node_info(fileConfig);

                var str = JSON.stringify(request);
                var keyPublic = new Buffer(nodeInfo.Key.publicKey, "hex");
                var privateKey = new Buffer(nodeInfo.Key.privateKey, "hex");
                var ec = new EC("secp256k1");
                var shaMsg = crypto.createHash("sha256").update(str).digest();
                var mySign = ec.sign(shaMsg, privateKey, { canonical: true });
                var signature = asn1SigSigToConcatSig(mySign);

                var packet = {
                    from: {
                        address: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port,
                        id: server.id,
                    },
                    message: {
                        type: 8,
                        host: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port,
                        publicKey: get_publicKey_node(fileConfig),
                        request: request,
                        shaMsg: shaMsg,
                        signature: signature,
                    },
                };
                server.sendMessage(
                    {
                        address: objAdresses.table[i].Node.IP,
                        port: objAdresses.table[i].Node.port,
                    },
                    packet
                );
            }
        }
    }
}

function get_publicKey_node(fileConfig) {
    var dataConfig = fs.readFileSync(fileConfig, "utf8");
    var objConfig = JSON.parse(dataConfig);
    if (dataConfig.length != 0) {
        return objConfig.table[0].Key.publicKey;
    }
    return false;
}

function verify_transaction_request(
    transaction,
    fileAccess,
    fileAdresses,
    fileData
) {
    var objAdresses = {
        table: [],
    };
    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    var dataAccess = fs.readFileSync(fileAccess, "utf8");
    var token = new Token();
    var transaction_request = new TransactionRequest();

    if (transaction.token != null) {
        var boolToken = token.verify(
            transaction.token.requested,
            transaction.token.requester,
            transaction.token.hash,
            transaction.token.action,
            transaction.token.validity,
            transaction.token.timestamp
        );
        //console.log('Bool Token : '+boolToken);
        if (boolToken == false) {
            console.log("False token detected");
            return false;
        }
    }

    var boolTransaction = transaction_request.verify(
        transaction.hash,
        transaction.requested,
        transaction.requester,
        transaction.action,
        transaction.timestamp,
        transaction.token
    );
    // console.log('Bool Transaction : '+boolTransaction);
    if (boolTransaction == false) {
        console.log("False Transaction detected");
        return false;
    }

    var boolExistTransaction = existTransaction(transaction.hash, fileData);
    //  console.log('Bool Exist Transaction : '+boolExistTransaction);
    if (boolExistTransaction == true) {
        console.log("Tentative de rejeu detectée");
        return false;
    }

    var boolExistRequested = existNode(transaction.requested, fileAdresses);
    //   console.log('Bool Exist Requested : '+boolExistRequested);
    if (boolExistRequested == false) {
        console.log("Requested doesn't exist");
        return false;
    }

    var boolExistRequester = existNode(transaction.requester, fileAdresses);
    //   console.log('Bool Exist requester : '+boolExistRequester);
    if (boolExistRequester == false) {
        console.log("Requester doesn't exist");
        return false;
    }

    var boolPermission = QueryPermission(
        fileAccess,
        fileAdresses,
        transaction.requester,
        transaction.requested,
        transaction.action,
        "conditions",
        "obligations"
    );
    //   console.log('Bool Permission : '+boolPermission);
    if (boolPermission == false && transaction.token != null) {
        console.log("Permission non accorded");
        return false;
    }

    return true;
}

function verify_transaction_use(
    transaction,
    fileAccess,
    fileAdresses,
    fileData
) {
    var objAdresses = {
        table: [],
    };
    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    var dataAccess = fs.readFileSync(fileAccess, "utf8");
    var token = new Token();
    var transaction_use = new TransactionUse();

    if (transaction.token != null) {
        var boolToken = token.verify(
            transaction.token.requested,
            transaction.token.requester,
            transaction.token.hash,
            transaction.token.action,
            transaction.token.validity,
            transaction.token.timestamp
        );
        //  console.log('Bool Token : '+boolToken);
        if (boolToken == false) {
            console.log("False token detected");
            return false;
        }
    }

    var boolTransaction = transaction_use.verify(
        transaction.hash,
        transaction.requested,
        transaction.requester,
        transaction.action,
        transaction.timestamp,
        transaction.token
    );
    //console.log('Bool Transaction : '+boolTransaction);
    if (boolTransaction == false) {
        console.log("False Transaction detected");
        return false;
    }

    var boolExistTransaction = existTransaction(transaction.hash, fileData);
    // console.log('Bool Exist Transaction : '+boolExistTransaction);
    if (boolExistTransaction == true) {
        console.log("Tentative de rejeu detectée");
        return false;
    }

    var boolExistRequested = existNode(transaction.requested, fileAdresses);
    // console.log('Bool Exist Requested : '+boolExistRequested);
    if (boolExistRequested == false) {
        console.log("Requested doesn't exist");
        return false;
    }

    var boolExistRequester = existNode(transaction.requester, fileAdresses);
    // console.log('Bool Exist requester : '+boolExistRequester);
    console.log("Requester doesn't exist");
    return false;

    var boolPermission = QueryPermission(
        fileAccess,
        transaction.requester,
        transaction.requested,
        transaction.action,
        "conditions",
        "obligations"
    );
    // console.log('Bool Permission : '+boolPermission);
    if (boolPermission == false) {
        console.log("Permission non accorded");
        return false;
    }

    return true;
}

function existTransaction(hash, fileData) {
    // Verify if transactions exist

    var data = fs.readFileSync(fileData, "utf8");
    boolExist = false;
    if (data.length != 0) {
        obj = JSON.parse(data);
        var j = 0;

        while (j < Object.keys(obj.table).length && boolExist == false) {
            var block = new Block();
            var index = obj.table.length - 1;
            var objTree = obj.table[index].Block._tree;
            var tabTree = Object.keys(objTree).map(function (key) {
                return [objTree[key]];
            });
            // console.log('Block '+i+' : ');
            //console.log(obj.table[i].Block.txs.length)
            block.new(
                obj.table[j].Block.hash,
                obj.table[j].Block.previousHash,
                obj.table[j].Block.timestamp,
                obj.table[j].Block.merkleRoot,
                obj.table[j].Block.difficulty,
                obj.table[j].Block.txs,
                obj.table[j].Block.nonce,
                obj.table[j].Block.no,
                tabTree,
                obj.table[j].Block.numberMax
            );
            boolExist = block.transactionsExist(hash);
            j++;
        }
    }
    return boolExist;
}

function existNode(nodeAdr, fileAdresses) {
    var objAdresses = {
        table: [],
    };
    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    if (dataAdresses.length != 0) {
        objAdresses = JSON.parse(dataAdresses);

        for (i = 0; i < Object.keys(objAdresses.table).length; i++) {
            // Test if node exist
            if (objAdresses.table[i].Node.adr == nodeAdr) return true;
        }
    }
    return false;
}

function insert_Transaction(transaction, fileData, blockN) {
    var data = fs.readFileSync(fileData, "utf8");
    console.log("Insert transaction : " + transaction.hash);
    var blockNew = null;
    if (existTransaction(transaction.hash, fileData) == false) {
        if (blockN != null) {
            if (data.length != 0) {
                obj = JSON.parse(data);
                obj.table.push({ Block: blockN });
            } else {
                var obj = {
                    table: [],
                };
                obj.table.push({ Block: blockN });
            }
            var json = JSON.stringify(obj);
            fs.writeFileSync(fileData, json, "utf8");
        } else {
            if (data.length != 0) {
                obj = JSON.parse(data);
                block = new Block();
                var objTree = obj.table[obj.table.length - 1].Block._tree;
                var tabTree = Object.keys(objTree).map(function (key) {
                    return [objTree[key]];
                });
                //obj.table[obj.table.length-1].Block._tree
                block.new(
                    obj.table[obj.table.length - 1].Block.hash,
                    obj.table[obj.table.length - 1].Block.previousHash,
                    obj.table[obj.table.length - 1].Block.timestamp,
                    obj.table[obj.table.length - 1].Block.merkleRoot,
                    obj.table[obj.table.length - 1].Block.difficulty,
                    obj.table[obj.table.length - 1].Block.txs,
                    obj.table[obj.table.length - 1].Block.nonce,
                    obj.table[obj.table.length - 1].Block.no,
                    tabTree,
                    obj.table[obj.table.length - 1].Block.numberMax
                );
                //block.setTransactions() = obj.table[obj.table.length-1].Block;
                if (block.getNumberOfTransactions() >= block.getNumberMax()) {
                    //Generate new Block
                    miner.setPreviousBlock(block);
                    miner.generateHash();
                    blockNew = miner.getNewBlock();

                    var tx = blockNew.getTransactions();
                    tx.push(transaction);
                    blockNew.setTransactions(tx);
                    blockNew.previousHash = block.hash;
                    obj.table[obj.table.length - 1].Block = block;
                    obj.table.push({ Block: blockNew });
                } else {
                    var tx = block.getTransactions();
                    tx.push(transaction);
                    block.setTransactions(tx);
                    obj.table[obj.table.length - 1].Block = block;
                }
                var json = JSON.stringify(obj);
                fs.writeFileSync(fileData, json, "utf8");
            }
        }
    }
    return blockNew;
}

function check_efficiency(transaction, fileAdresses, fileData, fileAccess) {
    boolExistTransaction = existTransaction(transaction.hash, fileData);
    // console.log('Exist Transaction : '+boolExistTransaction);
    if (boolExistTransaction == false) {
        console.log("Tentative de rejeu detectée");
        return false;
    }

    boolExistToken = existToken(transaction.token.hash, fileData);
    //console.log('Exist Token : '+boolExistToken);
    if (boolExistToken == false) {
        console.log("False token detected");
        return false;
    }

    boolHasPermission = QueryPermission(
        fileAccess,
        fileAdresses,
        transaction.requester,
        transaction.requested,
        transaction.action,
        transaction.conditions,
        transaction.obligations
    );
    //console.log('Has Permission : '+boolHasPermission);
    if (boolHasPermission == false) {
        console.log("Permission non accorded");
        return false;
    }
    var token = new Token();
    var transaction_request = new TransactionRequest();

    if (transaction.token != null) {
        var boolToken = token.verify(
            transaction.token.requested,
            transaction.token.requester,
            transaction.token.hash,
            transaction.token.action,
            transaction.token.validity,
            transaction.token.timestamp
        );
        //  console.log('Bool Token : '+boolToken);
        if (boolToken == false) {
            console.log("False token detected");
            return false;
        }
    }

    var boolTransaction = transaction_request.verify(
        transaction.hash,
        transaction.requested,
        transaction.requester,
        transaction.action,
        transaction.timestamp,
        transaction.token
    );
    //console.log('Bool Transaction : '+boolTransaction);
    if (boolTransaction == false) {
        console.log("False Transaction detected");
        return false;
    }

    var boolExistRequested = existNode(transaction.requested, fileAdresses);
    //console.log('Bool Exist Requested : '+boolExistRequested);
    if (boolExistRequested == false) {
        console.log("Requested doesn't exist");
        return false;
    }

    var boolExistRequester = existNode(transaction.requester, fileAdresses);
    // console.log('Bool Exist requester : '+boolExistRequester);
    if (boolExistRequester == false) {
        console.log("Requester doesn't exist");
        return false;
    }
    return true;
}

function saveNodeMacAdr(ip, port, mac, host, role, trust, fileAdresses) {
    var objAdresses = {
        table: [],
    };
    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    if (dataAdresses.length != 0) {
        var objAdresses = JSON.parse(dataAdresses);
    }
    objAdresses.table.push({
        Node: {
            adr: "",
            IP: ip,
            port: port,
            MAC: mac,
            host: host,
            role: role,
            trust: trust,
        },
    });
    var jsonAdresses = JSON.stringify(objAdresses);
    fs.writeFileSync(fileAdresses, jsonAdresses, "utf8");
}

function existNodeMacAdr(mac, fileAdresses) {
    var objAdresses = {
        table: [],
    };
    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    if (dataAdresses.length != 0) {
        objAdresses = JSON.parse(dataAdresses);

        for (i = 0; i < Object.keys(objAdresses.table).length; i++) {
            // Test if node exist
            if (objAdresses.table[i].Node.MAC == mac) return true;
        }
    }
    return false;
}

function broadcast_publicKey(fileAdresses, publicKey, macadr, fileConfig) {
    var objAdresses = {
        table: [],
    };

    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");
    var bool = false;
    if (dataAdresses.length != 0) {
        objAdresses = JSON.parse(dataAdresses);

        for (i = 0; i < Object.keys(objAdresses.table).length; i++) {
            //Test if node is miner
            if (objAdresses.table[i].Node.role == "miner") {
                nodeInfo = get_node_info(fileConfig);
                var str = publicKey + "" + macadr;
                var privateKey = new Buffer(nodeInfo.Key.privateKey, "hex");
                var ec = new EC("secp256k1");
                var shaMsg = crypto.createHash("sha256").update(str).digest();
                var mySign = ec.sign(shaMsg, privateKey, { canonical: true });
                var signature = asn1SigSigToConcatSig(mySign);

                var packet = {
                    from: {
                        address: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port,
                        id: server.id,
                    },
                    message: {
                        type: 11,
                        host: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port,
                        publicKey: publicKey,
                        public: nodeInfo.Key.publicKey,
                        mac: macadr,
                        signature: signature,
                        shaMsg: shaMsg,
                    },
                };
                server.sendMessage(
                    {
                        address: objAdresses.table[i].Node.IP,
                        port: objAdresses.table[i].Node.port,
                    },
                    packet
                );
            }
        }
    }
}

function update_adresses(publicKey, mac, fileAdresses) {
    var objAdresses = {
        table: [],
    };

    var dataAdresses = fs.readFileSync(fileAdresses, "utf8");

    if (dataAdresses.length != 0) {
        objAdresses = JSON.parse(dataAdresses);
        for (i = 0; i < objAdresses.table.length; i++) {
            if (objAdresses.table[i].Node.MAC == mac) {
                objAdresses.table[i].Node.adr = publicKey;
            }
        }
        var jsonAdresses = JSON.stringify(objAdresses);
        fs.writeFileSync(fileAdresses, jsonAdresses, "utf8");
    }
}

function update_access_list(publicKey, mac, fileAccess, fileAdresses) {
    var dataAccess = fs.readFileSync(fileAccess, "utf8");
    var objAccess = {
        table: [],
    };

    nodeInfo = get_node_info_by_mac(mac, fileAdresses);

    if (dataAccess.length != 0) {
        var objAccess = JSON.parse(dataAccess);

        for (i = 0; i < objAccess.table.length; i++) {
            if (
                objAccess.table[i].Node.adr == mac ||
                objAccess.table[i].Node.adr == nodeInfo.table[0].adr
            )
                objAccess.table[i].Node.adr = publicKey;
            for (k = 0; k < objAccess.table[i].Node.accesslist.length; k++) {
                if (
                    objAccess.table[i].Node.accesslist[k].ressource == mac ||
                    objAccess.table[i].Node.accesslist[k].ressource ==
                        nodeInfo.table[0].adr
                )
                    objAccess.table[i].Node.accesslist[k].ressource = publicKey;
            }
        }
        var jsonAccess = JSON.stringify(objAccess);
        fs.writeFileSync(fileAccess, jsonAccess, "utf8");
    }
}

function get_node_accesslist(publicKey, mac, fileAccess) {
    var dataAccess = fs.readFileSync(fileAccess, "utf8");
    var objAccess = {
        table: [],
    };

    if (dataAccess.length != 0) {
        var objAccess = JSON.parse(dataAccess);
        for (i = 0; i < objAccess.table.length; i++) {
            if (
                objAccess.table[i].Node.adr == mac ||
                objAccess.table[i].Node.adr == publicKey
            ) {
                return objAccess.table[i].Node.accesslist;
            }
        }
    }
    return null;
}

function existToken(hash, fileData) {
    // Verify if transactions exist

    var data = fs.readFileSync(fileData, "utf8");
    boolExist = false;
    if (data.length != 0) {
        obj = JSON.parse(data);
        i = 0;
        while (i < Object.keys(obj.table).length && boolExist == false) {
            var block = new Block();
            var objTree = obj.table[obj.table.length - 1].Block._tree;
            var tabTree = Object.keys(objTree).map(function (key) {
                return [objTree[key]];
            });
            block.new(
                obj.table[i].Block.hash,
                obj.table[i].Block.previousHash,
                obj.table[i].Block.timestamp,
                obj.table[i].Block.merkleRoot,
                obj.table[i].Block.difficulty,
                obj.table[i].Block.txs,
                obj.table[i].Block.nonce,
                obj.table[i].Block.no,
                tabTree,
                obj.table[i].Block.numberMax
            );
            boolExist = block.tokenExist(hash);
            i++;
        }
    }
    return boolExist;
}

function toHexString(byteArray) {
    return Array.from(byteArray, function (byte) {
        return ("0" + (byte & 0xff).toString(16)).slice(-2);
    }).join("");
}

function toStringHex(string) {
    var myBuffer = [];
    var str = string;
    var buffer = new Buffer(str, "utf16le");
    for (var i = 0; i < buffer.length; i++) {
        myBuffer.push(buffer[i]);
    }

    return myBuffer;
}

function asn1SigSigToConcatSig(asn1SigBuffer) {
    return Buffer.concat([
        asn1SigBuffer.r.toArrayLike(Buffer, "be", 32),
        asn1SigBuffer.s.toArrayLike(Buffer, "be", 32),
    ]);
}

function concatSigToAsn1Sig(concatSigBuffer) {
    const r = new BN(concatSigBuffer.slice(0, 32).toString("hex"), 16, "be");
    const s = new BN(concatSigBuffer.slice(32).toString("hex"), 16, "be");
    return EcdsaDerSig.encode({ r, s }, "der");
}

/**
 * Create a mining node.
 */
server.start({
    onstart: onstart,
    onmessage: onmessage,
});
/*--------------------------------------------------------*/
/*------------------MQTT BROKER SETUP---------------------*/
/*--------------------------------------------------------*/
var mosca = require("mosca");
var smartContract = require("./SmartContract");
var moscaSetting = {
    interfaces: [
        { type: "mqtt", port: 1883 },
        { type: "http", port: 3000, bundle: true },
    ],
    stats: false,
    onQoS2publish: "noack", // can set to 'disconnect', or to 'dropToQoS1' if using a client which will eat puback for QOS 2; e.g. mqtt.js

    logger: { name: "IoTChain MQTT Server" /*, level: 'debug'*/ },
};

var authenticate = function (client, username, password, callback) {
    if (username == "test" && password.toString() == "test")
        callback(null, true);
    else callback(null, false);
};

var authorizePublish = function (client, topic, payload, callback) {
    var auth = true;
    // set auth to :
    //  true to allow
    //  false to deny and disconnect
    //  'ignore' to puback but not publish msg.
    callback(null, auth);
};

var authorizeSubscribe = function (client, topic, callback) {
    var auth = true;
    // set auth to :
    //  true to allow
    //  false to deny
    callback(null, auth);
};
var mqttserver = new mosca.Server(moscaSetting);

mqttserver.on("ready", setup);

function setup() {
    mqttserver.authenticate = authenticate;
    mqttserver.authorizePublish = authorizePublish;
    mqttserver.authorizeSubscribe = authorizeSubscribe;

    console.log("IoTChain MQTT's server is up and running.");
}

mqttserver.on("error", function (err) {
    console.log(err);
});

mqttserver.on("clientConnected", function (client) {
    console.log("Client Connected \t:= ", client.id);
    //   console.log("Checking if Node ",client.id," exist !?");
    if (
        smartContract.existNodeMacAdr(
            client.id,
            __dirname + "/tmp/node/adresses.json"
        )
    ) {
        //   console.log("Node ",client.id," exist");
        //mqttserver.publish({topic:"REQUEST_USE", payload:'foo'}, client);
    } else {
        //mqttserver.publish({topic:"MINERS", payload:'foo'}, client);
        console.log("Node ", client.id, " not exist");
        //mqttserver.disconnect(client);
    }
});

mqttserver.on("published", function (packet, client) {
    if (packet.payload.length != 0) {
        //console.log("Published :=", packet);
        if (packet.topic == "INFO") {
            console.log(
                "Client \t:= ",
                client.id,
                " @ ",
                packet.payload,
                " Address updated"
            );
            if (
                existNodeMacAdr(
                    client.id,
                    __dirname + "/tmp/node/adresses.json"
                )
            ) {
                update_access_list(
                    toHexString(packet.payload),
                    client.id,
                    __dirname + "/tmp/node/list.json",
                    __dirname + "/tmp/node/adresses.json"
                );
                update_adresses(
                    toHexString(packet.payload),
                    client.id,
                    __dirname + "/tmp/node/adresses.json"
                );
                broadcast_publicKey(
                    __dirname + "/tmp/node/adresses.json",
                    toHexString(packet.payload),
                    client.id,
                    __dirname + "/tmp/node/config.json"
                );
            }
        }
        if (packet.topic == "Temp") {
            var value = toHexString(packet.payload);
            var dataResponse = fs.readFileSync(fileResponse, "utf8");

            if (dataResponse.length != 0) {
                var objResponse = JSON.parse(dataResponse);
                requestTmpFile = objResponse.requestTmp;
                sendFile = objResponse.send;
                if (sendFile == false) {
                    requestTmp = packet.payload;
                    send = true;
                    var objResponse = {
                        requestTmp: requestTmp.toString(),
                        send: send,
                    };
                    var jsonResponse = JSON.stringify(objResponse);
                    fs.writeFileSync(fileResponse, jsonResponse, "utf8");
                }
            } else {
                requestTmp = packet.payload;
                send = true;
                var objResponse = {
                    requestTmp: requestTmp.toString(),
                    send: send,
                };

                var jsonResponse = JSON.stringify(objResponse);
                fs.writeFileSync(fileResponse, jsonResponse, "utf8");
            }
        }
        if (packet.topic == "LightON") {
            var value = toHexString(packet.payload);
            var dataResponse = fs.readFileSync(fileResponse, "utf8");

            if (dataResponse.length != 0) {
                var objResponse = JSON.parse(dataResponse);
                requestTmpFile = objResponse.requestTmp;
                sendFile = objResponse.send;
                if (sendFile == false) {
                    requestTmp = packet.payload;
                    send = true;
                    var objResponse = {
                        requestTmp: "ON",
                        send: send,
                    };
                    var jsonResponse = JSON.stringify(objResponse);
                    fs.writeFileSync(fileResponse, jsonResponse, "utf8");
                }
            } else {
                requestTmp = packet.payload;
                send = true;
                var objResponse = {
                    requestTmp: "ON",
                    send: send,
                };

                var jsonResponse = JSON.stringify(objResponse);
                fs.writeFileSync(fileResponse, jsonResponse, "utf8");
            }
        }
        if (packet.topic == "LightOFF") {
            var value = toHexString(packet.payload);
            var dataResponse = fs.readFileSync(fileResponse, "utf8");

            if (dataResponse.length != 0) {
                var objResponse = JSON.parse(dataResponse);
                requestTmpFile = objResponse.requestTmp;
                sendFile = objResponse.send;
                if (sendFile == false) {
                    requestTmp = packet.payload;
                    send = true;
                    var objResponse = {
                        requestTmp: "OFF",
                        send: send,
                    };
                    var jsonResponse = JSON.stringify(objResponse);
                    fs.writeFileSync(fileResponse, jsonResponse, "utf8");
                }
            } else {
                requestTmp = packet.payload;
                send = true;
                var objResponse = {
                    requestTmp: "OFF",
                    send: send,
                };

                var jsonResponse = JSON.stringify(objResponse);
                fs.writeFileSync(fileResponse, jsonResponse, "utf8");
            }
        }

        if (packet.topic == "PIR") {
            var value = toHexString(packet.payload);
            var dataResponse = fs.readFileSync(fileResponse, "utf8");

            if (dataResponse.length != 0) {
                var objResponse = JSON.parse(dataResponse);
                requestTmpFile = objResponse.requestTmp;
                sendFile = objResponse.send;
                if (sendFile == false) {
                    requestTmp = packet.payload;
                    send = true;
                    var objResponse = {
                        requestTmp: requestTmp.toString(),
                        send: send,
                    };
                    var jsonResponse = JSON.stringify(objResponse);
                    fs.writeFileSync(fileResponse, jsonResponse, "utf8");
                }
            } else {
                requestTmp = packet.payload;
                send = true;
                var objResponse = {
                    requestTmp: requestTmp.toString(),
                    send: send,
                };

                var jsonResponse = JSON.stringify(objResponse);
                fs.writeFileSync(fileResponse, jsonResponse, "utf8");
            }
        }
    }
});
function unicodeStringToTypedArray(s) {
    var escstr = encodeURIComponent(s);
    var binstr = escstr.replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode("0x" + p1);
    });
    var ua = new Uint8Array(binstr.length);
    Array.prototype.forEach.call(binstr, function (ch, i) {
        ua[i] = ch.charCodeAt(0);
    });
    return ua;
}
mqttserver.on("subscribed", function (topic, client) {
    if (topic == "MINERS") {
        mqttserver.publish({ topic: "MINERS", payload: "foo" }, client);
    }

    // console.log(client.id," Subscribed in ", topic," topic");
});

mqttserver.on("unsubscribed", function (topic, client) {
    //  console.log('unsubscribed := ', topic);
});

mqttserver.on("clientDisconnecting", function (client) {
    console.log("clientDisconnecting := ", client.id);
});

mqttserver.on("clientDisconnected", function (client) {
    console.log("Client Disconnected     := ", client.id);
});
