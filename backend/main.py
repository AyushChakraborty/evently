"""
collects all the routers (modular route groups)
from separate files into app
"""

from fastapi import FastAPI

from backend.routers import student

# from fastapi.staticfiles import StaticFiles


app = FastAPI(title="evently: university event management api")

# routers
app.include_router(student.router)

# for any path that isnt handled by the API routes, serve static files from
# the frontend dir
# app.mount("/", StaticFiles(directory="frontend", html=True), name="static")


@app.get("/")
def root():
    """root endpoint"""
    return {"message": "db running on railway"}
