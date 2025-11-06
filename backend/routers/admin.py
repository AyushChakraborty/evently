"""
endpoints for admin facing actions
handles login, booking approval, and system overview
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.routers.student import StudentLogin, pwd_context


class AdminLogin(StudentLogin):
    pass


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/login")
def login_admin(login_data: AdminLogin, db: Session = Depends(get_db)):
    """
    verify admin's creds and role
    """
    try:
        user = db.execute(
            text(
                """
                SELECT u.user_id, u.first_name, u.password_hash, r.role_name
                FROM users u
                JOIN roles r ON u.role_id = r.role_id
                WHERE u.email = :email;
                """
            ),
            {"email": login_data.email},
        ).fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not pwd_context.verify(login_data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid password")

        if user.role_name.lower() != "admin":
            raise HTTPException(status_code=403, detail="User is not an Admin")

        return {
            "message": f"Welcome, {user.first_name}!",
            "user_id": user.user_id,
            "role": user.role_name,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}") from e


@router.get("/bookings/pending")
def get_pending_bookings(db: Session = Depends(get_db)):
    """
    Get a list of all pending venue bookings for admin review.
    """
    try:
        pending = db.execute(
            text(
                """
                SELECT 
                    b.booking_id, 
                    e.event_name, e.start_time, e.end_time,
                    v.venue_name, v.capacity,
                    c.club_name,
                    u.first_name AS requested_by_name,
                    fn_CheckVenueAvailability(v.venue_id, e.start_time, e.end_time) AS is_available
                FROM bookings b
                JOIN events e ON b.event_id = e.event_id
                JOIN venues v ON b.venue_id = v.venue_id
                JOIN clubs c ON e.club_id = c.club_id
                JOIN users u ON b.requested_by = u.user_id
                WHERE b.status = 'Pending'
                ORDER BY b.request_timestamp ASC;
                """
            )
        ).fetchall()

        pending_list = [dict(row._mapping) for row in pending]
        return pending_list

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}") from e


@router.post("/bookings/{booking_id}/approve")
def approve_booking(booking_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    """
    Approve a pending booking using the stored procedure.
    This will auto-reject if there is a conflict.
    """
    try:
        result = db.execute(
            text("CALL sp_ApproveBooking(:b_id)"), {"b_id": booking_id}
        ).fetchone()

        db.commit()

        if not result:
            raise HTTPException(
                status_code=500, detail="Stored procedure did not return a message."
            )

        if "Error" in result.message:
            raise HTTPException(status_code=400, detail=result.message)

        if "rejected" in result.message.lower():
            return {"message": result.message, "status": "Rejected"}

        return {"message": result.message, "status": "Approved"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}") from e


@router.post("/bookings/{booking_id}/reject")
def reject_booking(booking_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    """
    Manually reject a pending booking.
    """
    try:
        db.execute(
            text(
                "UPDATE bookings SET status = 'Rejected' WHERE booking_id = :b_id AND status = 'Pending'"
            ),
            {"b_id": booking_id},
        )
        db.commit()
        return {"message": "Booking manually rejected", "status": "Rejected"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}") from e


@router.get("/audit_log")
def get_audit_log(db: Session = Depends(get_db)):
    """
    Get the 50 most recent audit log entries.
    """
    try:
        logs = db.execute(
            text("SELECT * FROM audit_log ORDER BY log_timestamp DESC LIMIT 50")
        ).fetchall()

        log_list = [dict(row._mapping) for row in logs]
        return log_list
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}") from e
