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
          sh 'npx vitest --run'
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

    stage('Deploy (solo en master)') {
      when {
        branch 'master'
      }
      steps {
        echo 'Desplegando aplicación (rama master)...'
        sh './scripts/deploy.sh'
      }
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
