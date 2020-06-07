var express = require("express");
var router = express.Router();

router.post("/updateRights", function (req, res) {
    console.log("Received request to update access rights");

    var fileAdresses = __dirname + "/tmp/node/adresses.json";
    var fileAccess = __dirname + "/tmp/node/list.json";
    var fileConfig = __dirname + "/tmp/node/config.json";
    update_access_rights(
        req.body.requester,
        req.body.requested,
        req.body.action,
        req.body.condition,
        req.body.obligation,
        req.body.trust,
        fileAccess
    );
    response = "SUCCESS";
    broadcast_access_rights(
        "UPDATE",
        req.body.requester,
        req.body.requested,
        req.body.action,
        req.body.condition,
        req.body.obligation,
        req.body.trust,
        "",
        fileAdresses,
        fileConfig
    );
    res.send(response);
});

router.post("/deleteRights", function (req, res) {
    console.log("Received request to delete access rights");
    var fileAdresses = __dirname + "/tmp/node/adresses.json";
    var fileAccess = __dirname + "/tmp/node/list.json";
    var fileConfig = __dirname + "/tmp/node/config.json";
    delete_access_rights(
        req.body.requester,
        req.body.requested,
        req.body.action,
        req.body.condition,
        req.body.obligation,
        fileAccess
    );
    response = "SUCCESS";
    broadcast_access_rights(
        "DELETE",
        req.body.requester,
        req.body.requested,
        req.body.action,
        req.body.condition,
        req.body.obligation,
        "",
        "",
        fileAdresses,
        fileConfig
    );
    res.send(response);
});

router.post("/addRights", function (req, res) {
    console.log("Received request to add access rights");

    var fileAdresses = __dirname + "/tmp/node/adresses.json";
    var fileAccess = __dirname + "/tmp/node/list.json";
    var fileConfig = __dirname + "/tmp/node/config.json";
    // Save access rights
    var listAccess = req.body.listAccess;
    add_access_rights(fileAccess, listAccess);
    response = "SUCCESS";
    broadcast_access_rights(
        "ADD",
        "",
        "",
        "",
        "",
        "",
        "",
        listAccess,
        fileAdresses,
        fileConfig
    );
    res.send(response);
});

router.post("/ressource", function (req, res) {
    console.log("Received request to access ressource");

    var fileConfig = __dirname + "/tmp/node/config.json";
    var fileAdresses = __dirname + "/tmp/node/adresses.json";
    nbReq++;
    var objResponse = {
        requestTmp: "",
        send: false,
    };

    var jsonResponse = JSON.stringify(objResponse);
    fs.writeFileSync(fileResponse, jsonResponse, "utf8");

    var ipRequest = getClientIp(req).slice(
        getClientIp(req).lastIndexOf(":") + 1
    );

    request = {
        ip: getClientIp(req),
        requester: get_node_info_by_ip(ipRequest, fileAdresses).table[0].adr,
        requested: req.body.requested,
        action: req.body.action,
        type: req.body.type,
        value: req.body.value,
        //conditions : '',
        //obligations : '',
    };

    var objResponse = {
        requestTmp: requestTmp,
        send: send,
    };

    var jsonResponse = JSON.stringify(objResponse);
    fs.writeFileSync(fileResponse, jsonResponse, "utf8");
    var time = 0;
    var refreshIntervalId = setInterval(function () {
        var dataResponse = fs.readFileSync(fileResponse, "utf8");
        time++;
        if (dataResponse.length != 0) {
            var objResponse = JSON.parse(dataResponse);
            requestTmpFile = objResponse.requestTmp;
            sendFile = objResponse.send;

            if (sendFile == true && requestTmpFile != "") {
                console.log("Responding to requester ... ");
                res.json(requestTmpFile);
                requestTmp = "";
                send = false;
                var objResponse = {
                    requestTmp: requestTmp,
                    send: send,
                };

                var jsonResponse = JSON.stringify(objResponse);
                fs.writeFileSync(fileResponse, jsonResponse, "utf8");
                clearInterval(refreshIntervalId);
                // res.end();
            }
        }
    }, 20);

    // Broadcast request to execute Action
    broadcast_request(
        fileAdresses,
        get_publicKey_node(fileConfig),
        request,
        fileConfig
    );
});

module.exports = router;
