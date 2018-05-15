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
	
    this.id = token.id ;
    this.action = token.action;
    this.validity = token.validity;
    this.timestamp = token.timestamp;
}

Token.prototype.show= function(){
	return ' ID : ' + this.id + ' Action : ' + this.action + ' Validity : ' + this.validity + ' Timestamp : ' + this.timestamp ;
};

Token.prototype.new= function(action,validity){
	this.id = shortid.generate();
	this.action = action
	this.validity = validity
	this.timestamp =new Date();
};

module.exports = Token;
