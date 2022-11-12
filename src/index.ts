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
        
        try {
            if (method === 'GET') {
                if (path == "/blogsite/allArticles") {
                    // to get all the articles at once, no params required
                    var responseData = {
                        data: await collection.find({})
                    };
                    return utils.reply(
                        responseData
                    );
                }
                else if(path == "/blogsite/getBlogArticle") {
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

                
                return utils.reply("What you're looking for doesn't really exist");
            }

            else if(method === 'POST') {
                // this req.json() below has been troubling me here and there. shouldn't be executed when json isn't present ig.  
                var userDetails = await req.json();
                // console.log(req.headers.get("i"));
                return utils.reply(
                    await users.insertOne({
                        // name: userDetails.name,
                        clientIP: userDetails.ip,
                        browser: userDetails.browsername,
                        browser_version: userDetails.browserversion
                    })
                );
            }
            // unknown method
            return utils.toError('Error', 405);
        } catch (err) {
            const msg = (err as Error).message || 'Error with query.';
            return utils.toError(msg, 500);
        }
    }
}

// Export for discoverability
export default worker;
