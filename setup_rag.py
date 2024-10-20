from flask import Flask, request, jsonify 
from flask_cors import CORS 
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import os
from pinecone import Pinecone, ServerlessSpec
import openai
import PyPDF2
import tiktoken

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
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.embeddings.create(input=text, model='text-embedding-3-small')
    return response.data[0].embedding

# def create_embedding(text):
#     response = openai.Embedding.create(input=text, model='text-embedding-ada-002')
#     return response['data'][0]['embedding']

# func to split text into chunks
def split_text(text, max_tokens=800):
    tokenizer = tiktoken.get_encoding('p50k_base') # This encoding is suitable for GPT-3.5 models
    tokens = tokenizer.encode(text)
    
    chunks = []
    for i in range(0, len(tokens), max_tokens):
        chunk = tokens[i:i+max_tokens]
        chunks.append(tokenizer.decode(chunk))
    return chunks

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
    
        # Split text into smaller chunks
        chunks = split_text(file_text)
        
        # Generate embeddin for the extracted text
        #embedding = create_embedding(chunks)
        
        # generate embeddings for each chunk
        embeddings = []
        for chunk in chunks:
            embedding = create_embedding(chunk)
            embeddings.append({
                "id": f"{filename}_chunk_{chunks.index(chunk)}",
                "values": embedding,
                "metadata": {"filename": filename, 'text':chunk}
            })
        
        # Store the embedding in Pinecone
        index.upsert(vectors=embeddings)
        
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
    
    # generate a response using OpenAI
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model='gpt-4o-mini',
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Context: {context}\nQuestion: {user_question}"}
        ],
        max_tokens=150
    )
    
    return jsonify({"answer": response.choices[0].message.content}), 200

# new route
@app.route('/goaladvise', methods=['POST'])
def goal_advise():
    goal_statement = request.json.get('goal')
    if not goal_statement:
        return jsonify({"error": "No goal statement provided"}), 400
    
    # Sample context (you can edit this later)
    context = """
    Effective goal-setting involves creating SMART goals: Specific, Measurable, Achievable, Relevant, and Time-bound.
    Consider breaking larger goals into smaller, manageable tasks.
    Regular review and adjustment of goals is important for long-term success.
    ONLY provide advice on the goal if it is an ACADEMIC goal, related to Education, Career, or Personal Development.
    If it is not, please respond with "I am sorry, I can only provide advice on academic goals."
    """
    
    # Generate a response using OpenAI
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model='gpt-4o-mini',
        messages=[
            {"role": "system", "content": "You are a helpful assistant specializing in goal-setting and personal development."},
            {"role": "user", "content": f"Context: {context}\nGoal Statement: {goal_statement}\n Check and confirm whether the goal is SMART. Please provide advice on this goal. Be short and concise."}
        ],
        max_tokens=200
    )
    
    return jsonify({"advice": response.choices[0].message.content}), 200

if __name__ == "__main__":
    app.run(debug=True)