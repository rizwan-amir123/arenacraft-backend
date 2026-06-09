# 🎮 ArenaCraft: High-Throughput Gaming Backend Ecosystem

An architectural prototype of a **high-concurrency, transaction-heavy gaming backend** built with **NestJS, PostgreSQL, and Redis**. This system simulates production-grade microservice patterns for scalable real-time game session management, matchmaking, and financial integrity.

---

# 🚀 Architectural Highlights & Core Pillars

## 💰 1. Financial Data Integrity (Wallet Ledger System)

**Problem:**  
Prevent race conditions and double-spending during high-frequency micro-transactions (wallet updates, match entries, rewards).

**Solution:**
- Implemented an **immutable ledger-based financial model** using PostgreSQL
- Strict ACID compliance via `BEGIN / COMMIT / ROLLBACK`
- Ensures every wallet mutation is traceable and reversible

**Scaling Optimization:**
- Introduced **Redis Distributed Locking per userId**
- Prevents concurrent balance mutations
- Reduces DB row-level contention under heavy load

---

## ⚡ 2. High-Performance Matchmaking Pool

**Problem:**  
Traditional SQL-based matchmaking (`WHERE MMR BETWEEN X AND Y`) does not scale under high concurrency due to heavy read locks.

**Solution:**
- Replaced relational matching logic with **Redis Sorted Sets (ZSET)**
- Player queue is stored in-memory with **MMR as score**
- Efficient range queries using:
  - `ZRANGEBYSCORE`
  - `ZREM` (atomic dequeue)

**Performance Benefit:**
- O(log N) insertion
- Near real-time matchmaking under heavy load

---

## 🔥 3. Asynchronous Ingestion & Anti-Cheat Pipeline

**Problem:**  
Game telemetry payloads are large and can block API threads when processed synchronously.

**Solution:**
- Integrated **BullMQ + Redis queue system**
- API returns **202 Accepted immediately**
- Background workers process:
  - Match telemetry validation
  - Speed hack / anomaly detection
  - Player stat updates

**Outcome:**
- Non-blocking API layer
- Scalable event-driven processing pipeline

---

# 🛠️ Tech Stack

- **Backend Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL (Docker port `5433`)
- **Cache / Broker:** Redis v7 (Docker port `6380`)
- **Queue System:** BullMQ
- **Architecture Style:** Event-driven + Modular Monolith

---

# 🏗️ System Architecture Flow

```text
Client Requests
      │
      ▼
NestJS API Gateway
      │
      ├──────────────► PostgreSQL (Wallet Ledger / Persistent State)
      │
      ├──────────────► Redis (Matchmaking Queue / Locks / Cache)
      │
      └──────────────► BullMQ Queue
                              │
                              ▼
                    Background Workers
                              │
                              ▼
                 Anti-cheat + Telemetry Processing
```
                 
#🏃 Local Quick Start Guide
1. Start Infrastructure
```bash
docker-compose up -d
```
2. Install Dependencies
```bash
npm install
```
3. Configure Environment
Ensure .env contains correct Docker-mapped ports:

```bash
DATABASE_URL=postgresql://user:password@localhost:5433/db
REDIS_URL=redis://localhost:6380
```
4. Start Development Server
```bash
npm run start:dev
```
5. Seed Mock Data

Bootstrap test players and wallet balances:

```bash
POST http://localhost:3000/dev/seed
```

#📊 Key Features
- High-throughput wallet ledger system
- Redis-based matchmaking (MMR sorted queues)
- Distributed locking for race-condition prevention
- Async telemetry pipeline using BullMQ
- Anti-cheat background processing system
- Scalable real-time backend architecture

#⚠️ Design Philosophy

This system prioritizes:

- Consistency over premature optimization
- Horizontal scalability via Redis primitives
- Fault-tolerant async processing
- Production-style architecture simulation in local environment
