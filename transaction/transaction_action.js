/**
 *
 * Transaction type action
 *
 */

'use strict';

var transaction = require('./transaction');


function TransactionAction(transaction,transactionAction) {
	if (typeof transactionAction === 'undefined') {
		transactionAction = {};
	}
	
    this.transaction = transactionAction.transaction ;
   	this.action = transactionAction.action ;
   	this.token = transactionAction.token ;
}

TransactionAction.prototype.show= function(){
	return this.transaction.show()+' Action : '+ this.action+' Token : '+this.token.show();
};
TransactionAction.prototype.new= function(transaction,action,token){
	this.transaction = transaction;
	this.action = action;
	this.token = token;
};

module.exports = TransactionAction;