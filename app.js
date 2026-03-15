/* =========================================
   1. VARIABLES GLOBALES
   ========================================= */
   let USUARIO_ID = null; 
   const API_URL = "https://reto-paes-mvp.onrender.com/api";
   
   let userData = {
       streaks: { 'M1': 0, 'M2': 0, 'Lectora': 0, 'Ciencias': 0, 'Historia': 0 },
       preguntasHoy: { 'M1': 0, 'M2': 0, 'Lectora': 0, 'Ciencias': 0, 'Historia': 0 },
       correctasHoy: { 'M1': 0, 'M2': 0, 'Lectora': 0, 'Ciencias': 0, 'Historia': 0 }
   };
   
   let currentSubject = ''; 
   let currentQuestionData = null; 
   
   // REVISAR SI YA HAY UNA SESIÓN GUARDADA AL ABRIR LA PÁGINA
window.onload = async () => {
    const savedId = localStorage.getItem('retoPaes_userId');
    const savedName = localStorage.getItem('retoPaes_userName');

    if (savedId && savedName) {
        USUARIO_ID = savedId;
        document.getElementById('user-name-display').innerText = savedName.charAt(0).toUpperCase() + savedName.slice(1);
        
        try {
            const progresoResponse = await fetch(`${API_URL}/progreso/${USUARIO_ID}`);
            if (progresoResponse.ok) {
                userData = await progresoResponse.json();
                updateDashboard();
                
                // Ocultamos el login directamente
                document.getElementById('login-modal').classList.add('hidden');
                document.getElementById('logout-btn').classList.remove('hidden');
                document.getElementById('profile-btn').classList.remove('hidden');
            }
        } catch (error) {
            console.error("No se pudo validar la sesión silenciosa", error);
            // Si el servidor está apagado, simplemente le pedimos que inicie sesión de nuevo
        }
    }
};
   /* =========================================
      2. FUNCIONES DE AUTENTICACIÓN (LOGIN/REGISTRO)
      ========================================= */
   let isLoginMode = true;
   
   // Función para alternar visualmente entre Login y Registro
   function toggleAuthMode() {
       isLoginMode = !isLoginMode;
       const nameInput = document.getElementById('reg-name');
       const title = document.getElementById('auth-title');
       const subtitle = document.getElementById('auth-subtitle');
       const actionBtn = document.getElementById('auth-action-btn');
       const toggleText = document.getElementById('auth-toggle-text');
       const toggleLink = document.getElementById('auth-toggle-link');
   
       if (isLoginMode) {
           nameInput.classList.add('hidden');
           title.innerText = "Bienvenido a Reto PAES";
           subtitle.innerText = "Ingresa para guardar tu progreso";
           actionBtn.innerText = "Comenzar a entrenar";
           toggleText.innerText = "¿No tienes cuenta?";
           toggleLink.innerText = "Regístrate aquí";
       } else {
           nameInput.classList.remove('hidden');
           title.innerText = "Crea tu Cuenta";
           subtitle.innerText = "Únete y asegura tu puntaje";
           actionBtn.innerText = "Registrarme";
           toggleText.innerText = "¿Ya tienes cuenta?";
           toggleLink.innerText = "Inicia sesión";
       }
   }
   
   // Nueva función principal que reemplaza a iniciarSesionReal()
   async function procesarAuth() {
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    const nombre = document.getElementById('reg-name').value;

    if (!email || !email.includes('@') || !password) {
        alert("Por favor, completa correctamente todos los campos obligatorios.");
        return;
    }

    // Decidimos a qué ruta de Python llamar según el modo en el que estemos
    const endpoint = isLoginMode ? "/login" : "/registro";
    const payload = isLoginMode ? { email, password } : { email, nombre, password };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            USUARIO_ID = data.usuario_id;
            
            // ¡LA MAGIA DEL NOMBRE! Si es login viene de Python (data.nombre), si es registro viene del input (nombre)
            const displayNombre = isLoginMode ? data.nombre : nombre;
            
            // GUARDAMOS EL "PASE VIP" EN EL NAVEGADOR
            localStorage.setItem('retoPaes_userId', USUARIO_ID);
            localStorage.setItem('retoPaes_userName', displayNombre);
            
            // Cargar datos reales del servidor
            const progresoResponse = await fetch(`${API_URL}/progreso/${USUARIO_ID}`);
            if (progresoResponse.ok) {
                userData = await progresoResponse.json();
                
                // Saludo superior con el nombre real
                document.getElementById('user-name-display').innerText = displayNombre.charAt(0).toUpperCase() + displayNombre.slice(1);
                
                updateDashboard();
                
                // Animación de salida del modal
                const loginModal = document.getElementById('login-modal');
                loginModal.style.transition = "opacity 0.3s ease";
                loginModal.style.opacity = '0';
                setTimeout(() => {
                    loginModal.classList.add('hidden');
                    loginModal.style.opacity = '1'; 
                }, 300);
                
                document.getElementById('logout-btn').classList.remove('hidden');
                document.getElementById('profile-btn').classList.remove('hidden');
            }
        } else {
            // Mostrar error del servidor (ej: Contraseña incorrecta, correo en uso)
            alert(data.detail || "Error en la autenticación");
        }
    } catch (error) {
        alert("No se pudo conectar con el servidor Python.");
    }
}
   
   // Botón de salir actualizado para limpiar la contraseña
   // 1. Al apretar "Salir" en el menú, solo mostramos la advertencia
