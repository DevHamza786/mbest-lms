# API Integration Complete - Migration Guide

## ✅ Completed

### 1. API Service Layer Created
- ✅ `src/lib/api/client.ts` - Base API client with authentication
- ✅ `src/lib/api/auth.ts` - Authentication API service
- ✅ `src/lib/api/common.ts` - Common APIs (Messages, Notifications, Resources, Profile)
- ✅ `src/lib/api/parent.ts` - Parent API service
- ✅ `src/lib/api/student.ts` - Student API service
- ✅ `src/lib/api/tutor.ts` - Tutor API service
- ✅ `src/lib/api/admin.ts` - Admin API service
- ✅ `src/lib/api/index.ts` - Centralized exports

### 2. Auth Store Updated
- ✅ Updated `src/lib/store/authStore.ts` to use real API
- ✅ Token management integrated
- ✅ Session hydration from API

### 3. Environment Configuration
- ✅ Created `.env.example` file

## 🔄 Next Steps - Update Pages

### Parent Pages
Update these files to use `parentApi` instead of `parentService` from mocks:

1. **ParentDashboard.tsx**
   ```typescript
   // Replace:
   import { parentService } from '@/lib/mocks/parent';
   // With:
   import { parentApi } from '@/lib/api';
   
   // Update data fetching:
   const children = await parentApi.getChildren();
   const stats = await parentApi.getChildStats(childId);
   ```

2. **ParentClasses.tsx** - Use `parentApi.getChildClasses()`
3. **ParentAssignments.tsx** - Use `parentApi.getChildAssignments()`
4. **ParentGrades.tsx** - Use `parentApi.getChildGrades()`
5. **ParentBilling.tsx** - Use `parentApi.getInvoices()`
6. **ParentAttendance.tsx** - Use `parentApi.getChildAttendance()`
7. **ParentLessonHistory.tsx** - Use `parentApi.getChildSessions()`
8. **ParentMessages.tsx** - Use `commonApi.messages`
9. **ParentNotifications.tsx** - Use `commonApi.notifications`
10. **ParentResources.tsx** - Use `commonApi.resources`

### Student Pages
Update to use `studentApi`:

1. **StudentDashboard.tsx** - `studentApi.getDashboard()`
2. **StudentClasses.tsx** - `studentApi.getClasses()`, `studentApi.enrollInClass()`
3. **StudentAssignments.tsx** - `studentApi.getAssignments()`, `studentApi.submitAssignment()`
4. **StudentGrades.tsx** - `studentApi.getGrades()`
5. **StudentAttendance.tsx** - `studentApi.getAttendance()`
6. **StudentMessaging.tsx** - `commonApi.messages`
7. **StudentResources.tsx** - `commonApi.resources`
8. **StudentProfile.tsx** - `commonApi.profile`

### Tutor Pages
Update to use `tutorApi`:

1. **TutorDashboard.tsx** - `tutorApi.getDashboard()`
2. **TutorCalendar.tsx** - `tutorApi.getSessions()`, `tutorApi.createSession()`
3. **TutorClasses.tsx** - `tutorApi.getClasses()`, `tutorApi.getClassStudents()`
4. **TutorAssignments.tsx** - `tutorApi.getAssignments()`, `tutorApi.gradeSubmission()`
5. **TutorStudents.tsx** - `tutorApi.getStudents()`, `tutorApi.getStudentGrades()`
6. **TutorAvailability.tsx** - `tutorApi.getAvailability()`, `tutorApi.setAvailability()`
7. **TutorAttendance.tsx** - `tutorApi.getAttendance()`
8. **TutorHours.tsx** - `tutorApi.getHoursWorked()`, `tutorApi.getInvoices()`
9. **TutorLessonHistory.tsx** - `tutorApi.getLessonHistory()`

### Admin Pages
Update to use `adminApi`:

1. **AdminDashboard.tsx** - `adminApi.getDashboard()`
2. **AdminUsers.tsx** - `adminApi.getUsers()`, `adminApi.createUser()`, etc.
3. **AdminClasses.tsx** - `adminApi.getClasses()`, `adminApi.createClass()`, etc.
4. **AdminBilling.tsx** - `adminApi.getInvoices()`, `adminApi.createInvoice()`
5. **AdminAnalytics.tsx** - `adminApi.getAnalytics()`
6. **AdminCalendar.tsx** - `adminApi.getSessions()`
7. **AdminAttendance.tsx** - `adminApi.getAttendance()`, `adminApi.updateAttendance()`

### Common Components
Update to use `commonApi`:

1. **NotificationCenter.tsx** - `commonApi.notifications`
2. **ChatWidget.tsx** - `commonApi.messages`
3. **ProfileSettings.tsx** - `commonApi.profile`

## 🗑️ Files to Remove

After updating all pages, remove these mock data files:

1. `src/lib/mocks/auth.ts`
2. `src/lib/mocks/parent.ts`
3. `src/lib/mocks/utils.ts`
4. `src/data/assignments.json`
5. `src/data/classes.json`
6. `src/data/invoices.json`
7. `src/data/messages.json`
8. `src/data/resources.json`
9. `src/data/users.json`

## 📝 Example Page Update Pattern

### Before (Mock Data):
```typescript
import { parentService } from '@/lib/mocks/parent';

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  
  useEffect(() => {
    parentService.getChildren().then(setChildren);
  }, []);
  
  // ...
};
```

### After (Real API):
```typescript
import { parentApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query'; // If using React Query

const ParentDashboard = () => {
  const { data: children = [], isLoading } = useQuery({
    queryKey: ['parent', 'children'],
    queryFn: () => parentApi.getChildren(),
  });
  
  // Or with useState/useEffect:
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    parentApi.getChildren()
      .then(setChildren)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);
  
  // ...
};
```

## 🔧 Configuration

### Environment Variables
Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### CORS Setup
Ensure backend CORS is configured to allow frontend origin:
```php
// config/cors.php
'allowed_origins' => ['http://localhost:8080'],
```

## ✅ Testing Checklist

- [ ] Login/Logout works
- [ ] Token is stored and sent with requests
- [ ] 401 errors redirect to login
- [ ] All parent pages load data
- [ ] All student pages load data
- [ ] All tutor pages load data
- [ ] All admin pages load data
- [ ] File uploads work (assignments, avatars, resources)
- [ ] Error handling works
- [ ] Loading states display correctly

## 🚀 Quick Start

1. **Set environment variable:**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

2. **Start backend:**
   ```bash
   cd mbest-backend/laravel
   php artisan serve
   ```

3. **Start frontend:**
   ```bash
   cd mbest-frontend
   npm run dev
   ```

4. **Test login:**
   - Use credentials from seeder: `admin@mbest.com` / `password123`

## 📚 API Documentation

All API endpoints are documented in:
- `mbest-backend/ALL_APIS_CREATED.md`
- `mbest-backend/API_ENDPOINTS_REFERENCE.md`
- Postman Collection: `mbest-backend/MBEST_API.postman_collection.json`

