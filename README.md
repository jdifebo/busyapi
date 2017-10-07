# busyapi
## Scaling to 1 million requests per minute

This is a modification of busyapi that creates multiple processes in order to scale well.

## Code Changes

After doing some research, I realize that the Cluster API will help me reach my goals of scaling to 1 million requests per minute.  So I make a new file called `cluster.js` that spins up multiple processes where each worker process creates its own version of the application without any additional modification (yet).  The good news is that the application runs!  The bad news is that the server isn't responding with the correct usageId because each process has its own local count.

The solution to this is to have some centralized location where all of the usages are stored.  This could be something like a Redis instance, but that seemed like overkill for this project.  Instead, we will store all usages in the master process, and communicate between the master process and child processes using messaging.  When a user makes an API call, the child process will receive the request, and it will then send some information to the master process.  The master process stores the body of the request, and then replies to the child process with the correct usageId.  Once the child process hears back, it can complete the response to the user.

### Some Bugs

Originally the child process kept track of the most recent response object.  Once it heard back from the master process, it would then get that response and send it out.  This worked alright when API calls were spread out, but there were errors when requests were too close together.  If a second request comes in before the first request is complete, I lost track of the correct response object, and instead tried to use the second response object twice.  I was getting the error `Can't set headers after they are sent`, oops!  The solution to this was to keep track of all of the pending response objects, and inside of the message sent to and from the master process, note which response object should be sent out for that message. This solution worked, and the program now works as expected!

## Testing

For testing, I found the useful utility `ab` that comes with Apache installations.  I could quickly and easily launch requests just by typing `ab -c200 -t60 -n1000000 -p data.json http://localhost:3000/api/usages`, and it will tell me how many requests got completed.  This shouldn't be used as the only form of load testing in an application, but it'll work for my purposes.

Originally I tried testing on my laptop.  The code ran correctly, but not very quickly.  I was getting well under 100,000 requests in a minute.  But thankfully my laptop is nothing like an actual production server.  To get a more accurate test, I used some of my free trial on Google Cloud.  I opened up my console and spun up a small machine to start.  It was faster than my laptop, but it still wasn't very fast because I picked a machine with only 1 CPU because I wasn't thinking.  So I quickly move on to a machine with 8 CPUs and I'm able to complete 481,567 requests in a minute!  I tried using a 32 CPU machine, but apparently that exceeds my CPU quota, so I had to stick with a 16 CPU machine instead.  On that machine, I finished 724,086 requests.  Not quite a million, but pretty close.  And scaling to an even bigger machine probably would have brought me past the 1 million mark.

## Taking it Further

If we needed to scale even more, there are a couple of approaches we could take.  Google offers machines with 64 cores, so we could take the current approach a little bit further just by getting a bigger machine.  Beyond that though, and we would need to expand to multiple machines and have a load balancer distribute the workload.  If we went with that route, we wouldn't be able to use the process messaging technique used here, and instead we'd need some data source that is external to all of the node instances.  We would probably have some type of database already though if this was a real production application.
