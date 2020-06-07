/**
 *
 */

"use strict";

var nodeUtils = {
    getInfoByAdr: function (adr, fileAdresses) {
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
                if (objAdresses.table[i].Node.adr == adr) {
                    data.table.push({
                        ip: objAdresses.table[i].Node.IP,
                        port: objAdresses.table[i].Node.port,
                        role: objAdresses.table[i].Node.role,
                        mac: objAdresses.table[i].Node.MAC,
                    });
                }
            }
        }
        return data;
    },

    getInfoByIp: function (ip, fileAdresses) {
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
    },

    getInfoByMac: function (mac, fileAdresses) {
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
                if (objAdresses.table[i].Node.MAC == mac) {
                    data.table.push({
                        ip: objAdresses.table[i].Node.IP,
                        port: objAdresses.table[i].Node.port,
                        role: objAdresses.table[i].Node.role,
                        adr: objAdresses.table[i].Node.adr,
                    });
                }
            }
        }
        return data;
    },

    getInfo: function (fileConfig) {
        var dataConfig = fs.readFileSync(fileConfig, "utf8");
        var objConfig = JSON.parse(dataConfig);
        if (dataConfig.length != 0) {
            return objConfig.table[0];
        }
        return false;
    },

    save: function (publicKey, ip, port, mac, host, role, trust, fileAdresses) {
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
    },

    saveMacAdr: function (ip, port, mac, host, role, trust, fileAdresses) {
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
    },

    exist: function (nodeAdr, fileAdresses) {
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
    },
    configure: function (ip, mac, role, port, trust, fileConfig) {
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
    },
};

if (typeof module != "undefined" && typeof exports != "undefined")
    module.exports = nodeUtils;
