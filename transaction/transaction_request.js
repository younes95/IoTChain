/**
 *
 * Transaction type request
 *
 */

'use strict';
var token = require('./token');
var crypto = require("crypto");

function TransactionRequest(transactionRequest) {
	if (typeof transactionRequest === 'undefined') {
		transactionRequest = {};
	}
	token =new Token(transactionRequest.token)
	this.hash = transactionRequest.hash ;
    this.requested = transactionRequest.requested;
    this.requester = transactionRequest.requester;
    this.timestamp = transactionRequest.timestamp;
   	this.action = transactionRequest.action ;
   	this.token = token ;
}

TransactionRequest.prototype.show= function(){
	return 'Hash : '+this.hash+' Requested : '+ this.requested + ' Requester : '+this.requester+' Timestamp : '+this.timestamp+' Action : '+ this.action+' Token : '+this.token.show();
};
TransactionRequest.prototype.new= function(requested,requester,action,token){

    this.requested = requested;
    this.requester = requester;
    this.timestamp = new Date().valueOf();
   	this.action = action;
	this.token = token;

	if(this.token != null){
		var header = {
		requested : this.requested,
	    requester : this.requester,
	    timestamp : this.timestamp,
	   	action : this.action ,
	   	token : this.token.hash 
    	};	
	}else{
		var header = {
		requested : this.requested,
	    requester : this.requester,
	    timestamp : this.timestamp,
	   	action : this.action ,
	   	};
	}

	
    
	var hash = crypto.createHmac('sha256', 'Transaction Request')
                        .update( JSON.stringify(header) )
                        .digest('hex');

	this.hash =  hash;

	return this.hash;
};

TransactionRequest.prototype.verify= function(hash,requested,requester,action,timestamp,token){

	if(token != null){
		var header = {
		requested : requested,
	    requester : requester,
	    timestamp : timestamp,
	   	action : action ,
	   	token : token.hash 
    	};	
	}else{
		var header = {
		requested : requested,
	    requester : requester,
	    timestamp : timestamp,
	   	action : action ,
	   	};
	}

	var hashValid = crypto.createHmac('sha256', 'Transaction Request')
                        .update( JSON.stringify(header) )
                        .digest('hex');

	if(hashValid == hash) return true;
	else return false;
};

module.exports = TransactionRequest;