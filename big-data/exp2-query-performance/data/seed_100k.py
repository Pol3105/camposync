import psycopg2
from psycopg2 import extras
import os
import random
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

def run_seeder():
    # Load .env file
    env_path = Path(__file__).parent.parent.parent / ".env"
    load_dotenv(env_path)
    
    print(f"Connecting to database '{os.getenv('DB_NAME', 'agro_data')}' as user '{os.getenv('DB_USER', 'admin_saas')}'...")
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "agro_data"),
        user=os.getenv("DB_USER", "admin_saas"),
        password=os.getenv("DB_PASSWORD", "CampoSyncS2026PostgreSQL!"),
        port=os.getenv("DB_PORT", "5432")
    )
    conn.autocommit = False
    cursor = conn.cursor()
    
    try:
        # First, clean up previous seed data to avoid infinite accumulation and keep it clean
        print("Cleaning up previous seed data (with correct FK ordering)...")
        # 1. Delete treatments referencing seeded recintos
        cursor.execute("DELETE FROM tratamiento WHERE recinto_id IN (SELECT id FROM recinto WHERE cultivo IN ('Trigo Duro', 'Cebada', 'Olivo', 'Almendro', 'Maíz', 'Viñedo', 'Girasol'));")
        # 2. Delete treatments that might have been left over with the observations string
        cursor.execute("DELETE FROM tratamiento WHERE observaciones_validador = 'Validado automáticamente por el seeder';")
        # 3. Delete recintos
        cursor.execute("DELETE FROM recinto WHERE cultivo IN ('Trigo Duro', 'Cebada', 'Olivo', 'Almendro', 'Maíz', 'Viñedo', 'Girasol');")
        # 4. Delete parcelas
        cursor.execute("DELETE FROM parcela WHERE ref_catastral LIKE '__%A001%0000';")
        # 5. Delete explotaciones
        cursor.execute("DELETE FROM explotacion WHERE nombre LIKE 'Finca Seed%';")
        # 6. Delete granjeros and usuarios
        cursor.execute("DELETE FROM granjero WHERE id IN (SELECT id FROM usuario WHERE username LIKE 'granjero_seed_%');")
        cursor.execute("DELETE FROM usuario WHERE username LIKE 'granjero_seed_%';")
        
        # 1. Fetch auxiliary data
        # Get first Asesoria
        cursor.execute("SELECT id FROM asesoria LIMIT 1;")
        asesoria_row = cursor.fetchone()
        if not asesoria_row:
            raise Exception("No asesoria found in database! Please seed or create one first.")
        asesoria_id = asesoria_row[0]
        
        # Get existing Product IDs
        cursor.execute("SELECT id FROM producto_fitosanitario;")
        product_ids = [r[0] for r in cursor.fetchall()]
        if not product_ids:
            raise Exception("No products found in database! Please run Phase 1 ingest_reto.py first.")
        print(f"Found {len(product_ids)} products in catalog.")
        
        # Get existing Aplicadores and Equipamientos
        cursor.execute("SELECT id FROM aplicador;")
        aplicador_ids = [r[0] for r in cursor.fetchall()]
        cursor.execute("SELECT id FROM equipamiento;")
        equipamiento_ids = [r[0] for r in cursor.fetchall()]
        
        # If there are no aplicadores or equipamientos, let's create a few linked to the existing usuarios
        cursor.execute("SELECT id FROM usuario LIMIT 5;")
        existing_user_ids = [r[0] for r in cursor.fetchall()]
        
        if not aplicador_ids:
            print("No aplicadores found, creating 10 default ones...")
            for i in range(10):
                uid = random.choice(existing_user_ids)
                cursor.execute(
                    "INSERT INTO aplicador (usuario_id, nif, nivel_capacitacion, nombre, numero_ropo) VALUES (%s, %s, %s, %s, %s) RETURNING id;",
                    (uid, f"1234567{i}A", "Básico", f"Aplicador Semilla {i}", f"ROPO-{i:05d}")
                )
                aplicador_ids.append(cursor.fetchone()[0])
                
        if not equipamiento_ids:
            print("No equipamientos found, creating 10 default ones...")
            for i in range(10):
                uid = random.choice(existing_user_ids)
                cursor.execute(
                    "INSERT INTO equipamiento (usuario_id, alias, marca_modelo, num_registro_iteaf, tipo_maquina) VALUES (%s, %s, %s, %s, %s) RETURNING id;",
                    (uid, f"Tractor {i}", "John Deere 6R", f"ITEAF-{i:05d}", "Pulverizador")
                )
                equipamiento_ids.append(cursor.fetchone()[0])
        
        print(f"Using {len(aplicador_ids)} Aplicadores and {len(equipamiento_ids)} Equipamientos.")

        # 2. Generate Granjeros
        num_granjeros_to_create = 50
        print(f"Generating {num_granjeros_to_create} Granjeros...")
        granjero_ids = []
        
        for i in range(num_granjeros_to_create):
            username = f"granjero_seed_{i}_{random.randint(1000,9999)}"
            passwd = "$2b$10$10T0XiN7UOrYYda27VcxeOMSTbJ5V60cy8wcHoluTRIoLD/5r8zGG" # Real bcrypt hash of 'campo2024'
            nombre = f"Granjero Semilla {i}"
            nif = f"{random.randint(10000000, 99999999)}G"
            nombre_legal = f"{nombre} S.L."
            now = datetime.now()
            
            cursor.execute(
                """INSERT INTO usuario (username, passwd, nombre, nif, nombre_legal, discrimi, created_at, updated_at) 
                   VALUES %s RETURNING id;""",
                [(username, passwd, nombre, nif, nombre_legal, 'GRANJERO', now, now)]
            )
            uid = cursor.fetchone()[0]
            
            cursor.execute(
                "INSERT INTO granjero (id, cnae, telefono, asesoria_id) VALUES (%s, %s, %s, %s);",
                (uid, "0111", f"+346001122{i:02d}", asesoria_id)
            )
            granjero_ids.append(uid)
            
        print(f"Successfully generated {len(granjero_ids)} Granjeros.")
        
        # 3. Generate Explotaciones
        num_explotaciones = 1000
        print(f"Generating {num_explotaciones} Explotaciones...")
        explotacion_data = []
        now = datetime.now()
        
        for i in range(num_explotaciones):
            granjero_id = random.choice(granjero_ids)
            nombre = f"Finca Seed {i:04d}"
            ref_sig = f"ES-SIG-{i:06d}"
            superficie_total = round(random.uniform(5.5, 120.0), 4)
            estado = "ACTIVA"
            codigo_rea = f"REA-{random.randint(100000, 999999)}"
            tipo_explotacion = "PR"
            orientacion_productiva = "CERE"
            provincia_explotacion = f"{random.randint(10, 50)}"
            municipio_explotacion = f"{random.randint(100, 999):05d}"
            anio_declaracion = 2026
            
            explotacion_data.append((
                nombre, ref_sig, superficie_total, estado, codigo_rea,
                tipo_explotacion, orientacion_productiva, provincia_explotacion,
                municipio_explotacion, anio_declaracion, asesoria_id, granjero_id, now, now
            ))
            
        extras.execute_values(
            cursor,
            """INSERT INTO explotacion (nombre, ref_sig, superficie_total, estado, codigo_rea, 
                                        tipo_explotacion, orientacion_productiva, provincia_explotacion, 
                                        municipio_explotacion, anio_declaracion, asesoria_id, usuario_id, created_at, updated_at) 
               VALUES %s;""",
            explotacion_data
        )
        
        # Fetch all newly generated explotaciones
        cursor.execute("SELECT id, usuario_id FROM explotacion WHERE nombre LIKE 'Finca Seed%';")
        explotacion_rows = cursor.fetchall()
        explotacion_granjero_map = {row[0]: row[1] for row in explotacion_rows}
        explotacion_ids = list(explotacion_granjero_map.keys())
        print(f"Successfully generated {len(explotacion_ids)} Explotaciones in DB.")
        
        # 4. Generate Parcelas
        num_parcelas = 5000
        print(f"Generating {num_parcelas} Parcelas...")
        parcela_data = []
        now = datetime.now()
        
        provincias = ["Sevilla", "Zaragoza", "Burgos", "Lleida", "Murcia", "Ciudad Real", "Badajoz", "Valencia"]
        
        for i in range(num_parcelas):
            explotacion_id = random.choice(explotacion_ids)
            ref_catastral = f"{random.randint(10, 50):02d}{random.randint(100, 999):03d}A001{random.randint(10000, 99999):05d}0000"
            prov = random.choice(provincias)
            muni = f"Municipio {random.randint(1,50)}"
            agregado = random.randint(0, 9)
            zona = random.randint(1, 99)
            poligono = random.randint(1, 200)
            parcela_sigpac = random.randint(1, 500)
            
            parcela_data.append((
                ref_catastral, muni, prov, agregado, zona, poligono, parcela_sigpac, explotacion_id, now, now
            ))
            
        extras.execute_values(
            cursor,
            """INSERT INTO parcela (ref_catastral, municipio, provincia, agregado, zona, poligono, parcela_sigpac, explotacion_id, created_at, updated_at)
               VALUES %s;""",
            parcela_data
        )
        
        # Fetch all newly generated parcelas
        cursor.execute("SELECT id, explotacion_id FROM parcela WHERE ref_catastral LIKE '__%A001%0000';")
        parcela_rows = cursor.fetchall()
        parcela_explotacion_map = {row[0]: row[1] for row in parcela_rows}
        parcela_ids = list(parcela_explotacion_map.keys())
        print(f"Successfully generated {len(parcela_ids)} Parcelas in DB.")
        
        # 5. Generate Recintos
        num_recintos = 15000
        print(f"Generating {num_recintos} Recintos...")
        recinto_data = []
        now = datetime.now()
        
        usos_sigpac = ["TA", "TH", "FY", "CI", "VI", "PA", "PR"]
        sistemas_cultivo = ["Secano", "Regadío", "Asistido"]
        cultivos = ["Trigo Duro", "Cebada", "Olivo", "Almendro", "Maíz", "Viñedo", "Girasol"]
        
        for i in range(num_recintos):
            parcela_id = random.choice(parcela_ids)
            numero_recinto = random.randint(1, 15)
            superficie = round(random.uniform(0.1, 15.0), 4)
            uso = random.choice(usos_sigpac)
            sistema = random.choice(sistemas_cultivo)
            cult = random.choice(cultivos)
            
            recinto_data.append((
                numero_recinto, superficie, uso, sistema, cult, parcela_id, now, now
            ))
            
        extras.execute_values(
            cursor,
            """INSERT INTO recinto (numero_recinto, superficie, uso_sigpac, sistema_cultivo, cultivo, parcela_id, created_at, updated_at)
               VALUES %s;""",
            recinto_data
        )
        
        # Fetch all newly generated recintos
        cursor.execute("SELECT id, parcela_id FROM recinto WHERE cultivo IN ('Trigo Duro', 'Cebada', 'Olivo', 'Almendro', 'Maíz', 'Viñedo', 'Girasol');")
        recinto_rows = cursor.fetchall()
        recinto_parcela_map = {row[0]: row[1] for row in recinto_rows}
        recinto_ids = list(recinto_parcela_map.keys())
        print(f"Successfully generated {len(recinto_ids)} Recintos in DB.")
        
        # Precompute maps for extremely fast O(1) treatment generation
        recinto_granjero_map = {}
        for r_id, p_id in recinto_parcela_map.items():
            exp_id = parcela_explotacion_map[p_id]
            g_id = explotacion_granjero_map[exp_id]
            recinto_granjero_map[r_id] = g_id
            
        # 6. Generate 100,000 Treatments!
        num_treatments = 100000
        print(f"Generating {num_treatments} Treatments...")
        
        motivos = ["PR", "CU", "ED"]
        unidades = ["L/ha", "kg/ha", "g/hl"]
        plagas = ["Pulgón", "Mildiu", "Oidio", "Mosca del olivo", "Gusano de la manzana", "Malas hierbas"]
        estados = ["VALIDADO", "PENDIENTE", "RECHAZADO"]
        
        batch_size = 10000
        total_inserted = 0
        
        for batch_start in range(0, num_treatments, batch_size):
            treatment_data = []
            now = datetime.now()
            
            current_batch_size = min(batch_size, num_treatments - batch_start)
            for _ in range(current_batch_size):
                r_id = random.choice(recinto_ids)
                g_id = recinto_granjero_map[r_id]
                
                prod_id = random.choice(product_ids)
                ap_id = random.choice(aplicador_ids)
                eq_id = random.choice(equipamiento_ids)
                
                days_ago = random.randint(0, 365)
                fecha = (datetime.now() - timedelta(days=days_ago)).date()
                
                dosis = round(random.uniform(0.1, 5.0), 2)
                unis = random.choice(unidades)
                estado = random.choice(estados)
                validado = (estado == "VALIDADO")
                superficie_tratada = round(random.uniform(0.05, 5.0), 4)
                motivo = random.choice(motivos)
                codigo_plaga = f"EPPO-{random.randint(100, 999)}"
                volumen_caldo = round(random.uniform(100.0, 1000.0), 2)
                plaga_obj = random.choice(plagas)
                txt_orig = f"Tratamiento de {plaga_obj} con dosis {dosis} {unis}"
                
                treatment_data.append((
                    random.uniform(0.70, 0.99), dosis, fecha, motivo, superficie_tratada, validado, volumen_caldo,
                    ap_id, now, eq_id, prod_id, r_id, now, g_id, codigo_plaga, estado, 
                    "Validado automáticamente por el seeder" if validado else None,
                    plaga_obj, txt_orig, unis
                ))
            
            extras.execute_values(
                cursor,
                """INSERT INTO tratamiento (ai_confidence, dosis, fecha, motivo_tratamiento, superficie_tratada, validado, volumen_caldo,
                                            aplicador_id, created_at, equipamiento_id, producto_fito_id, recinto_id, updated_at, usuario_id,
                                            codigo_plaga, estado, observaciones_validador, plaga_objetivo, texto_original, unidades)
                   VALUES %s;""",
                treatment_data
            )
            total_inserted += current_batch_size
            print(f"  Inserted {total_inserted} / {num_treatments} treatments...")
            
        print("Committing transaction...")
        conn.commit()
        print(f"SUCCESS: Successfully seeded database with all {num_treatments} treatments and their parent structures!")
        
    except Exception as e:
        print(f"ERROR during seeding: {e}")
        print("Rolling back transaction...")
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    run_seeder()
