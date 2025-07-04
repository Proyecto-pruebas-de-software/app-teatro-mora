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
        echo '📦 Instalando dependencias del frontend...'
        sh 'rm -rf $DEPLOY_PATH/src/node_modules $DEPLOY_PATH/src/package-lock.json'
        sh 'cd $DEPLOY_PATH/src && npm install'

        echo '⚙️ Construyendo frontend...'
        sh 'cd $DEPLOY_PATH/src && npm run build'
      }
    }

    stage('Deploy Backend') {
      steps {
        echo '🚀 Desplegando backend...'

        sh '''
          echo "📁 Limpiando backend anterior..."
          rm -rf $DEPLOY_PATH/api/node_modules $DEPLOY_PATH/api/tests

          echo "📦 Instalando dependencias de producción (backend)..."
          cd $DEPLOY_PATH/api && npm install --omit=dev

          echo "♻️ Reiniciando backend con PM2..."
          pm2 reset api-teatro || pm2 start $DEPLOY_PATH/api/index.js --name api-teatro
        '''
      }
    }

    stage('E2E Tests - Selenium') {
      steps {
        echo '📦 Instalando dependencias E2E...'
        sh 'rm -rf $DEPLOY_PATH/src/tests/e2e-chromium/node_modules $DEPLOY_PATH/src/tests/e2e-chromium/package-lock.json'
        sh 'cd $DEPLOY_PATH/src/tests/e2e-chromium && npm install selenium-webdriver mocha chai'

        echo '🧪 Ejecutando pruebas E2E Selenium Chromium...'
        script {
          def e2eCode = sh(
            script: '''
              cd $DEPLOY_PATH
              npm run test:e2e-chromium
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
      post {
        always {
          junit '$DEPLOY_PATH/src/tests/e2e-chromium/test-results-e2e.xml'
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
