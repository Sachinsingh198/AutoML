from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json
from engine import run_automl_pipeline


app = FastAPI(title = "AutoML-Studio Telemetry Server")


# Dynamic pipeline connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)


@app.get('/')
def read_root():
    return {"status" : "AutoML Engine Active and running Live"}


@app.post("/analyze-headers")
async def analyze_headers(file: UploadFile= File(...)):
    """
    Route 1: File drop hote hi instantly readable header keys fetch karke
    frontend columns dropdown fill karne ke liye send karega.
    """
    try:
        # onlyc checks the first 10 rows of the file to keep the processing of the system fast
        df = pd.read_csv(file.file, nrows=10)
        columns = df.columns.tolist()
        return {"columns": columns}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV layout structure: {str(e)}")


@app.post("/train")
async def train_model(file: UploadFile = File(...), target_column : str = Form(...)):
    """
    Route 2: Target lock hote hi AutoML lifecycle compute karega.
    """
    try:
        # Full data load into dataframes
        df = pd.read_csv(file.file)

        # Execute core pipeline
        results = run_automl_pipeline(df, target_column)
        return results
    
    except Exception as e :
        raise HTTPException(status_code=500, detail=f"Model execution broken: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)