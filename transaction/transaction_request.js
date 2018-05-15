/**
 *
 * Transaction type request
 *
 */

'use strict';

var transaction = require('./transaction');

function TransactionRequest(transaction,TransactionRequest) {
	if (typeof TransactionRequest === 'undefined') {
		TransactionRequest = {};
	}
	
    this.transaction = TransactionRequest.transaction;
   	this.action = TransactionRequest.action;

}

TransactionRequest.prototype.show= function(){
	return this.transaction.show()+' Action : '+ this.action;
};

TransactionRequest.prototype.new= function(transaction,action,token){
	this.transaction = transaction;
	this.action = action;
};


module.exports = TransactionRequest;
