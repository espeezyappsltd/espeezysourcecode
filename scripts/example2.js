import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: ".process.env.local["OPENAI_TEST_API_KEY"]",
  targetModel: "gpt-5.4-mini",
});

const response = openai.responses.create({
  model: "gpt-5.4-mini",
  input: "write a haiku about ai",
  store: true,
});

response.then((result) => console.log(result.output_text));