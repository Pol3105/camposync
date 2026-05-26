import subprocess
import os
import time
from pathlib import Path
from dotenv import load_dotenv

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
        print("Killed previous processes on 8080.")
    except Exception:
        pass
        
    env = os.environ.copy()
    
    log_file_path = backend_dir / "big-data/exp2-query-performance/spring_boot_boot.log"
    print(f"Starting Spring Boot, writing logs to {log_file_path}...")
    
    with open(log_file_path, "w") as log_f:
        process = subprocess.Popen(
            ["./mvnw", "spring-boot:run"],
            cwd=str(backend_dir),
            stdout=log_f,
            stderr=log_f,
            env=env,
            text=True
        )
        
        # Let it run for 30 seconds
        time.sleep(30)
        
        print("Stopping Spring Boot process...")
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            
    print("Done. Logs written.")

if __name__ == '__main__':
    run_debug()
