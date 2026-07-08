from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pyodbc
from datetime import datetime

from .database import get_db_connection
from . import schemas

app = FastAPI(title="Super Admin Customer Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

def row_to_dict(cursor, row):
    if not row:
        return None
    columns = [column[0] for column in cursor.description]
    return dict(zip(columns, row))

# --- CUSTOMER ENDPOINTS ---

@app.get("/api/customers", response_model=List[schemas.CustomerResponse])
def get_customers(db = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT [Customer_ID], [Customer_Code], [Customer_Name], [Contact_Person],
               [Super_Admin], [Country], [Status], [Created_Date], [Updated_Date],
               [Created_By], [Updated_By]
        FROM [DocuzoneDev].[dbo].[Customer]
    """)
    rows = cursor.fetchall()
    return [row_to_dict(cursor, row) for row in rows]

@app.get("/api/customers/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer(customer_id: int, db = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM [DocuzoneDev].[dbo].[Customer] WHERE Customer_ID = ?", customer_id)
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Customer not found")
    return row_to_dict(cursor, row)

@app.post("/api/customers", response_model=schemas.CustomerResponse)
def create_customer(customer: schemas.CustomerCreate, db = Depends(get_db)):
    cursor = db.cursor()
    created_date = datetime.now()
    
    query = """
        INSERT INTO [DocuzoneDev].[dbo].[Customer] 
        ([Customer_Code], [Customer_Name], [Contact_Person], [Super_Admin], [Country], [Status], [Created_Date], [Created_By])
        OUTPUT INSERTED.*
        VALUES (?, ?, ?, ?, ?, ?, ?, 'System')
    """
    cursor.execute(query, (
        customer.Customer_Code, customer.Customer_Name, customer.Contact_Person,
        customer.Super_Admin, customer.Country, customer.Status, created_date
    ))
    row = cursor.fetchone()
    db.commit()
    return row_to_dict(cursor, row)

@app.put("/api/customers/{customer_id}", response_model=schemas.CustomerResponse)
def update_customer(customer_id: int, customer: schemas.CustomerUpdate, db = Depends(get_db)):
    cursor = db.cursor()
    updated_date = datetime.now()
    
    query = """
        UPDATE [DocuzoneDev].[dbo].[Customer] 
        SET [Customer_Code] = ?, [Customer_Name] = ?, [Contact_Person] = ?, 
            [Super_Admin] = ?, [Country] = ?, [Status] = ?, [Updated_Date] = ?
        OUTPUT INSERTED.*
        WHERE [Customer_ID] = ?
    """
    cursor.execute(query, (
        customer.Customer_Code, customer.Customer_Name, customer.Contact_Person,
        customer.Super_Admin, customer.Country, customer.Status, updated_date, customer_id
    ))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.commit()
    return row_to_dict(cursor, row)

@app.delete("/api/customers/{customer_id}")
def delete_customer(customer_id: int, db = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM [DocuzoneDev].[dbo].[Customer] WHERE Customer_ID = ?", customer_id)
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.commit()
    return {"message": "Customer deleted successfully"}

# --- USER ENDPOINTS ---

@app.get("/api/customers/{customer_id}/users", response_model=List[schemas.UserResponse])
def get_customer_users(customer_id: int, db = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT [User_ID], [Customer_ID], [Username], [Email], [Full_Name],
               [Phone], [User_Type], [Status], [Last_Login_At], [Created_Date], [Updated_Date]
        FROM [DocuzoneDev].[dbo].[User]
        WHERE Customer_ID = ?
    """, customer_id)
    rows = cursor.fetchall()
    return [row_to_dict(cursor, row) for row in rows]

@app.post("/api/users", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db = Depends(get_db)):
    cursor = db.cursor()
    created_date = datetime.now()
    
    query = """
        INSERT INTO [DocuzoneDev].[dbo].[User] 
        ([Customer_ID], [Username], [Email], [Password_Hash], [Full_Name], [Phone], [User_Type], [Status], [Created_Date], [Created_By], [Failed_Login_Count], [Is_Email_Verified])
        OUTPUT INSERTED.*
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'System', 0, 0)
    """
    cursor.execute(query, (
        user.Customer_ID, user.Username, user.Email, user.Password, user.Full_Name,
        user.Phone, user.User_Type, user.Status, created_date
    ))
    row = cursor.fetchone()
    db.commit()
    return row_to_dict(cursor, row)

@app.put("/api/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user: schemas.UserUpdate, db = Depends(get_db)):
    cursor = db.cursor()
    updated_date = datetime.now()
    
    # Simple dynamic update for provided fields
    update_fields = []
    params = []
    for field, value in user.dict(exclude_unset=True).items():
        update_fields.append(f"[{field}] = ?")
        params.append(value)
        
    if not update_fields:
        cursor.execute("SELECT * FROM [DocuzoneDev].[dbo].[User] WHERE User_ID = ?", user_id)
        row = cursor.fetchone()
        return row_to_dict(cursor, row)

    update_fields.append("[Updated_Date] = ?")
    params.append(updated_date)
    params.append(user_id)
    
    query = f"""
        UPDATE [DocuzoneDev].[dbo].[User] 
        SET {', '.join(update_fields)}
        OUTPUT INSERTED.*
        WHERE [User_ID] = ?
    """
    cursor.execute(query, tuple(params))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    db.commit()
    return row_to_dict(cursor, row)

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db = Depends(get_db)):
    cursor = db.cursor()
    # Delete references first
    cursor.execute("DELETE FROM [DocuzoneDev].[dbo].[User_Audit_Log] WHERE User_ID = ?", user_id)
    cursor.execute("DELETE FROM [DocuzoneDev].[dbo].[User_Role] WHERE User_ID = ?", user_id)
    cursor.execute("DELETE FROM [DocuzoneDev].[dbo].[User_Session] WHERE User_ID = ?", user_id)
    
    cursor.execute("DELETE FROM [DocuzoneDev].[dbo].[User] WHERE User_ID = ?", user_id)
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="User not found")
    db.commit()
    return {"message": "User deleted successfully"}

