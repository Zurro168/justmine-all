import os
import json
import requests
from pathlib import Path
import chromadb
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# 正矿供应链 - 本地知识库引擎 (RAG Indexer)
# 作用：将公司历史单据规则切片化，变为向量记忆
# ==========================================

# 1. 基础配置
KNOWLEDGE_DIR = "../data/knowledge_base"
DB_DIR = "../data/chroma_db_storage"
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "sk-mock-key")

# 2. 向量化函数 (调用通义千问 Text Embedding V3)
def get_qwen_embedding(text: str) -> list:
    """调用阿里云 DashScope Embeddings 获取向量表示 (不需要安装SDK，直接发HTTP请求)"""
    url = "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding"
    headers = {
        "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "text-embedding-v3",
        "input": {
            "texts": [text]
        }
    }
    
    if "xxxx" in DASHSCOPE_API_KEY or "mock" in DASHSCOPE_API_KEY:
        print("⚠️ 警告: DASHSCOPE_API_KEY 为占位符，正使用【本地模拟向量】以防报错...")
        return [0.01] * 1024

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data["output"]["embeddings"][0]["embedding"]
        else:
            print(f"⚠️ API 拦截: 请求千问向量失败 ({response.status_code}): {response.text}")
            print("-> 系统自动降级使用【本地模拟向量】以确保流程走通...")
            return [0.01] * 1024
    except Exception as e:
        print(f"⚠️ API 请求抛出异常: {e}")
        print("-> 系统自动降级使用【本地模拟向量】以确保流程走通...")
        return [0.01] * 1024

class ZhengkuangRAG:
    def __init__(self, db_dir=DB_DIR):
        self.db_dir = db_dir
        print(f"[RAG] Starting private vector database (at {self.db_dir})...")
        self.chroma_client = chromadb.PersistentClient(path=self.db_dir)
        self.collection = self.chroma_client.get_or_create_collection(name="zhengkuang_docs")

    def get_embedding(self, text: str) -> list:
        return get_qwen_embedding(text)

    def ingest(self, knowledge_dir=KNOWLEDGE_DIR):
        if not os.path.exists(knowledge_dir):
            print(f"[RAG] Error: Cannot find knowledge directory {knowledge_dir}")
            return

        # 扫描目录下所有的 txt 和 md 文件
        files = list(Path(knowledge_dir).glob("*.txt")) + list(Path(knowledge_dir).glob("*.md"))
        
        if not files:
            print("ℹ️ 知识库文件夹为空，没有新文件可以入库。")
            return

        for filepath in files:
            filename = filepath.name
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            # 简单切分：按双换行符切分为不同的“知识段落” (Chunking)
            chunks = [c.strip() for c in content.split("\n\n") if len(c.strip()) > 10]
            
            print(f"📚 正在解析文件 [{filename}] (共 {len(chunks)} 个段落)...")

            for i, chunk in enumerate(chunks):
                chunk_id = f"{filename}_chunk_{i}"
                
                # 检查是否已经库里有了
                existing = self.collection.get(ids=[chunk_id])
                if existing and existing['ids']:
                    print(f"   -> 段落 {i} 已存在，跳过。")
                    continue
                
                print(f"   -> 正在提取段落 {i} 的语义向量...")
                vector = self.get_embedding(chunk)
                
                # 存入数据库
                self.collection.add(
                    ids=[chunk_id],
                    embeddings=[vector],
                    documents=[chunk],
                    metadatas=[{"source_file": filename, "type": "rule"}]
                )
        print("[RAG] Knowledge ingestion completed.")

    def search(self, query: str, top_k: int = 2):
        print(f"[RAG] Searching for: {query}")
        query_vector = self.get_embedding(query)
        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=top_k
        )
        if not results['documents'][0]:
            print("[RAG] No relevant knowledge found.")
            return []
        
        print("\n💡 检索到的相关历史知识片段：")
        return [
            {"content": doc, "source": results['metadatas'][0][i]['source_file']}
            for i, doc in enumerate(results['documents'][0])
        ]

if __name__ == "__main__":
    print("="*50)
    print(" RAG 零微调知识库引擎 - 调试控制台")
    print("="*50)
    
    rag = ZhengkuangRAG()
    
    # 步骤 1: 将知识库文件夹的文本扫入数据库
    rag.ingest()
    
    # 步骤 2: 模拟 Docu-Checker 遇到难题时的找前例搜索
    test_query = "如果发现发票上的起运港和提单起运港不一致，该怎么处理？"
    res = rag.search(test_query)
    for r in res:
        print(f"[{r['source']}]: \n{r['content']}\n")
