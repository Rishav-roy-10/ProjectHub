# Project Sharing System

## Overview
This system now supports **project sharing** instead of **project ownership transfer**. Multiple users can collaborate on the same project and chat about it.

## Key Changes

### 1. Project Model
- **Before**: `User` field (single owner)
- **Now**: `owner` field + `sharedUsers` array
- Projects can have one owner and multiple shared users

### 2. How It Works
- **Owner**: Creates the project and can share it with others
- **Shared Users**: Can access the project and participate in chat
- **No Ownership Transfer**: Projects stay with their original creator

### 3. New API Endpoints

#### Project Management
- `POST /project/create` - Create a new project (you become owner)
- `PUT /project/add-user` - Share project with another user
- `PUT /project/remove-user` - Remove user from shared access
- `GET /project/getAll` - Get all projects you own OR have access to
- `GET /project/get-project/:id` - Get specific project details

#### Chat Functionality
- `GET /chat/project/:projectId` - Get project chat
- `POST /chat/send-message` - Send message to project chat
- `GET /chat/recent/:projectId` - Get recent messages

## Usage Examples

### Sharing a Project
```javascript
// Share project with user
PUT /project/add-user
{
  "projectId": "project_id_here",
  "user": "user_id_to_share_with"
}
```

### Sending a Message
```javascript
// Send message to project chat
POST /chat/send-message
{
  "projectId": "project_id_here",
  "content": "Hello team! How's the project going?"
}
```

## Benefits
1. **Collaboration**: Multiple users can work on the same project
2. **Chat**: Built-in messaging system for project discussions
3. **Access Control**: Only project owner can add/remove users
4. **No Data Loss**: Projects stay with original creator

## Database Migration
If you have existing projects, you'll need to migrate them:
- Old projects with `User` field need to be updated to use `owner` field
- Add empty `sharedUsers` array to existing projects

## Security
- Only project owners can add/remove users
- Users can only access projects they own or have been shared with
- All chat messages are tied to project access permissions
