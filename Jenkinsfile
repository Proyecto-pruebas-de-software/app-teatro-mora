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

            
            echo "Reiniciando backend con PM2 como azureuser..."
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
        echo '🌐 Construyendo y desplegando frontend (React)...'
        dir('frontend') {
          sh '''
            echo "Limpiando y preparando frontend..."
            rm -rf node_modules package-lock.json build
            npm install

            echo "Construyendo frontend..."
            npm run build

            echo "Copiando build a /home/azureuser/app-teatro-mora (raíz para NGINX)..."
            rsync -av --delete build/ /home/azureuser/app-teatro-mora/
          '''
        }
      }
    }

    stage('Run E2E Tests') {
      
      steps {
        echo '🧪 Ejecutando pruebas E2E con Chromium...'
        // Esperar a que los servicios estén completamente levantados
        sh 'sleep 5'

        // Ejecutar pruebas desde la raíz del proyecto
        sh '''
          echo "Instalando dependencias E2E si es necesario..."
          npm install

          echo "Ejecutando pruebas E2E (npm run test:e2e)..."
          npm run test:e2e
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
