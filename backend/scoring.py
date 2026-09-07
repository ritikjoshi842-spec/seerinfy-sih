import os
import tempfile
import re
import nltk
from nltk import word_tokenize, pos_tag

KEEP_POS_PREFIXES = ('NN', 'VB', 'JJ', 'RB', 'CD')
GRAMMATICAL_FILLER = {'is', 'was', 'are', 'were', 'be', 'been', 'am', 'the', 'a', 'an'}


def tokenize(text: str) -> list[str]:
    """Tokenize text using NLTK, falling back to wordpunct_tokenize if NLTK data is missing."""
    try:
        return word_tokenize(text)
    except LookupError:
        return nltk.tokenize.wordpunct_tokenize(text)


def tag_tokens(tokens: list[str]) -> list[tuple[str, str]]:
    """Tag tokens using NLTK pos_tag, falling back to heuristic tags if NLTK data is missing."""
    try:
        return pos_tag(tokens)
    except LookupError:
        return [(token, 'NN' if token.isalpha() else 'SYM') for token in tokens]


def extract_keywords(description: str) -> list[str]:
    tokens = tokenize(description)
    tagged = tag_tokens(tokens)
    keywords = [
        word for word, tag in tagged
        if tag.startswith(KEEP_POS_PREFIXES)
        and word.lower() not in GRAMMATICAL_FILLER
        and word.isalpha()
    ]
    return keywords


def lexical_density_score(description: str) -> dict:
    tokens = [t for t in tokenize(description) if t.isalpha()]
    total_words = len(tokens) or 1
    keywords = extract_keywords(description)
    ratio = len(keywords) / total_words
    return {
        'keywords': keywords,
        'total_words': total_words,
        'keyword_count': len(keywords),
        'lexical_density_pct': round(ratio * 100, 1),
    }


from rapidfuzz import fuzz

CANONICAL_FILLERS = ['um', 'uh', 'hmm', 'erm', 'ah', 'huh']
CONTEXT_DEPENDENT = {'like', 'so', 'well'}


def normalize_repeated_chars(word: str) -> str:
    return re.sub(r'(.)\1{2,}', r'\1\1', word.lower())


def is_filler(word: str, prev_word: str | None, next_word: str | None, fuzzy_threshold: int = 80) -> bool:
    normalized = normalize_repeated_chars(word)
    
    if normalized in CONTEXT_DEPENDENT:
        isolated = prev_word is None or next_word is None or (
            prev_word in {',', None} and next_word in {',', '.', None}
        )
        return isolated
    
    if normalized in CANONICAL_FILLERS:
        return True
    
    return any(fuzz.ratio(normalized, canon) >= fuzzy_threshold for canon in CANONICAL_FILLERS)


def filler_word_score(description: str) -> dict:
    words = description.split()
    total_words = len(words) or 1
    filler_count = 0
    for i, w in enumerate(words):
        prev_w = words[i - 1] if i > 0 else None
        next_w = words[i + 1] if i < len(words) - 1 else None
        if is_filler(w.strip('.,!?'), prev_w, next_w):
            filler_count += 1
    return {
        'filler_count': filler_count,
        'total_words': total_words,
        'filler_word_pct': round((filler_count / total_words) * 100, 1),
    }


import numpy as np
from fastembed import TextEmbedding

_embedding_model = None


def get_embedding_model() -> TextEmbedding:
    """Load the model on demand, using a writable temporary cache directory for serverless runtimes."""
    global _embedding_model
    if _embedding_model is None:
        cache_dir = os.environ.get("FASTEMBED_CACHE_DIR") or os.path.join(tempfile.gettempdir(), "fastembed_cache")
        _embedding_model = TextEmbedding(model_name='BAAI/bge-small-en-v1.5', cache_dir=cache_dir)
    return _embedding_model


POS_WEIGHTS = {
    'NN': 1.0, 'NNS': 1.0, 'NNP': 1.0, 'NNPS': 1.0,
    'JJ': 0.9, 'JJR': 0.9, 'JJS': 0.9,
    'CD': 0.8,
    'VB': 0.5, 'VBD': 0.5, 'VBG': 0.5, 'VBN': 0.5, 'VBP': 0.5, 'VBZ': 0.5,
    'RB': 0.4, 'RBR': 0.4, 'RBS': 0.4,
}
DEFAULT_WEIGHT = 0.3


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def weighted_semantic_relevance(tagged_keywords: list[tuple[str, str]], portfolio_word: str) -> dict:
    if not tagged_keywords:
        return {'weighted_relevance_pct': 0.0, 'per_keyword': []}

    embedding_model = get_embedding_model()
    portfolio_vec = np.array(list(embedding_model.embed([portfolio_word]))[0])
    words_only = [w for w, _ in tagged_keywords]
    keyword_vecs = list(embedding_model.embed(words_only))

    weighted_sum = 0.0
    weight_total = 0.0
    per_keyword = []
    for (word, tag), vec in zip(tagged_keywords, keyword_vecs):
        sim = cosine_similarity(np.array(vec), portfolio_vec)
        weight = POS_WEIGHTS.get(tag, DEFAULT_WEIGHT)
        weighted_sum += sim * weight
        weight_total += weight
        per_keyword.append({'word': word, 'similarity': round(sim, 3), 'weight': weight})

    relevance = weighted_sum / weight_total if weight_total else 0.0
    return {
        'weighted_relevance_pct': round(relevance * 100, 1),
        'per_keyword': per_keyword,
    }


COMPLETENESS_WEIGHT = 0.4
SEMANTIC_WEIGHT = 0.6


def final_score(lexical_density_pct: float, weighted_relevance_pct: float) -> float:
    completeness = lexical_density_pct / 100
    semantic_relevance = weighted_relevance_pct / 100
    combined = (COMPLETENESS_WEIGHT * completeness) + (SEMANTIC_WEIGHT * semantic_relevance)
    return round(combined * 100, 1)


def analyze_description(description: str, portfolio_word: str) -> dict:
    lexical_density = lexical_density_score(description)
    filler_word = filler_word_score(description)
    
    tokens = tokenize(description)
    tagged = tag_tokens(tokens)
    tagged_keywords = [
        (word, tag) for word, tag in tagged
        if tag.startswith(KEEP_POS_PREFIXES)
        and word.lower() not in GRAMMATICAL_FILLER
        and word.isalpha()
    ]
    
    relevance = weighted_semantic_relevance(tagged_keywords, portfolio_word)
    final = final_score(lexical_density['lexical_density_pct'], relevance['weighted_relevance_pct'])
    
    return {
        'lexical_density_pct': lexical_density['lexical_density_pct'],
        'filler_word_pct': filler_word['filler_word_pct'],
        'weighted_relevance_pct': relevance['weighted_relevance_pct'],
        'final_score_pct': final,
        'lexical_details': lexical_density,
        'filler_details': filler_word,
        'relevance_details': relevance
    }
