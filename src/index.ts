import * as Realm from 'realm-web';
import * as utils from './utils';


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
        const path = url.pathname.replace(/[/]$/, '');
        const articleTitle = url.searchParams.get('title') || "didn't find";

        const credentials = Realm.Credentials.apiKey(token);
        var user = await App.logIn(credentials);
        var client = user.mongoClient('mongodb-atlas');

        // Grab a reference to the "cloudflare.todos" collection
        const collection = client.db('blogsite').collection<Todo>('articles');

        try {
            if (method === 'GET') {
                if (path == "/blogsite/allArticles") {
                    // to get all the articles at once, no params required
                    return utils.reply(
                        await collection.find({})
                    );
                }
                else if(path == "/blogsite/getBlogArticle") {
                    // to get a single blog article, param 'title' needed in request
                    return utils.reply(
                        await collection.findOne({
                            title: articleTitle,
                        })
                    );
                }

                return utils.reply("What you're looking for doesn't really exist");
            }

            // unknown method
            return utils.toError('Method not allowed.', 405);
        } catch (err) {
            const msg = (err as Error).message || 'Error with query.';
            return utils.toError(msg, 500);
        }
    }
}

// Export for discoverability
export default worker;
