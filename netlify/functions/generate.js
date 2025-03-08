import fetch from 'node-fetch';export async function handler(event, context) {  // Only allow POST requests  if (event.httpMethod !== 'POST') {    return {      statusCode: 405,      body: JSON.stringify({ error: 'Method Not Allowed' })    };  }  try {    const body = JSON.parse(event.body);    const { prompt } = body;        // Set your Hugging Face API token (from environment variables)    const HF_API_TOKEN = process.env.HF_API_TOKEN || "";        if (!HF_API_TOKEN) {      return {        statusCode: 500,        body: JSON.stringify({           error: "Hugging Face API token not configured. Please set HF_API_TOKEN in Netlify environment variables."        })      };    }        // You can choose different models - this is a Mistral model hosted on Hugging Face    const MODEL_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";        // Prepare the request for Hugging Face API    const payload = {      inputs: prompt,      parameters: {        max_new_tokens: 1000,        temperature: 0.7,        return_full_text: false      }    };        console.log(`Sending request to Hugging Face API`);        const response = await fetch(MODEL_URL, {      method: 'POST',      headers: {        'Authorization': `Bearer ${HF_API_TOKEN}`,        'Content-Type': 'application/json'      },      body: JSON.stringify(payload)    });        if (!response.ok) {      const errorText = await response.text();      console.error(`Hugging Face API error (${response.status}):`, errorText);      return {        statusCode: response.status,        body: JSON.stringify({           error: `Error from Hugging Face API: ${errorText}`         })      };    }        const data = await response.json();        // Extract the generated text - Hugging Face API returns different format    let generatedText = '';    if (Array.isArray(data)) {      generatedText = data[0].generated_text || '';    } else if (data.generated_text) {      generatedText = data.generated_text;    } else {      // Fallback in case the response format is different      generatedText = JSON.stringify(data);    }        return {      statusCode: 200,      headers: {        'Content-Type': 'application/json'      },      body: JSON.stringify({ response: generatedText })    };      } catch (error) {    console.error('Error in function handler:', error);    return {      statusCode: 500,      body: JSON.stringify({ error: error.message })    };  }}