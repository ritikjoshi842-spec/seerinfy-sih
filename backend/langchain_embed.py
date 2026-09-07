"""Optional, lightweight Groq query generation for Unsplash searches.

This module is imported only by session routes. Keeping it focused avoids
initializing embedding/Qdrant clients for an image-search request.
"""

import os

from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is missing.")

unsplash_query_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """You generate one concise Unsplash photo-search query for a reminiscence
therapy application. Use the most meaningful visual idea in the profile. Do
not include names, ages, diagnoses, questions, or explanations. Return only
3 to 8 natural search keywords.""",
    ),
    ("human", "Patient profile:\n{profile}"),
])

model = ChatGroq(model="gpt-oss-120b", temperature=0.7, api_key=GROQ_API_KEY)
generate_query_chain = unsplash_query_prompt | model | StrOutputParser()
