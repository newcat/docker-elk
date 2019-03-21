const zmq = require("zeromq");
const sock = zmq.socket("sub");

const DEBUG = false;
const CLEAR_AT_START = true;

const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://elasticsearch:9200',  })

const subscribedChannels = ["sn", "tx", "rstat", "mctn", "lmi", "lmsi", "lmhs"];

sock.connect('tcp://iota.ormos.online:5556');
subscribedChannels.forEach((c) => sock.subscribe(c));

function handleMessage(msg) {
    const data = msg.toString().split(' ');

    let dataObject;
    switch(data[0]) {
        case "tx":
            dataObject = {
                hash: data[1],
                address: data[2],
                value: parseInt(data[3] || "0"),
                obsoleteTag: data[4],
                transactionTimestamp: new Date(parseInt(data[5]) * 1000),
                currentIndex: parseInt(data[6] || "0"),
                lastIndex: parseInt(data[7] || "0"),
                bundle: data[8],
                trunkTransaction: data[9],
                branchTransaction: data[10],
                received: new Date(parseInt(data[11] || "0")),
                tag: data[12]
            };
            break;
    }

    if (dataObject) {
        dataObject.timestamp = new Date();
    }

    if (data[0] === "tx") {
        if (!DEBUG) {
            client.index({
                index: "iota_" + data[0],
                id: data[1],
                body: dataObject
            });
        } else {
            console.log(dataObject);
        }
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
            if (await client.indices.exists({ index: "iota_" + c })) {
                await client.indices.delete({ index: "iota_" + c });
            }
        }

        for (const c of subscribedChannels) {
            if (!(await client.indices.exists({ index: "iota_" + c }))) {
                console.log("Creating index iota_" + c);
                await client.indices.create({ index: "iota_" + c });
            }
        }

        sock.on('message', handleMessage);

    })();
} else {
    sock.on('message', handleMessage);
}
