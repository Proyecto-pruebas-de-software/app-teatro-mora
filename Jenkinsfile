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
          sh 'npm install --save-dev mocha chai mocha-junit-reporter'

        }
      }
    }

    stage('Run Backend Tests') {
  steps {
    dir('api') {
      echo 'Ejecutando pruebas del backend una por una y forzando continuar aunque fallen...'
      sh '''
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
