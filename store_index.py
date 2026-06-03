import os
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv
from langchain_pinecone import PineconeVectorStore
from src.helper import load_embeddings, extract_text_from_pdfs, filter_to_minimum_docs, text_split

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
if not PINECONE_API_KEY:
    raise EnvironmentError("PINECONE_API_KEY is not set in .env")

pc = Pinecone(api_key=PINECONE_API_KEY)

# Build and upsert index
extracted_docs = extract_text_from_pdfs("data")
filtered_docs = filter_to_minimum_docs(extracted_docs)
text_chunks = text_split(filtered_docs)
embeddings = load_embeddings()

INDEX_NAME = "medical-chatbot"

if not pc.has_index(INDEX_NAME):
    pc.create_index(
        name=INDEX_NAME,
        dimension=384,
        metric="cosine",
        serverless=ServerlessSpec(cloud="aws", region="us-east-1")
    )

index = pc.Index(INDEX_NAME)
print(f"Index '{INDEX_NAME}' ready.")

PineconeVectorStore.from_documents(
    documents=text_chunks,
    embedding=embeddings,
    index_name=INDEX_NAME
)
print("Documents upserted successfully.")