from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
import datetime
import os
from dotenv import load_dotenv

# Cargar las variables del archivo .env
load_dotenv()


# Inicializamos la aplicación
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Datos de conexión a nuestra base de datos en Docker
DB_CONFIG = {
    "dbname": "retopaes",
    "user": "admin",
    "password": "password123",
    "host": "localhost",
    "port": "5433"
}

# Moldes de datos
class RespuestaUsuario(BaseModel):
    usuario_id: int
    pregunta_id: int
    materia: str
    fue_correcta: bool

class UsuarioLogin(BaseModel):
    email: str
    password: str

class UsuarioRegistro(BaseModel):
    email: str
    nombre: str
    password: str

class NuevaPregunta(BaseModel):
    materia: str
    categoria: str
    texto: str
    opciones: str  
    indice_correcto: int
    explicacion: str

# 1. Configuración de la base de datos (Ahora lee desde el .env)
def get_db_connection():
    # Buscamos la URL en el archivo .env
    db_url = os.getenv("DATABASE_URL")
    
    # Nos conectamos usando esa URL
    conn = psycopg2.connect(db_url)
    return conn

# --- RUTAS (Endpoints) ---

# 1. Ruta de prueba
@app.get("/")
def read_root():
    return {"mensaje": "¡El servidor de Reto PAES está vivo y conectado!"}

# 2. Obtener una pregunta aleatoria y nueva
@app.get("/api/pregunta/{materia}/{usuario_id}")
def obtener_pregunta(materia: str, usuario_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor) 
    
    try:
        query = """
            SELECT id, materia, texto, opciones, indice_correcto, explicacion 
            FROM preguntas 
            WHERE materia = %s 
            AND id NOT IN (
                SELECT pregunta_id 
                FROM historial_respuestas 
                WHERE usuario_id = %s
            )
            ORDER BY RANDOM() 
            LIMIT 1;
        """
        cursor.execute(query, (materia, usuario_id))
        pregunta = cursor.fetchone() 
        
        if not pregunta:
            raise HTTPException(status_code=404, detail="¡Felicidades! Ya respondiste todas las preguntas de esta materia.")
            
        return pregunta
        
    finally:
        cursor.close()
        conn.close()

# 3. Guardar la respuesta, actualizar racha y contador diario (Solo premia constancia)
# 3. Guardar la respuesta, actualizar racha y contadores diarios
@app.post("/api/respuesta")
def guardar_respuesta(respuesta: RespuestaUsuario):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # 1. Guardar en el historial
        cursor.execute("""
            INSERT INTO historial_respuestas (usuario_id, pregunta_id, fue_correcta)
            VALUES (%s, %s, %s)
            ON CONFLICT (usuario_id, pregunta_id) DO NOTHING;
        """, (respuesta.usuario_id, respuesta.pregunta_id, respuesta.fue_correcta))

        # 2. Consultamos cómo está el usuario
        cursor.execute("""
            SELECT racha_actual, preguntas_hoy, correctas_hoy, ultima_fecha_respuesta 
            FROM rachas WHERE usuario_id = %s AND materia = %s
        """, (respuesta.usuario_id, respuesta.materia))
        racha_db = cursor.fetchone()

        hoy = datetime.date.today()

        if racha_db:
            racha_actual = racha_db['racha_actual']
            preguntas_hoy = racha_db['preguntas_hoy']
            correctas_hoy = racha_db['correctas_hoy'] if racha_db['correctas_hoy'] is not None else 0
            ultima_fecha = racha_db['ultima_fecha_respuesta']

            # Calcular contadores
            if ultima_fecha == hoy:
                nuevo_preguntas = preguntas_hoy + 1
                nuevo_correctas = correctas_hoy + (1 if respuesta.fue_correcta else 0)
            else:
                nuevo_preguntas = 1
                nuevo_correctas = 1 if respuesta.fue_correcta else 0
                if ultima_fecha < hoy - datetime.timedelta(days=1):
                    racha_actual = 0
            
            # Sumamos racha si llega a la 3ra
            if nuevo_preguntas == 3:
                racha_actual += 1

            # Actualizamos la base de datos
            cursor.execute("""
                UPDATE rachas 
                SET racha_actual = %s, preguntas_hoy = %s, correctas_hoy = %s, ultima_fecha_respuesta = %s
                WHERE usuario_id = %s AND materia = %s
            """, (racha_actual, nuevo_preguntas, nuevo_correctas, hoy, respuesta.usuario_id, respuesta.materia))
            
        else:
            # Primera vez que responde esta materia
            nuevo_correctas = 1 if respuesta.fue_correcta else 0
            cursor.execute("""
                INSERT INTO rachas (usuario_id, materia, racha_actual, ultima_fecha_respuesta, preguntas_hoy, correctas_hoy)
                VALUES (%s, %s, 0, %s, 1, %s)
            """, (respuesta.usuario_id, respuesta.materia, hoy, nuevo_correctas))

        conn.commit()
        return {"mensaje": "Respuesta procesada correctamente"}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# 4. Iniciar sesión o registrar usuario
