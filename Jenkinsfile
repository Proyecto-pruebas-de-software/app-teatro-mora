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
    stage('Install Backend Dependencies') {
      steps {
        dir('api') {
          echo 'Borrando node_modules y package-lock.json...'
          sh 'rm -rf node_modules package-lock.json'
          echo 'Instalando dependencias backend...'
          sh 'npm install'
          sh 'npm install --save-dev mocha chai mocha-junit-reporter'
        }
      }
    }

    stage('Run Backend Tests') {
      steps {
        dir('api') {
          echo 'Ejecutando pruebas del backend...'
          sh '''
            rm -f test-results-*.xml
            for testfile in tests/*.test.js; do
              echo "Ejecutando $testfile..."
              npx mocha "$testfile" --reporter mocha-junit-reporter --reporter-options mochaFile=test-results-$(basename $testfile .js).xml --timeout 15000 || true
            done
          '''
        }
      }
      post {
        always {
          junit 'api/test-results-*.xml'
        }
      }
    }

    stage('Deploy Backend') {
      when {
        branch 'main'
      }
      steps {
        echo '🚀 Desplegando backend...'
        dir('api') {
          sh '''
            echo "Sincronizando backend a /home/azureuser/app-teatro-mora/api..."
            rsync -av --delete --exclude=node_modules --exclude=tests ./ /home/azureuser/app-teatro-mora/api/

            echo "Instalando dependencias de producción..."
            cd /home/azureuser/app-teatro-mora/api
            npm install --omit=dev

            echo "Reiniciando backend con PM2..."
            pm2 reset api-teatro
          '''
        }
      }
    }

    stage('Build & Deploy Frontend') {
      when {
        branch 'main'
      }
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
