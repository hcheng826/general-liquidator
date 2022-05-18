// Use this code snippet in your app.
// If you need more information about configurations or implementing the sample code, visit the AWS docs:
// https://aws.amazon.com/developers/getting-started/nodejs/

import { spawn } from "child_process";

// Load the AWS SDK
let AWS = require('aws-sdk'),
    region = "ap-northeast-1",
    secretName = "arn:aws:secretsmanager:ap-northeast-1:422440744886:secret:hung_test_private_key-E2d4qP",
    secret: string,
    decodedBinarySecret: string;

// Create a Secrets Manager client
const client = new AWS.SecretsManager({
    region: region,
    accessKeyId: 'AKIAWEW3OG63MTQTCPUU',
    secretAccessKey: 'I73DKuw8afJG1IQnhrsqiOCFvGewqS2xulQTPW60'
});

// In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
// See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
// We rethrow the exception by default.

client.getSecretValue({SecretId: secretName}, function(err: any, data: any) {
    if (err) {
        if (err.code === 'DecryptionFailureException')
            // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InternalServiceErrorException')
            // An error occurred on the server side.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InvalidParameterException')
            // You provided an invalid value for a parameter.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InvalidRequestException')
            // You provided a parameter value that is not valid for the current state of the resource.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'ResourceNotFoundException')
            // We can't find the resource that you asked for.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
    }
    else {
        // Decrypts secret using the associated KMS key.
        // Depending on whether the secret is a string or binary, one of these fields will be populated.
        if ('SecretString' in data) {
            secret = data.SecretString;
        } else {
            let buff = new Buffer(data.SecretBinary, 'base64');
            decodedBinarySecret = buff.toString('ascii');
        }
    }

    // Your code goes here.
    const privateKey = JSON.parse(secret)["HUNG_TEST_PRIVATE_KEY"];
    const spawnProcess = spawn(`PRIVATE_KEY=${privateKey} npx hardhat run scripts/yeti/index.ts --network avalanche`);
    spawnProcess.stdout.on('data', (data) => {
        console.log(data);
    })
});
