# 🎟️ Evently

_A University Event Booking and Management Web Application_

> **Final Project** for the **Database Management Systems (DBMS)** course.

---

## Tech Stack

**Frontend:** React (Vite) + Tailwind CSS + Axios  
**Backend:** Python + FastAPI + SQLAlchemy  
**Database:** MySQL (hosted on Railway)

---

## Database Hosting Notes

This project uses **Railway’s free tier** for database hosting.

> **Note:** The database container may go to sleep if inactive(may happen in the future).  
> If the app fails to load data, please wait **~30 seconds** for the DB to wake up and try again.

---

## User Roles & Application Pages

Evently provides **three distinct user roles**, each with dedicated login and dashboard pages:

### Student

- **Login:** `/student-login`
- **Signup:** `/student-signup`
- **Dashboard:** `/student-dashboard`
- **Features:**
  - View all upcoming university events.
  - View a list of registered events.
  - Register for available events using the stored procedure `sp_RegisterForEvent`.

---

### Club Member

- **Login:** `/club-login`
- **Dashboard:** `/club-dashboard`
- **Features:**
  - Create new events for their respective club.
  - Request venue bookings for newly created events.
  - View all club events and booking statuses:
    - `Pending`
    - `Approved`
    - `Rejected`

---

### Admin

- **Login:** `/admin-login`
- **Dashboard:** `/admin-dashboard`
- **Features:**
  - View all pending venue booking requests from all clubs.
  - Approve or reject venue bookings.
    - Approvals use `sp_ApproveBooking`, which calls `fn_CheckVenueAvailability` to prevent scheduling conflicts.
  - View the **system-wide audit log**.

---

## ⚙️ Local Development Setup

### Backend Setup

1. Obtain the `.env` file (containing secrets).
2. From the project **root directory**, run:

   ```bash
   # (Ensure your Python virtual environment is active)
   pip install -r requirements.txt
   uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

```bash
npm install
npm run dev
```

## Troubleshooting

If the frontend build is slow, unresponsive, or fails to start, try the following steps:

```bash
# Run from ./frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run dev -- --force
```
