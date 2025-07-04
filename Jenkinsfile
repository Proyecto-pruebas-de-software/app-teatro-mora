pipeline {
  agent any
  environment {
    NODE_ENV = 'development'
  }
  options {
    skipStagesAfterUnstable()
  }

  tools {
    nodejs 'node24'
  }

  stages {

    stage('Deploy Backend') {
      steps {
        echo '🚀 Desplegando backend...'
        dir('api') {
          sh '''
            echo "Sincronizando backend a /home/azureuser/app-teatro-mora/api..."
            rsync -av --delete --exclude=node_modules --exclude=tests ./ /home/azureuser/app-teatro-mora/api/

            echo "Instalando dependencias de producción..."
            cd /home/azureuser/app-teatro-mora/api
            npm install --omit=dev

            echo "Eliminando proceso anterior de PM2..."
            sudo -u azureuser pm2 delete api-teatro || true

            echo "Levantando backend con PM2 desde cero..."
            sudo -u azureuser pm2 start index.js \
              --name api-teatro \
              --cwd /home/azureuser/app-teatro-mora/api \
              --env production \
              --update-env
          '''
        }
      }
    }

    stage('Build & Deploy Frontend') {
      steps {
        echo '🌐 Construyendo y desplegando frontend (Vite)...'
        dir('frontend') {
          sh '''
            echo "Limpiando y preparando frontend..."
            rm -rf node_modules package-lock.json dist
            npm install

            echo "Construyendo frontend..."
            npm run build
          '''
        }

        // Copiar dist desde la raíz del proyecto
        sh '''
          echo "Copiando build desde raíz del proyecto (dist/) a /home/azureuser/app-teatro-mora..."
          if [ ! -d dist ]; then
            echo "❌ No se encontró el directorio 'dist/' en la raíz del proyecto."
            exit 1
          fi

          rsync -av --delete dist/ /home/azureuser/app-teatro-mora/
        '''
      }
    }

    stage('Run E2E Tests') {
  steps {
    echo '🧪 Ejecutando pruebas E2E con Chromium como azureuser...'

    // Espera para asegurar que el backend y frontend estén arriba
    sh 'sleep 5'

    // Ejecuta las pruebas con sudo -u azureuser
    sh '''
      echo "Ejecutando pruebas E2E como azureuser..."
      sudo -u azureuser bash -c '
        cd /var/lib/jenkins/workspace/teatro-mora
        npm install
        npm run test:e2e
      '
    '''
  }
}
  }

  post {
    success {
      echo '✅ CI/CD completado exitosamente.'
    }
    failure {
      echo '❌ El pipeline falló.'
    }
  }
}
