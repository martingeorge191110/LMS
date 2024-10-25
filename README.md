# Project Name

## Overview
This project is built using Prisma ORM with a MySQL database. The schema defines various entities and their relationships, which support features such as user authentication, course management, messaging, posts, and comments. 

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
