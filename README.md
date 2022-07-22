# EOLakeWatch app

## Main Technologies

* [Vue.js](https://vuejs.org/)
* [Node.js](https://nodejs.org/en/)
* [Leaflet](https://leafletjs.com/index.html)
* [leaflet-geotiff-2](https://github.com/danwild/leaflet-geotiff-2)

## Project setup

### Environment Variables

Clone the project locally and add a `.env` file to the root of the project, or set them in "Project Settings" in Azure.

Add the following and fill in their values within `.env` (exclude NODE_ENV=development for Azure env vars).

```bash
NODE_ENV=development
VUE_APP_API_URL=
VUE_APP_TITILER_URL=
VUE_APP_COG_STORAGE_URL=
VUE_APP_COG_CONTAINER=
VUE_APP_BOUNDARY_CONTAINER=

PG_USER=
PG_PASSWORD=
PG_HOST=
PG_PORT=
PG_DATABASE=
```

### Install Dependancies

```bash
yarn install
```

### Dev mode with auto-reloading

```bash
# frontend dev
yarn dev:vue

# backend dev
yarn dev:express
# backend dev with debug
DEBUG=express:* yarn run dev:express

# run frontend dev and backend dev together
yarn run dev
```

### Compiles and minifies for production

```bash
yarn build
```

### Lints and fixes files

```bash
yarn lint
```

## Deployment

Auto deployments are configured with Azure for any code changes merged into `main` in this repository. Once code is merged into `main` the Azure deployment will automatically begin and the production URL will be updated once the deployment has successfully completed.

See [Configuration Reference](https://cli.vuejs.org/config/).
