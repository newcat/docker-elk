const sn = {
    milestoneIndex: { type: "long" },
    transaction: { type: "keyword" },
    address: { type: "keyword" },
    trunkTransaction: { type: "keyword" },
    branchTransaction: { type: "keyword" },
    bundle: { type: "keyword" }
};

const tx = {
    hash: { type: "keyword" },
    address: { type: "keyword" },
    value: { type: "long" },
    obsoleteTag: { type: "keyword" },
    transactionTimestamp: { type: "date" },
    currentIndex: { type: "long" },
    lastIndex: { type: "long" },
    bundle: { type: "keyword" },
    trunkTransaction: { type: "keyword" },
    branchTransaction: { type: "keyword" },
    received: { type: "date" },
    tag: { type: "keyword" }
};

const rstat = {
    tipTxToProcess: { type: "long" },
    tipTxToBroadcast: { type: "long" },
    tipTxToRequest: { type: "long" },
    tipTxToReply: { type: "long" },
    storedTx: { type: "long" }
};

const mctn = {
    numTransactions: { type: "long" }
};

const lmi = {
    prevMIndex: { type: "long" },
    latestMIndex: { type: "long" }
};

const lmsi = {
    prevSSMIndex: { type: "long" },
    latestSSMIndex: { type: "long" }
};

const lmhs = {
    hash: { type: "keyword" }
};

module.exports = { sn, tx, rstat, mctn, lmi, lmsi, lmhs };
