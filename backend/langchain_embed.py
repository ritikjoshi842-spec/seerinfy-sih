import os
from main import PatientProfile,DescriptionPayload,ImageResponse,fetch_unsplash_photo
from langchain_core.tools import tool
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEndpoint,ChatHuggingFace
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate,ChatPromptTemplate
from langchain_core.runnables import RunnableLambda

import json
import spacy
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser,JsonOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from langchain_qdrant import QdrantVectorStore

load_dotenv()


HF_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN")

if not HF_TOKEN:
    raise RuntimeError(
        "HUGGINGFACEHUB_API_TOKEN is missing. "
        "Add it to your .env file."
    )

UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
UNSPLASH_API_BASE = "https://api.unsplash.com"

if not UNSPLASH_ACCESS_KEY:
    raise RuntimeError(
        "UNSPLASH_ACCESS_KEY is missing. Add it to your .env file before starting the server."
    )


parser1 = StrOutputParser()
parser2 = JsonOutputParser()

llm = HuggingFaceEndpoint(
    repo_id = 'Qwen/Qwen3-4B-Instruct-2507',
    huggingfacehub_api_token=HF_TOKEN,
    task = 'text-generation',
)
print("creating model")
model = ChatHuggingFace(llm=llm)

#query for unspash api
unsplash_query_prompt = ChatPromptTemplate.from_messages([
    ("system","""You are an image-search query generator for a reminiscence therapy application.

You will receive a patient's profile containing information such as:

* hobbies
* past activities
* favorite places
* life milestones

Your task is to analyze the entire patient profile and generate ONE concise search query suitable for the Unsplash image-search API.

Instructions:

1. Identify the most meaningful and visually representable concept from the patient's profile.
2. Prefer concrete subjects, activities, locations, objects, or scenes that can be represented by a photograph.
3. Combine relevant information from multiple profile fields when doing so creates a more meaningful visual query.
4. Prioritize personal interests and experiences over generic information.
5. If a specific place is mentioned, include it when it would produce a useful visual search.
6. If a hobby or past activity is mentioned, prefer the activity and its visual context.
7. If a life milestone is mentioned, convert it into a visually representable scene.
8. Do not include the patient's name, age, or other identifying information.
9. Do not mention medical conditions or diagnoses in the query.
10. Do not generate a question or sentence.
11. Return ONLY the search query.
12. Keep the query between 3 and 8 words.
13. Use natural keywords that would work well for Unsplash.

Example:

Patient profile:
Hobbies: ["fishing", "gardening"]
Past activities: "Spent many weekends fishing with friends near the Ganges."
Favorite places: ["Rishikesh"]
Life milestones: "Moved to Rishikesh after retirement."

Output:
fishing friends river Rishikesh

Another example:

Patient profile:
Hobbies: ["photography"]
Past activities: "Used to take photographs during mountain trips."
Favorite places: ["Manali"]
Life milestones: "First family trip to the Himalayas."

Output:
family mountain photography Manali

Now analyze the provided patient profile and return ONLY the best Unsplash search query.

"""),
("human","Patient profile:{profile} ,Generate the best Unsplash search query.")
])

async def search_unsplash(query: str) -> dict:
    """Search Unsplash for an image matching the query."""
    return await fetch_unsplash_photo(query)

fetch_image_runnable = RunnableLambda(search_unsplash)

#embedding pipeline

JSON_FILE = "result.json"


def load_json(file_path: str) -> dict:
    """
    Loads the transcript result JSON file and returns its data.
    """

    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    return data

QDRANT_URL = "http://localhost:6333"
COLLECTION_NAME = "patient_transcripts"


embed_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

SPACY_MODEL = "en_core_web_sm"

nlp= spacy.load(SPACY_MODEL)

def extract_transcript(data: dict):

    transcript = data["linguistic_data"]["transcript"]

    return {
        "transcript": transcript,
        "patient_id": data.get("patient_id"),
        "timestamp": data.get("timestamp"),
        "language": data.get("language"),
        "acoustic_biomarkers": data.get(
            "acoustic_biomarkers",
            {}
        ),
        "linguistic_data": data.get(
            "linguistic_data",
            {}
        )
    }


def process_with_spacy(data: dict):

    transcript = data["transcript"]

    doc = nlp(transcript)

    processed_text = " ".join(
        token.text
        for token in doc
        if not token.is_space
    )

    return {
        **data,
        "processed_text": processed_text
    }


def create_document(data: dict):

    acoustic = data["acoustic_biomarkers"]
    linguistic = data["linguistic_data"]

    document = Document(
        page_content=data["processed_text"],

        metadata={
            "patient_id": data["patient_id"],
            "timestamp": data["timestamp"],
            "language": data["language"],

            "response_latency_sec":
                acoustic.get("response_latency_sec"),

            "pause_count":
                acoustic.get("pause_count"),

            "total_pause_duration_sec":
                acoustic.get("total_pause_duration_sec"),

            "speaking_duration_sec":
                acoustic.get("speaking_duration_sec"),

            "pause_to_speech_ratio":
                acoustic.get("pause_to_speech_ratio"),

            "word_count":
                linguistic.get("word_count")
        }
    )

    return document


def split_document(document: Document):

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    return splitter.split_documents([document])


def store_embeddings(documents):

    QdrantVectorStore.from_documents(
        documents=documents,
        embedding=embed_model,
        collection_name=COLLECTION_NAME,
        url=QDRANT_URL
    )

    return {
        "status": "success",
        "message": "Embeddings stored in Qdrant",
        "chunks_stored": len(documents)
    }


extract_chain = RunnableLambda(extract_transcript)
spacy_chain = RunnableLambda(process_with_spacy)
document_chain = RunnableLambda(create_document)
split_chain = RunnableLambda(split_document)
qdrant_chain = RunnableLambda(store_embeddings)


unsplash_chain = unsplash_query_prompt | model | parser1 | fetch_image_runnable

embeding_chain = extract_chain | spacy_chain | document_chain | split_chain | qdrant_chain


