var express = require("express");
var nodeRoute = require("./node");
var accessRoute = require("./access");
var router = express.Router();

router.use("/node", nodeRoute);
router.use("/access", accessRoute);

router.post("/generateUse", function (req, res) {
    transaction = req.body;
    console.log("Received request to generate Transaction Use");

    var fileAccess = __dirname + "/tmp/node/list.json";
    var fileTmp = __dirname + "/tmp/node/tmp.json";
    var fileConfig = __dirname + "/tmp/node/config.json";
    var fileAdresses = __dirname + "/tmp/node/adresses.json";
    var fileData = __dirname + "/tmp/node/blocs/data.json";

    check_efficiency(transaction, fileAdresses, fileData, fileAccess);
    transaction_use = new TransactionUse();
    transaction_use.new(
        transaction.requested,
        transaction.requester,
        transaction.timestamp,
        transaction.action,
        transaction.token
    );

    // Broadcast transaction to validate

    tmp = {
        Transaction: transaction_use,
        nb_node: get_nb_miner(fileAdresses),
        nb_agree: 0,
        nb_reject: 0,
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

    broadcast_transaction(
        fileAdresses,
        transaction_use,
        "use",
        get_publicKey_node(fileConfig),
        fileConfig,
        ""
    );
});

module.exports = router;
