"""
collects all the routers (modular route groups)
from separate files into app
"""

from fastapi import FastAPI

from backend.routers import student

app = FastAPI(title="university event management api")

# routers
app.include_router(student.router)


@app.get("/")
def root():
    """root endpoint"""
    return {"message": "db running on railway"}
