const TronWeb = require("tronweb")
const fs = require("fs");
const csv = require("csv-parser");
const express = require("express");

app = express();
port = 3001;


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
    
    const parameter = [{type: 'address', value: toAddress }, {type: 'uint256', value: amount * 1e6 } ] 
    

    try {
        const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
            tokenAddress,
            'transfer(address,uint256)',
            options,
            parameter
        );
        
        const signedTransaction = await tronWeb.trx.sign(transaction.transaction);
        const payoutReceipt = await tronWeb.trx.sendRawTransaction(signedTransaction);
        
        console.log(`Transaction sent to ${toAddress} with amount ${amount}:`, payoutReceipt);
    } catch (error) {
        console.error(`Error sending to ${toAddress}:`, error);
    }
};

app.get('/payout', (req,res) => {
    const sendPromises = [];

    fs.createReadStream('payout.csv').pipe(csv()).on('data', (row) => {
        const address = row.address;
        const amount = row.amount;
        
        if (tronWeb.isAddress(address) && !isNaN(amount)) {
            sendPromises.push(sendToken(address, amount));
        } else {
            console.error(`Invalid data - Address: ${address}, Amount: ${amount}`);
        }
    })
    .on('end', async () => {
        console.log('Payot csv processing...');
        await Promise.all(sendPromises);
        res.send("Payout completed")
    });
}) 

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
