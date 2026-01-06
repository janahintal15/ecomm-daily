pipeline {
  agent any

  tools {
    nodejs 'node20'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install dependencies') {
      steps {
        bat '''
          node -v
          npm -v

          if exist node_modules rmdir /s /q node_modules
          if exist package-lock.json del package-lock.json

          npm install
        '''
      }
    }

    stage('Install Playwright browsers') {
      steps {
        bat '''
          npx playwright install chromium
        '''
      }
    }

    stage('Run tests') {
      steps {
        bat '''
          npx playwright test
        '''
      }
    }
  }
}
