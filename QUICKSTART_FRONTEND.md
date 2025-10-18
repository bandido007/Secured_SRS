# Quick Start Guide - Frontend

## Current Status

✅ **Frontend Server**: Running on http://localhost:3000
✅ **Backend Server**: Should be running on http://localhost:8000
✅ **Database**: PostgreSQL with test data
✅ **All Components**: Built and ready

## Access the Application

### Open in Browser
```
http://localhost:3000
```

You'll be redirected to the login page.

## Test Credentials

### Login as Admin
```
Username: signalmtaalam
Password: [your password]
```
**After login, you'll see:**
- System overview dashboard
- Statistics for students, lecturers, courses, grades
- Recent activity feed
- System health monitoring

### Login as Lecturer
```
Username: [any lecturer username from backend]
Password: [your password]
```
**After login, you'll see:**
- Your courses dashboard
- Grade submission interface
- Pending grades to verify
- Recent submissions

### Login as Student
```
Username: [any student username from backend]
Password: [your password]
```
**After login, you'll see:**
- Your academic progress
- Enrolled courses
- Your grades (pending and official)
- GPA and credits

## Demo Flow for Presentation

### 1. Start at Login Page (2 minutes)
**Highlight:**
- Clean, modern design
- Blockchain security messaging
- Professional branding with logo
- Smooth animations

**Show:**
- Enter credentials
- Loading state during authentication
- Automatic role-based redirect

### 2. Admin Dashboard (3 minutes)
**Highlight:**
- System overview with real-time stats
- Color-coded stat cards
- Recent activity feed
- System health indicators (Blockchain, IPFS)
- Grade integrity metrics

**Navigate:**
- Click sidebar links to show navigation
- Emphasize role-based access control

### 3. Lecturer Dashboard (4 minutes)
**Highlight:**
- Course management overview
- Student counts per course
- Pending grades requiring action
- Verified grades history

**Demonstrate:**
- "Submit Grades" button for new submissions
- "Verify" buttons on pending grades
- Blockchain verification workflow

### 4. Student Dashboard (3 minutes)
**Highlight:**
- Academic progress visualization
- GPA and credits display
- Enrolled courses
- Grade status (Pending vs Official)
- Blockchain verification badges

**Show:**
- Official grades with green badges (blockchain-verified)
- Pending grades with orange badges
- "Generate Transcript" functionality

### 5. Key Features to Emphasize (3 minutes)
- **Security**: All official grades are blockchain-verified
- **Transparency**: Students see verification status
- **Immutability**: Official grades cannot be changed
- **Audit Trail**: Complete history of all actions
- **Modern UI**: Clean, professional, presentation-ready

## Troubleshooting

### Frontend not loading?
```bash
cd frontend
npm run dev
```

### Backend not responding?
```bash
cd ..
python manage.py runserver
```

### Can't login?
1. Check backend is running: `http://localhost:8000/api/auth/login`
2. Verify credentials in Django admin
3. Check browser console for errors

### API errors?
1. Open browser DevTools (F12)
2. Check Network tab for failed requests
3. Verify CORS settings in Django backend

## Presentation Tips

### Visual Flow
1. **Start clean** - Show login page
2. **Role progression** - Admin → Lecturer → Student
3. **Feature deep-dive** - Pick one role and go deep
4. **Security emphasis** - Highlight blockchain badges
5. **End strong** - Return to system overview

### Key Talking Points
- "Blockchain-secured academic records"
- "Role-based access control for security"
- "Immutable, verifiable grades"
- "Modern, intuitive interface"
- "Production-ready architecture"

### Technical Highlights for Developers
- React 18 + TypeScript
- TailwindCSS for styling
- JWT authentication
- Automatic token refresh
- Type-safe API integration
- Component-based architecture

### Business Highlights for Stakeholders
- "Eliminates grade tampering"
- "Complete audit trail"
- "Student trust through transparency"
- "Easy to use for all roles"
- "Scalable architecture"

## Screenshots to Take

For your presentation deck, capture:
1. **Login page** - First impression
2. **Admin dashboard** - System overview
3. **Lecturer dashboard** - Grade submission
4. **Student dashboard** - Grade viewing
5. **Blockchain badge** - Security feature
6. **Navigation sidebar** - User experience

## Live Demo Checklist

Before presenting:
- [ ] Both servers running (frontend + backend)
- [ ] Test all three user roles
- [ ] Browser cache cleared
- [ ] Full screen browser mode
- [ ] Close unnecessary tabs
- [ ] Zoom level at 100% or 125%
- [ ] Prepare fallback credentials
- [ ] Have backup plan (screenshots/video)

## Quick Commands

### Start Everything
```bash
# Terminal 1 - Backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Stop Everything
```bash
# Press Ctrl+C in both terminals
```

### Restart Frontend Only
```bash
cd frontend
pkill -f "vite"
npm run dev
```

## Support During Presentation

If something breaks:
1. **Have screenshots ready** as fallback
2. **Know your test credentials** by heart
3. **Browser refresh** fixes most UI issues
4. **Check backend logs** for API errors
5. **Stay calm** - explain the feature theoretically

## Post-Presentation

Share with stakeholders:
- Live demo URL (if deployed)
- GitHub repository
- README.md for technical details
- API documentation
- Architecture diagrams

## Next Steps After Approval

1. Deploy to staging environment
2. Add more detailed pages (lists, forms)
3. Implement search and filtering
4. Add data export features
5. Create admin user management UI
6. Build grade submission form
7. Implement transcript viewer
8. Add analytics and charts

---

**You're all set! Open http://localhost:3000 and start your demo!** 🚀
