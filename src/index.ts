import * as Realm from 'realm-web';
import * as utils from './utils';
// import * as json from 'json';

var token = "Ofjgf0isHiLdCTaA8KPdbyOTRsdzpLMQDv28xsIq60eQ3mSSUCHqUMIRrs2f9Hsl";

// The Worker's environment bindings. See `wrangler.toml` file.
interface Bindings {
    // MongoDB Realm Application ID
    REALM_APPID: string;
}

// Define type alias; available via `realm-web`
type Document = globalThis.Realm.Services.MongoDB.Document;

// Declare the interface for a "todos" document
interface Todo extends Document {
    title: String,
    text: String,
    dateCreatedStamp: Number,
    dateCreatedString: String,
    desc: String,
}

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Max-Age": "86400",
}
function handleOptions (request: Request) {
    // Make sure the necessary headers are present
    // for this to be a valid pre-flight request
    let headers = request.headers
    if (
            headers.get("Origin") !== null &&
            headers.get("Access-Control-Request-Method") !== null &&
            headers.get("Access-Control-Request-Headers") !== null
    ) {
            // Handle CORS pre-flight request.
            // If you want to check or reject the requested method + headers
            // you can do that here.
            let respHeaders = {
                    ...corsHeaders,
                    // Allow all future content Request headers to go back to browser
                    // such as Authorization (Bearer) or X-Client-Name-Version
                    "Access-Control-Allow-Headers": "*",
            }
            return new Response(null, {
                    headers: respHeaders,
            })
    }
    else {
            // Handle standard OPTIONS request.
            // If you want to allow other HTTP Methods, you can do that here.
            return new Response(null, {
                    headers: {
                            Allow: "GET, HEAD, POST, OPTIONS",
                    },
            })
    }
}

let App: Realm.App;
const ObjectId = Realm.BSON.ObjectID;

// Define the Worker logic
const worker: ExportedHandler<Bindings> = {
    async fetch(req, env) {
        const url = new URL(req.url);
        App = App || new Realm.App(env.REALM_APPID);
        const method = req.method;
        // req.
        const path = url.pathname.replace(/[/]$/, '');
        const articleTitle = url.searchParams.get('title') || "didn't find";

        const credentials = Realm.Credentials.apiKey(token);
        var user = await App.logIn(credentials);
        var client = user.mongoClient('mongodb-atlas');

        // Grab a reference to the "cloudflare.todos" collection
        const collection = client.db('blogsite').collection<Todo>('articles');
        const users = client.db('blogsite').collection<Todo>('userdetails');
        const currentlyworking = client.db('blogsite').collection<Todo>('currentlyworking');
        
        try {
            if (method === 'GET') {
                if (path === "/blogsite/allArticles") {
                    // to get all the articles at once, no params required
                    var responseData = {
                        data: await collection.find({})
                    };
                    return utils.reply(
                        responseData
                    );
                }
                else if(path === "/blogsite/getBlogArticle") {
                    // to get a single blog article, param 'title' needed in request
                    var responseArticle = {
                        data: await collection.findOne({
                                        title: articleTitle,
                                    })
                    };
                    return utils.reply(
                        responseArticle
                    );
                }
                else if(path === "/blogsite/visitorsCount") {
                    var visitorsCount = {
                        visitors: await users.count({})
                    };
                    return utils.reply(
                        visitorsCount
                    );
                }
                else if(path === "/blogsite/getCurrentlyWorking") {
                    var working = {
                        currentlyWorking: (await currentlyworking.find({}))[await currentlyworking.count({})-1]
                    };
                // console.log(working.currentlyWorking)
                    return utils.reply(
                        working
                    );
                }
                // else if(path === "/blogsite/putUserDetails"){
                //     // this req.json() below has been troubling me here and there. shouldn't be executed when json isn't present ig.  
                //     console.log("hahahahah");
                //     await req.json().then(async (userDetails) => {
                //         console.log("ohh", userDetails);
                //         var reply = {
                //             reply: await users.insertOne({
                //                 // name: userDetails.name,
                //                 clientLocation: userDetails.location,
                //                 browser: userDetails.browsername,
                //                 browser_version: userDetails.browserversion
                //             })
                //         };
                //         return utils.reply(
                //             reply
                //         );
                //     });
                // }
                // else{
                //     return utils.reply("What you're looking for doesn't really exist");
                // }
            }
            else if(method === "POST") {
                if(path == "/blogsite/putUserDetails"){
                    // this req.json() below has been troubling me here and there. shouldn't be executed when json isn't present ig.  
                    var userDetails = await req.json();
                    var reply = {
                        reply: await users.insertOne({
                            clientLocation: userDetails.location,
                            browser: userDetails.browsername,
                            browser_version: userDetails.browserversion
                        })
                    };
                    return utils.reply(
                        reply
                    );
                }
            }
            else if(method==="OPTIONS") {
                console.log("hey there is something here");
                return handleOptions(req);
            }
            return utils.toError('Error haha', 403);
        } catch (err) {
            const msg = (err as Error).message || 'Error with query.';
            return utils.toError(msg, 500);
        }
    }
}

// Export for discoverability
export default worker;
