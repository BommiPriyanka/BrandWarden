"""BM25 retrieval over guideline clauses."""
from typing import List, Dict
try:
    from rank_bm25 import BM25Okapi
except ImportError:
    BM25Okapi = None


def _tokenise(text: str) -> List[str]:
    return text.lower().split()


def retrieve_clauses(
    query: str,
    clauses: List[Dict],
    top_k: int = 5,
) -> List[Dict]:
    """Return the top-k most relevant clauses for the query text using BM25 or token overlap."""
    if not clauses:
        return []

    query_tokens = _tokenise(query)
    if not query_tokens:
        return clauses[:top_k]

    if BM25Okapi is not None:
        corpus = [_tokenise(c.get("text", "") + " " + c.get("title", "")) for c in clauses]
        bm25 = BM25Okapi(corpus)
        scores = bm25.get_scores(query_tokens)
    else:
        # Fallback keyword overlap
        q_set = set(query_tokens)
        scores = [
            len(q_set.intersection(set(_tokenise(c.get("text", "") + " " + c.get("title", "")))))
            for c in clauses
        ]

    ranked = sorted(zip(scores, clauses), key=lambda x: x[0], reverse=True)
    results = [clause for score, clause in ranked[:top_k] if score > 0]
    return results if results else clauses[:top_k]
