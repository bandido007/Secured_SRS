# 🧪 **Secured SRS - API Testing Guide**

## 📋 **Table of Contents**
1. [Setup & Prerequisites](#setup--prerequisites)
2. [Authentication Endpoints](#1-authentication-endpoints)
3. [Account Management Endpoints](#2-account-management-endpoints)
4. [Authorization Endpoints](#3-authorization-endpoints)
5. [Email Templates](#4-email-templates)
6. [Testing Workflow](#5-testing-workflow)

---

## **Setup & Prerequisites**

### **1. Start the Server**
```bash
# Make sure you're in venv
source venv/bin/activate

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Seed roles and permissions
python manage.py seed_permissions

# Start server
python manage.py runserver 0.0.0.0:8000
```

### **2. Access API Documentation**
## creating superuser
python manage.py createsuperuser

- **Scalar API Docs**: http://localhost:8000/api/docs
- **Admin Panel**: http://localhost:8000/admin (admin/admin123)

### **3. Default Test Credentials**
```
Username: admin
Password: admin123
Email: admin@example.com
```

---

## **1. Authentication Endpoints**

### **🔐 POST /api/auth/login**
**Purpose**: Login with username/password
**Layer Flow**: API → Authentication → Authorization → Response

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success):**
```json
{
  "refresh": "eyJhbG...encrypted_token",
  "access": "eyJhbG...encrypted_token",
  "expires": 86400,
  "user": {
    "id": "1",
    "userName": "admin",
    "email": "admin@example.com",
    "roles": [
      {
        "roleName": "ADMIN",
        "permissions": [
          "can_manage_roles",
          "can_manage_users",
          "can_manage_analysis",
          ...
        ]
      }
    ]
  }
}
```

**Response (Failed - Invalid Credentials):**
```json
{
  "detail": "Invalid credentials"
}
```

**Response (Failed - Rate Limited):**
```json
{
  "error": "user_blocked",
  "code": 403,
  "detail": "User is blocked. Please try again after 300 seconds"
}
```

**What This Tests:**
- ✅ AuthenticationService.authenticate_with_credentials()
- ✅ AuthorizationService.get_user_roles()
- ✅ Rate limiting (LoginAttemptsMiddleware)
- ✅ Token encryption (AESCipher)
- ✅ Layer separation (Auth returns tokens, Authz returns roles)

---

### **🔐 POST /api/auth/login_with_google**
**Purpose**: Login with Google OAuth
**Layer Flow**: API → GoogleAuth → UserManagement → Authentication → Authorization

**Request:**
```json
{
  "jwtToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
}
```

**Response (Success):**
```json
{
  "refresh": "eyJhbG...encrypted_token",
  "access": "eyJhbG...encrypted_token",
  "expires": 86400,
  "user": {
    "id": "2",
    "userName": "user@gmail.com",
    "email": "user@gmail.com",
    "roles": [
      {
        "roleName": "NORMAL_USER",
        "permissions": []
      }
    ]
  }
}
```

**What This Tests:**
- ✅ GoogleAuth.verify_and_get_user_info() - JWT signature verification
- ✅ UserManagementService.create_or_update_user_from_google()
- ✅ Auto user creation for OAuth users
- ✅ Default role assignment

**Note:** Requires valid Google JWT token. Get one from Google OAuth playground or frontend.

---

### **👤 GET /api/auth/me**
**Purpose**: Get current authenticated user info
**Requires**: Bearer token in Authorization header

**Request Headers:**
```
Authorization: Bearer eyJhbG...your_access_token
```

**Response:**
```json
{
  "user": {
    "id": "1",
    "userName": "admin",
    "email": "admin@example.com",
    "firstName": "admin",
    "lastName": "admin"
  },
  "roles": [
    {
      "roleName": "ADMIN",
      "permissions": ["can_manage_roles", ...]
    }
  ],
  "permissions": [
    "can_manage_roles",
    "can_manage_users",
    "can_manage_analysis"
  ]
}
```

**What This Tests:**
- ✅ PermissionAuth decorator (token validation)
- ✅ AuthenticationService.validate_token()
- ✅ AuthorizationService.get_user_roles()
- ✅ AuthorizationService.get_user_permissions()

---

## **2. Account Management Endpoints**

### **📝 POST /api/accounts/register**
**Purpose**: Register new user account
**Email Template**: `templates/email/verify_account.html`

**Request:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Response (Success):**
```json
{
  "id": 1,
  "status": true,
  "message": "Registration Was Successfully",
  "code": 9001
}
```

**Response (Failed - User Exists):**
```json
{
  "id": 2,
  "status": false,
  "message": "A user with this Email Already Exits",
  "code": 9002
}
```

**What Happens:**
1. ✅ Validates username format (lowercase, letters, numbers, underscores)
2. ✅ Validates email format
3. ✅ Checks password confirmation
4. ✅ Creates User via UserManagementService
5. ✅ Creates UserProfile
6. ✅ Assigns default NORMAL_USER role
7. ✅ Creates activation token
8. ✅ **Sends email** using `verify_account.html`

**Email Template Variables:**
- `data.user.email` - User's email
- `data.url` - Activation link (e.g., http://frontend.com/auth/verify-account?token=abc123)

---

### **✅ POST /api/accounts/verify_account**
**Purpose**: Verify email address with token

**Request:**
```json
{
  "token": "abc123xyz..."
}
```

**Response (Success):**
```json
{
  "id": 1,
  "status": true,
  "message": "Account verified Successfully You can now Login",
  "code": 9001
}
```

**Response (Already Verified):**
```json
{
  "id": 1,
  "status": true,
  "message": "Account Already Verified",
  "code": 9001
}
```

**What This Tests:**
- ✅ Token validation
- ✅ Account activation flow
- ✅ Idempotency (can verify multiple times)

---

### **🔑 POST /api/accounts/forgot_pass_token**
**Purpose**: Request password reset
**Email Template**: `templates/email/forgot_password.html`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Always Same for Security):**
```json
{
  "id": 1,
  "status": true,
  "message": "if this account is valid An Email will Be Sent To you",
  "code": 9001
}
```

**What Happens:**
1. ✅ Looks up user by email
2. ✅ Creates ForgotPasswordRequestUser token
3. ✅ **Sends email** using `forgot_password.html`
4. ✅ Returns generic message (security best practice)

**Email Template Variables:**
- `data.user.email` - User's email
- `data.url` - Password reset link (e.g., http://frontend.com/password-set/token123)

---

### **🔐 POST /api/accounts/forgot_pass**
**Purpose**: Reset password with token

**Request:**
```json
{
  "token": "reset_token_here",
  "newPassword": "NewSecure123!",
  "confirmNewPassword": "NewSecure123!"
}
```

**Response (Success):**
```json
{
  "id": 1,
  "status": true,
  "message": "Operation successfully executed",
  "code": 9001
}
```

**Response (Failed - Invalid Token):**
```json
{
  "id": 2,
  "status": false,
  "message": "invalid Token",
  "code": 9002
}
```

**Response (Failed - Used Token):**
```json
{
  "id": 2,
  "status": false,
  "message": "Token Expired Request Another Token Or has Been Used",
  "code": 9002
}
```

---

### **🔒 POST /api/accounts/change_password**
**Purpose**: Change password (requires authentication)
**Requires**: Bearer token

**Request Headers:**
```
Authorization: Bearer your_access_token
```

**Request:**
```json
{
  "oldPassword": "admin123",
  "newPassword": "NewAdmin456!",
  "confirmNewPassword": "NewAdmin456!"
}
```

**Response (Success):**
```json
{
  "id": 1,
  "status": true,
  "message": "Operation successfully executed",
  "code": 9001
}
```

**Response (Failed - Wrong Old Password):**
```json
{
  "id": 2,
  "status": false,
  "message": "Old Password is Incorrect",
  "code": 9002
}
```

---

### **👤 GET /api/accounts/get_my_profile**
**Purpose**: Get authenticated user's profile
**Requires**: Bearer token

**Response:**
```json
{
  "response": {
    "id": 1,
    "status": true,
    "message": "Operation successfully executed",
    "code": 9001
  },
  "data": {
    "id": 1,
    "uniqueId": "550e8400-e29b-41d4-a716-446655440000",
    "createdDate": "2025-10-04",
    "updatedDate": "2025-10-04",
    "isActive": true,
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "accountType": "NORMAL_USER",
    "photo": "/profiles/user_profile.png",
    "hasBeenVerified": true,
    "role": {
      "name": "NORMAL_USER",
      "description": "NORMAL_USER"
    }
  }
}
```

---

### **✏️ POST /api/accounts/update_my_profile**
**Purpose**: Update own profile
**Requires**: Bearer token

**Request:**
```json
{
  "uniqueId": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Jane",
  "lastName": "Smith",
  "photo": "/profiles/new_photo.png"
}
```

---

## **3. Authorization Endpoints**

### **👥 GET /api/auth/roles**
**Purpose**: Get all roles (paginated)
**Requires**: `VIEW_ROLES` permission

**Request Headers:**
```
Authorization: Bearer your_access_token
```

**Query Parameters:**
```
?pageNumber=1&itemsPerPage=10&searchTerm=ADMIN
```

**Response:**
```json
{
  "response": {
    "id": 1,
    "status": true,
    "message": "Operation successfully executed",
    "code": 9001
  },
  "page": {
    "number": 1,
    "hasNextPage": false,
    "hasPreviousPage": false,
    "currentPageNumber": 1,
    "numberOfPages": 1,
    "totalElements": 2,
    "pagesNumberArray": [1]
  },
  "data": [
    {
      "id": 1,
      "uniqueId": "...",
      "name": "ADMIN",
      "description": "ADMIN",
      "permissions": [
        {
          "name": "can manage roles",
          "code": "can_manage_roles"
        }
      ]
    }
  ]
}
```

**What This Tests:**
- ✅ PermissionAuth with required permissions
- ✅ AuthorizationService.has_permission()
- ✅ Permission-based access control
- ✅ Pagination

---

### **➕ POST /api/auth/create_role**
**Purpose**: Create new role
**Requires**: `MANAGE_ROLES` permission

**Request:**
```json
{
  "name": "LECTURER",
  "description": "University Lecturer",
  "permissions": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Response (Success):**
```json
{
  "response": {
    "id": 1,
    "status": true,
    "code": 9001
  },
  "data": {
    "id": 3,
    "uniqueId": "...",
    "name": "LECTURER",
    "description": "University Lecturer",
    "permissions": [...]
  }
}
```

---

### **✏️ PUT /api/auth/create_role**
**Purpose**: Update existing role
**Requires**: `MANAGE_ROLES` permission

**Request:**
```json
{
  "uniqueId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "LECTURER",
  "description": "Updated description",
  "permissions": [
    "550e8400-e29b-41d4-a716-446655440001"
  ]
}
```

---

### **📋 GET /api/auth/grouped_permissions**
**Purpose**: Get all permissions grouped by category
**Requires**: `VIEW_PERMISSIONS` permission

**Response:**
```json
{
  "response": {...},
  "data": [
    {
      "name": "MANAGE USERS",
      "isGlobal": false,
      "permissions": [
        {
          "name": "can manage roles",
          "code": "can_manage_roles"
        },
        {
          "name": "can manage users",
          "code": "can_manage_users"
        }
      ]
    },
    {
      "name": "MANAGE ANALYSIS",
      "isGlobal": false,
      "permissions": [...]
    }
  ]
}
```

---

## **4. Email Templates**

### **📧 Email Template Locations**

| Template | Used In | Trigger | Variables |
|----------|---------|---------|-----------|
| `verify_account.html` | `/api/accounts/register` | New user registration | `data.user.email`, `data.url` |
| `verify_account.html` | `/api/accounts/create_update_user_profile` (POST) | Admin creates user | `data.user.email`, `data.url` |
| `forgot_password.html` | `/api/accounts/forgot_pass_token` | Password reset request | `data.user.email`, `data.url` |

### **Email Sending Code**
Located in: `srs_accounts/views.py`

**Example (Line 239-252):**
```python
template = "email/forgot_password.html"

url = config["FRONTEND_DOMAIN"] + f"password-set/{password_token.request_token}"

body = {
    "receiver_details": user.email,
    "user": user,
    "url": url,
    "subject": "Activate",
}

EmailNotifications.send_email_notification(body, template, user=user)
```

### **⚙️ Email Configuration Required**

Check `.env` file for:
```env
FRONTEND_DOMAIN=http://localhost:3000/
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

---

## **5. Testing Workflow**

### **🔄 Complete User Journey**

```mermaid
graph TD
    A[Register Account] -->|Email sent| B[Verify Email]
    B --> C[Login]
    C --> D[Get Profile]
    D --> E[Update Profile]
    E --> F[Change Password]

    G[Forgot Password] -->|Email sent| H[Reset Password]
    H --> C
```

### **✅ Test Checklist**

#### **Authentication Layer (Layer 4)**
- [ ] Login with correct credentials returns tokens
- [ ] Login with wrong password fails
- [ ] Rate limiting blocks after 5 failed attempts
- [ ] Rate limiting unblocks after 300 seconds
- [ ] Tokens are encrypted (not plain JWT)
- [ ] Token validation works on protected endpoints
- [ ] Google OAuth creates new users automatically

#### **Authorization Layer (Layer 5)**
- [ ] `/api/auth/me` returns user roles and permissions
- [ ] `/api/auth/roles` requires `VIEW_ROLES` permission
- [ ] `/api/auth/create_role` requires `MANAGE_ROLES` permission
- [ ] Non-admin users cannot access admin endpoints
- [ ] Permission check works correctly

#### **Account Management**
- [ ] Registration creates user, profile, and assigns default role
- [ ] Verification email sent on registration
- [ ] Account verification works with token
- [ ] Duplicate email/username rejected
- [ ] Password reset email sent
- [ ] Password reset works with valid token
- [ ] Password reset token single-use
- [ ] Change password requires old password

#### **Layer Separation**
- [ ] AuthenticationService doesn't return roles (only tokens)
- [ ] AuthorizationService called separately in API layer
- [ ] UserManagementService handles user creation
- [ ] No cross-layer violations

---

## **📊 Testing Results Template**

| Endpoint | Method | Auth Required | Expected Result | Actual Result | Status |
|----------|--------|---------------|-----------------|---------------|--------|
| `/api/auth/login` | POST | No | Returns tokens + user | | ⏳ |
| `/api/auth/me` | GET | Yes | Returns user + roles | | ⏳ |
| `/api/accounts/register` | POST | No | Creates user + sends email | | ⏳ |
| `/api/accounts/verify_account` | POST | No | Activates account | | ⏳ |
| `/api/auth/roles` | GET | Yes (VIEW_ROLES) | Returns roles list | | ⏳ |

---

## **🐛 Common Issues & Solutions**

### **Issue: "User is blocked" on first login attempt**
**Solution:** The middleware increments attempts before checking. This is intentional for security.

### **Issue: Email not sending**
**Solution:** Check `.env` configuration and `srs_utils/email.py` implementation.

### **Issue: "Permission denied" errors**
**Solution:** Make sure user has required permissions. Admin user has all permissions by default.

### **Issue: Tokens not decrypting**
**Solution:** Ensure `SECRET_KEY` in settings.py matches between encryption and decryption.

---

**Happy Testing! 🚀**
