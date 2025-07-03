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

    stage('Backend: Install & Test') {
      steps {
        dir('api') {
          echo '📦 Instalando dependencias del backend...'
          sh 'rm -rf node_modules package-lock.json'
          sh 'npm install'
          sh 'npm install --save-dev mocha chai mocha-junit-reporter selenium-webdriver'

          echo '🧪 Ejecutando pruebas del backend...'
          script {
            def exitCode = sh (
              script: '''
                rm -f test-results-*.xml
                exitCode=0
                for testfile in tests/*.test.js; do
                  echo "🧪 Ejecutando $testfile..."
                  npx mocha "$testfile" --reporter mocha-junit-reporter --reporter-options mochaFile=test-results-$(basename $testfile .js).xml --timeout 15000 || exitCode=1
                done
                exit $exitCode
              ''',
              returnStatus: true
            )

            if (exitCode != 0) {
              echo '⚠️ Algunas pruebas del backend fallaron.'
              currentBuild.result = 'UNSTABLE'
            } else {
              echo '✅ Todas las pruebas del backend pasaron.'
            }
          }
        }
      }
      post {
        always {
          junit 'api/test-results-*.xml'
        }
      }
    }

    stage('Frontend: Install & Build') {
      steps {
        dir('frontend') {
          echo '📦 Instalando dependencias del frontend...'
          sh 'rm -rf node_modules package-lock.json build'
          sh 'npm install'

          echo '⚙️ Construyendo frontend...'
          sh 'npm run build'
        }
      }
    }

    stage('Deploy Frontend & Backend') {
      steps {
        script {
          echo '🚀 Desplegando frontend y backend...'

          // Copiar backend (sin node_modules, sin tests)
          sh '''
            echo "📁 Copiando backend a $DEPLOY_PATH/api..."
            rm -rf $DEPLOY_PATH/api
            mkdir -p $DEPLOY_PATH/api
            cp -r api/* $DEPLOY_PATH/api
            rm -rf $DEPLOY_PATH/api/tests $DEPLOY_PATH/api/node_modules
          '''

          // Instalar dependencias de producción en el backend
          sh '''
            echo "📦 Instalando dependencias de producción en backend..."
            cd $DEPLOY_PATH/api
            npm install --omit=dev
          '''

          // Reiniciar backend
          sh '''
            echo "♻️ Reiniciando backend con PM2..."
            pm2 reset api-teatro || pm2 start index.js --name api-teatro
          '''

          // Copiar frontend build
          sh '''
            echo "🌐 Copiando frontend..."
            rm -rf $DEPLOY_PATH/build
            cp -r frontend/build $DEPLOY_PATH/
          '''
        }
      }
    }

    stage('E2E Tests - Selenium') {
      steps {
        dir('src/tests/e2e-chromium') {
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
