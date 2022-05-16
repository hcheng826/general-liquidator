import axios from 'axios';
import { AVAX_RPC_URL } from '../const';

let requestId = 0;

function scratchMempoolTx() {
    const reqBody = {
        jsonrpc:"2.0",
        method:"txpool_content",
        id: requestId++
    }

    axios
        .post(AVAX_RPC_URL, reqBody)
        .then(res => {
            console.log(`statusCode: ${res.status}`);
            console.log(JSON.stringify(res.data, null, 2));
        })
        .catch(error => {
            console.error(error);
        });
}

setInterval(scratchMempoolTx, 100)
