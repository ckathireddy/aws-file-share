from fastapi import FastAPI, Request, HTTPException, Form, File, UploadFile
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json
from database import db_connect
from utils import aws_s3_client, genrate_global_uri, S3_BUCKET_NAME, aws_lambda_client

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


templates = Jinja2Templates(directory="templates")

@app.get("/home")
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request":request})

@app.post("/signup")
async def signup(request: Request, data:dict):
    name = data["name"]
    email = data["email"]
    password = data["password"]
    with db_connect() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))

        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="User with this email already registered")
  
        cursor.execute("INSERT INTO users(username, email, password) VALUES(%s, %s, %s)", (name, email, password))
        conn.commit()
    
    return {"status":True,"detail":"User registration successful"}


@app.post("/login")
async def login(request: Request, data:dict):
    email = data["email"]
    password = data["password"]
    
    with db_connect() as conn:
        cursor = conn.cursor()
    
        cursor.execute("SELECT * FROM users WHERE email=%s AND password=%s", (email, password))
        user = cursor.fetchone()
    
    if user is None:
        return HTTPException(status_code=400, detail="Wrong credentials")
    
    return{"username":user[1],"email":email}
    
@app.get("/login")
async def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/signup")
async def signup(request: Request,):
    return templates.TemplateResponse("signup.html", {"request": request})

@app.post("/upload")
async def upload_file(sender:str = Form(...),emails: str = Form(...), file: UploadFile = File(...)):
    
    try:
        filename  = file.filename
        s3_client = aws_s3_client()
        s3_client.upload_fileobj(file.file, S3_BUCKET_NAME, filename)
    except Exception as e:
        return HTTPException(status_code=400,detail="Failed while uploading the file to S3")

    access_link = genrate_global_uri(filename)
    mail_body = f"Hi, this mail was triggred by {sender} to share a file named {filename}, download link {access_link}"
    print(mail_body)
    try:
        lambda_client = aws_lambda_client()
        lamda_res = lambda_client.invoke(FunctionName='emailTrigger',Payload=json.dumps({'mail_body':mail_body,'emails':emails}))
        print(lamda_res)

    except Exception as e:
        print(e)
        return HTTPException(status_code=500, detail="Failed while sending mails try again")
    
    if lamda_res["ResponseMetadata"].get("HTTPStatusCode","") == 200:
        with db_connect() as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO file_upload_logs(sender, filename, filelink, receivers) VALUES(%s, %s, %s, %s)", (sender, filename, access_link, emails ))
            conn.commit()
            return {"status":True,"message":"Successfully uploaded the file and sent mails to the corresponding emails"}
    else:
        return HTTPException(status_code=400, detail="Failed while sending mails try again")
    
