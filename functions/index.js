import { graphql, buildSchema } from "graphql";

// 创建 GraphQL schema 和 resolver
const schema = buildSchema(`
   input MessageInput {
    role: String!
    content: String!
  }
  type Query {
    hello: String
    chat(model: String!, messages: [MessageInput!]!): String

    }
`);
// const root = {
//   hello: () => "Hello from Worker!"
// };

const root= (env) => ({
  
  chat: async ({ model, messages }) => {
    try {
      console.log(JSON.stringify(env),100000)
     
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
        }),
      });

      const text = await res.text();
      console.log('📤 OpenAI response:', text);

      if (!res.ok) {
        return `❌ OpenAI API 请求失败: ${res.status} - ${text}`;
      }

      const json = JSON.parse(text);
      return json.choices?.[0]?.message?.content || '⚠️ OpenAI 无返回结果';

    } catch (err) {
      console.error('🔥 OpenAI 请求异常:', err);
      return '❗ OpenAI 请求异常，请检查网络或 API Key';
    }
  }
})

// CORS 允许所有来源（你也可以改为指定的 origin）
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request,env) {
    const url = new URL(request.url);

    // 处理预检 OPTIONS 请求
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    // 处理 GraphQL POST 请求
    if (url.pathname === "/graphql" && request.method === "POST") {
      const { query,variables} = await request.json();
      const result = await graphql({
        schema,
        source: query,
        rootValue: root(env),
          variableValues: variables  // 👈 这里必须加上

      });

      return new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS
        }
      });
    }

    // 默认返回
    return new Response("Not found", {
      status: 404,
      headers: CORS_HEADERS
    });
  }
};
