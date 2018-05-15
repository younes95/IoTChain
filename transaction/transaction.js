/**
 *
 * Transaction
 *
 */

'use strict';

var shortid = require('shortid');

function Transaction(transaction) {
	if (typeof transaction === 'undefined') {
		transaction = {};
	}
	
    this.id = transaction.id ;
    this.requested = transaction.requested;
    this.requester = transaction.requester;
    this.timestamp = transaction.timestamp;
}

Transaction.prototype.show= function(){
	return 'ID : '+this.id+' Requested : '+ this.requested + ' Requester : '+this.requester+' Timestamp : '+this.timestamp;
};

Transaction.prototype.new= function(requested,requester){
	this.id = shortid.generate();
	this.requested = transaction.requested;
    this.requester = transaction.requester;
	this.timestamp =new Date();
};

module.exports = Transaction;
