pipeline {
  agent any

  environment {
    NODE_ENV = 'development'
  }

  tools {
    nodejs 'node24'
  }

  stages {
    stage('Test Backend') {
      steps {
        dir('api') {
          echo '📦 Instalando dependencias del backend...'
          sh 'rm -rf node_modules package-lock.json'
          sh 'npm install'
          sh 'npm install --save-dev mocha chai mocha-junit-reporter'

          echo '🧪 Ejecutando pruebas del backend...'
          script {
            def testExitCode = sh(
              script: '''
                rm -f test-results-*.xml
                exitCode=0
                for testfile in tests/*.test.js; do
                  echo "🔹 Ejecutando $testfile..."
                  npx mocha "$testfile" --reporter mocha-junit-reporter --reporter-options mochaFile=test-results-$(basename $testfile .js).xml --timeout 15000 || exitCode=1
                done
                exit $exitCode
              ''',
              returnStatus: true
            )
            if (testExitCode != 0) {
              echo '⚠️ Algunas pruebas backend fallaron.'
              currentBuild.result = 'UNSTABLE'
            } else {
              echo '✅ Todas las pruebas backend pasaron.'
            }
          }
        }
      }
      post {
        always {
          echo '📄 Publicando resultados de pruebas backend...'
          junit 'api/test-results-*.xml'
        }
      }
    }

    stage('Build Frontend') {
      steps {
        dir('frontend') {
          echo '📦 Instalando y construyendo frontend...'
          sh 'rm -rf node_modules package-lock.json build'
          sh 'npm install'
          sh 'npm run build'
        }
      }
    }

    stage('Deploy Frontend & Backend') {
      steps {
        echo '🚀 Desplegando frontend y backend en servidor...'
        script {
          // Sincronizar y reiniciar backend con PM2
          sh '''
            sudo su - azureuser -c '
              echo "🔄 Sincronizando backend..."
              rsync -av --delete --exclude=node_modules --exclude=tests /var/lib/jenkins/workspace/${JOB_NAME}/api/ /home/azureuser/app-teatro-mora/api/

              echo "📦 Instalando dependencias de producción (backend)..."
              cd /home/azureuser/app-teatro-mora/api
              npm install --omit=dev

              echo "♻️ Reiniciando backend con PM2..."
              pm2 reset api-teatro
            '
          '''

          // Desplegar frontend (copiar `build/` a base)
          sh '''
            sudo su - azureuser -c '
              echo "🌐 Copiando frontend build..."
              rsync -av --delete /var/lib/jenkins/workspace/${JOB_NAME}/frontend/build/ /home/azureuser/app-teatro-mora/
            '
          '''
        }
      }
    }

    stage('Run Selenium E2E Tests') {
      steps {
        dir('src/tests/e2e-chromium') {
          echo '📦 Instalando dependencias E2E...'
          sh 'rm -rf node_modules package-lock.json'
          sh 'npm install selenium-webdriver mocha chai'

          echo '🧪 Ejecutando pruebas E2E Selenium...'
          script {
            def e2eExitCode = sh(
              script: '''
                rm -f test-results-e2e.xml
                npx mocha --reporter mocha-junit-reporter --reporter-options mochaFile=test-results-e2e.xml --timeout 30000 || exit 1
              ''',
              returnStatus: true
            )
            if (e2eExitCode != 0) {
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
          echo '📄 Publicando resultados E2E...'
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
