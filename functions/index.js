import { graphql, buildSchema } from "graphql";

const schema = buildSchema(`
  type Query {
    hello: String
  }
`);

const root = {
  hello: () => "Hello from Cloudflare Worker + GraphQL"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/graphql") {
      const { query } = await request.json();
      const result = await graphql({ schema, source: query, rootValue: root });
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Use /graphql with POST request");
  }
};
