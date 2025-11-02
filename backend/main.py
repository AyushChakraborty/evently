"""
collects all the routers (modular route groups)
from separate files into app
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import student


app = FastAPI(title="evently: university event management api")

#allow CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
)

# routers
app.include_router(student.router)

@app.get("/")
def root():
    """root endpoint"""
    return {"message": "db running on railway"}
