/**
 *
 * Transaction type config
 *
 */

'use strict';

var transaction = require('./transaction');

function TransactionConfig(transaction,TransactionConfig) {
	if (typeof TransactionConfig === 'undefined') {
		TransactionConfig = {};
	}
	
    this.transaction = TransactionConfig.transaction;
   	this.parameterName = TransactionConfig.parameterName;
   	this.parameterValue= TransactionConfig.parameterValue;
   	this.token = TransactionConfig.token;

}
TransactionConfig.prototype.show= function(){
	return this.transaction.show()+' Parameter Name '+ this.parameterName +'  Parameter Value : '+this.parameterValue+' Token : '+ this.token.show();
};

TransactionConfig.prototype.new= function(transaction,parameterName,parameterValue,token){
	this.transaction = transaction;
	this.parameterName = parameterName;
	this.parameterValue = parameterValue;
	this.token = token;
};

module.exports = TransactionConfig;
