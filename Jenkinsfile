pipeline {
  agent any

  environment {
    NODE_ENV = 'development'
    DEPLOY_PATH = '/home/azureuser/app-teatro-mora'
  }

  tools {
    nodejs 'node24'
  }

  stages {

    stage('Pruebas Backend') {
      steps {
        dir('api') {
          echo '📦 Instalando dependencias backend...'
          sh 'rm -rf node_modules package-lock.json'
          sh 'npm install'

          echo '🧪 Ejecutando pruebas backend...'
          script {
            def code = sh(
              script: '''
                npx mocha tests/**/*.test.js --timeout 15000 --reporter mocha-junit-reporter --reporter-options mochaFile=test-results-backend.xml
              ''',
              returnStatus: true
            )
            if (code != 0) {
              error "❌ Fallaron pruebas backend"
            }
          }
        }
      }
      post {
        always {
          junit 'api/test-results-backend.xml'
        }
      }
    }

    stage('Construir Backend y Frontend en Deploy Path') {
      steps {
        echo '🚧 Construyendo backend y frontend en directorio de despliegue...'

        // Backend
        dir("$DEPLOY_PATH/api") {
          sh 'rm -rf node_modules package-lock.json'
          sh 'npm install --omit=dev'
        }

        // Frontend
        dir("$DEPLOY_PATH") {
          sh 'rm -rf node_modules package-lock.json build dist'
          sh 'npm install'
          sh 'npm run build'
        }
      }
    }

    stage('Reiniciar Backend con PM2') {
      steps {
        dir("$DEPLOY_PATH/api") {
          echo '♻️ Reiniciando backend con PM2...'
          sh '''
            pm2 delete api-teatro || true
            pm2 start index.js --name api-teatro
          '''
        }
      }
    }

    stage('Ejecutar pruebas E2E Selenium Chromium') {
      steps {
        dir("$DEPLOY_PATH/src/tests/e2e-chromium") {
          echo '📦 Instalando dependencias para pruebas E2E...'
          sh 'rm -rf node_modules package-lock.json'
          sh 'npm install selenium-webdriver mocha chai'

          echo '🧪 Ejecutando pruebas E2E Selenium...'
          script {
            def e2eCode = sh(
              script: '''
                npx mocha --reporter mocha-junit-reporter --reporter-options mochaFile=test-results-e2e.xml --timeout 30000 || exit 1
              ''',
              returnStatus: true
            )

            if (e2eCode != 0) {
              echo '⚠️ Algunas pruebas E2E fallaron.'
              currentBuild.result = 'UNSTABLE'
            } else {
              echo '✅ Todas las pruebas E2E pasaron.'
            }
          }
        }
      }
      post {
        always {
          junit "$DEPLOY_PATH/src/tests/e2e-chromium/test-results-e2e.xml"
        }
      }
    }
  }

  post {
    success {
      echo '✅ Pipeline finalizado con éxito.'
    }
    unstable {
      echo '⚠️ Pipeline finalizado con estado UNSTABLE, revisar pruebas E2E.'
    }
    failure {
      echo '❌ Pipeline falló.'
    }
    always {
      echo '🏁 Pipeline terminado.'
    }
  }
}
