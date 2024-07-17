const TronWeb = require("tronweb")
const express = require("express");

app = express();
port = 8000;


const tronWeb = new TronWeb({
    fullHost: 'https://api.nileex.io',
    solidityNode: 'https://api.nileex.io',
    eventServer: 'https://api.nileex.io',
    privateKey: '0d97f38c4366bd66000ec27d3919013d462463f79e425654110070fe84c74325' //pk of the payout address
});

const tokenAddress = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'; //USDT CA

const sendToken = async (toAddress, amount) => {
    const options = {
        feeLimit: 100000000,
        callValue: 0,
        shouldPollResponse: false
    };
    
    const parameter = [ { type: 'address', value: toAddress }, { type: 'uint256', value: amount * 1e6 } ] 
    

    try {
        const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
            tokenAddress,
            'transfer(address,uint256)',
            options,
            parameter
        );
        
        const signedTransaction = await tronWeb.trx.sign(transaction.transaction);
        const payoutReceipt = await tronWeb.trx.sendRawTransaction(signedTransaction);
        
        console.log(`${amount} USD sent to ${toAddress}`, payoutReceipt);
        return { success: true, receipt: payoutReceipt };
    } catch (error) {
        console.error(`Error sending to ${toAddress}:`, error);
        return { success: false, error: error.message };

    }
};

app.get('/singlePayout', async (req,res) => {
    // const sendPromises = [];

    const userAddress = req.query.userAddress; 
    const amount = req.query.amount;



    if (tronWeb.isAddress(userAddress) && !isNaN(amount)) {

      const payoutResult = await sendToken(userAddress, amount);
      res.json(payoutResult);

    } else {
        console.error(`invalid data - Address: ${userAddress}, Amount: ${amount}`);
        res.json({ error: 'invalid address or amount' });
    }

    // res.send
}) 

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
