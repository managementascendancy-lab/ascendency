# ASCENDANCY Auth Testing

## MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
```
Verify bcrypt hash starts with `$2b$`. Unique index on users.email.

## API Testing
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@ascendancy.io","password":"Ascend@2026"}'
curl -b cookies.txt http://localhost:8001/api/auth/me
```

## Simulation submit (auth required)
```
curl -b cookies.txt -X POST http://localhost:8001/api/simulations -H "Content-Type: application/json" -d '{"wpm":95,"accuracy":97,"consistency":80,"correctCharacters":400,"incorrectCharacters":8,"totalCharacters":408,"duration":60}'
```
Expect: hero classification (deterministic), score, isPersonalBest / isNewClassification flags.
