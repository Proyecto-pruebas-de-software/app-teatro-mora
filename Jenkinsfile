pipeline {
  agent any

  environment {
    NODE_ENV = 'development'
  }

  tools {
    nodejs 'node24'
  }

  stages {
    stage('Install Backend Dependencies') {
      steps {
        dir('api') {
          echo '🧹 Limpiando dependencias previas del backend...'
          sh 'rm -rf node_modules package-lock.json'

          echo '📦 Instalando dependencias del backend...'
          sh 'npm install'
          sh 'npm install --save-dev mocha chai mocha-junit-reporter'
        }
      }
    }

    stage('Run Backend Tests') {
      steps {
        dir('api') {
          echo '🧪 Ejecutando pruebas del backend...'
          // Captura errores para no interrumpir el flujo
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
              echo '⚠️ Algunas pruebas fallaron.'
              currentBuild.result = 'UNSTABLE'
            } else {
              echo '✅ Todas las pruebas pasaron.'
            }
          }
        }
      }
      post {
        always {
          echo '📄 Publicando resultados de pruebas...'
          junit 'api/test-results-*.xml'
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
        script {
          if (env.BRANCH_NAME == 'main') {
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
          } else {
            echo "⏭️ Saltando deploy backend (branch: ${env.BRANCH_NAME})"
          }
        }
      }
    }

    stage('Deploy Frontend') {
      steps {
        script {
          if (env.BRANCH_NAME == 'main') {
            echo '🌐 Desplegando frontend (React) en servidor...'
            dir('frontend') {
              sh '''
                echo "📁 Copiando build de frontend a /home/azureuser/app-teatro-mora..."
                rsync -av --delete build/ /home/azureuser/app-teatro-mora/
              '''
            }
          } else {
            echo "⏭️ Saltando deploy frontend (branch: ${env.BRANCH_NAME})"
          }
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
