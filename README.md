# README - Proyecto 3D Third Person Shooter con Three.js

## Descripción

Este proyecto consiste en el desarrollo de un entorno interactivo 3D utilizando Three.js y WebGL, implementando un sistema de control en tercera persona inspirado en videojuegos tipo Free Fire.

El proyecto integra:

* Modelos 3D en formato `.glb`
* Animaciones de personaje
* Cámara en tercera y primera persona
* Movimiento libre
* Sistema de disparos
* Física básica
* Colisiones
* Escenario interactivo
* Controles mediante teclado y mouse

El objetivo principal es desarrollar una experiencia interactiva en tiempo real utilizando gráficos 3D y controles modernos de videojuegos.

---

# Características principales

## Movimiento del personaje

El jugador controla un personaje animado con:

* Movimiento hacia adelante y atrás
* Movimiento lateral (strafe)
* Rotación con mouse
* Salto con gravedad
* Detección de suelo y plataformas

---

## Sistema de cámara

El proyecto incluye:

### Cámara en tercera persona

* Seguimiento dinámico del personaje
* Rotación libre con mouse
* Movimiento suave
* Vista tipo shooter

### Cámara en primera persona

* Cambio dinámico de perspectiva
* Activación mediante tecla `V`

---

## Animaciones

El personaje cuenta con animaciones importadas desde el modelo `.glb`.

Animaciones utilizadas:

* `Caminando`
* `Ataque`
* `CamConEsp`
* `Poder`

Las animaciones utilizan:

* `AnimationMixer`
* Transiciones suaves (`fadeIn`, `fadeOut`)
* Reproducción controlada mediante teclado y mouse

---

# Sistema de disparos

Se implementó un sistema de proyectiles utilizando geometrías personalizadas en forma de estrella.

Características:

* Disparo desde el personaje
* Dirección basada en cámara
* Física de movimiento
* Colisiones con entorno
* Rotación visual de proyectiles

---

# Física y colisiones

El proyecto utiliza:

* `Octree`
* `Sphere Collision`
* Física básica personalizada

Permite:

* Detectar paredes
* Detectar plataformas
* Evitar atravesar objetos
* Caída por gravedad
* Movimiento sobre superficies

---

# Tecnologías utilizadas

* HTML5
* CSS3
* JavaScript ES6
* WebGL
* Three.js

Librerías y módulos:

* `GLTFLoader`
* `Octree`
* `OctreeHelper`
* `Stats.js`
* `lil-gui`

---

# Controles

| Tecla / Mouse   | Acción                                  |
| --------------- | --------------------------------------- |
| W               | Avanzar                                 |
| S               | Retroceder                              |
| A               | Movimiento lateral izquierda            |
| D               | Movimiento lateral derecha              |
| Mouse           | Rotar cámara/personaje                  |
| Click izquierdo | Disparar                                |
| Espacio         | Saltar                                  |
| V               | Cambiar entre primera y tercera persona |

---

# Funcionalidades implementadas

## Escenario 3D

* Carga de mapa `.glb`
* Iluminación dinámica
* Sombras
* Entorno interactivo

## Personaje

* Modelo animado
* Movimiento real
* Sistema de animaciones
* Colisiones

## Cámara

* Tercera persona
* Primera persona
* Rotación libre

## Física

* Gravedad
* Detección de suelo
* Plataformas
* Colisiones

## Proyectiles

* Disparos personalizados
* Física básica
* Colisiones

---

# Problemas resueltos durante el desarrollo

Durante el desarrollo se solucionaron diversos problemas técnicos:

* Conflicto entre sistema FPS original y tercera persona
* Errores de animaciones no definidas
* Sincronización entre cámara y personaje
* Disparos desde cámara en lugar del personaje
* Vibración de cámara durante salto
* Rotación incorrecta del personaje
* Detección de colisiones
* Personaje atravesando objetos
* Ajuste de escala y posición del modelo

---

# Objetivo académico

Desarrollar aplicaciones capaces de crear ambientes interactivos 3D utilizando controles FPS/TPS mediante mouse y teclado, integrando recursos de WebGL y Three.js para simular mecánicas modernas de videojuegos.

---

# Posibles mejoras futuras

* Sistema de vida
* Enemigos IA
* HUD
* Minimapa
* Efectos de partículas
* Sonidos
* Multiplayer
* Inventario
* Sistema de armas
* Animaciones adicionales
* Mejor sistema físico

---

# Autor
Jesus Roberto Hernandez Benitez
Proyecto desarrollado como práctica de interacción 3D y desarrollo de videojuegos utilizando Three.js y WebGL.
