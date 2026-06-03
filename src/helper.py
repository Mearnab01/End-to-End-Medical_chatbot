from langchain.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from typing import List
from langchain.schema import Document


#Extract Data From the PDF File
def extract_text_from_pdfs(pdf_directory):
    loader = DirectoryLoader(pdf_directory, glob="*.pdf", loader_cls=PyPDFLoader, show_progress=True)
    documents = loader.load()
    return documents



def filter_to_minimum_docs(docs: List[Document])-> List[Document]:
    minimum_docs: List[Document] = []
    for doc in docs:
        src = doc.metadata.get("source", "")
        minimum_docs.append(
            Document(
                page_content=doc.page_content,
                metadata={"source": src}
            )
        )
    return minimum_docs

 

#Split the Data into Text Chunks
def text_split(minimum_docs: List[Document]) -> List[Document]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500, 
        chunk_overlap=20
    )
    text_chunks = text_splitter.split_documents(minimum_docs)
    return text_chunks



#Download the Embeddings from HuggingFace 
def load_embeddings():
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return embeddings
