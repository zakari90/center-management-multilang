# MongoDB Replica Set Setup

## Problem
Prisma requires MongoDB to be configured as a replica set to support transactions. Without this configuration, you'll see errors like:
```
Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set.
```

## Solution: Configure MongoDB as a Single-Node Replica Set

### For Development (Local MongoDB)

1. **Stop MongoDB if it's running:**
   - If running as a service: Stop the MongoDB service
   - If running manually: Stop the MongoDB process

2. **Start MongoDB with replica set enabled:**
   
   **Option A: If MongoDB is installed as a Windows service:**
   - Edit the MongoDB service configuration to add `--replSet rs0` to the startup parameters
   - Or modify `mongod.cfg` file (usually in `C:\Program Files\MongoDB\Server\<version>\bin\`) to include:
     ```yaml
     replication:
       replSetName: "rs0"
     ```
   - Restart the MongoDB service
   
   **Option B: If running MongoDB manually:**
   ```bash
   mongod --replSet rs0 --dbpath "C:\data\db"
   ```
   (Adjust the `--dbpath` to your MongoDB data directory)

3. **Initialize the replica set:**
   
   **Option A: Using mongosh (MongoDB Shell)**
   ```bash
   mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] })"
   ```
   
   **Option B: Connect to MongoDB and run:**
   ```bash
   mongosh
   ```
   Then in the MongoDB shell:
   ```javascript
   rs.initiate({
     _id: "rs0",
     members: [
       { _id: 0, host: "localhost:27017" }
     ]
   })
   ```

3. **Verify the replica set is initialized:**
   ```bash
   mongosh --eval "rs.status()"
   ```
   
   You should see output indicating the replica set is active. Look for `"stateStr": "PRIMARY"`.

4. **Wait a few seconds** for the replica set to fully initialize before using your application.

### For Production

For production environments, you should set up a proper multi-node replica set. See the [MongoDB Replica Set Documentation](https://www.mongodb.com/docs/manual/replication/).

### Troubleshooting

- **If you get "already initialized" error:** The replica set is already set up. You can check status with `rs.status()`.
- **If MongoDB won't start:** Make sure MongoDB is installed and the service is running.
- **If the replica set won't initialize:** Check MongoDB logs for errors.

### Alternative: Using Docker

If you're using Docker for MongoDB, you can initialize the replica set in your `docker-compose.yml`:

```yaml
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    command: mongod --replSet rs0
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

Then initialize the replica set:
```bash
docker exec -it <container_name> mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] })"
```

