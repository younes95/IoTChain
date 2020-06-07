/**
 *
 */

"use strict";

var Utils = {
    DebugVerbose: true,

    /**
     * Generate a hash key by SHA1. The key is used as identifier (ID) of each node.
     *
     * @param {String} text
     * @return {String}
     */
    hash: function (text) {
        var data =
            "CHORD..++" +
            text +
            new Date() +
            Math.floor(Math.random() * 999999);
        var Crypto = require("crypto");
        var key = Crypto.createHash("sha1").update(data).digest("hex");

        return key;
    },
    /**
     *
     * @param {Request type} request
     */
    getClientIp: function (request) {
        var ipAddress;
        // The request may be forwarded from local web server.
        var forwardedIpsStr = request.header("x-forwarded-for");
        if (forwardedIpsStr) {
            // 'x-forwarded-for' header may return multiple IP addresses in
            // the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
            // the first one
            var forwardedIps = forwardedIpsStr.split(",");
            ipAddress = forwardedIps[0];
        }
        if (!ipAddress) {
            // If request was not forwarded
            ipAddress = request.connection.remoteAddress;
        }
        return ipAddress;
    },
};

if (typeof module != "undefined" && typeof exports != "undefined")
    module.exports = Utils;
