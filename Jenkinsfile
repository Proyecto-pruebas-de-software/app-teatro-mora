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

    

    stage('Frontend: Install & Build') {
      steps {
        dir("${DEPLOY_PATH}/src") {
          echo '📦 Instalando dependencias del frontend...'
          sh 'rm -rf node_modules package-lock.json build'
          sh 'npm install'

          echo '⚙️ Construyendo frontend...'
          sh 'npm run build'
        }
      }
    }

    stage('Deploy & Restart Backend') {
      steps {
        dir("${DEPLOY_PATH}/api") {
          echo '📦 Instalando dependencias de producción en backend...'
          sh 'npm install --omit=dev'

          echo '♻️ Reiniciando backend con PM2...'
          sh 'pm2 reset api-teatro || pm2 start index.js --name api-teatro'
        }

        dir("${DEPLOY_PATH}") {
          echo '🌐 Moviendo build de frontend a raíz del proyecto...'
          sh 'rm -rf build'
          sh 'mv src/build ./'
        }
      }
    }

    stage('E2E Tests - Selenium') {
      steps {
        dir("${DEPLOY_PATH}/src/tests/e2e-chromium") {
          echo '📦 Instalando dependencias E2E...'
          sh 'rm -rf node_modules package-lock.json'
          sh 'npm install selenium-webdriver mocha chai'

          echo '🧪 Ejecutando pruebas E2E Selenium Chromium...'
          script {
            def e2eCode = sh(
              script: '''
                rm -f test-results-e2e.xml
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
          junit "${DEPLOY_PATH}/src/tests/e2e-chromium/test-results-e2e.xml"
        }
      }
    }
  }

  post {
    success {
      echo '✅ CI/CD completado exitosamente.'
    }
    unstable {
      echo '⚠️ CI/CD completado con estado UNSTABLE. Revisa los reportes.'
    }
    failure {
      echo '❌ Falló el pipeline. Revisa los errores.'
    }
    always {
      echo '📦 Pipeline finalizado.'
    }
  }
}
