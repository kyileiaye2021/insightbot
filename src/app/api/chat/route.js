// The API route encapsulates the core RAG functionality of the application.
// It combines vector search (via Pinecone) with natural language processing generation (via OpenAI)
// to provide relevant, context-aware responses to user queries about professors and classes.

import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

//define system prompt
const systemPrompt = `You are a rate my professor agent to help students find classes, that takes in user questions and answer them.
For every user question, the top 3 professor that matched the user questions are returned. Use them to answer the question if needed.`

//create the POST func
export async function POST(req) {
    const data = await req.json()

    //initialize pinecone and openai
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    })

    const index = pc.index('rag').namespace('ns1')
    const openai = new OpenAI()

    //create the user's question and create an embedding
    const text = data[data.length - 1].content
    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
    })

    //query pinecone
    //use the embedding to find similar professor review in Pinecone
    const results = await index.query(
        {
            topK: 5,
            includeMetadata: true,
            vector: embedding.data[0].embedding,
        }
    )

    //format the Pinecone results into readable string
    let resultString = ''
    results.matches.forEach((match) => {
        resultString += 
        `Returned Results:
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n`
    })

    //prepare the open ai request
    //combine the user's question with the Pinecone results
    const lastMessage = data[data.length - 1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1)

    //send request to open ai
    //create a chat completion request to openai
    const completion = await openai.chat.completions.create({
        messages: [
            { role:'system', content: systemPrompt },
            ...lastDataWithoutLastMessage,
            { role: 'user', content: lastMessageContent },
        ],
        model: 'gpt-3.5-turbo',
        stream: true,
    })

    //set up streaming response
    //create a readablestream to handle the streaming response
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()

            try {
                for await (const chunk of completion){
                    const content = chunk.choices[0]?.delta?.content

                    if (content) {
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }

            } catch (err) {
                controller.error(err)
            } finally {
                controller.close()
            }
        },
    })
    return new NextResponse(stream)
}