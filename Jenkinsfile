pipeline {
  agent any

  environment {
    NODE_ENV = 'development'
  }

  tools {
    nodejs 'node24'
  }

  stages {
    stage('Checkout') {
      steps {
        echo '📥 Haciendo checkout del repositorio...'
        checkout scm
      }
    }

    stage('Install Backend Dependencies') {
      steps {
        dir('api') {
          echo '🧹 Limpiando dependencias previas del backend...'
          sh 'rm -rf node_modules package-lock.json'

          echo '📦 Instalando dependencias del backend...'
          sh 'npm install'
          sh 'npm install --save-dev mocha chai mocha-junit-reporter selenium-webdriver'
        }
      }
    }


    stage('Install & Build Frontend') {
      steps {
        dir('frontend') {
          echo '🧹 Limpiando frontend...'
          sh 'rm -rf node_modules package-lock.json build'

          echo '📦 Instalando dependencias del frontend...'
          sh 'npm install'

          echo '⚙️ Construyendo frontend...'
          sh 'npm run build'
        }
      }
    }

    stage('Deploy Backend') {

      steps {
        echo '🚀 Desplegando backend en servidor...'
        dir('api') {
          sh '''
            echo "📁 Sincronizando backend a /home/azureuser/app-teatro-mora/api..."
            rsync -av --delete --exclude=node_modules --exclude=tests ./ /home/azureuser/app-teatro-mora/api/

            echo "📦 Instalando dependencias de producción..."
            cd /home/azureuser/app-teatro-mora/api
            npm install --omit=dev

            echo "♻️ Reiniciando backend con PM2..."
            pm2 reset api-teatro
          '''
        }
      }
    }

    stage('Deploy Frontend') {
      
      steps {
        echo '🌐 Desplegando frontend (React) en servidor...'
        dir('frontend') {
          sh '''
            echo "📁 Copiando build de frontend a /home/azureuser/app-teatro-mora..."
            rsync -av --delete build/ /home/azureuser/app-teatro-mora/
          '''
        }
      }
    }

    stage('Run Selenium E2E Tests') {
      
      steps {
        dir('src/tests/e2e-chromium') {
          echo '🧪 Instalando dependencias para tests E2E Chromium...'
          sh 'rm -rf node_modules package-lock.json'
          sh 'npm install selenium-webdriver mocha chai'

          echo '🚀 Ejecutando pruebas E2E con Selenium Chromium...'
          script {
            def e2eExitCode = sh(
              script: '''
                rm -f test-results-e2e.xml
                npx mocha --reporter mocha-junit-reporter --reporter-options mochaFile=test-results-e2e.xml --timeout 30000 || exit 1
              ''',
              returnStatus: true
            )
            if (e2eExitCode != 0) {
              echo '⚠️ Algunas pruebas E2E Chromium fallaron.'
              currentBuild.result = 'UNSTABLE'
            } else {
              echo '✅ Todas las pruebas E2E Chromium pasaron.'
            }
          }
        }
      }
      post {
        always {
          echo '📄 Publicando resultados de pruebas E2E Chromium...'
          junit 'src/tests/e2e-chromium/test-results-e2e.xml'
        }
      }
    }
  }

  post {
    success {
      echo '✅ CI/CD completado exitosamente.'
    }
    unstable {
      echo '⚠️ CI/CD completado con estado UNSTABLE (verifica los tests).'
    }
    failure {
      echo '❌ El pipeline falló completamente.'
    }
    always {
      echo '📦 Finalizando ejecución del pipeline.'
    }
  }
}
