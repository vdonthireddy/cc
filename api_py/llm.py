import os
import json
import httpx
from typing import Optional

class LLMClient:
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "gemini").lower()
        self.api_key = os.getenv("LLM_API_KEY")
        self.base_url = os.getenv("LLM_BASE_URL") # For Local/Ollama
        self.model = os.getenv("LLM_MODEL", "gemini-pro")

    def get_model_name(self) -> str:
        return self.model

    async def generate_content(self, prompt: str) -> str:
        if self.provider == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(prompt)
            return response.text
        
        elif self.provider == "openai":
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {self.api_key}"}
                data = {
                    "model": os.getenv("LLM_MODEL", "gpt-3.5-turbo"),
                    "messages": [{"role": "user", "content": prompt}]
                }
                res = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)
                return res.json()["choices"][0]["message"]["content"]

        elif self.provider == "local":
            # Default to Ollama style API
            url = self.base_url or "http://localhost:11434/api/generate"
            async with httpx.AsyncClient() as client:
                data = {
                    "model": os.getenv("LLM_MODEL", "llama2"),
                    "prompt": prompt,
                    "stream": False
                }
                res = await client.post(url, json=data, timeout=60.0)
                return res.json().get("response", res.json().get("content", ""))

        return "LLM Provider not configured correctly."

llm = LLMClient()
