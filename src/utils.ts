var myHeaders = new Headers({
    'Access-Control-Allow-Origin': '*',
    // 'Access-Control-Allow-Methods': "POST,GET,OPTIONS, PUT, DELETE"
    // 'Access-Control-Allow-Origin': 'https://blog-site.palash-sharma.workers.dev/'
});

export function toJSON(data: unknown, status = 200): Response {
    let body = JSON.stringify(data, null, 2);
    let headers = {
        'content-type': "*",
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': "POST,GET,OPTIONS,PUT,DELETE",
    };
    return new Response(body, {headers, status});
}

export function toError(error: string | unknown, status = 400): Response {
    return toJSON({error}, status);
}

export function reply(output: any): Response {
    if (output != null) return toJSON(output, 200);
    return toError('Error with query', 500);
}
