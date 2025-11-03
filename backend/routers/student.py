"""
endpoints for student facing actions
handles signup, login, event interactions
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.db import get_db

##########signup###############


class StudentSignup(BaseModel):
    """
    class for the data coming from the user"""

    first_name: str
    last_name: str
    email: EmailStr
    password: str
    phone: str
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_pincode: Optional[str] = None


router = APIRouter(prefix="/student", tags=["Student"])

# password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/signup")
def signup_student(student_data: StudentSignup, db: Session = Depends(get_db)):
    """
    create a new student user
    """
    try:
        hashed_pw = pwd_context.hash(student_data.password)  # hash the password
        # what will be stored in the table is the hashed password

        db.execute(
            text(
                """
                     INSERT INTO users 
                     (first_name, last_name, email, password_hash, address_street,
                     address_city, address_pincode, role_id) VALUES 
                     (:first_name, :last_name, :email, :password_hash,
                     :address_street, :address_city, :address_pincode,
                     (SELECT role_id FROM roles WHERE role_name = 'Student'));
                     """
            ),
            {
                "first_name": student_data.first_name,
                "last_name": student_data.last_name,
                "email": student_data.email,
                "password_hash": hashed_pw,
                "address_street": student_data.address_street,
                "address_city": student_data.address_city,
                "address_pincode": student_data.address_pincode,
            },
        )
        # add user phone number in user_phone_numbers table, since it
        # is actually a multivalued attributed
        db.execute(
            text(
                """
                        INSERT INTO user_phone_numbers (user_id, phone_number)
                        VALUES ((SELECT user_id FROM users WHERE email = :email), :phone);
                        """
            ),
            {"email": student_data.email, "phone": student_data.phone},
        )
        # email is unique and hence can be used in the selection of user_id

        db.commit()
        return {"message": "signup successful"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400, detail=f"error: {str(e)}"
        ) from e  # exception chaining,
        # from says that a new exception (HTTPException) is raised but it was caused by this earlier
        # exception e. Useful for debugging


#########login#####
class StudentLogin(BaseModel):
    """
    class for data coming from user during login
    """

    email: EmailStr
    password: str


@router.post("/login")
def login_student(login_data: StudentLogin, db: Session = Depends(get_db)):
    """
    verify student's creds and role, given the user only gives
    in the email and pass
    """
    try:
        result = db.execute(
            text(
                """
                     SELECT u.user_id, u.first_name, u.last_name, u.password_hash, r.role_name
                     FROM users u
                     JOIN roles r ON u.role_id = r.role_id
                     WHERE u.email = :email;
                     """
            ),
            {"email": login_data.email},
        ).fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="user not found")

        # check if the password is same by checking password entered by
        # user and that fetched from db, which is the right one
        if not pwd_context.verify(login_data.password, result.password_hash):
            # 401: unauthorised client error
            raise HTTPException(status_code=401, detail="invalid password")

        # ensure the role is student
        if result.role_name.lower() != "student":
            # 403: forbidden client error, changing authentication does not help here
            raise HTTPException(status_code=403, detail="user is not a student")

        return {
            "message": f"welcome, {result.first_name}!",
            "user_id": result.user_id,
            "role": result.role_name,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"error: {str(e)}") from e


#######get events###########
@router.get("/{student_id}/events")
def get_all_events_for_students(
    student_id: int = Path(..., gt=0), db: Session = Depends(get_db)
):
    """
    return all upcoming events for a student
    """

    try:
        # verify the student exists
        result = db.execute(
            text(
                """
        SELECT u.user_id, r.role_name
        FROM users u 
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.user_id = :student_id;
        """
            ),
            {"student_id": student_id},
        ).fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="student not found")
        if result.role_name.lower() != "student":
            raise HTTPException(status_code=403, detail="user is not a student")

        # fetch all upcoming events
        events = db.execute(
            text(
                """
        SELECT e.event_id, e.event_name, e.description, e.start_time, e.end_time, c.club_name, v.venue_name, v.location
        FROM events e JOIN clubs c ON e.club_id = c.club_id
        LEFT JOIN bookings b ON e.event_id = b.event_id AND b.status = 'Approved'
        LEFT JOIN venues v ON b.venue_id = v.venue_id
        WHERE e.start_time >= NOW()
        ORDER BY e.start_time ASC;
        """
            )
        ).fetchall()

        # convert to json
        events_list = [
            {
                "event_id": row.event_id,
                "event_name": row.event_name,
                "description": row.description,
                "start_time": row.start_time,
                "end_time": row.end_time,
                "club_name": row.club_name,
                "venue_name": row.venue_name,
                "venue_location": row.location,
            }
            for row in events
        ]

        return {"student_id": student_id, "events": events_list}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"error: {str(e)}") from e


#########get all registrations###
@router.get("/{student_id}/registrations")
def get_registered_events(
    student_id: int = Path(..., gt=0), db: Session = Depends(get_db)
):
    """
    select all the registrations by the student
    """

    # check if the student is present first
    try:
        result = db.execute(
            text(
                """
            SELECT u.user_id, r.role_name
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.user_id = :student_id
            """
            ),
            {"student_id": student_id},
        ).fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="student not found")
        if result.role_name.lower() != "student":
            raise HTTPException(status_code=403, detail="user not a student")

        events = db.execute(
            text(
                """
            SELECT e.event_id, e.event_name, e.description, e.start_time, e.end_time, c.club_name, v.venue_name, v.location
            FROM attendees a        
            JOIN events e ON a.event_id = e.event_id    
            JOIN clubs c ON e.club_id = c.club_id    
            LEFT JOIN bookings b ON e.event_id = b.event_id AND b.status = 'Approved'
            LEFT JOIN venues v ON b.venue_id = v.venue_id
            WHERE a.user_id = :student_id
            ORDER BY e.start_time ASC;
            """
            ),
            {"student_id": student_id},
        ).fetchall()

        # convert to json
        events_list = [
            {
                "event_id": row.event_id,
                "event_name": row.event_name,
                "description": row.description,
                "start_time": row.start_time,
                "end_time": row.end_time,
                "club_name": row.club_name,
                "venue_name": row.venue_name,
                "venue_location": row.location,
            }
            for row in events
        ]

        return events_list

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"error: {str(e)}") from e


######register for event#####
@router.post("/{student_id}/register/{event_id}")
def register_for_event(
    student_id: int = Path(..., gt=0),
    event_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
):
    """
    Register a student for an event by calling the stored procedure.
    """
    try:
        result = db.execute(
            text("CALL sp_RegisterForEvent(:u_id, :e_id)"),
            {"u_id": student_id, "e_id": event_id},
        ).fetchone()

        db.commit()

        if result and "Error" in result.message:
            raise HTTPException(status_code=409, detail=result.message)

        return {"message": "Registration successful."}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"error: {str(e)}") from e