# 4A. Ruta para REGISTRAR un nuevo usuario
@app.post("/api/registro")
def registrar_usuario(usuario: UsuarioRegistro):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Verificamos si el correo ya existe
        cursor.execute("SELECT id FROM usuarios WHERE email = %s", (usuario.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Este correo ya está registrado")

        # Encriptamos la contraseña de forma nativa convirtiéndola a bytes
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(usuario.password.encode('utf-8'), salt).decode('utf-8')

        cursor.execute(
            "INSERT INTO usuarios (email, nombre, password_hash) VALUES (%s, %s, %s) RETURNING id", 
            (usuario.email, usuario.nombre, hashed_password)
        )
        nuevo_id = cursor.fetchone()['id']
        conn.commit()
        return {"mensaje": "Usuario registrado exitosamente", "usuario_id": nuevo_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# 4B. Ruta para INICIAR SESIÓN
# 4B. Ruta para INICIAR SESIÓN (Actualizada para devolver el nombre)
@app.post("/api/login")
def login_usuario(usuario: UsuarioLogin):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # ¡AQUÍ ESTÁ EL CAMBIO! Agregamos "nombre" a la búsqueda de SQL
        cursor.execute("SELECT id, nombre, password_hash FROM usuarios WHERE email = %s", (usuario.email,))
        user_db = cursor.fetchone()

        if not user_db:
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

        # Verificamos que la contraseña coincida de forma nativa
        if not bcrypt.checkpw(usuario.password.encode('utf-8'), user_db['password_hash'].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

        # ¡AQUÍ TAMBIÉN! Devolvemos el nombre en el JSON
        return {"mensaje": "Inicio de sesión exitoso", "usuario_id": user_db['id'], "nombre": user_db['nombre']}
    finally:
        cursor.close()
        conn.close()

# 5. Obtener el progreso real del usuario al iniciar sesión (Lógica de 3 preguntas)
@app.get("/api/progreso/{usuario_id}")
def obtener_progreso(usuario_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("""
            SELECT materia, racha_actual, 
            CASE WHEN ultima_fecha_respuesta = CURRENT_DATE THEN preguntas_hoy ELSE 0 END as preguntas_hoy,
            CASE WHEN ultima_fecha_respuesta = CURRENT_DATE THEN correctas_hoy ELSE 0 END as correctas_hoy
            FROM rachas WHERE usuario_id = %s
        """, (usuario_id,))
        rachas_db = cursor.fetchall()

        progreso = {
            "streaks": { 'M1': 0, 'M2': 0, 'Lectora': 0, 'Ciencias': 0, 'Historia': 0 },
            "preguntasHoy": { 'M1': 0, 'M2': 0, 'Lectora': 0, 'Ciencias': 0, 'Historia': 0 },
            "correctasHoy": { 'M1': 0, 'M2': 0, 'Lectora': 0, 'Ciencias': 0, 'Historia': 0 } # ¡NUEVO!
        }

        for fila in rachas_db:
            materia = fila['materia']
            progreso["streaks"][materia] = fila['racha_actual']
            progreso["preguntasHoy"][materia] = fila['preguntas_hoy']
            progreso["correctasHoy"][materia] = fila['correctas_hoy'] if fila['correctas_hoy'] is not None else 0

        return progreso
    finally:
        cursor.close()
        conn.close()

# 6. Recibir preguntas desde n8n
@app.post("/api/preguntas")
def crear_pregunta(pregunta: NuevaPregunta):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO preguntas (materia, categoria, texto, opciones, indice_correcto, explicacion)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (pregunta.materia, pregunta.categoria, pregunta.texto, 
              pregunta.opciones, pregunta.indice_correcto, pregunta.explicacion))
        conn.commit()
        return {"mensaje": "Pregunta guardada con éxito en la base de datos"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()