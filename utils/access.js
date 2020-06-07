/**
 *
 */

"use strict";

var AccessUtils = {
    /**
     * @param {string} requester
     * @param {string} requested
     * @param {string} action
     * @param {string} condition
     * @param {string} obligation
     * @param {string} trust
     * @param {string} fileAccess
     */
    update: function (
        requester,
        requested,
        action,
        condition,
        obligation,
        trust,
        fileAccess
    ) {
        var dataAccess = fs.readFileSync(fileAccess, "utf8");
        var objAccess = {
            table: [],
        };

        if (dataAccess.length != 0) {
            var objAccess = JSON.parse(dataAccess);

            for (i = 0; i < objAccess.table.length; i++) {
                if (objAccess.table[i].Node.adr == requester) {
                    for (
                        k = 0;
                        k < objAccess.table[i].Node.accesslist.length;
                        k++
                    ) {
                        if (
                            objAccess.table[i].Node.accesslist[k].ressource ==
                                requested &&
                            objAccess.table[i].Node.accesslist[k].rights ==
                                action
                        ) {
                            objAccess.table[i].Node.accesslist[
                                k
                            ].conditions = condition;
                            objAccess.table[i].Node.accesslist[
                                k
                            ].obligations = obligation;
                            objAccess.table[i].Node.accesslist[k].trust = trust;
                        }
                    }
                }
            }
            var jsonAccess = JSON.stringify(objAccess);
            fs.writeFileSync(fileAccess, jsonAccess, "utf8");
        }
    },
    delete: function (
        requester,
        requested,
        action,
        condition,
        obligation,
        fileAccess
    ) {
        var dataAccess = fs.readFileSync(fileAccess, "utf8");
        var objAccess = {
            table: [],
        };

        if (dataAccess.length != 0) {
            var objAccess = JSON.parse(dataAccess);

            for (i = 0; i < objAccess.table.length; i++) {
                if (objAccess.table[i].Node.adr == requester) {
                    for (
                        k = 0;
                        k < objAccess.table[i].Node.accesslist.length;
                        k++
                    ) {
                        if (
                            objAccess.table[i].Node.accesslist[k].ressource ==
                                requested &&
                            objAccess.table[i].Node.accesslist[k].rights ==
                                action
                        ) {
                            objAccess.table[i].Node.accesslist.splice(k, 1);
                        }
                    }
                }
            }
            var jsonAccess = JSON.stringify(objAccess);
            fs.writeFileSync(fileAccess, jsonAccess, "utf8");
        }
    },

    add: function (fileAccess, listAccess) {
        var dataAccess = fs.readFileSync(fileAccess, "utf8");
        var objAccess = {
            table: [],
        };

        if (dataAccess.length != 0) {
            var objAccess = JSON.parse(dataAccess);
            precHash = objAccess.table[0].Node.adr;
            var boolNode = false;
            var boolAccess = false;
            for (i = 0; i < objAccess.table.length; i++) {
                for (j = 0; j < listAccess.length; j++) {
                    if (
                        objAccess.table[i].Node.adr == listAccess[j].requested
                    ) {
                        boolNode = true;
                        boolAccess = false;
                        for (
                            k = 0;
                            k < objAccess.table[i].Node.accesslist.length;
                            k++
                        ) {
                            if (
                                listAccess[j].requested ==
                                    objAccess.table[i].Node.accesslist[k]
                                        .ressource &&
                                listAccess[j].rights ==
                                    objAccess.table[i].Node.accesslist[k].rights
                            )
                                boolAccess = true;
                        }

                        //Access rights doesn't exist, save it !!
                        if (boolAccess == false) {
                            objAccess.table[i].Node.accesslist.push({
                                ressource: listAccess[j].requested,
                                rights: listAccess[j].rights,
                                conditions: listAccess[j].conditions,
                                obligations: listAccess[j].obligations,
                                trust: listAccess[j].trust,
                            });
                        }
                    }
                }
            }

            // Node doesn't exist, save all the rights !
            if (boolNode == false) {
                for (j = 0; j < listAccess.length; j++) {
                    if (j == 0) {
                        var accesslist = [];
                        accesslist.push({
                            ressource: listAccess[j].requested,
                            rights: listAccess[j].rights,
                            conditions: listAccess[j].conditions,
                            obligations: listAccess[j].obligations,
                            trust: listAccess[j].trust,
                        });
                        objAccess.table.push({
                            Node: {
                                adr: listAccess[j].requester,
                                accesslist: accesslist,
                            },
                        });
                    } else {
                        objAccess.table[
                            objAccess.table.length - 1
                        ].Node.accesslist.push({
                            ressource: listAccess[j].requested,
                            rights: listAccess[j].rights,
                            conditions: listAccess[j].conditions,
                            obligations: listAccess[j].obligations,
                            trust: listAccess[j].trust,
                        });
                    }
                }
            }
            var jsonAccess = JSON.stringify(objAccess);
            fs.writeFileSync(fileAccess, jsonAccess, "utf8");
        } else {
            for (j = 0; j < listAccess.length; j++) {
                if (j == 0) {
                    var accesslist = [];
                    accesslist.push({
                        ressource: listAccess[j].requested,
                        rights: listAccess[j].rights,
                        conditions: listAccess[j].conditions,
                        obligations: listAccess[j].obligations,
                        trust: listAccess[j].trust,
                    });
                    objAccess.table.push({
                        Node: {
                            adr: listAccess[j].requester,
                            accesslist: accesslist,
                        },
                    });
                } else {
                    objAccess.table[
                        objAccess.table.length - 1
                    ].Node.accesslist.push({
                        ressource: listAccess[j].requested,
                        rights: listAccess[j].rights,
                        conditions: listAccess[j].conditions,
                        obligations: listAccess[j].obligations,
                        trust: listAccess[j].trust,
                    });
                }
            }

            var jsonAccess = JSON.stringify(objAccess);
            fs.writeFileSync(fileAccess, jsonAccess, "utf8");
        }
    },

    broadcast: function (
        type,
        requester,
        requested,
        action,
        condition,
        obligation,
        trust,
        listAccess,
        fileAdresses,
        fileConfig
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
                if (objAdresses.table[i].Node.role == "miner") {
                    if (type == "ADD") {
                        nodeInfo = get_node_info(fileConfig);

                        var str = type + "" + JSON.stringify(listAccess);
                        var keyPublic = new Buffer(
                            nodeInfo.Key.publicKey,
                            "hex"
                        );
                        var privateKey = new Buffer(
                            nodeInfo.Key.privateKey,
                            "hex"
                        );
                        var ec = new EC("secp256k1");
                        var shaMsg = crypto
                            .createHash("sha256")
                            .update(str)
                            .digest();
                        var mySign = ec.sign(shaMsg, privateKey, {
                            canonical: true,
                        });
                        var signature = asn1SigSigToConcatSig(mySign);
                        const asn1signature = concatSigToAsn1Sig(signature);

                        var packet = {
                            from: {
                                address: nodeInfo.Server.IP,
                                port: nodeInfo.Server.port,
                                id: server.id,
                            },
                            message: {
                                type: 14,
                                host: nodeInfo.Server.IP,
                                port: nodeInfo.Server.port,
                                publicKey: nodeInfo.Key.publicKey,
                                typeAction: type,
                                listAccess: listAccess,
                                shaMsg: shaMsg,
                                signature: signature,
                            },
                        };
                    } else {
                        nodeInfo = get_node_info(fileConfig);
                        var str =
                            type +
                            "" +
                            requester +
                            "" +
                            requested +
                            "" +
                            action +
                            "" +
                            condition +
                            "" +
                            obligation +
                            "" +
                            trust;
                        var keyPublic = new Buffer(
                            nodeInfo.Key.publicKey,
                            "hex"
                        );
                        var privateKey = new Buffer(
                            nodeInfo.Key.privateKey,
                            "hex"
                        );
                        var ec = new EC("secp256k1");
                        var shaMsg = crypto
                            .createHash("sha256")
                            .update(str)
                            .digest();
                        var mySign = ec.sign(shaMsg, privateKey, {
                            canonical: true,
                        });
                        var signature = asn1SigSigToConcatSig(mySign);

                        var packet = {
                            from: {
                                address: nodeInfo.Server.IP,
                                port: nodeInfo.Server.port,
                                id: server.id,
                            },
                            message: {
                                type: 14,
                                host: nodeInfo.Server.IP,
                                port: nodeInfo.Server.port,
                                publicKey: nodeInfo.Key.publicKey,
                                typeAction: type,
                                requester: requester,
                                requested: requested,
                                action: action,
                                condition: condition,
                                obligation: obligation,
                                trust: trust,
                                shaMsg: shaMsg,
                                signature: signature,
                            },
                        };
                    }
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
    },
    save: function (fileAccess, listAccess) {
        var dataAccess = fs.readFileSync(fileAccess, "utf8");
        var objAccess = {
            table: [],
        };

        if (dataAccess.length != 0) {
            var objAccess = JSON.parse(dataAccess);
            precHash = objAccess.table[0].Node.adr;
            for (i = 0; i < objAccess.table.length; i++) {
                var boolNode = false;
                if (objAccess.table[i].Node.adr == objReceived.publicKey) {
                    boolNode = true;
                    for (j = 0; j < listAccess.length; j++) {
                        boolAccess = false;
                        for (
                            k = 0;
                            k < objAccess.table[i].Node.accesslist.length;
                            k++
                        ) {
                            if (
                                listAccess[j].requested ==
                                    objAccess.table[i].Node.accesslist[k]
                                        .ressource &&
                                listAccess[j].rights ==
                                    objAccess.table[i].Node.accesslist[k].rights
                            )
                                boolAccess = true;
                        }
                        //Access rights doesn't exist, save it !!
                        if (boolAccess == false) {
                            objAccess.table[i].Node.accesslist.push({
                                ressource: listAccess[j].requested,
                                rights: listAccess[j].rights,
                                conditions: listAccess[j].conditions,
                                obligations: listAccess[j].obligations,
                            });
                        }
                    }
                }
            }
            // Node doesn't exist, save all the rights !
            if (boolNode == false) {
                for (j = 0; j < listAccess.length; j++) {
                    if (j == 0) {
                        var accesslist = [];
                        accesslist.push({
                            ressource: listAccess[j].requested,
                            rights: listAccess[j].rights,
                            conditions: listAccess[j].conditions,
                            obligations: listAccess[j].obligations,
                        });
                        objAccess.table.push({
                            Node: {
                                adr: listAccess[j].requester,
                                accesslist: accesslist,
                            },
                        });
                    } else {
                        objAccess.table[
                            objAccess.table.length - 1
                        ].Node.accesslist.push({
                            ressource: listAccess[j].requested,
                            rights: listAccess[j].rights,
                            conditions: listAccess[j].conditions,
                            obligations: listAccess[j].obligations,
                        });
                    }
                }
            }
            var jsonAccess = JSON.stringify(objAccess);
            fs.writeFileSync(fileAccess, jsonAccess, "utf8");
        } else {
            for (j = 0; j < listAccess.length; j++) {
                if (j == 0) {
                    var accesslist = [];
                    accesslist.push({
                        ressource: listAccess[j].requested,
                        rights: listAccess[j].rights,
                        conditions: listAccess[j].conditions,
                        obligations: listAccess[j].obligations,
                    });
                    objAccess.table.push({
                        Node: {
                            adr: listAccess[j].requester,
                            accesslist: accesslist,
                        },
                    });
                } else {
                    objAccess.table[
                        objAccess.table.length - 1
                    ].Node.accesslist.push({
                        ressource: listAccess[j].requested,
                        rights: listAccess[j].rights,
                        conditions: listAccess[j].conditions,
                        obligations: listAccess[j].obligations,
                    });
                }
            }

            var jsonAccess = JSON.stringify(objAccess);
            fs.writeFileSync(fileAccess, jsonAccess, "utf8");
        }
    },
};

if (typeof module != "undefined" && typeof exports != "undefined")
    module.exports = AccessUtils;
