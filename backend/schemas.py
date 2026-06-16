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

class LoginRequest(BaseModel):
    username: str
    password: str

