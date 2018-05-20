/**
 *
 * Transaction type Use
 *
 */

'use strict';

var token = require('./token');
var crypto = require("crypto");

function TransactionUse(transactionUse) {
	if (typeof transactionUse === 'undefined') {
		transactionUse = {};
	}
	
	token =new Token(transactionUse.token)
	this.hash = transactionUse.hash ;
    this.requested = transactionUse.requested;
    this.requester = transactionUse.requester;
    this.timestamp = transactionUse.timestamp;
   	this.action = transactionUse.action ;
   	this.token = transactionUse.token ;
}

TransactionUse.prototype.show= function(){
	return 'Hash : '+this.hash+' Requested : '+ this.requested + ' Requester : '+this.requester+' Timestamp : '+this.timestamp+' Action : '+ this.action+' Token : '+this.token.show();
};
TransactionUse.prototype.new= function(requested,requester,timestamp,action,token){

    this.requested = requested;
    this.requester = requester;
    this.timestamp = timestamp;
   	this.action = action;
	this.token = token;

	var header = {
		requested : this.requested,
	    requester : this.requester,
	    timestamp : this.timestamp,
	   	action : this.action ,
	   	token : this.token.hash 
    };
    
	var hash = crypto.createHmac('sha256', 'Transaction Use')
                        .update( JSON.stringify(header) )
                        .digest('hex');

	this.hash =  hash;

	return this.hash;
};

TransactionUse.prototype.verify= function(hash,requested,requester,action,timestamp,token){

	var header = {
		requested : requested,
	    requester : requester,
	    timestamp : timestamp,
	   	action : action ,
	   	token : token.hash 
    };
    
	var hashValid = crypto.createHmac('sha256', 'Transaction Use')
                        .update( JSON.stringify(header) )
                        .digest('hex');

	if(hashValid == hash) return true;
	else return false;
};

module.exports = TransactionUse;