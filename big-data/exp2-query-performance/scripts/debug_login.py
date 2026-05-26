import subprocess
import os
import time
import requests
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

def get_top_granjero():
    backend_dir = Path('/Users/pablo/Desktop/Roma3/Big Data/1 Proyecto/camposync')
    env_path = backend_dir / ".env"
    load_dotenv(env_path)
    
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "agro_data"),
        user=os.getenv("DB_USER", "admin_saas"),
        password=os.getenv("DB_PASSWORD", "CampoSyncS2026PostgreSQL!"),
        port=os.getenv("DB_PORT", "5432")
    )
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.username
        FROM usuario u
        JOIN tratamiento t ON t.usuario_id = u.id
        WHERE u.username LIKE 'granjero_seed_%'
        GROUP BY u.username
        ORDER BY COUNT(t.id) DESC
        LIMIT 1;
    """)
    row = cursor.fetchone()
    conn.close()
    return row[0]

def run_debug():
    backend_dir = Path('/Users/pablo/Desktop/Roma3/Big Data/1 Proyecto/camposync')
    env_path = backend_dir / ".env"
    load_dotenv(env_path)
    
    # Kill anything on 8080
    try:
        pid_bytes = subprocess.check_output("lsof -t -i:8080", shell=True)
        pids = pid_bytes.decode().strip().split("\n")
        for pid in pids:
            if pid:
                subprocess.run(f"kill -9 {pid}", shell=True)
    except Exception:
        pass
        
    env = os.environ.copy()
    
    # Start Spring Boot, writing stdout to spring_debug.log
    log_file_path = backend_dir / "big-data/exp2-query-performance/spring_debug.log"
    print(f"Starting Spring Boot, logging to {log_file_path}...")
    
    with open(log_file_path, "w") as log_f:
        process = subprocess.Popen(
            ["./mvnw", "spring-boot:run"],
            cwd=str(backend_dir),
            stdout=log_f,
            stderr=log_f,
            env=env,
            text=True
        )
        
        # Wait for online
        print("Waiting for Tomcat port 8080...")
        online = False
        start_t = time.time()
        while time.time() - start_t < 90:
            try:
                res = requests.get("http://localhost:8080/api/auth/login", timeout=2)
                print(f"Tomcat is up! Status: {res.status_code}")
                online = True
                break
            except requests.exceptions.RequestException:
                time.sleep(2)
                
        if not online:
            print("Spring Boot failed to start.")
            process.terminate()
            return
            
        print("Sleeping 10 seconds for warm-up...")
        time.sleep(10)
        
        username = get_top_granjero()
        print(f"Attempting login for user '{username}'...")
        
        try:
            # We send a request with a very long timeout (60s) to see if it eventually succeeds or what it does
            start_req = time.time()
            login_res = requests.post(
                "http://localhost:8080/api/auth/login",
                json={"username": username, "password": "granjero123"},
                timeout=60
            )
            duration = time.time() - start_req
            print(f"Login Response (took {duration:.2f}s): Status {login_res.status_code}")
            print(f"Response Body: {login_res.text}")
        except Exception as e:
            print(f"Login request failed: {e}")
            
        print("Stopping Spring Boot...")
        process.terminate()
        try:
            process.wait(timeout=5)
        except Exception:
            process.kill()

if __name__ == '__main__':
    run_debug()
