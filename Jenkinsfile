pipeline {
  agent any

  environment {
    NODE_ENV = 'development'
  }

  options {
    skipStagesAfterUnstable()
  }

  stages {
    stage('Install Backend Dependencies') {
      steps {
        dir('api') {
          echo 'Instalando dependencias del backend...'
          sh '''
            rm -rf node_modules package-lock.json
            npm install
          '''
        }
      }
    }

    stage('Run Backend Tests') {
      steps {
        dir('api') {
          echo 'Ejecutando pruebas del backend...'
          sh '''
            npm install --save-dev mocha chai mocha-junit-reporter
            npx mocha tests --reporter mocha-junit-reporter --timeout 15000
          '''
        }
      }
      post {
        always {
          junit 'api/test-results.xml'
        }
      }
    }

    stage('Install Frontend Dependencies') {
      steps {
        dir('frontend') {
          echo 'Instalando dependencias del frontend...'
          sh 'npm install'
        }
      }
    }

    stage('Run Frontend Tests') {
      steps {
        dir('frontend') {
          echo 'Ejecutando pruebas del frontend...'
          sh 'node run-tests.js'
        }
      }
    }

    stage('Build Frontend') {
      steps {
        dir('frontend') {
          echo 'Construyendo el frontend...'
          sh 'npm run build'
        }
      }
    }

    stage('Deploy') {
  when {
    branch 'master'
  }
  steps {
    echo '🚀 Iniciando despliegue en producción...'

    dir('frontend') {
      echo '📦 Construyendo frontend...'
      sh '''
        npm install
        npm run build
      '''
      echo '✅ Frontend construido'
    }

    dir('api') {
      echo '🔁 Reiniciando backend...'
      sh '''
        npm install
        pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js
      '''
      echo '✅ Backend reiniciado con PM2'
    }

    echo '🎉 Despliegue completo.'
  }
}


  post {
    success {
      echo '✅ Pipeline completado exitosamente.'
    }
    failure {
      echo '❌ El pipeline falló.'
    }
  }
}
