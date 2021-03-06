const zmq = require("zeromq");
const { Client } = require('@elastic/elasticsearch')
const mappings = require("./mappings");

const DEBUG = false;
const CLEAR_AT_START = false;

const sock = zmq.socket("sub");
const client = new Client({ node: 'http://elasticsearch:9200',  })

const subscribedChannels = ["sn", "tx", "rstat", "mctn", "lmi", "lmsi", "lmhs"];
let bulk = [];
let tempBulk = [];
let bulkInProgress = false;
const MAX_BULK = 100;

sock.connect('tcp://iota.ormos.online:5556');
subscribedChannels.forEach((c) => sock.subscribe(c));

async function handleMessage(msg) {
    const data = msg.toString().split(' ');

    if (!subscribedChannels.includes(data[0])) {
        return;
    }

    let dataObject;
    switch(data[0]) {
        case "sn":
            dataObject = {
                milestoneIndex: data[1],
                transaction: data[2],
                address: data[3],
                trunkTransaction: data[4],
                branchTransaction: data[5],
                bundle: data[6]
            };
            break;
        case "tx":
            dataObject = {
                hash: data[1],
                address: data[2],
                value: parseInt(data[3] || "0"),
                obsoleteTag: data[4],
                transactionTimestamp: parseInt(data[5]) * 1000,
                currentIndex: parseInt(data[6] || "0"),
                lastIndex: parseInt(data[7] || "0"),
                bundle: data[8],
                trunkTransaction: data[9],
                branchTransaction: data[10],
                received: parseInt(data[11] || "0"),
                tag: data[12]
            };
            break;
        case "rstat":
            dataObject = {
                tipTxToProcess: parseInt(data[1]),
                tipTxToBroadcast: parseInt(data[2]),
                tipTxToRequest: parseInt(data[3]),
                tipTxToReply: parseInt(data[4]),
                storedTx: parseInt(data[5])
            };
            break;
        case "mctn":
            dataObject = {
                numTransactions: parseInt(data[1])
            };
            break;
        case "lmi":
            dataObject = {
                prevMIndex: parseInt(data[1]),
                latestMIndex: parseInt(data[2])
            };
            break;
        case "lmsi":
            dataObject = {
                prevSSMIndex: parseInt(data[1]),
                latestSSMIndex: parseInt(data[2])
            };
            break;
        case "lmhs":
            dataObject = {
                hash: data[1]
            };
            break;
    }

    if (dataObject) {
        dataObject.timestamp = Date.now();
    }

    if (!DEBUG && dataObject) {
        try {
            (bulkInProgress ? tempBulk : bulk).push(
                { index: { _index: "iota_" + data[0], _type: "_doc" } },
                dataObject
            );
            if (!bulkInProgress && bulk.length >= MAX_BULK) {
                bulkInProgress = true;
                await client.bulk({
                    body: bulk
                });
                bulk = tempBulk;
                tempBulk = [];
                bulkInProgress = false;
            }
        } catch (err) {
            console.log(err);
            if (err && err.body && err.body.error) {
                console.log(err.body.error);
            }
            bulkInProgress = false;
        }
    } else {
        console.log(data[0], dataObject);
    }

};

function sleep(ms) {
    return new Promise((res) => {
        setTimeout(res, ms);
    });
}

if (!DEBUG) {
    (async () => {

        await sleep(30000);

        while (!(await client.ping())) {
            await sleep(5000);
        }

        if (CLEAR_AT_START) {
            console.log("Clearing all iota indices");
            for (const c of subscribedChannels) {
                const index = "iota_" + c;
                if (await client.indices.exists({ index })) {
                    try {
                        await client.indices.delete({ index });
                    } catch (err) {
                        console.warn("Failed to delete index " + index);
                    }
                }
                await client.indices.create({ index });
                const m = mappings[c];
                m.timestamp = { type: "date" };
                await client.indices.putMapping({ index, type: "_doc", body: { properties: m }});
            }
        }

        sock.on('message', handleMessage);

    })();
} else {
    sock.on('message', handleMessage);
}
