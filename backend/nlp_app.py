import arxiv
import spacy
import asyncio
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import Counter
from typing import List, Dict, Optional

try:
    from keybert import KeyBERT
    kw_model = KeyBERT()
except ImportError:
    print("Error: KeyBERT is not installed. Run: pip install keybert")

app = FastAPI(title="Scientific NLP Analyzer")

try:
    nlp = spacy.load("en_core_web_lg")
except OSError:
    print("Error: SpaCy model not found.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ArticleResponse(BaseModel):
    title: str
    summary: str
    published: str
    pdf_url: str
    keywords: List[dict]
    top_cluster: str 

class GlobalStats(BaseModel):
    total_keywords: List[dict]
    clusters: Dict[str, int]

class SearchResponse(BaseModel):
    articles: List[ArticleResponse]
    global_stats: GlobalStats


def analyze_summary_nlp(text: str, query_doc):
    doc = nlp(text)
    meaningful_words = []
    stop_words = {"result", "method", "analysis", "paper", "approach", "data", "study", "using", "rights", "reserved", "copyright"}

    for token in doc:
        if (token.pos_ in ["NOUN", "PROPN"] and not token.is_stop and token.is_alpha 
            and len(token.lemma_) > 1 and token.lemma_.lower() not in stop_words):
            if query_doc.vector_norm > 0 and token.vector_norm > 0:
                if token.similarity(query_doc) >= 0.3:
                    meaningful_words.append(token.lemma_.lower())

    counts = Counter(meaningful_words)
    final_data = [{"word": word, "count": count} for word, count in counts.most_common(6)]

    return final_data, counts

search_cache = {}

def fetch_and_process_articles(query: str, year: Optional[int], limit: int):
    cache_key = f"{query}_{year}_{limit}"
    if cache_key in search_cache:
        return search_cache[cache_key]

    query_doc = nlp(query)
    articles_list = []
    global_keywords_counter = Counter()
    clusters_counter = Counter()

    CURRENT_YEAR = datetime.now().year
    MIN_YEAR = CURRENT_YEAR - 5
    
    if year and MIN_YEAR <= year <= CURRENT_YEAR:
        final_query = f'all:"{query}" AND submittedDate:[{year}01010000 TO {year}12312359]'
    else:
        final_query = f'all:"{query}" AND submittedDate:[{MIN_YEAR}01010000 TO {CURRENT_YEAR}12312359]'

    client = arxiv.Client(
        page_size=limit, 
        delay_seconds=2.0, 
        num_retries=3      
    )

    search = arxiv.Search(
        query=final_query,
        max_results=limit + 3,  
        sort_by=arxiv.SortCriterion.Relevance,
        sort_order=arxiv.SortOrder.Descending
    )

    try:
        for result in client.results(search):
            if len(articles_list) >= limit:
                break

            result_year = result.published.year
            
            if result_year < MIN_YEAR or result_year > CURRENT_YEAR:
                continue
                
            if year and MIN_YEAR <= year <= CURRENT_YEAR:
                if result_year != year:
                    continue

            keywords_data, raw_counts = analyze_summary_nlp(result.summary, query_doc)
            global_keywords_counter.update(raw_counts)

            keybert_keywords = kw_model.extract_keywords(
                result.summary, 
                keyphrase_ngram_range=(2, 3), 
                stop_words='english', 
                top_n=1
            )
            
            sub_topic = keybert_keywords[0][0].title() if keybert_keywords else "General Focus"
            clusters_counter.update([sub_topic])

            articles_list.append({
                "title": result.title,
                "summary": result.summary.replace("\n", " "),
                "published": result.published.strftime("%Y-%m-%d"),
                "pdf_url": result.pdf_url,
                "keywords": keywords_data,
                "top_cluster": sub_topic
            })

        result_data = (articles_list, global_keywords_counter, clusters_counter)
        search_cache[cache_key] = result_data 
        
        return result_data

    except arxiv.HTTPError as e:
        raise e


@app.get("/search/{query}", response_model=SearchResponse)
async def search_arxiv(
    query: str,
    year: Optional[int] = Query(None),
    limit: int = Query(10, ge=10, le=50) 
):
    try:
        articles_list, global_keywords_counter, clusters_counter = await asyncio.to_thread(
            fetch_and_process_articles, query, year, limit
        )

        if not articles_list:
            return {"articles": [], "global_stats": {"total_keywords": [], "clusters": {}}}

        global_top_words = [{"word": word, "count": count} for word, count in global_keywords_counter.most_common(12)]

        return {
            "articles": articles_list,
            "global_stats": {
                "total_keywords": global_top_words,
                "clusters": dict(clusters_counter)
            }
        }

    except arxiv.HTTPError as e:
        if "429" in str(e):
            raise HTTPException(status_code=429, detail="ArXiv API Rate Limit. Please wait 1 minute.")
        raise HTTPException(status_code=500, detail=f"ArXiv Error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))