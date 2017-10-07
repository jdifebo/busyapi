// Include the cluster module
var cluster = require('cluster');

// Move our in-memory data store here
// so that the master process controls it
var usages = [];

// Code to run if we're in the master process
if (cluster.isMaster) {
    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;
    console.log("Creating ", cpuCount - 1, " worker processes");

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount - 1; i += 1) {
        let worker = cluster.fork();

        worker.on('message', function (usage) {
            usages.push(usage.body);
            worker.send({id: usage.id, count: usages.length});
        });
    }

    // Code to run if we're in a worker process
} else {
    require("./bin/www");
}