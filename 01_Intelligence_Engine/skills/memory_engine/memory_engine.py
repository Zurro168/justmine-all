import os
from dotenv import load_dotenv

load_dotenv()

class ZhengkuangMemory:
    def __init__(self, db_dir="../data/chroma_db_storage"):
        self.db_dir = db_dir
        DEEPSEEK_KEY = os.getenv("DEEPSEEK_API_KEY")
        
        # 配置 Mem0
        config = {
            "vector_store": {
                "provider": "chroma",
                "config": {
                    "collection_name": "zhengkuang_longterm_memory",
                    "path": self.db_dir,
                }
            },
            "llm": {
                "provider": "openai",
                "config": {
                    "model": "deepseek-chat",
                    "api_key": DEEPSEEK_KEY,
                    "openai_base_url": "https://api.deepseek.com"
                }
            },
            "embedder": {
                "provider": "openai",
                "config": {
                    "model": "text-embedding-v3",
                    "api_key": os.getenv("DASHSCOPE_API_KEY"),
                    "openai_base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"
                }
            }
        }
        
        try:
            from mem0 import Memory
            self.m = Memory.from_config(config)
        except Exception as e:
            print(f"⚠️ Memory 引擎降级运行 (可能是缺少依赖或 Key): {e}")
            self.m = None

    def add(self, text, user_id="default", run_id="main"):
        if self.m:
            try:
                self.m.add(text, user_id=user_id, run_id=run_id)
            except Exception as e:
                print(f"Memory Add Error: {e}")

    def search(self, query, user_id="default", run_id="main"):
        if self.m:
            try:
                results = self.m.search(query, user_id=user_id, run_id=run_id)
                return [{"text": r.get('memory', r.get('text', ''))} for r in results]
            except Exception as e:
                print(f"Memory Search Error: {e}")
                return []
        return []

if __name__ == "__main__":
    memory = ZhengkuangMemory()
    memory.add("客户王总不喜欢钛含量低于 45% 的矿", user_id="wang_zong", run_id="room_1")
    res = memory.search("王总的要求是什么？", user_id="wang_zong", run_id="room_1")
    print(f"检索到记忆: {res}")