document.getElementById('logout-btn').addEventListener('click', () => {
    document.getElementById('logout-confirm-modal').classList.remove('hidden');
});

// 2. Si se arrepiente, cerramos el cartel
function closeLogoutConfirm() {
    document.getElementById('logout-confirm-modal').classList.add('hidden');
}

// 3. Si confirma, ejecutamos toda la limpieza
function confirmLogout() {
    // Escondemos la confirmación
    document.getElementById('logout-confirm-modal').classList.add('hidden');
    
    // Mostramos el login y escondemos los botones del menú
    document.getElementById('login-modal').classList.remove('hidden');
    document.getElementById('logout-btn').classList.add('hidden');
    document.getElementById('profile-btn').classList.add('hidden');
    
    // Limpiamos los campos para el siguiente usuario
    document.getElementById('user-email').value = '';
    document.getElementById('user-password').value = '';
    document.getElementById('reg-name').value = '';
    
    // Destruimos el Pase VIP del navegador
    localStorage.removeItem('retoPaes_userId');
    localStorage.removeItem('retoPaes_userName');
    
    USUARIO_ID = null;
    
    // Reseteamos el tablero a cero
    document.getElementById('user-name-display').innerText = 'Estudiante';
    const ids = ['m1', 'm2', 'lectora', 'ciencias', 'historia'];
    ids.forEach(id => {
        document.getElementById(`streak-${id}`).innerText = '0';
        const badge = document.getElementById(`streak-${id}`).closest('.subject-card').querySelector('.status-badge');
        if(badge) {
            badge.innerText = "Practicar (0/3)";
            badge.classList.remove('listo');
            badge.classList.add('pendiente');
        }
    });
    
    // Si cerramos sesión, volvemos a poner el modal en modo "Login" por defecto
    if (!isLoginMode) {
        toggleAuthMode();
    }
}
   
   /* =========================================
      3. LÓGICA DEL JUEGO
      ========================================= */
   async function openQuestion(subject) {
       if (userData.preguntasHoy[subject] >= 3) {
           alert("Ya completaste tus 3 preguntas gratuitas de hoy para esta materia. ¡Vuelve mañana!");
           return;
       }
   
       currentSubject = subject;
   
       try {
           const response = await fetch(`${API_URL}/pregunta/${subject}/${USUARIO_ID}`);
           if (!response.ok) {
               if(response.status === 404) alert("¡Felicidades! Ya respondiste todas las preguntas disponibles para esta materia.");
               else alert("Hubo un error al buscar la pregunta.");
               return;
           }
   
           currentQuestionData = await response.json();
           const nombresMaterias = {
               'M1': 'Competencia Matemática 1 (M1)', 'M2': 'Competencia Matemática 2 (M2)',
               'Lectora': 'Competencia Lectora', 'Ciencias': 'Ciencias', 'Historia': 'Historia y Cs. Sociales'
           };
   
           document.getElementById('question-subject').innerText = nombresMaterias[subject];
           document.getElementById('question-text').innerText = currentQuestionData.texto;
           
           const optionsContainer = document.getElementById('options-container');
           optionsContainer.innerHTML = '';
           document.getElementById('feedback-container').classList.add('hidden');
   
           currentQuestionData.opciones.forEach((optionText, index) => {
               const btn = document.createElement('button');
               btn.className = 'option-btn';
               btn.innerText = optionText;
               btn.onclick = () => checkAnswer(index, btn); 
               optionsContainer.appendChild(btn);
           });
   
           document.getElementById('question-modal').classList.remove('hidden');
           if (window.MathJax) {
            MathJax.typesetPromise().then(() => {
                console.log('Matemáticas renderizadas correctamente');
            }).catch((err) => console.log('Error en MathJax: ', err));
        }
        // -------------------------------------------------

    } catch (error) {
        alert("No se pudo conectar con el servidor Python.");
    }
}
   
   async function checkAnswer(selectedIndex, clickedButton) {
       const isCorrect = (selectedIndex === currentQuestionData.indice_correcto);
       const allButtons = document.querySelectorAll('.option-btn');
       allButtons.forEach(btn => btn.disabled = true);
   
       const feedbackTitle = document.getElementById('feedback-title');
       const modalGlass = document.querySelector('#question-modal .glass-card');
   
       if (isCorrect) {
           clickedButton.classList.add('correct');
           feedbackTitle.innerText = "¡Correcto! 🔥";
           feedbackTitle.style.color = "var(--success)";
           
           modalGlass.style.transition = "background-color 0.3s ease";
           modalGlass.style.backgroundColor = "rgba(37, 211, 102, 0.15)";
           setTimeout(() => {
               modalGlass.style.backgroundColor = ""; 
           }, 400);
           userData.correctasHoy[currentSubject] = (userData.correctasHoy[currentSubject] || 0) + 1;
   
       } else {
           clickedButton.classList.add('wrong');
           feedbackTitle.innerText = "Incorrecto 😢";
           feedbackTitle.style.color = "var(--error)";
           allButtons[currentQuestionData.indice_correcto].classList.add('correct');
           
           clickedButton.classList.add('shake');
           setTimeout(() => clickedButton.classList.remove('shake'), 500);
       }
   
       userData.preguntasHoy[currentSubject] = (userData.preguntasHoy[currentSubject] || 0) + 1;
   
       if (userData.preguntasHoy[currentSubject] === 3) {
           userData.streaks[currentSubject] += 1;
       }
   
       document.getElementById('feedback-explanation').innerText = currentQuestionData.explicacion;
       document.getElementById('feedback-container').classList.remove('hidden');
       if (window.MathJax) {
        MathJax.typesetPromise().catch((err) => console.log('Error renderizando explicación: ', err));
    }
   
       const btnNext = document.getElementById('btn-next-action');
       if (userData.preguntasHoy[currentSubject] >= 3) {
           btnNext.innerText = "¡Materia Completada! 🏆";
       } else {
           btnNext.innerText = "Siguiente pregunta ➔";
       }
   
       try {
           await fetch(`${API_URL}/respuesta`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   usuario_id: USUARIO_ID, pregunta_id: currentQuestionData.id,
                   materia: currentSubject, fue_correcta: isCorrect
               })
           });
       } catch (error) { console.error("Error guardando"); }
   }
   
   function closeQuestion() {
       document.getElementById('question-modal').classList.add('hidden');
       updateDashboard(); 
   }
   
   async function siguienteAccion() {
       const preguntasHechas = userData.preguntasHoy[currentSubject] || 0;
   
       if (preguntasHechas < 3) {
           const btnNext = document.getElementById('btn-next-action');
           btnNext.innerText = "Cargando...";
           await openQuestion(currentSubject); 
       } else {
           closeQuestion();
           confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
   
           const materias = ['M1', 'M2', 'Lectora', 'Ciencias', 'Historia'];
           const todasCompletadas = materias.every(materia => (userData.preguntasHoy[materia] || 0) >= 3);
           
           if (todasCompletadas) {
               setTimeout(() => {
                   var duration = 3 * 1000;
                   var animationEnd = Date.now() + duration;
                   var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
                   var interval = setInterval(function() {
                       var timeLeft = animationEnd - Date.now();
                       if (timeLeft <= 0) return clearInterval(interval);
                       var particleCount = 50 * (timeLeft / duration);
                       confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
                   }, 250);
                   
                   setTimeout(() => {
                       document.getElementById('upsell-modal').classList.remove('hidden');
                   }, 1000);
               }, 500);
           }
       }
   }
   
   function updateDashboard() {
       const ids = { 'M1': 'm1', 'M2': 'm2', 'Lectora': 'lectora', 'Ciencias': 'ciencias', 'Historia': 'historia' };
       for (const subject in ids) {
           const idSuffix = ids[subject];
           const streakElement = document.getElementById(`streak-${idSuffix}`);
           
           if(streakElement) {
               streakElement.innerText = userData.streaks[subject];
               const statusBadge = streakElement.closest('.subject-card').querySelector('.status-badge');
               
               if(statusBadge) {
                   const contador = userData.preguntasHoy[subject] || 0;
                   if (contador >= 3) {
                       statusBadge.innerText = "Completado"; 
                       statusBadge.classList.remove('pendiente'); 
                       statusBadge.classList.add('listo'); 
                   } else {
                       statusBadge.innerText = `Practicar (${contador}/3)`;
                       statusBadge.classList.remove('listo');
                       statusBadge.classList.add('pendiente');
                   }
               }
           }
       }
   }
   
   /* =========================================
      4. PERFIL Y GAMIFICACIÓN
      ========================================= */
   function openProfile() {
       const totalStreak = Object.values(userData.streaks).reduce((a, b) => a + b, 0);
       const totalHoy = Object.values(userData.preguntasHoy).reduce((a, b) => a + b, 0);
       const correctasHoy = Object.values(userData.correctasHoy).reduce((a, b) => a + b, 0); 
       
       document.getElementById('profile-name').innerText = document.getElementById('user-name-display').innerText;
       document.getElementById('stat-total-streak').innerText = totalStreak;
       document.getElementById('stat-today').innerText = `${correctasHoy}/${totalHoy}`; 
       
       document.getElementById('prof-m1').innerText = userData.streaks['M1'] || 0;
       document.getElementById('prof-m2').innerText = userData.streaks['M2'] || 0;
       document.getElementById('prof-lec').innerText = userData.streaks['Lectora'] || 0;
       document.getElementById('prof-cie').innerText = userData.streaks['Ciencias'] || 0;
       document.getElementById('prof-his').innerText = userData.streaks['Historia'] || 0;
       
       document.getElementById('profile-modal').classList.remove('hidden');
   }
   
   function closeProfile() {
       document.getElementById('profile-modal').classList.add('hidden');
   }
   
   function shareProgress() {
       const totalStreak = Object.values(userData.streaks).reduce((a, b) => a + b, 0);
       const totalHoy = Object.values(userData.preguntasHoy).reduce((a, b) => a + b, 0);
       const correctasHoy = Object.values(userData.correctasHoy).reduce((a, b) => a + b, 0);
   
       const text = `🔥 ¡Mi entrenamiento en Reto PAES está en llamas! 🚀\n\n` +
                    `🎯 Aciertos de hoy: ${correctasHoy}/${totalHoy}\n` +
                    `🏆 Puntaje total de rachas: ${totalStreak}\n\n` +
                    `Mis rachas activas:\n` +
                    `📐 M1: ${userData.streaks['M1'] || 0} días\n` +
                    `📈 M2: ${userData.streaks['M2'] || 0} días\n` +
                    `📖 Lectora: ${userData.streaks['Lectora'] || 0} días\n` +
                    `🔬 Ciencias: ${userData.streaks['Ciencias'] || 0} días\n` +
                    `🏛️ Historia: ${userData.streaks['Historia'] || 0} días\n\n` +
                    `¡Entrena gratis conmigo aquí! 👇\n` + 
                    `https://tupagina.com`; 
   
       const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
       window.open(url, '_blank');
   }

// REGISTRO DEL SERVICE WORKER PARA PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}