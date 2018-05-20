/**
 *
 * Transaction
 *
 */

'use strict';

var crypto = require('crypto');
var merkle = require('merkle');
var merkleRoot = merkle('sha256');
var shortid = require('shortid');

function Token(token) {
	if (typeof token=== 'undefined') {
		token = {};
	}
	
    this.hash = token.hash ;
    this.action = token.action;
    this.validity = token.validity;
    this.timestamp = token.timestamp;
}

Token.prototype.show= function(){
	return ' Hash : ' + this.hash + ' Action : ' + this.action + ' Validity : ' + this.validity + ' Timestamp : ' + this.timestamp ;
};

Token.prototype.new= function(action,validity,timestamp){

	this.action = action;
	this.validity = validity;
	this.timestamp = new Date().valueOf();

	var header = {
		timestamp : this.timestamp,
	    validity : this.validity,
	   	action : this.action 
    };
    
	var hash = crypto.createHmac('sha256', 'Transaction Request')
                        .update( JSON.stringify(header) )
                        .digest('hex');

	this.hash = hash;
};

Token.prototype.verify= function(hash,action,validity,timestamp){
	var header = {
		timestamp : timestamp,
	    validity : validity,
	   	action : action 
    };
    
	var hashValid = crypto.createHmac('sha256', 'Transaction Request')
                        .update( JSON.stringify(header) )
                        .digest('hex');

    if(hash == hashValid) return true;
    else return false;
}

module.exports = Token;
