const zmq = require("zeromq");
const sock = zmq.socket("sub");

const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

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
                transactionTimestamp: data[5],
                currentIndex: parseInt(data[6] || "0"),
                lastIndex: parseInt(data[7] || "0"),
                bundle: data[8],
                trunkTransaction: data[9],
                branchTransaction: data[10],
                received: parseInt(data[3] || "0"),
                tag: data[12]
            };
            break;
    }

    if (data[0] === "tx") {
        client.index({
            index: "iota_" + data[0],
            id: data[1],
            body: dataObject
        });
    }

});

(async () => {

    for (const c of subscribedChannels) {
        if (!(await client.indices.exists({ index: "iota_" + c }))) {
            await client.indices.create({ index: "iota_" + c });
        }
    }

    sock.on('message', handleMessage);

})();