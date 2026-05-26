import os
import sys
import time
import subprocess
import psycopg2
import csv
from pathlib import Path
from dotenv import load_dotenv
import requests

# Add scripts dir to path for benchmark import
sys.path.insert(0, str(Path(__file__).parent))
from benchmark import run_benchmark

# Set backend working dir
BACKEND_DIR = Path(__file__).parent.parent.parent.parent


def get_top_granjero():
    env_path = BACKEND_DIR / ".env"
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

def kill_port_8080():
    print("Ensuring port 8080 is free...")
    try:
        # lsof on macOS
        pid_bytes = subprocess.check_output("lsof -t -i:8080", shell=True)
        pids = pid_bytes.decode().strip().split("\n")
        for pid in pids:
            if pid:
                print(f"Killing process {pid} using port 8080...")
                subprocess.run(f"kill -9 {pid}", shell=True)
        time.sleep(2)
    except subprocess.CalledProcessError:
        # lsof returns non-zero if no process is found, which is fine
        print("Port 8080 is free.")

def start_spring_boot():
    print("Starting Spring Boot application in the background...")
    # Load .env variables into environment
    env_path = BACKEND_DIR / ".env"
    load_dotenv(env_path)
    
    env = os.environ.copy()
    
    # Open a log file to write stdout and stderr, preventing buffer block
    log_file_path = BACKEND_DIR / "big-data" / "spring_boot_benchmark.log"
    log_file = open(log_file_path, "w", encoding="utf-8")
    
    # Start mvnw spring-boot:run
    process = subprocess.Popen(
        ["./mvnw", "spring-boot:run"],
        cwd=str(BACKEND_DIR),
        stdout=log_file,
        stderr=subprocess.STDOUT,
        env=env,
        text=True
    )
    
    # Wait for the port to open and Actuator or Auth to be online
    print("Waiting for Tomcat to start up on port 8080...")
    started = False
    start_time = time.time()
    
    while time.time() - start_time < 120: # 120 seconds timeout (more generous for large DB)
        try:
            # We check the actuator health endpoint first, then login url
            response = requests.get("http://localhost:8080/actuator/health", timeout=3)
            if response.status_code in (200, 401, 403):
                started = True
                print(f"Spring Boot application is ONLINE (actuator status: {response.status_code})!")
                print("Allowing 15 seconds for Hibernate and DataSeeder to fully initialize...")
                time.sleep(15)
                break
        except requests.exceptions.RequestException:
            pass
        
        try:
            response = requests.get("http://localhost:8080/api/auth/login", timeout=3)
            started = True
            print(f"Spring Boot application is ONLINE (Status: {response.status_code})!")
            print("Allowing 15 seconds for Hibernate and DataSeeder to fully initialize...")
            time.sleep(15)
            break
        except requests.exceptions.RequestException:
            # Check if process died
            if process.poll() is not None:
                print("Spring Boot process died unexpectedly! Checking log...")
                log_file.close()
                try:
                    with open(log_file_path, "r", encoding="utf-8") as lf:
                        lines = lf.readlines()
                        for line in lines[-30:]:
                            print(f"[Spring Boot LOG] {line.strip()}")
                except Exception as le:
                    print(f"Could not read log file: {le}")
                raise Exception("Spring Boot failed to start.")
            time.sleep(3)
            print("  Still waiting for Spring Boot to start...")
            
    if not started:
        process.terminate()
        log_file.close()
        raise TimeoutError("Spring Boot failed to start within 90 seconds.")
        
    return process, log_file

def generate_chart(results_file, output_chart):
    try:
        import matplotlib.pyplot as plt
        import pandas as pd
        import seaborn as sns
        
        df = pd.read_csv(results_file)
        if df.empty:
            print("No data to plot.")
            return
            
        plt.figure(figsize=(10, 6))
        sns.set_theme(style="whitegrid")
        
        # We plot concurrency vs p95_latency_ms for each strategy
        sns.lineplot(
            data=df, 
            x="concurrency", 
            y="p95_latency_ms", 
            hue="strategy", 
            marker="o", 
            linewidth=2.5,
            markersize=8
        )
        
        plt.title("Comparación de Latencia P95 por Estrategia de Carga (Hibernate N+1)", fontsize=14, fontweight="bold", pad=15)
        plt.xlabel("Carga Concurrente (Peticiones Simultáneas)", fontsize=12, labelpad=10)
        plt.ylabel("Latencia P95 (ms)", fontsize=12, labelpad=10)
        plt.yscale("log") # Use log scale because N+1 has MASSIVE difference (thousands vs tens of ms)
        plt.gca().yaxis.set_major_formatter(plt.FuncFormatter(lambda y, _: '{:g}'.format(y)))
        
        plt.legend(title="Estrategia", fontsize=11, title_fontsize=12, loc="upper left")
        plt.tight_layout()
        
        plt.savefig(output_chart, dpi=150)
        plt.close()
        print(f"Latency comparison chart successfully saved to: {output_chart}")
    except Exception as e:
        print(f"Error generating chart: {e}")
        print("Make sure matplotlib and pandas are installed in the venv.")

def main():
    # Make sure we are on port 8080 clean
    kill_port_8080()
    
    # Find top seeded user
    username, treatment_count = get_top_granjero()
    print(f"Target Seeded User: '{username}' with {treatment_count} treatments in database.")
    
    # Start app
    spring_process, log_file = start_spring_boot()
    
    results = []
    
    try:
        # No JWT needed - using public /api/benchmark/tratamientos endpoint
        strategies = ["lazy", "eager", "join-fetch", "entity-graph"]
        concurrencies = [10, 50, 100]
        
        # Number of requests scales with concurrency to get a good average
        for strategy in strategies:
            for concurrency in concurrencies:
                total_requests = max(50, concurrency * 2)
                res = run_benchmark(strategy, concurrency, total_requests, "http://localhost:8080", username)
                if res:
                    results.append(res)
                    
        # Save results to CSV
        results_dir = Path(__file__).parent.parent / "results"
        results_dir.mkdir(parents=True, exist_ok=True)
        
        csv_file = results_dir / "latency_comparison.csv"
        print(f"\nSaving results to CSV: {csv_file}")
        
        keys = results[0].keys()
        with open(csv_file, "w", newline="", encoding="utf-8") as f:
            dict_writer = csv.DictWriter(f, keys)
            dict_writer.writeheader()
            dict_writer.writerows(results)
            
        print("CSV file written successfully!")
        
        # Generate chart
        chart_file = results_dir / "latency_comparison.png"
        generate_chart(csv_file, chart_file)
        
    finally:
        print("Shutting down Spring Boot application...")
        if 'spring_process' in locals():
            spring_process.terminate()
            spring_process.wait()
        if 'log_file' in locals():
            log_file.close()
        kill_port_8080()
        print("All processes cleaned up successfully.")

if __name__ == '__main__':
    main()
