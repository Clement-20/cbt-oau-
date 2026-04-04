# Upload & Security Testing Guide

## ✅ Server Status
- **Status**: HEALTHY
- **URL**: http://localhost:3000
- **Security**: Fully hardened with Helmet.js

### Security Headers Active
```
✅ Content-Security-Policy (CSP)
✅ Strict-Transport-Security (HSTS: 1 year)
✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff
✅ X-XSS-Protection: 1; mode=block
✅ Cross-Origin-Opener-Policy: same-origin
✅ Referrer-Policy: strict-origin-when-cross-origin
```

### Rate Limiting Configuration
```
General Endpoint: 100 requests/15 minutes
Question Submission: 10 submissions/1 hour per IP
```

---

## 📋 Question Submission Flow

### **Step 1: Manual Entry Via UI (Recommended)**

1. **Login** to the app with Firebase auth
2. **Navigate** to "Validator" page
3. **Fill the form:**
   - **Course Code**: e.g., `CSC101` (max 20 chars)
   - **Question**: e.g., `What is the capital of France?` (max 1000 chars)
   - **Option 1**: `Paris` (max 500 chars)
   - **Option 2**: `London` (max 500 chars)
   - **Option 3**: `Berlin` (max 500 chars)
   - **Option 4**: `Madrid` (max 500 chars)
   - **Correct Answer**: Select `Option 1 (Paris)`
4. **Click Submit**
5. **Expected**: Success toast with question ID

### **Step 2: Verify in Firestore**
- Check `pending_questions` collection
- New document should contain:
  ```
  {
    courseCode: "CSC101",
    question: "What is the capital of France?",
    options: ["Paris", "London", "Berlin", "Madrid"],
    correctAnswer: 0,
    authorId: "[user.uid]",
    authorEmail: "[user.email]",
    authorName: "[user.displayName]",
    votes: 0,
    rejections: 0,
    voters: [],
    status: "pending",
    timestamp: [server timestamp]
  }
  ```

---

## 🗳️ Testing the Voting System

### **Auto-Approval (20 Votes)**
1. **Vote YES** on the question 20 times
2. **Expected**: 
   - Question auto-adds to `courses/CSC101/questions` array
   - Question auto-deletes from `pending_questions`
   - Status: APPROVED

### **Auto-Rejection (10 Rejects)**
1. **Vote REJECT** on a question 10 times
2. **Expected**:
   - Question auto-deletes from `pending_questions`
   - Status: REJECTED/REMOVED (spam prevention)

---

## 🔒 Security Testing

### **XSS Attack Prevention**
Test with malicious input:
```
Input: <script>alert('XSS')</script>
Result: Script tags should be stripped by sanitizeInput()
```

### **Rate Limiting Test**
```bash
# Make 101 requests to trigger limit
for i in {1..101}; do
  curl http://localhost:3000/api/health
done
# After 100 requests: Should receive 429 Too Many Requests
```

### **CORS Testing**
```bash
curl -H "Origin: https://malicious.com" http://localhost:3000/api/health
# Should reject if not in NEXT_PUBLIC_BASE_URL whitelist
```

### **CSP Header Test**
```bash
curl -I http://localhost:3000/api/health
# Look for: Content-Security-Policy header
# Verify: default-src 'self', script-src restricted
```

---

## 📊 Current Statistics

### **Questions Collection**
- **Location**: `courses/{courseCode}/questions`
- **Auto-added on**: 20 votes or Admin approval
- **Auto-removed on**: 10 rejects

### **Pending Questions Collection**
- **Location**: `pending_questions/{questionId}`
- **Lifespan**: Until 20 votes (approval) OR 10 rejects (spam)
- **Fields**: courseCode, question, options (4), correctAnswer, authorId, authorEmail, authorName, votes, rejections, voters, status, timestamp

---

## 🐛 Troubleshooting

### **Question Won't Submit**
- ✅ Check Firebase login status
- ✅ Verify all form fields filled
- ✅ Check field lengths (courseCode ≤20, question ≤1000, options ≤500)
- ✅ Check Firestore rules allow write
- ✅ Check browser console for auth errors

### **Question Appears but Won't Vote**
- ✅ Verify user is authenticated
- ✅ Check voter list (voters array) for duplicate votes
- ✅ Verify correctAnswer is 0-3 (valid index)

### **Question Doesn't Auto-Approve at 20 Votes**
- ✅ Check votes field in Firestore
- ✅ Verify transaction completed
- ✅ Check courses/{courseCode} collection exists or creates properly

### **Rate Limit Blocking Legitimate Users**
- ✅ 10 submissions/hour per IP is the limit
- ✅ Check if users behind same proxy/NAT
- ✅ Adjust submissionLimiter in server.ts if needed

---

## 🚀 Deployment Checklist

Before production:
- [ ] Test all security headers are present
- [ ] Verify rate limiting doesn't break legitimate flow
- [ ] Confirm Firestore rules are deployed
- [ ] Test on actual Firebase project (not local)
- [ ] Verify auto-removal logic with 20+ users voting
- [ ] Load test with concurrent submissions
- [ ] Monitor CSP violations in browser console

---

## 📞 Quick API Reference

### **Health Check**
```bash
GET /api/health
# Returns: { status: "HEALTHY", message: "...", timestamp: "..." }
```

### **Question Submission** (For Testing)
```bash
POST /api/questions/submit
Content-Type: application/json

{
  "courseCode": "CSC101",
  "question": "What is 2+2?",
  "options": ["3", "4", "5", "6"],
  "correctAnswer": 1,
  "userId": "user123",
  "userEmail": "user@example.com",
  "userName": "Test User"
}
```

### **Portal Check** (Heartbeat)
```bash
GET /api/portal-check
# Returns portal status & response time
```

---

## 📝 Notes

- **No AI Used**: Questions are manually submitted by users
- **Community Validated**: 20 votes needed for approval
- **Spam Protected**: 10 rejects auto-deletes question
- **Encrypted**: All data in transit (HTTPS + CSP)
- **Logged**: User authorship tracked (authorId, authorEmail, authorName)
- **Auditable**: Timestamp on all questions
