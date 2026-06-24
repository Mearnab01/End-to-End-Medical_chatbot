# 🩺 End-to-End Medical Chatbot

A production-ready RAG (Retrieval-Augmented Generation) chatbot for medical Q&A, deployed on AWS EC2 with a full CI/CD pipeline via GitHub Actions.

![Python](https://img.shields.io/badge/Python-3.10-blue?style=flat-square)
![Flask](https://img.shields.io/badge/Flask-3.x-black?style=flat-square)
![LangChain](https://img.shields.io/badge/LangChain-0.2-green?style=flat-square)
![Pinecone](https://img.shields.io/badge/Pinecone-Vector%20DB-purple?style=flat-square)
![Groq](https://img.shields.io/badge/Groq-LLaMA%203.1-orange?style=flat-square)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square)
![AWS](https://img.shields.io/badge/AWS-EC2%20Deployed-FF9900?style=flat-square)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=flat-square)

---

## What it does

Users ask medical questions in natural language. The system retrieves the most relevant chunks from a medical knowledge base stored in Pinecone, then passes them as context to Groq's LLaMA 3.1 (8B) model to generate a grounded, accurate answer — preventing hallucination by anchoring responses to retrieved source documents.

---

## Architecture

```
User Query
    │
    ▼
Flask Web App (app.py)
    │
    ▼
LangChain Retrieval Chain
    │
    ├──► Pinecone Vector Store  ◄── Indexed PDFs (store_index.py)
    │         (cosine similarity, k=3)
    │
    ▼
ChatGroq (LLaMA-3.1-8b-instant)
    │
    ▼
Answer rendered in chat UI
```

**Indexing pipeline** (`store_index.py`):
1. Load medical PDFs from `/data`
2. Extract and chunk text via LangChain text splitter
3. Generate embeddings (dim=384) and upsert to Pinecone Serverless (AWS us-east-1, cosine metric)

**Inference pipeline** (`app.py`):
1. Embed incoming user query
2. Retrieve top-3 similar chunks from Pinecone
3. Stuff retrieved docs into a `ChatPromptTemplate` with a medical system prompt
4. Stream response from Groq LLaMA 3.1 back to the user

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Groq — LLaMA-3.1-8b-instant |
| Orchestration | LangChain (`create_retrieval_chain`, `create_stuff_documents_chain`) |
| Vector Store | Pinecone Serverless (cosine similarity, 384-dim) |
| Embeddings | HuggingFace sentence-transformers |
| Backend | Flask (REST API, `host=0.0.0.0`, port 8080) |
| Frontend | HTML/CSS/JS (custom chat UI) |
| Containerization | Docker |
| Deployment | AWS EC2 (Ubuntu) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
├── .github/
│   └── workflows/        # GitHub Actions CI/CD pipeline
├── data/                 # Source medical PDFs
├── research/             # Jupyter notebooks (experimentation)
├── src/
│   ├── helper.py         # PDF loading, chunking, embedding utils
│   └── prompt.py         # System prompt for the LLM
├── static/               # CSS, JS for the chat UI
├── templates/
│   └── chat.html         # Chat interface
├── app.py                # Flask app + RAG chain setup
├── store_index.py        # One-time indexing script (PDF → Pinecone)
├── Dockerfile
├── requirements.txt
└── setup.py
```

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/Mearnab01/End-to-End-Medical_chatbot.git
cd End-to-End-Medical_chatbot
pip install -r requirements.txt
```

### 2. Set environment variables

Create a `.env` file:

```env
PINECONE_API_KEY=your_pinecone_api_key
GROQ_API_KEY=your_groq_api_key
```

### 3. Index your documents

Place medical PDFs in the `/data` folder, then run:

```bash
python store_index.py
```

This creates a `medical-chatbot` Pinecone index and upserts all document chunks.

### 4. Run the app

```bash
python app.py
```

Visit `http://localhost:8080`

---

## Docker

```bash
# Build
docker build -t medical-chatbot .

# Run
docker run -p 8080:8080 \
  -e PINECONE_API_KEY=your_key \
  -e GROQ_API_KEY=your_key \
  medical-chatbot
```

---

## Deployment — AWS EC2

The app is deployed on an AWS EC2 Ubuntu instance.

**CI/CD flow via GitHub Actions:**
1. Push to `main` triggers the workflow (`.github/workflows/`)
2. Docker image is built and pushed
3. EC2 instance pulls the latest image and restarts the container

To deploy manually on EC2:

```bash
# On your EC2 instance (Ubuntu)
sudo apt update && sudo apt install docker.io -y
sudo systemctl start docker

# Pull and run
docker pull <your-image>
docker run -d -p 8080:8080 \
  -e PINECONE_API_KEY=your_key \
  -e GROQ_API_KEY=your_key \
  <your-image>
```

Ensure port 8080 is open in your EC2 Security Group inbound rules.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PINECONE_API_KEY` | ✅ | Pinecone API key for vector store access |
| `GROQ_API_KEY` | ✅ | Groq API key for LLaMA inference |

---

## Key Design Decisions

- **RAG over fine-tuning**: Retrieval grounds the LLM's responses in actual source documents, reducing hallucination — critical for medical use cases.
- **Pinecone Serverless**: Zero infrastructure management for the vector store; scales automatically.
- **Groq inference**: LLaMA 3.1 8B via Groq gives fast, low-latency responses suitable for a real-time chat interface.
- **`k=3` retrieval**: Balances context quality vs. prompt length — enough signal without overloading the context window.

---

## License

[MIT](LICENSE)
