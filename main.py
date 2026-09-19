import joblib
from fastapi import FastAPI
from pydantic import BaseModel , Field
from typing import Literal
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

model = joblib.load("Mental_Health_Model.pkl")
#load model



top_countries = ['Other','India','Canada','Australia','UK','Germany','Mexico','Turkey','France']

#pydantic model for input data validation
class StudentData(BaseModel):
    age : int = Field(...,ge=10,le=100)
    gender: Literal['Male','Female']
    country: str
    academic_level: Literal['High School','Undergraduate','Graduate']
    most_used_platform: Literal['Instagram','Facebook','Snapchat','TikTok','Twitter','YouTube','Whatsapp','LINE','LinkedIn','kakoaTalk','WeChat','VKontakte']
    purpose_of_use: Literal['Networking','Entertasinment','Education','News']
    avg_daily_usage_hours: int = Field(...,ge=0,le=24)
    daily_unlocks: float = Field(...,ge=0)
    study_hours: float = Field(...,ge=0,le=24) 
    physical_activity_hours:  float = Field(...,ge=0,le=24)
    sleep_hours_per_night: float = Field(...,ge=0,le=24)
    stress_level: Literal['Low','Medium','High','Very High']

app = FastAPI()

#middleware to allow cross-origin requests from any origin, method, and header
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def greet():
    return {"Welcome to daksh web page"}

#response by server against the request made by user
class PredectionResponse(BaseModel):
    predicted_mental_health_score :float #6.7777 ->float


@app.post('/predict',response_model=PredectionResponse)
def predict(data:StudentData):

    country_group = data.country if data.country in top_countries else "Other"
    #request body
    input_row = pd.DataFrame([{
        'Age':data.age,
        'Gender':data.gender,
        'Country':data.country,
        'Academic_Level':data.academic_level,
        'Most_Used_Platform':data.most_used_platform,
        'Purpose_Of_Use':data.purpose_of_use,
        'Avg_Daily_Usage_Hours':data.avg_daily_usage_hours,
        'Daily_Unlocks':data.daily_unlocks,
        'Study_Hours':data.study_hours,
        'Physical_Activity_Hours':data.physical_activity_hours,
        'Sleep_Hours_Per_Night':data.sleep_hours_per_night,
        'Stress_Level':data.stress_level,
        'Grouped_Country': country_group
    }])
    
    predection = model.predict(input_row)[0] #6.77
    return PredectionResponse(predicted_mental_health_score=round(float(predection),1))