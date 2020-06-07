var express = require("express");
var router = express.Router();

router.all("/add", function (req, res) {
    objReceived = req.body;
    var arp = require("node-arp");
    arp.getMAC(objReceived.ipadr, function (err, mac) {
        res.header(
            "Access-Control-Allow-Methods",
            "GET, PUT, POST, DELETE, OPTIONS"
        );
        console.log("Adding new node to network ");

        var fileAdresses = __dirname + "/tmp/node/adresses.json";
        var fileConfig = __dirname + "/tmp/node/config.json";
        var fileAccess = __dirname + "/tmp/node/list.json";
        var fileMiner = __dirname + "/tmp/node/miner.json";
        var file = __dirname + "/tmp/node/blocs/data.json";
        objReceived = req.body;

        // Test if the node exist

        var bool = existNodeMacAdr(mac, fileAdresses);

        var response = "FAIL";
        if (bool == false) {
            //node doesn't exist , save it
            port = objReceived.port;
            host = objReceived.ipadr;
            ip = objReceived.ipadr;
            role = objReceived.role;
            var trust;
            if (role == "miner") trust = 0;
            if (role == "ressource") trust = 3;
            if (role == "user") trust = 5;

            nodeUtils.saveMacAdr(
                ip,
                port,
                mac,
                host,
                role,
                trust,
                fileAdresses
            );

            // Save access rights of the new node
            var listAccess = objReceived.listAccess;
            if (listAccess != null) {
                saveAccessRight(fileAccess, listAccess);
            }

            var dataConfig = fs.readFileSync(fileConfig, "utf8");
            objConfig = JSON.parse(dataConfig);

            response = "SUCCESS";

            if (process.platform === "win32") {
                var adrMacTurn = require("os").networkInterfaces()["Wi-Fi"][0]
                    .address;
            } else {
                var adrMacTurn = require("os").networkInterfaces().wlan0[0].mac;
            }
            if (role == "miner" && adrMacTurn == "b8:27:eb:86:51:88") {
                // && minerTurn(fileMiner) == true){ // is the selected miner

                // Get the Blockchain

                var jsonToSend = null;
                data = fs.readFileSync(file, "utf8");
                if (data.length != 0) {
                    obj = JSON.parse(data);
                } else {
                    obj = "";
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
                var nodeInfo = get_node_info(fileConfig);

                var str =
                    response +
                    "" +
                    JSON.stringify(obj) +
                    "" +
                    JSON.stringify(objAdresses) +
                    "" +
                    JSON.stringify(objAccess);
                var keyPublic = new Buffer(nodeInfo.Key.publicKey, "hex");
                var privateKey = new Buffer(nodeInfo.Key.privateKey, "hex");
                var ec = new EC("secp256k1");
                var shaMsg = crypto.createHash("sha256").update(str).digest();
                var mySign = ec.sign(shaMsg, privateKey, {
                    canonical: true,
                });
                var signature = asn1SigSigToConcatSig(mySign);

                // Send to the node addresses, access list and BC
                var packet = {
                    from: {
                        address: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port,
                        id: server.id,
                    },
                    message: {
                        type: 9,
                        host: nodeInfo.Server.IP,
                        port: nodeInfo.Server.port,
                        publicKey: nodeInfo.Key.publicKey,
                        response: response,
                        blocs: obj,
                        adresses: objAdresses,
                        accesslist: objAccess,
                        shaMsg: shaMsg,
                        signature: signature,
                    },
                };
                server.sendMessage({ address: ip, port: port }, packet);
            }
            if (process.platform === "win32") {
                var adrMacTurn = require("os").networkInterfaces()["Wi-Fi"][0]
                    .address;
            } else {
                var adrMacTurn = require("os").networkInterfaces().wlan0[0].mac;
            }
            if (role == "user" && adrMacTurn == "b8:27:eb:86:51:88") {
                // console.log('Config node user');
                // Generate keypair for the node
                var privateKeyUser = crypto.randomBytes(32);
                var publicKeyUser = eccrypto.getPublic(privateKeyUser);
                update_adresses(toHexString(publicKeyUser), mac, fileAdresses);

                broadcast_publicKey(
                    fileAdresses,
                    toHexString(publicKeyUser),
                    mac,
                    fileConfig
                );
            }
        }
        res.send({ response: response });
    });
});

router.all("/configure", function (req, res) {
    res.header(
        "Access-Control-Allow-Methods",
        "GET, PUT, POST, DELETE, OPTIONS"
    );
    console.log("Configure Information of the node");
    // Save in the config file

    var file = __dirname + "/tmp/node/blocs/data.json";
    var fileConfig = __dirname + "/tmp/node/config.json";
    var fileAdresses = __dirname + "/tmp/node/adresses.json";
    var fileMiner = __dirname + "/tmp/node/miner.json";
    objReceived = req.body;
    var jsonfile = require("jsonfile");
    var arp = require("node-arp");

    if (process.platform === "win32") {
        var adrMac = require("os").networkInterfaces()["Wi-Fi"][0].address;
    } else {
        var adrMac = require("os").networkInterfaces().wlan0[0].mac;
    }

    var trust;
    if (req.body.role == "miner") trust = 0;
    if (req.body.role == "ressource") trust = 3;
    if (req.body.role == "user") trust = 5;

    nodeUtils.configure(
        req.body.ipadr,
        adrMac,
        req.body.role,
        req.body.port,
        trust,
        fileConfig
    );
    if (req.body.first == "true") {
        var config = require("./config.js");
        var block = new Block(config.genesis);
        var obj = {
            table: [],
        };
        // Store the genesis block in the file
        var data = fs.readFileSync(file, "utf8");
        if (data.length == 0) {
            obj.table.push({ Block: block });
            var json = JSON.stringify(obj);
            fs.writeFileSync(file, json, "utf8");
        }

        // Generate keypair for the node
        var privateKey = crypto.randomBytes(32);
        var publicKey = eccrypto.getPublic(privateKey);
        // Generate keypair
        var dataConfig = fs.readFileSync(fileConfig, "utf8");
        if (dataConfig.length != 0) {
            objConfig = JSON.parse(dataConfig);

            objConfig.table[0].Key.publicKey = toHexString(publicKey);
            objConfig.table[0].Key.privateKey = toHexString(privateKey);

            // Fill in the file config of the node

            var jsonConfig = JSON.stringify(objConfig);
            fs.writeFileSync(fileConfig, jsonConfig, "utf8");
        }
        nodeUtils.save(
            toHexString(publicKey),
            req.body.ipadr,
            req.body.port,
            adrMac,
            req.body.ipadr,
            req.body.role,
            trust,
            fileAdresses
        );

        var dataMiner = fs.readFileSync(fileMiner, "utf8");
        objMiner = {
            table: [],
        };
        var tabAdr = [];
        tabAdr.push(toHexString(publicKey));
        objMiner.table.push({
            adr: toHexString(publicKey),
            myTurn: true,
            tabAdr: tabAdr,
        });
        var jsonMiner = JSON.stringify(objMiner);
        fs.writeFileSync(fileMiner, jsonMiner, "utf8");
        /*   setInterval(function() {
                switch_elected_miner(fileMiner,fileConfig,fileAdresses);
            }, 15000);*/
    } else {
        nodeUtils.saveMacAdr(
            req.body.ipadr,
            req.body.port,
            adrMac,
            req.body.ipadr,
            req.body.role,
            trust,
            fileAdresses
        );
    }

    res.send({ statut: "SUCCESS" });
});

router.post("/all", function (req, res) {
    var fileAdresses = __dirname + "/tmp/node/adresses.json";
    var fileAccess = __dirname + "/tmp/node/list.json";
    console.log("Received request to send Nodes");
    var ipRequest = getClientIp(req).slice(
        getClientIp(req).lastIndexOf(":") + 1
    );

    //    if (get_node_info_by_ip(ipRequest,fileAdresses).table.length>0){
    var util = require("util");

    var nodes = [];
    nodes = get_all_node(fileAdresses);
    var adresses = [];
    for (var i = 0; i < nodes.length; i++) {
        var accesslist = get_node_accesslist(
            nodes[i].Node.adr,
            nodes[i].Node.MAC,
            fileAccess
        );
        //console.log(accesslist);
        adresses.push({ Node: nodes[i].Node, accesslist: accesslist });
    }
    //console.log(adresses);
    //  adresses['Node']['accesslist']=get_node_accesslist(publicKey,mac,fileAccess);
    res.send(adresses);
    /*   }
            else
            {
                res.send("Permission non accordée");
                console.log("ip :",ipRequest," Non autorisé pour cette action");
            }*/
});

router.post("/getBlockchain", function (req, res) {
    res.header(
        "Access-Control-Allow-Methods",
        "GET, PUT, POST, DELETE, OPTIONS"
    );
    console.log("Received request to send BC");
    var jsonToSend = null;
    var fileData = __dirname + "/tmp/node/blocs/data.json";
    data = fs.readFileSync(fileData, "utf8");
    var objdata = "";
    if (data.length != 0) {
        objdata = JSON.parse(data);
    }
    res.send(JSON.stringify(objdata));
});

module.exports = router;
