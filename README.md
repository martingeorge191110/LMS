# Project Name

## Table of Contents

- [Project Overview](#project-overview)
- [API Routers](#api-routers)
- [Database Schema](#database-schema)
- [WebSocket Overview](#websocket-overview)

## Project Overview

This project utilizes **Express** and **Node.js** alongside **Socket.io** for real-time communication. It integrates **Prisma ORM** with a **MySQL** database to manage entities related to user authentication, course management, messaging, and post interactions. The architecture is designed to accommodate additional events based on front-end actions.

## API Routers

### Auth Router

1. **`POST /register`** - User registration.
2. **`POST /login`** - User login.
3. **`POST /reset-password`** - Send reset code via email.
4. **`GET /reset-password`** - Verify reset code.
5. **`PUT /reset-password`** - Update password.
6. **`POST /instructor`** - Add new instructor (create or link to user).

### User Router

1. **`PUT /profile`** - Complete user profile.
2. **`GET /profile`** - Retrieve user profile.
3. **`PUT /avatar`** - Update user avatar (supports file upload).
4. **`GET /search`** - Search for users by ID, name, or fetch all users.

### Certificate Router

1. **`POST /`** - Add a new certificate.
2. **`DELETE /`** - Delete a certificate.
3. **`PUT /`** - Update an existing certificate.
4. **`GET /`** - Retrieve all certificates.
5. **`PUT /avatar`** - Upload or update certificate image (supports file upload).

### Education Router

1. **`GET /`** - Retrieve all education records for the user.
2. **`POST /`** - Add a new education record.
3. **`PUT /`** - Update an existing education record.
4. **`DELETE /`** - Delete an education record.

### Link Router

1. **`POST /user/`** - Add a new link associated with the user.
2. **`GET /user/`** - Retrieve a specific link or all links for the user.
3. **`PUT /user/`** - Update an existing link associated with the user.
4. **`DELETE /user/`** - Delete a link associated with the user.

### Courses Router

1. **`POST /admin/`** - Add a new course (admin access).
2. **`PUT /admin/`** - Update an existing course (admin access).
3. **`PATCH /admin/`** - Assign an instructor to a course (admin access).
4. **`PUT /admin/video/`** - Upload an introductory video for a course (admin access).
5. **`GET /user/`** - Search for courses available to users.
6. **`POST /user/`** - Process payment for a course (user access).
7. **`GET /payment/success/:courseId/:userId`** - Confirmation of a successful payment for a course.

### Course Review Router

1. **`POST /course/`** - Add a new review for a course (user access).
2. **`GET /course/`** - Retrieve all reviews for a specific course (user access).
3. **`DELETE /course/`** - Delete a specific review (user access).
4. **`PUT /course/`** - Update an existing review (user access).
5. **`PUT /course/like/`** - Like a specific course review (user access).
6. **`PATCH /course/like/`** - Remove a like from a specific course review (user access).

### Posts Router

1. **`POST /`** - Add a new post with media (user access).
2. **`DELETE /`** - Delete an existing post (user access).
3. **`PUT /`** - Edit an existing post with media (user access).
4. **`GET /`** - Retrieve all posts created by a specific user (user access).
5. **`PATCH /like/`** - Add or remove likes on a post (user access).
6. **`/comments/`** - Nested routes for managing comments on posts.

### Comments Router

1. **`POST /`** - Add a comment to a post with optional media.
2. **`DELETE /`** - Delete an existing comment.
3. **`PATCH /like/`** - Add or remove likes on a comment.

### Chat Router

1. **`POST /`** - Create a new chat room.
2. **`GET /`** - Display chat rooms.
3. **`GET /personel/`** - Search for a personal chat room.
4. **`PATCH /remove/`** - Remove a user from a chat room.
5. **`PUT /remove/`** - Admin can remove themselves from the chat room.
6. **`PATCH /add/`** - Add a user to a chat room or designate a new admin.
7. **`PUT /add/`** - Add another admin to a chat room.
8. **`/message`** - Sub-route for handling messages in chat.

### Messages Router

1. **`POST /`** - Send a new message in a chat.
2. **`DELETE /`** - Delete a specific message.
3. **`PATCH /`** - Edit an existing message.
4. **`POST /like/`** - Add a like to a message.
5. **`PUT /like/`** - Remove a like from a message.

### WebHooks Router

1. **`POST /course/webhook`** - Handle payment notifications for course enrollment via Stripe.

### WebSocket Overview

This WebSocket file manages real-time communication for chat functionality in the application. It utilizes the `socket.io` library to create a server that handles user connections, chat room management, and message visibility tracking. Key features include:

1. **User Management**: Tracks online users and updates their online status in the database using Prisma ORM.
2. **Chat Room Functionality**: Allows users to join chat rooms, storing the user IDs for each room and facilitating real-time messaging.
3. **Message Visibility**: Emits events to notify users when messages have been seen, updating the relevant records in the database.
4. **User Disconnection Handling**: Updates the user's offline status and cleans up chat rooms when users disconnect, ensuring accurate management of online presence and room membership.

The WebSocket server is initialized with CORS settings to allow requests from specified origins, supporting both development and production environments.

> **Note**: Additional events can be created based on the actions taken in the frontend. This allows for a more dynamic and responsive user experience, enabling features such as notifications, user status updates, or other interactive elements as needed.

## Database Schema

### Models and Relationships
- **User**: Represents a user of the platform, can be a student or an instructor.
- **Instructor**: Contains details about an instructor, linked to a User.
- **Course**: Courses that can be taught by instructors and enrolled by students.
- **CourseReview**: Reviews given by users to courses, with the ability to like the reviews.
- **Chat and Messages**: Users can send messages in personal or group chats.
- **Posts**: Users can create posts, comment, and like posts.
- **MessageLikes**: Tracks users who liked specific messages.
- **PostComment**: Users can comment on posts, and these comments can also be liked.

### Relationship Diagram
```mermaid
erDiagram
    User {
        String id
        String firstName
        String lastName
        String email
    }
    User ||--o{ Instructor : "linked as instructor"
    User ||--o{ Course : "enrolled"
    User ||--o{ Messages : "sent messages"
    User ||--o{ Post : "created posts"
    User ||--o{ Chat : "participates"
    User ||--o{ MessageLikes : "likes messages"
    
    Course ||--o{ CourseReview : "reviewed by"
    Instructor ||--o{ Course : "teaches"
    Course ||--o{ CourseLecs : "contains lectures"
    CourseReview ||--o{ User : "liked by users"
    
    Chat ||--o{ Messages : "contains messages"
    Messages ||--o{ MessageLikes : "liked by users"
    Post ||--o{ PostComment : "has comments"
    PostComment ||--o{ User : "liked by users"
