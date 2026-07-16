from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class CustomerBase(BaseModel):
    Customer_Code: Optional[str] = None
    Customer_Name: str
    Contact_Person: Optional[str] = None
    Super_Admin: Any = False
    Country: Optional[str] = None
    Status: Optional[str] = "Active"

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    Customer_Name: Optional[str] = None

class CustomerResponse(CustomerBase):
    Customer_ID: int
    Created_Date: Optional[datetime] = None
    Updated_Date: Optional[datetime] = None
    Created_By: Optional[str] = None
    Updated_By: Optional[str] = None

class UserBase(BaseModel):
    Username: str
    Email: str
    Full_Name: Optional[str] = None
    Phone: Optional[str] = None
    User_Type: Optional[str] = "Client"
    Status: Optional[str] = "Active"

class UserCreate(UserBase):
    Password: str # for initial password
    Customer_ID: int

class UserUpdate(BaseModel):
    Username: Optional[str] = None
    Email: Optional[str] = None
    Full_Name: Optional[str] = None
    Phone: Optional[str] = None
    User_Type: Optional[str] = None
    Status: Optional[str] = None

class UserResponse(UserBase):
    User_ID: int
    Customer_ID: int
    Last_Login_At: Optional[datetime] = None
    Created_Date: Optional[datetime] = None
    Updated_Date: Optional[datetime] = None

class BillingSummaryResponse(BaseModel):
    Project_Name: str
    Model_ID: int
    Model_Name: str
    Total_Documents: int
    Total_Pages: int

class BillingChartResponse(BaseModel):
    Date: str
    Total_Documents: int
    Total_Pages: int

class ExecutionDetailsResponse(BaseModel):
    Execution_ID: int
    Triggered_By: str
    Trigger_Source: Optional[str] = None
    Execution_Status: str
    No_of_Documents: Optional[int] = None
    No_of_page: Optional[int] = None
    Start_Time: Optional[datetime] = None
    End_Time: Optional[datetime] = None
    Runtime_Seconds: Optional[int] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# --- API KEY SCHEMAS ---

class APIKeyCreate(BaseModel):
    Label: Optional[str] = None
    Expiry_Date: Optional[datetime] = None

class APIKeyUpdate(BaseModel):
    Label: Optional[str] = None
    Expiry_Date: Optional[datetime] = None

class APIKeyResponse(BaseModel):
    API_Key_ID: int
    Customer_ID: int
    Key: str
    Label: Optional[str] = None
    Is_Active: bool
    Last_Used_Date: Optional[datetime] = None
    Expiry_Date: Optional[datetime] = None
    Created_Date: Optional[datetime] = None
    Created_By: Optional[str] = None
    Revoked_Date: Optional[datetime] = None
    Revoked_By: Optional[str] = None

class APIScopeCreate(BaseModel):
    Project_ID: int
    Model_ID: Optional[int] = None

class APIScopeResponse(BaseModel):
    Scope_ID: int
    API_Key_ID: int
    Project_ID: int
    Model_ID: Optional[int] = None
    Granted_By: Optional[str] = None
    Granted_Date: Optional[datetime] = None
    Project_Name: Optional[str] = None
    Model_Name: Optional[str] = None

class ModelInfo(BaseModel):
    Model_ID: int
    Model_Name: str

class ProjectModelsResponse(BaseModel):
    Project_ID: int
    Project_Name: str
    Models: list[ModelInfo] = []

