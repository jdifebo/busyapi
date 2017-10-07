module.exports = function(app){
    app.post('/api/usages', function(req, res){

        // We need to make sure to reply to the correct response once we get
        // our message from the master process, so we store all pending responses
        // with unique keys.  We send that key as part of our message to the
        // master process, and when it is complete with its work, it returns
        // that same key so we know which response to complete.
        var responseId = app.localCount;
        app.localCount++;
        app.pendingResponses[responseId] = res;

        process.send({id: responseId, body: req.body});
    });

    app.localCount = 0;
    app.pendingResponses = {};
    
    process.on('message', function(msg) {
      console.log('Worker ' + process.pid + ' received message from master.', msg);
      app.pendingResponses[msg.id].status(201).json({'id':msg.count});
      delete app.pendingResponses[msg.id]
    });
}
