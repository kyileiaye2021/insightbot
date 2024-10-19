from flask import Flask, request, jsonify 
from flask_cors import CORS 
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import os
from pinecone import Pinecone, ServerlessSpec
import openai
import PyPDF2

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# load environment variables
load_dotenv(dotenv_path='.env.local')

# initialize pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

# Create Pinecone index if not exists
if "rag" not in pc.list_indexes().names():
    pc.create_index(
        name="rag",
        dimension=1536,
        metric="cosine",
        spec=ServerlessSpec(cloud='aws', region="us-east-1")
    )

index = pc.Index("rag")

# Set openAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

# Func to create embeddings
def create_embedding(text):
    response = openai.Embedding.create(input=text, model='text-embedding-ada-002')
    return response['data'][0]['embedding']

# func to extract text from a PDF
def extract_text_from_pdf(pdf_file):
    reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    # extract text from each page
    for page_num in range(len(reader.pages)):
        page = reader.pages[page_num]
        text += page.extract_text()
        
    return text

# Route to handle file uploaad and embedding creation
@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        filename = secure_filename(file.filename)
        
        # check if the uploaded file is a PDF
        if not filename.endswith('.pdf'):
            return jsonify({"error": "Only PDF files are allowed"}), 400
        
        # Extract text from the PDF file
        file_text = extract_text_from_pdf(file)
        
        # Generate embeddin for the extracted text
        embedding = create_embedding(file_text)
        
        # Store the embedding in Pinecone
        index.upsert(vectors=[
            {'id': filename, "values":embedding, "metadata": {"filename": filename, "text": file_text}}
        ])
        
        return jsonify({'message': f'File {filename} uploaded and embedding stored in Pinecone'}), 200
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
# for handling user queries
@app.route('/chat', methods=['POST'])
def chat():
    user_question = request.json.get('question')
    if not user_question:
        return jsonify({"error": "No question provided"}), 400
    
    # Generate an embedding for the user's question
    question_embedding = create_embedding(user_question)
    
    # Query pinecone for the most relevant data
    query_response = index.query(
        vector=question_embedding,
        top_k=5,  # Retrieve top 5 relevant matches
        include_metadata=True
    )
    
    # Construct a context from the most relevant matches
    context = "\n".join([match['metadata']['text'] for match in query_response['matches']])
    
    # generate a response using Openai
    response = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Context: {context}\nQuestion: {user_question}"}
        ],
        max_tokens=150
    )
    
    return  jsonify({"answer": response['choices'][0]['message']['content']}), 200

if __name__ == "__main__":
    app.run(debug=True)