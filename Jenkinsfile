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
          echo 'Directorio actual:'
          sh 'pwd'
          echo 'Listado de archivos en api:'
          sh 'ls -la'
          echo 'Borrando node_modules y package-lock.json...'
          sh 'rm -rf node_modules package-lock.json'
          echo 'Ejecutando npm install...'
          sh 'npm install'
        }
      }
    }

    stage('Run Backend Tests') {
  steps {
    dir('api') {
      echo 'Ejecutando pruebas del backend una por una y forzando continuar aunque fallen...'
      sh '''
        npm install --save-dev mocha chai mocha-junit-reporter
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
  }  // fin stages

  post {
    success {
      echo '✅ Pipeline completado exitosamente.'
    }
    failure {
      echo '❌ El pipeline falló.'
    }
  }
}
