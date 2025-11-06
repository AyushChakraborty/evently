"""
endpoints for club member facing actions
handles login, event creation, and booking venues
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.db import get_db

# Import from your existing student router
from backend.routers.student import StudentLogin, pwd_context


class ClubLogin(StudentLogin):
    pass


class EventCreate(BaseModel):
    event_name: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime


class BookingRequest(BaseModel):
    event_id: int
    venue_id: int


# NEW: Pydantic models for the new endpoints
class Venue(BaseModel):
    venue_id: int
    venue_name: str
    location: Optional[str] = None
    capacity: int


class EventBasic(BaseModel):
    event_id: int
    event_name: str


router = APIRouter(prefix="/club", tags=["Club"])


@router.post("/login")
def login_club_member(login_data: ClubLogin, db: Session = Depends(get_db)):
    """
    verify club member's creds and role
    """
    try:
        user = db.execute(
            text(
                """
                SELECT u.user_id, u.first_name, u.password_hash, r.role_name,
                       cm.club_id, c.club_name
                FROM users u
                JOIN roles r ON u.role_id = r.role_id
                LEFT JOIN club_memberships cm ON u.user_id = cm.user_id
                LEFT JOIN clubs c ON cm.club_id = c.club_id
                WHERE u.email = :email;
                """
            ),
            {"email": login_data.email},
        ).fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not pwd_context.verify(login_data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid password")

        if user.role_name.lower() != "club member":
            raise HTTPException(status_code=403, detail="User is not a Club Member")

        if not user.club_id:
            raise HTTPException(
                status_code=403, detail="Club Member is not assigned to any club"
            )

        return {
            "message": f"Welcome, {user.first_name}!",
            "user_id": user.user_id,
            "role": user.role_name,
            "club_id": user.club_id,
            "club_name": user.club_name,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}") from e


@router.post("/{club_id}/events")
def create_event(
    club_id: int,
    event_data: EventCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new event for a club.
    """
    try:
        db.execute(
            text(
                """
                INSERT INTO events (event_name, description, start_time, end_time, club_id)
                VALUES (:event_name, :description, :start_time, :end_time, :club_id);
                """
            ),
            {
                "event_name": event_data.event_name,
                "description": event_data.description,
                "start_time": event_data.start_time,
                "end_time": event_data.end_time,
                "club_id": club_id,
            },
        )

        # Get the last inserted ID
        event_id_result = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()
        if event_id_result is None or event_id_result[0] is None:
            raise Exception("Could not retrieve new event ID after insert.")

        event_id = event_id_result[0]

        db.commit()

        return {"message": "Event created successfully", "event_id": event_id}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}") from e


@router.post("/bookings")
def request_venue_booking(
    booking_data: BookingRequest, requested_by: int, db: Session = Depends(get_db)
):
    """
    Request a venue booking for an event.
    'requested_by' should be the user_id of the club member (as a query param).
    """
    try:
        # Check if user is a club member
        user_check = db.execute(
            text(
                "SELECT role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = :user_id"
            ),
            {"user_id": requested_by},
        ).fetchone()

        if not user_check or user_check.role_name.lower() != "club member":
            raise HTTPException(
                status_code=403, detail="Requesting user is not a club member"
            )

        db.execute(
            text(
                """
                INSERT INTO bookings (event_id, venue_id, requested_by, status)
                VALUES (:event_id, :venue_id, :requested_by, 'Pending');
                """
            ),
            {
                "event_id": booking_data.event_id,
                "venue_id": booking_data.venue_id,
                "requested_by": requested_by,
            },
        )
        db.commit()
        return {"message": "Booking requested successfully. Awaiting admin approval."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}") from e


@router.get("/{club_id}/events")
def get_club_events(club_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    """
    Get all events (past and future) for a specific club.
    """
    try:
        events = db.execute(
            text(
                """
                SELECT 
                    e.event_id, e.event_name, e.description, e.start_time, e.end_time,
                    v.venue_name, b.status AS booking_status,
                    fn_GetAttendeeCount(e.event_id) AS attendee_count
                FROM events e
                LEFT JOIN bookings b ON e.event_id = b.event_id
                LEFT JOIN venues v ON b.venue_id = v.venue_id
                WHERE e.club_id = :club_id
                ORDER BY e.start_time DESC;
                """
            ),
            {"club_id": club_id},
        ).fetchall()

        events_list = [dict(row._mapping) for row in events]
        return events_list

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}") from e


# ---
# NEW ENDPOINTS FOR BOOKING FORM
# ---


@router.get("/venues", response_model=List[Venue])
def get_all_venues(db: Session = Depends(get_db)):
    """
    Get a list of all venues for the booking form.
    """
    try:
        venues = db.execute(
            text(
                "SELECT venue_id, venue_name, location, capacity FROM venues ORDER BY venue_name"
            )
        ).fetchall()
        return venues
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}") from e


@router.get("/{club_id}/events/unbooked", response_model=List[EventBasic])
def get_unbooked_events(club_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    """
    Get a list of events for this club that do not have a booking.
    """
    try:
        events = db.execute(
            text(
                """
                SELECT e.event_id, e.event_name
                FROM events e
                LEFT JOIN bookings b ON e.event_id = b.event_id
                WHERE e.club_id = :club_id
                  AND (b.booking_id IS NULL OR b.status = 'Rejected')
                ORDER BY e.start_time DESC;
                """
            ),
            {"club_id": club_id},
        ).fetchall()
        return events
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}") from e
