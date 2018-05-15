This file show how to manipulate the transaction    

Call different module in the directory ``` ./transaction/ ```
```
    Transaction = require('./transaction/transaction');
    TransactionConfig = require('./transaction/transaction_config');
    TransactionRequest= require('./transaction/transaction_request');
    TransactionInfo = require('./transaction/transaction_info');
    TransactionAction = require('./transaction/transaction_action');
    Token = require('./transaction/token'); 
```

Instantiate the different types of Transaction and token
``` 
    var transaction = new Transaction();
    var transaction_config = new TransactionConfig();
    var transaction_request = new TransactionRequest();
    var transaction_info = new TransactionInfo();
    var transaction_action = new TransactionAction();
    var token = new Token();
    
```

Setting values to Token
```
    token.id = 23;
    token.action = 'ACCESS';
    token.validity = 3600;
    token.timestamp = new Date();
```

Setting values to transactions :

Transaction
```
    transaction.id = 1 ;
    transaction.requested = 'OIJSDQFOPK';
    transaction.requester = 'KOIJSOIJDI'; 
    transaction.timestamp = new Date();
```

Transaction type : Config
```
    transaction_config.transaction = transaction;
    transaction_config.parameterName = 'Parameter name';
    transaction_config.parameterValue = 'Parameter Value';
    transaction_config.token = token;
```

Transaction type Request
```
    transaction_request.transaction = transaction ;
    transaction_request.action = 'ACCESS' ;
```

Transaction type Info
```
    transaction_info.transaction = transaction ;
    transaction_info.parameterValue = 'Parameter Value';
    transaction_info.token = token;
```

Transaction type Action
```
    transaction_action.transaction = transaction ;
    transaction_action.action = 'ACCESS' ;
    transaction_action.token = token ;
```

Showing transactions
```
    console.log('Transaction Config : '+transaction_config.show());
    console.log('Transaction Action : '+transaction_action.show());
    console.log('Transaction Info : '+transaction_info.show());
    console.log('Transaction Request : '+transaction_request.show());
```