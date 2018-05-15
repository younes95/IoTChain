/**
 *
 * Transaction type config
 *
 */

'use strict';

var transaction = require('./transaction');

function TransactionInfo(transaction,TransactionInfo) {
	if (typeof TransactionInfo === 'undefined') {
		TransactionInfo = {};
	}
	
    this.transaction = TransactionInfo.transaction;
   	this.parameterValue= TransactionInfo.parameterValue;
   	this.token = TransactionInfo.token;

}

TransactionInfo.prototype.show= function(){
	return this.transaction.show()+'  Parameter Value : '+this.parameterValue+' Token : '+this.token.show();
};

TransactionInfo.prototype.new= function(transaction,parameterValue,token){
	this.transaction = transaction;
	this.parameterValue = parameterValue;
	this.token = token;
};


module.exports = TransactionInfo;
