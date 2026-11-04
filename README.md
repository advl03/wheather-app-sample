# Weather CLI App

Aplicación de consola para consultar el clima actual de una o varias ciudades usando Bun y Open-Meteo.

## Requisitos

- [Bun](https://bun.sh/) instalado.
- Acceso a internet para consultar las APIs de Open-Meteo.
- No se requiere API key.

## Instalación

```bash
bun install
```

## Ejecutar

```bash
bun index.ts
```

La aplicación guarda las ciudades y la configuración en un archivo JSON. La ruta puede configurarse con `WEATHER_APP_DATA_FILE`:

```bash
WEATHER_APP_DATA_FILE=/tmp/weather.json bun index.ts
```

Si no se define la variable, se usa `$XDG_CONFIG_HOME/wheather-app/data.json` o `~/.config/wheather-app/data.json`.

## Opciones

- **1. Clima de ciudad default**: consulta la temperatura de la ciudad predeterminada.
- **2. Clima de todas las ciudades**: consulta todas las ciudades guardadas.
- **3. Buscar y agregar ciudad**: busca una ciudad y guarda su nombre, país y coordenadas.
- **4. Eliminar ciudad**: elimina una ciudad guardada.
- **5. Establecer ciudad default**: selecciona la ciudad predeterminada.
- **8. Ajustes (°C)**: muestra la unidad utilizada por la aplicación.
- **9. Salir**: cierra la aplicación.

La primera ciudad agregada se establece automáticamente como predeterminada. Las ciudades duplicadas no se agregan. Si se elimina la ciudad predeterminada, se selecciona la primera ciudad restante.

### Ejemplo del menú

```text
════════════════════════════════════════
         WEATHER CLI
════════════════════════════════════════
  1. Clima de ciudad default
  2. Clima de todas las ciudades (1)
  3. Buscar y agregar ciudad
  4. Eliminar ciudad
  5. Establecer ciudad default
  8. Ajustes (°C)
  9. Salir
════════════════════════════════════════
Selecciona una opción:
```

## APIs de Open-Meteo

La aplicación realiza dos solicitudes:

1. **Geocoding API** para convertir el nombre de la ciudad en coordenadas:

```text
https://geocoding-api.open-meteo.com/v1/search?name=Ottawa&count=1&language=es&format=json
```

2. **Forecast API** para consultar la temperatura actual con esas coordenadas:

```text
https://api.open-meteo.com/v1/forecast?latitude=45.41117&longitude=-75.69812&current=temperature_2m
```

Los errores de red, ciudades no encontradas y respuestas inválidas se muestran al usuario y no terminan el menú.

## Desarrollo y verificación

```bash
bun test
bun run typecheck
```

Para ejecutar una prueba específica:

```bash
bun test src/weather.test.ts
```

## Crear un binario ejecutable

```bash
bun build --compile --outfile weather-cli index.ts
./weather-cli
```

El binario utiliza la misma variable `WEATHER_APP_DATA_FILE` para configurar la ubicación del archivo de datos.

## Estructura principal

- `index.ts`: punto de entrada, terminal real y ciclo de persistencia.
- `src/cli.ts`: menú, entrada/salida inyectable y transiciones del estado.
- `src/weather.ts`: clientes de geocodificación y pronóstico de Open-Meteo.
- `src/storage.ts`: carga, validación y guardado del estado JSON.
- `src/types.ts`: tipos `City` y `AppState`.
- `src/*.test.ts`: pruebas unitarias con `bun:test`.
