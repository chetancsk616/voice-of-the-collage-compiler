# Granular Permission Management System

## Overview

This system allows admins to control fine-grained permissions for all users in the application. Admins can grant or revoke specific permissions to users, or apply permission presets (student, teacher, admin).

## Features

### 1. **Granular Permissions**

Each user can have the following permissions:

- **canReadQuestions**: View all questions in the system
- **canWriteQuestions**: Create, edit, and delete questions
- **canReadAllSubmissions**: View submissions from all users
- **canEvaluateSubmissions**: Score and evaluate user submissions
- **canManageUsers**: View and manage user accounts
- **canGrantPermissions**: Grant/revoke permissions to other users (restricted to non-admin permissions)
- **canViewAuditLogs**: Access system audit logs
- **canExportData**: Export questions, submissions, and reports

### 2. **Permission Presets**

Three predefined permission levels:

#### **Admin** (Full Access)
- All permissions enabled
- Can manage all aspects of the system
- Set via Firebase custom claims (`role: 'admin'`)

#### **Teacher** (Moderate Access)
- ✅ Read questions
- ❌ Write questions
- ✅ Read all submissions
- ✅ Evaluate submissions
- ❌ Manage users
- ❌ Grant permissions
- ❌ View audit logs
- ✅ Export data

#### **Student** (Limited Access)
- ✅ Read questions
- ❌ Write questions
- ❌ Read all submissions (only their own)
- ❌ Evaluate submissions
- ❌ Manage users
- ❌ Grant permissions
- ❌ View audit logs
- ❌ Export data

### 3. **Database Security Rules**

The Firebase Realtime Database rules enforce permissions at the database level:

```json
{
  "rules": {
    "questions": {
      ".read": "auth.token.role == 'admin' || userPermissions[auth.uid].canReadQuestions == true",
      ".write": "auth.token.role == 'admin' || userPermissions[auth.uid].canWriteQuestions == true"
    },
    "submissions": {
      ".read": "auth.token.role == 'admin' || userPermissions[auth.uid].canReadAllSubmissions == true",
      "$userId": {
        ".read": "auth.uid == $userId || auth.token.role == 'admin' || userPermissions[auth.uid].canReadAllSubmissions == true",
        ".write": "auth.uid == $userId"
      }
    }
  }
}
```

## Setup Instructions

### 1. **Update Firebase Database Rules**

Copy the contents of `database-rules.json` to your Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **aicompiler-45c59**
3. Navigate to **Realtime Database** → **Rules**
4. Replace with the rules from `database-rules.json`
5. Click **Publish**

### 2. **Grant Admin Access**

Run the script to grant admin access to your email:

```bash
node grantAdminByEmail.js
```

This sets the `role: 'admin'` custom claim on your Firebase user.

### 3. **Access Permission Manager**

Navigate to the admin panel:

```
http://localhost:3000/admin/permissions
```

## Usage Guide

### **For Admins**

#### **View All Users with Permissions**
1. Navigate to `/admin/permissions`
2. See all users with their current permissions
3. Use search to filter users by email or name

#### **Apply Permission Preset**
1. Find the user in the list
2. Click the preset button (**Student**, **Teacher**, or **Admin**)
3. Permissions will be updated immediately

#### **Grant/Revoke Individual Permissions**
1. Find the user in the list
2. Toggle individual permission switches
3. Changes are saved automatically
4. Audit log is created for each change

#### **Make Someone an Admin**
1. Navigate to `/admin/users`
2. Click **Make Admin** next to the user
3. User will have full admin access with all permissions

### **API Endpoints**

All endpoints require admin authentication (`Authorization: Bearer <token>`).

#### **Get Available Permissions**
```
GET /api/admin/permissions/available
```

Response:
```json
{
  "success": true,
  "permissions": { ... },
  "presets": { ... }
}
```

#### **Get User Permissions**
```
GET /api/admin/permissions/user/:userId
```

#### **Set User Permissions**
```
POST /api/admin/permissions/user/:userId
Body: { "permissions": { "canReadQuestions": true, ... } }
```

#### **Grant Single Permission**
```
POST /api/admin/permissions/user/:userId/grant/:permission
```

#### **Revoke Single Permission**
```
POST /api/admin/permissions/user/:userId/revoke/:permission
```

#### **Apply Permission Preset**
```
POST /api/admin/permissions/user/:userId/preset/:presetName
```

Preset names: `student`, `teacher`, `admin`

## Security Considerations

### **Database-Level Enforcement**
- All permissions are enforced at the database rules level
- Even if someone bypasses the UI, they cannot access data they don't have permission for
- Admin custom claims cannot be modified via the API (only via Firebase Admin SDK)

### **Audit Logging**
- Every permission change is logged with timestamp, admin user, target user, and changes made
- Logs are stored in `/auditLogs` in the database
- Only admins can view audit logs

### **Permission Hierarchy**
- Admins (with `role: 'admin'` custom claim) always have all permissions
- Permission presets can be applied, but admins retain full access
- `canGrantPermissions` permission allows users to grant non-admin permissions only

## Example Scenarios

### **Scenario 1: Adding a Teacher**
1. User signs up as a student
2. Admin goes to `/admin/permissions`
3. Admin clicks **Teacher** preset button for that user
4. User can now:
   - View all student submissions
   - Evaluate and grade submissions
   - Export data for reports
   - But cannot create/edit questions or manage users

### **Scenario 2: Giving Temporary Question Access**
1. Admin wants to allow a user to view questions but not edit
2. Admin toggles **Read Questions** permission on
3. User can now access the questions database
4. Admin can revoke permission later by toggling off

### **Scenario 3: Promoting a Teacher to Admin**
1. Admin goes to `/admin/users`
2. Clicks **Make Admin** next to teacher's account
3. Teacher now has full admin access
4. Their preset permissions are overridden by admin role

## Database Structure

```
/
├── questions/          (question data)
├── submissions/        (user submissions)
├── users/             (user metadata)
├── userPermissions/   (granular permissions)
│   └── {userId}/
│       ├── canReadQuestions: true/false
│       ├── canWriteQuestions: true/false
│       ├── ...
│       ├── updatedBy: {adminUserId}
│       └── updatedAt: {timestamp}
└── auditLogs/         (permission change logs)
    └── {logId}/
        ├── timestamp
        ├── action
        ├── adminUserId
        ├── targetUserId
        └── permissions
```

## Troubleshooting

### **Issue: User can't access data after permission granted**
**Solution**: User needs to log out and log back in to get a fresh token with updated permissions.

### **Issue: Admin loses permissions**
**Solution**: Admins are controlled by Firebase custom claims, not database permissions. Run `node grantAdminByEmail.js` to restore admin access.

### **Issue: Permission changes not saving**
**Solution**: Check Firebase Database Rules are properly published. Check console for API errors.

### **Issue: Permission Manager page not loading**
**Solution**: 
- Ensure admin server is running on port 4000
- Check that you're logged in as an admin
- Check browser console for errors

## Future Enhancements

- **Role-based groups**: Create custom role groups with predefined permission sets
- **Time-limited permissions**: Grant permissions that expire after a set time
- **Permission requests**: Allow users to request permissions, pending admin approval
- **Bulk permission management**: Apply permissions to multiple users at once
- **Permission templates**: Save custom permission combinations as templates

---

**Last Updated**: December 29, 2025
