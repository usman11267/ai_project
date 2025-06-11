# AI Medical Assistant

An AI-powered application that assists patients by providing medicine suggestions based on their symptoms. This system leverages natural language processing and retrieval-augmented generation (RAG) techniques to improve healthcare accessibility and efficiency.

## 🚀 Features

- 🤖 AI model to analyze patient symptoms
- 💊 Provides intelligent medicine suggestions
- 📚 Uses Retrieval-Augmented Generation (RAG) for accurate recommendations
- 🔐 Secure handling of patient input
- 📈 Scalable architecture for future enhancements

## 🛠️ Tech Stack

- Python
- LangGraph
- Gemini/OpenAI API
- Flask / FastAPI (for backend API)
- react for fronted
- Git & GitHub

## 📦 Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/usman11267/ai_project.git
   cd ai_project
   ```

2. **Create a Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**
   Create a `.env` file and add your API keys and configurations:
   ```
   OPENAI_API_KEY=your_key_here
   VECTOR_DB_API_KEY=your_vector_db_key_here
   ```

5. **Run the App**
   ```bash
   python app.py
   ```

## 🧪 Example Usage

- Patient inputs: `"I have a sore throat and mild fever"`
- AI Output: 
  ```json
  {
    "diagnosis": "Possible viral pharyngitis",
    "suggested_medicines": ["Paracetamol", "Cough syrup", "Warm saline gargles"],
    "recommendation": "Consult a physician if symptoms persist"
  }
  ```


Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

**Developed by Muhammad Usman**   
🌐 GitHub: [usman11267](https://github.com/usman11267)