@app.post("/api/login")
def login_admin(creds: schemas.LoginRequest, db = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT [User_ID], [Customer_ID], [Username], [Password_Hash], [User_Type] 
        FROM [DocuzoneDev].[dbo].[User] 
        WHERE Username = ?
    """, creds.username)
    row = cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if row.Password_Hash != creds.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if row.User_Type != "Super Admin":
        raise HTTPException(status_code=403, detail="Unauthorized access. Super Admin role required.")
        
    return {
        "message": "Login successful", 
        "user": {
            "User_ID": row.User_ID,
            "Customer_ID": row.Customer_ID,
            "Username": row.Username,
            "User_Type": row.User_Type
        }
    }

# --- BILLING ENDPOINTS ---

@app.get("/api/customers/{customer_id}/billing-summary", response_model=List[schemas.BillingSummaryResponse])
def get_billing_summary(customer_id: int, start_date: str = None, end_date: str = None, db = Depends(get_db)):
    cursor = db.cursor()
    
    query = """
        SELECT
            p.Project_Name,
            m.Model_ID,
            m.Model_Name,
            COUNT(d.Doc_ID) as Total_Documents,
            SUM(ISNULL(d.Page_Count, 0)) as Total_Pages
        FROM [DocuzoneDev].[dbo].[Project] p
        INNER JOIN [DocuzoneDev].[dbo].[Model] m ON p.Project_ID = m.Project_ID
        LEFT JOIN [DocuzoneDev].[dbo].[Execution_Master] e ON m.Model_ID = e.Model_ID
        LEFT JOIN [DocuzoneDev].[dbo].[Document_Table] d ON e.Execution_ID = d.Execution_ID 
    """
    params = []
    
    where_clauses = ["p.Customer_ID = ?"]
    params.append(customer_id)
    
    if start_date:
        where_clauses.append("d.Created_Date >= ?")
        params.append(start_date)
    if end_date:
        where_clauses.append("d.Created_Date <= ?")
        params.append(end_date)
        
    query += " AND ".join(where_clauses) if "AND" not in query else " AND " + " AND ".join(where_clauses)
    
    # Actually, we need to handle the LEFT JOIN condition differently if we filter by date
    # Otherwise models with no documents in that date range will be excluded (behaving like INNER JOIN)
    # The correct way is to put the date filter in the ON clause for the LEFT JOIN, or just accept that they might be excluded.
    # To keep all models for the customer, we put it in the ON clause.
    
    query = """
        SELECT
            p.Project_Name,
            m.Model_ID,
            m.Model_Name,
            COUNT(d.Doc_ID) as Total_Documents,
            SUM(ISNULL(d.Page_Count, 0)) as Total_Pages
        FROM [DocuzoneDev].[dbo].[Project] p
        INNER JOIN [DocuzoneDev].[dbo].[Model] m ON p.Project_ID = m.Project_ID
        LEFT JOIN [DocuzoneDev].[dbo].[Execution_Master] e ON m.Model_ID = e.Model_ID
        LEFT JOIN [DocuzoneDev].[dbo].[Document_Table] d ON e.Execution_ID = d.Execution_ID 
    """
    
    join_conditions = []
    if start_date:
        join_conditions.append("d.Created_Date >= ?")
        params.insert(0, start_date)
    if end_date:
        join_conditions.append("d.Created_Date <= ?")
        params.insert(len(join_conditions) - 1 if start_date else 0, end_date)
        
    if join_conditions:
        query += " AND " + " AND ".join(join_conditions)
        
    query += """
        WHERE p.Customer_ID = ?
        GROUP BY p.Project_Name, m.Model_ID, m.Model_Name
    """
    
    # Wait, the params order for the above string concatenation is tricky.
    # Let's do it safely:
    
    query = """
        SELECT
            p.Project_Name,
            m.Model_ID,
            m.Model_Name,
            COUNT(d.Doc_ID) as Total_Documents,
            SUM(ISNULL(d.Page_Count, 0)) as Total_Pages
        FROM [DocuzoneDev].[dbo].[Project] p
        INNER JOIN [DocuzoneDev].[dbo].[Model] m ON p.Project_ID = m.Project_ID
        LEFT JOIN [DocuzoneDev].[dbo].[Execution_Master] e ON m.Model_ID = e.Model_ID
        LEFT JOIN [DocuzoneDev].[dbo].[Document_Table] d ON e.Execution_ID = d.Execution_ID 
    """
    
    params = []
    if start_date:
        query += " AND d.Created_Date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND d.Created_Date <= ?"
        params.append(end_date)
        
    query += """
        WHERE p.Customer_ID = ?
        GROUP BY p.Project_Name, m.Model_ID, m.Model_Name
    """
    params.append(customer_id)

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    return [row_to_dict(cursor, row) for row in rows]

@app.get("/api/models/{model_id}/billing-chart", response_model=List[schemas.BillingChartResponse])
def get_billing_chart(model_id: int, start_date: str = None, end_date: str = None, db = Depends(get_db)):
    cursor = db.cursor()
    
    query = """
        SELECT
            FORMAT(d.Created_Date, 'yyyy-MM-dd') as Date,
            COUNT(d.Doc_ID) as Total_Documents,
            SUM(ISNULL(d.Page_Count, 0)) as Total_Pages
        FROM [DocuzoneDev].[dbo].[Execution_Master] e
        INNER JOIN [DocuzoneDev].[dbo].[Document_Table] d ON e.Execution_ID = d.Execution_ID
        WHERE e.Model_ID = ?
    """
    params = [model_id]
    
    if start_date:
        query += " AND d.Created_Date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND d.Created_Date <= ?"
        params.append(end_date)
        
    query += """
        GROUP BY FORMAT(d.Created_Date, 'yyyy-MM-dd')
        ORDER BY Date ASC
    """

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    return [row_to_dict(cursor, row) for row in rows]

