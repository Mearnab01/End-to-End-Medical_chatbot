from flask import Flask, render_template, jsonify, request
from src.helper import load_embeddings
from langchain_pinecone import PineconeVectorStore
from langchain_groq import ChatGroq
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from src.prompt import system_prompt
import os

load_dotenv()

# Validate required env vars early so the error is obvious
PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

if not PINECONE_API_KEY:
    raise EnvironmentError("PINECONE_API_KEY is not set in .env")
if not GROQ_API_KEY:
    raise EnvironmentError("GROQ_API_KEY is not set in .env")

app = Flask(__name__)

# --- RAG Setup ---
embeddings = load_embeddings()

INDEX_NAME = "medical-chatbot"
docsearch = PineconeVectorStore.from_existing_index(
    index_name=INDEX_NAME,
    embedding=embeddings
)

retriever = docsearch.as_retriever(search_type="similarity", search_kwargs={"k": 3})

chat_model = ChatGroq(
    model_name="llama-3.1-8b-instant",
    temperature=0.5
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])

question_answer_chain = create_stuff_documents_chain(chat_model, prompt)
rag_chain = create_retrieval_chain(retriever, question_answer_chain)


# --- Routes ---
@app.route("/")
def index():
    return render_template("chat.html")


@app.route("/get", methods=["GET", "POST"])
def chat():
    msg = request.form.get("msg", "").strip()
    if not msg:
        return jsonify({"error": "Empty message"}), 400

    try:
        response = rag_chain.invoke({"input": msg})
        answer = response.get("answer", "Sorry, I couldn't generate a response.")
        return str(answer)
    except Exception as e:
        app.logger.error(f"RAG chain error: {e}")
        return "An error occurred while processing your request.", 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)