import os
import sys
import time
import argparse
import random
import psycopg2
from pathlib import Path
from dotenv import load_dotenv
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

def get_top_granjero():
    # Load .env
    env_path = Path(__file__).parent.parent.parent.parent / ".env"
    load_dotenv(env_path)
    
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "agro_data"),
        user=os.getenv("DB_USER", "admin_saas"),
        password=os.getenv("DB_PASSWORD", "CampoSyncS2026PostgreSQL!"),
        port=os.getenv("DB_PORT", "5432")
    )
    cursor = conn.cursor()
    
    # Get seeded granjero with the most treatments
    cursor.execute("""
        SELECT u.username, COUNT(t.id) as cnt
        FROM usuario u
        JOIN tratamiento t ON t.usuario_id = u.id
        WHERE u.username LIKE 'granjero_seed_%'
        GROUP BY u.username
        ORDER BY cnt DESC
        LIMIT 1;
    """)
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise Exception("No seeded granjeros found in DB. Run the seeder first!")
    return row[0], row[1]

def get_jwt_token(username, base_url):
    login_url = f"{base_url}/api/auth/login"
    payload = {
        "username": username,
        "password": "campo2024" # Seeded users use the 'campo2024' password
    }

    
    print(f"Logging in as '{username}' to {login_url}...")
    try:
        response = requests.post(login_url, json=payload, timeout=60)
        if response.status_code == 200:
            token = response.json().get("token")
            if token:
                print("Login successful! JWT token acquired.")
                return token
        print(f"Login failed: Status {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Connection error to {login_url}: {e}")
    return None


def single_request(url, headers=None):
    start = time.perf_counter()
    try:
        response = requests.get(url, headers=headers, timeout=60)
        latency = (time.perf_counter() - start) * 1000.0 # ms
        if response.status_code == 200:
            return latency, True
        else:
            return latency, False
    except Exception:
        latency = (time.perf_counter() - start) * 1000.0
        return latency, False

def run_benchmark(strategy, concurrency, total_requests, base_url, username):
    url = f"{base_url}/api/benchmark/tratamientos?username={username}&strategy={strategy}"
    
    print(f"\nRunning benchmark for strategy '{strategy.upper()}'...")
    print(f"Target URL: {url}")
    print(f"Concurrency: {concurrency} | Total requests: {total_requests}")
    
    # Warmup request
    print("Sending warmup request...")
    warmup_lat, ok = single_request(url)
    if ok:
        print(f"Warmup successful! Latency: {warmup_lat:.2f} ms")
    else:
        print("Warmup failed or returned non-200. Proceeding anyway...")
    
    latencies = []
    success_count = 0
    failure_count = 0
    
    start_time = time.perf_counter()
    
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(single_request, url) for _ in range(total_requests)]
        
        for idx, future in enumerate(as_completed(futures)):
            try:
                lat, success = future.result()
                latencies.append(lat)
                if success:
                    success_count += 1
                else:
                    failure_count += 1
            except Exception as e:
                latencies.append(0.0)
                failure_count += 1
                
            if (idx + 1) % max(1, total_requests // 10) == 0:
                print(f"  Completed {idx+1}/{total_requests} requests...")
                
    end_time = time.perf_counter()
    total_duration = end_time - start_time
    
    if not latencies:
        print("No requests completed.")
        return None
        
    valid_latencies = [l for l in latencies if l > 0.0]
    avg_lat = sum(valid_latencies) / len(valid_latencies) if valid_latencies else 0.0
    sorted_lats = sorted(valid_latencies)
    p95_lat = sorted_lats[int(len(sorted_lats) * 0.95)] if sorted_lats else 0.0
    p50_lat = sorted_lats[int(len(sorted_lats) * 0.50)] if sorted_lats else 0.0
    throughput = success_count / total_duration if total_duration > 0 else 0.0
    error_rate = (failure_count / total_requests) * 100.0
    
    print(f"--- Results for {strategy.upper()} ---")
    print(f"  Total Duration: {total_duration:.2f} s")
    print(f"  Throughput: {throughput:.2f} req/s")
    print(f"  Average Latency: {avg_lat:.2f} ms")
    print(f"  p50 (Median) Latency: {p50_lat:.2f} ms")
    print(f"  p95 Latency: {p95_lat:.2f} ms")
    print(f"  Success Rate: {success_count}/{total_requests} ({100.0 - error_rate:.1f}%)")
    print(f"  Error Rate: {error_rate:.1f}%\n")
    
    return {
        "strategy": strategy,
        "concurrency": concurrency,
        "total_requests": total_requests,
        "total_duration_s": round(total_duration, 4),
        "throughput_req_s": round(throughput, 2),
        "avg_latency_ms": round(avg_lat, 2),
        "p50_latency_ms": round(p50_lat, 2),
        "p95_latency_ms": round(p95_lat, 2),
        "error_rate_pct": round(error_rate, 2)
    }

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="CampoSync Big Data Exp2 Query Performance Benchmark")
    parser.add_argument("--strategy", type=str, default="lazy", choices=["lazy", "eager", "join-fetch", "entity-graph"], help="Hibernate fetch strategy")
    parser.add_argument("--concurrency", type=int, default=10, help="Number of concurrent requests")
    parser.add_argument("--requests", type=int, default=100, help="Total number of requests to execute")
    parser.add_argument("--port", type=int, default=8080, help="Port of the running Spring Boot app")
    
    args = parser.parse_args()
    
    base_url = f"http://localhost:{args.port}"
    
    # 1. Fetch top user
    try:
        username, count = get_top_granjero()
        print(f"Target Seeded Granjero: '{username}' with {count} treatments in database.")
    except Exception as e:
        print(f"Error reading DB: {e}")
        sys.exit(1)
        
    # 2. Get JWT Token
    token = get_jwt_token(username, base_url)
    if not token:
        print("Error: Could not acquire JWT token. Make sure the Spring Boot app is running and seeded.")
        sys.exit(1)
        
    # 3. Run Benchmark
    run_benchmark(args.strategy, args.concurrency, args.requests, base_url, token)
