import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware


model = joblib.load("Stacking_pipeline.pkl")

app= FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins= ["*"],
    allow_headers= ["*"],
    allow_methods= ["*"],
)

class InputData(BaseModel):
    Age : int= Field(..., ge= 10, lt= 100)
    Gender : Literal["Male", "Female"]
    Country : str
    Academic_Level : Literal['Undergraduate', 'Graduate', 'High School']
    Most_Used_Platform : Literal['Facebook',  'LinkedIn', 'Instagram',  'Snapchat',   'Twitter',   'YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte',  'WhatsApp', 'WeChat']
    Purpose_Of_Use : Literal['Networking', 'Education', 'Entertainment', 'News']
    Avg_Daily_Usage_Hours : float= Field(..., ge= 0, lt= 24)
    Daily_Unlocks : int= Field(..., ge= 0)
    Study_Hours : float= Field(..., ge= 0, le= 24)
    Physical_Activity_Hours : float= Field(..., ge= 0, le= 24)
    Sleep_Hours_Per_Night : float= Field(..., ge= 0, le= 24)
    Stress_Level : Literal['Medium', 'Low', 'Very High', 'High']

class PredictResponce(BaseModel):
    predict_mentel_health_score: float


@app.get("/")
def great():
    return "Welcome to Mentel_Health_Score Predicter"

@app.post("/predict")
def predict(data: InputData, response_model= PredictResponce):
    
    top_contry= np.array(['Other', 'Canada', 'USA', 'India', 'Australia', 'UK', 'Germany', 'France', 'Spain', 'Mexico', 'Ireland', 'Turkey'])
    
    contry_Groupd= data.Country if data.Country in top_contry else "Other"
    
    input_data= pd.DataFrame(
        [
            {
                'Age': data.Age,
                'Gender': data.Gender,
                'Country': data.Country,
                'Academic_Level': data.Academic_Level,
                'Most_Used_Platform': data.Most_Used_Platform,
                'Purpose_Of_Use': data.Purpose_Of_Use,
                'Avg_Daily_Usage_Hours': data.Avg_Daily_Usage_Hours,
                'Daily_Unlocks': data.Daily_Unlocks,
                'Study_Hours': data.Study_Hours,
                'Physical_Activity_Hours': data.Physical_Activity_Hours,
                'Sleep_Hours_Per_Night': data.Sleep_Hours_Per_Night,
                'Stress_Level': data.Stress_Level,
                'Groupd_contry': contry_Groupd
            }
        ]
    )
    
    predict= model.predict(input_data)[0]
    return PredictResponce(predict_mentel_health_score= (predict))