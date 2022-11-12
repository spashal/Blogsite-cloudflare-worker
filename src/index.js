import * as Realm from 'realm-web';
import * as utils from './utils';
var token = "Ofjgf0isHiLdCTaA8KPdbyOTRsdzpLMQDv28xsIq60eQ3mSSUCHqUMIRrs2f9Hsl";
let App;
const ObjectId = Realm.BSON.ObjectID;
// Define the Worker logic
const worker = {
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
        const collection = client.db('blogsite').collection('articles');
        try {
            if (method === 'GET') {
                if (path == "/blogsite/allArticles") {
                    // to get all the articles at once, no params required
                    var responseData = {
                        data: await collection.find({})
                    };
                    return utils.reply(responseData);
                }
                else if (path == "/blogsite/getBlogArticle") {
                    // to get a single blog article, param 'title' needed in request
                    var responseArticle = {
                        data: await collection.findOne({
                            title: articleTitle,
                        })
                    };
                    return utils.reply(responseArticle);
                }
                return utils.reply("What you're looking for doesn't really exist");
            }
            // unknown method
            return utils.toError('Method not allowed.', 405);
        }
        catch (err) {
            const msg = err.message || 'Error with query.';
            return utils.toError(msg, 500);
        }
    }
};
// Export for discoverability
export default worker;
